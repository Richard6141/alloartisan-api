import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

/**
 * Variantes d'images générées
 */
export interface ImageVariants {
    /** Miniature 200x200px - pour listes, avatars */
    thumbnail: string;
    /** Moyenne 800x600px - pour affichage standard */
    medium: string;
    /** Originale max 1920px - pour affichage plein écran */
    original: string;
    /** Placeholder flou base64 pour lazy loading */
    placeholder: string;
    /** Public ID pour suppression */
    publicId: string;
}

export interface UploadResult {
    publicId: string;
    variants: ImageVariants;
}

/**
 * Configuration des buckets Supabase Storage
 */
const BUCKETS = {
    USERS: 'users',
    ARTISANS: 'artisans',
    PORTFOLIO: 'portfolio',
} as const;

/**
 * Tailles d'images
 */
const IMAGE_SIZES = {
    thumbnail: { width: 200, height: 200 },
    medium: { width: 800, height: 600 },
    original: { width: 1920, height: 1920 },
};

/**
 * Configuration retry
 */
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000,
};

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly logger = new Logger(StorageService.name);
    private supabase!: SupabaseClient;
    private readonly supabaseUrl: string;

    constructor(private configService: ConfigService) {
        this.supabaseUrl = this.configService.get<string>('SUPABASE_URL', '');
        const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY', '');

        if (!this.supabaseUrl || !supabaseKey) {
            this.logger.warn('Supabase credentials not configured');
        }

        this.supabase = createClient(this.supabaseUrl, supabaseKey, {
            auth: { persistSession: false },
        });
    }

    async onModuleInit() {
        // Créer les buckets si ils n'existent pas
        await this.ensureBucketsExist();
    }

    /**
     * Crée les buckets nécessaires
     */
    private async ensureBucketsExist(): Promise<void> {
        const buckets = Object.values(BUCKETS);

        for (const bucket of buckets) {
            try {
                const { error } = await this.supabase.storage.getBucket(bucket);

                if (error && error.message.includes('not found')) {
                    await this.supabase.storage.createBucket(bucket, {
                        public: true, // Images publiques
                        fileSizeLimit: 10 * 1024 * 1024, // 10MB
                        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
                    });
                    this.logger.log(`Bucket "${bucket}" created`);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.warn(`Could not check/create bucket "${bucket}": ${errorMessage}`);
            }
        }
    }

    /**
     * Upload une image avec génération de toutes les variantes
     * L'image est compressée AVANT upload pour économiser la bande passante
     */
    async uploadImage(buffer: Buffer, bucket: string, folder: string): Promise<UploadResult> {
        const publicId = uuidv4();
        const basePath = `${folder}/${publicId}`;

        // Générer toutes les variantes localement avec Sharp
        const [thumbnailBuffer, mediumBuffer, originalBuffer, placeholderBase64] =
            await Promise.all([
                this.resizeImage(buffer, IMAGE_SIZES.thumbnail, 'fill'),
                this.resizeImage(buffer, IMAGE_SIZES.medium, 'inside'),
                this.resizeImage(buffer, IMAGE_SIZES.original, 'inside'),
                this.generatePlaceholder(buffer),
            ]);

        // Upload toutes les variantes en parallèle
        const uploads = await Promise.all([
            this.uploadToSupabase(bucket, `${basePath}/thumbnail.webp`, thumbnailBuffer),
            this.uploadToSupabase(bucket, `${basePath}/medium.webp`, mediumBuffer),
            this.uploadToSupabase(bucket, `${basePath}/original.webp`, originalBuffer),
        ]);

        // Vérifier les erreurs
        const errors = uploads.filter((u) => u.error);
        if (errors.length > 0) {
            // Cleanup en cas d'erreur partielle
            await this.deleteFolder(bucket, basePath).catch(() => {});
            const errorMessages = errors
                .map((e) => (e.error instanceof Error ? e.error.message : String(e.error)))
                .join(', ');
            throw new BadRequestException(`Erreur upload: ${errorMessages}`);
        }

        // Générer les URLs publiques
        const variants = this.generatePublicUrls(bucket, basePath, placeholderBase64, publicId);

        return { publicId, variants };
    }

    /**
     * Redimensionne une image avec Sharp
     */
    private async resizeImage(
        buffer: Buffer,
        size: { width: number; height: number },
        fit: 'fill' | 'inside' | 'cover' = 'inside',
    ): Promise<Buffer> {
        let sharpInstance = sharp(buffer).rotate(); // Auto-rotate based on EXIF

        if (fit === 'fill') {
            // Pour thumbnail: crop centré avec détection de visage si possible
            sharpInstance = sharpInstance.resize(size.width, size.height, {
                fit: 'cover',
                position: 'attention', // Focus intelligent
            });
        } else {
            // Pour medium/original: garde les proportions
            sharpInstance = sharpInstance.resize(size.width, size.height, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }

        return sharpInstance
            .webp({
                quality: 85,
                effort: 4, // Bon compromis compression/vitesse
            })
            .toBuffer();
    }

    /**
     * Génère un placeholder flou en base64
     */
    private async generatePlaceholder(buffer: Buffer): Promise<string> {
        const placeholderBuffer = await sharp(buffer)
            .resize(20, 20, { fit: 'inside' })
            .blur(10)
            .webp({ quality: 20 })
            .toBuffer();

        return `data:image/webp;base64,${placeholderBuffer.toString('base64')}`;
    }

    /**
     * Upload vers Supabase avec retry
     */
    private async uploadToSupabase(
        bucket: string,
        path: string,
        buffer: Buffer,
    ): Promise<{ data: unknown; error: Error | null }> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
            const { data, error } = await this.supabase.storage.from(bucket).upload(path, buffer, {
                contentType: 'image/webp',
                cacheControl: '604800', // 7 jours de cache
                upsert: true,
            });

            if (!error) {
                return { data, error: null };
            }

            lastError = error;
            this.logger.warn(
                `Upload attempt ${attempt}/${RETRY_CONFIG.maxRetries} failed: ${error.message}`,
            );

            if (attempt < RETRY_CONFIG.maxRetries) {
                await this.sleep(RETRY_CONFIG.baseDelay * attempt);
            }
        }

        return { data: null, error: lastError };
    }

    /**
     * Génère les URLs publiques Supabase
     */
    private generatePublicUrls(
        bucket: string,
        basePath: string,
        placeholder: string,
        publicId: string,
    ): ImageVariants {
        const baseUrl = `${this.supabaseUrl}/storage/v1/object/public/${bucket}`;

        return {
            thumbnail: `${baseUrl}/${basePath}/thumbnail.webp`,
            medium: `${baseUrl}/${basePath}/medium.webp`,
            original: `${baseUrl}/${basePath}/original.webp`,
            placeholder,
            publicId,
        };
    }

    /**
     * Upload photo de profil utilisateur
     */
    async uploadUserProfilePhoto(buffer: Buffer, userId: string): Promise<ImageVariants> {
        const result = await this.uploadImage(buffer, BUCKETS.USERS, `profiles/${userId}`);
        return result.variants;
    }

    /**
     * Upload photo de profil artisan
     */
    async uploadArtisanProfilePhoto(buffer: Buffer, artisanId: string): Promise<ImageVariants> {
        const result = await this.uploadImage(buffer, BUCKETS.ARTISANS, `profiles/${artisanId}`);
        return result.variants;
    }

    /**
     * Upload photo de couverture artisan
     */
    async uploadArtisanCoverPhoto(buffer: Buffer, artisanId: string): Promise<ImageVariants> {
        const result = await this.uploadImage(buffer, BUCKETS.ARTISANS, `covers/${artisanId}`);
        return result.variants;
    }

    /**
     * Upload photo portfolio artisan
     */
    async uploadPortfolioPhoto(buffer: Buffer, artisanId: string): Promise<ImageVariants> {
        const result = await this.uploadImage(buffer, BUCKETS.PORTFOLIO, artisanId);
        return result.variants;
    }

    /**
     * Supprime une image et toutes ses variantes
     */
    async deleteImage(bucket: string, publicId: string, folder: string): Promise<void> {
        const basePath = `${folder}/${publicId}`;
        await this.deleteFolder(bucket, basePath);
    }

    /**
     * Supprime un dossier entier
     */
    private async deleteFolder(bucket: string, folderPath: string): Promise<void> {
        try {
            const { data: files } = await this.supabase.storage.from(bucket).list(folderPath);

            if (files && files.length > 0) {
                const filePaths = files.map((f) => `${folderPath}/${f.name}`);
                await this.supabase.storage.from(bucket).remove(filePaths);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(`Failed to delete folder ${folderPath}: ${errorMessage}`);
        }
    }

    /**
     * Supprime une photo de profil utilisateur
     */
    async deleteUserProfilePhoto(userId: string, publicId: string): Promise<void> {
        await this.deleteImage(BUCKETS.USERS, publicId, `profiles/${userId}`);
    }

    /**
     * Supprime une photo de profil artisan
     */
    async deleteArtisanProfilePhoto(artisanId: string, publicId: string): Promise<void> {
        await this.deleteImage(BUCKETS.ARTISANS, publicId, `profiles/${artisanId}`);
    }

    /**
     * Supprime une photo de couverture artisan
     */
    async deleteArtisanCoverPhoto(artisanId: string, publicId: string): Promise<void> {
        await this.deleteImage(BUCKETS.ARTISANS, publicId, `covers/${artisanId}`);
    }

    /**
     * Supprime une photo portfolio
     */
    async deletePortfolioPhoto(artisanId: string, publicId: string): Promise<void> {
        await this.deleteImage(BUCKETS.PORTFOLIO, publicId, artisanId);
    }

    /**
     * Extrait le publicId depuis une URL Supabase
     */
    extractPublicIdFromUrl(url: string): string | null {
        try {
            // URL format: .../bucket/folder/publicId/variant.webp
            const regex = /\/([a-f0-9-]{36})\//;
            const match = url.match(regex);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    }

    /**
     * Extrait les infos de l'URL (bucket, folder, publicId)
     */
    extractInfoFromUrl(url: string): { bucket: string; folder: string; publicId: string } | null {
        try {
            // URL: .../storage/v1/object/public/{bucket}/{folder}/{publicId}/variant.webp
            const regex = /\/public\/([^/]+)\/(.+)\/([a-f0-9-]{36})\//;
            const match = url.match(regex);
            if (match) {
                return {
                    bucket: match[1],
                    folder: match[2],
                    publicId: match[3],
                };
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Vérifie si Supabase Storage est accessible
     */
    async healthCheck(): Promise<boolean> {
        try {
            const { error } = await this.supabase.storage.listBuckets();
            return !error;
        } catch {
            return false;
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
