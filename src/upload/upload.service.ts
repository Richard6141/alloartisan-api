import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

export type CloudinaryResponse = UploadApiResponse | UploadApiErrorResponse;

/**
 * Variantes d'images générées automatiquement
 */
export interface ImageVariants {
    /** Miniature 200x200px - pour listes, avatars */
    thumbnail: string;
    /** Moyenne 800x600px - pour affichage standard */
    medium: string;
    /** Originale max 1920px - pour affichage plein écran */
    original: string;
    /** URL de base Cloudinary (pour transformations à la volée) */
    baseUrl: string;
    /** Placeholder flou pour lazy loading (base64 data URI) */
    placeholder: string;
}

export interface UploadResult {
    publicId: string;
    variants: ImageVariants;
}

/**
 * Configuration des transformations Cloudinary
 * - WebP avec fallback JPEG automatique (f_auto)
 * - Suppression métadonnées EXIF (fl_strip_profile)
 * - Qualité optimisée (q_auto:good = ~90%)
 * - Cache CDN 7 jours par défaut
 */
const CLOUDINARY_BASE_TRANSFORMS = {
    fetch_format: 'auto',
    quality: 'auto:good',
    flags: 'strip_profile',
};

const IMAGE_SIZES = {
    thumbnail: { width: 200, height: 200, crop: 'fill', gravity: 'face' },
    medium: { width: 800, height: 600, crop: 'limit' },
    original: { width: 1920, height: 1920, crop: 'limit' },
    placeholder: { width: 20, height: 20, crop: 'fill', effect: 'blur:1000', quality: 10 },
};

/**
 * Configuration retry pour résilience
 */
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 seconde
    maxDelay: 10000, // 10 secondes
};

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);

    constructor(private configService: ConfigService) {}

    /**
     * Upload une image depuis un buffer (après sanitization)
     * Avec retry automatique et gestion d'erreurs
     */
    async uploadImageBuffer(buffer: Buffer, folder: string = 'alloartisan'): Promise<UploadResult> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
            try {
                return await this.performUpload(buffer, folder);
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                this.logger.warn(
                    `Upload attempt ${attempt}/${RETRY_CONFIG.maxRetries} failed: ${lastError.message}`,
                );

                if (attempt < RETRY_CONFIG.maxRetries) {
                    const delay = Math.min(
                        RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
                        RETRY_CONFIG.maxDelay,
                    );
                    await this.sleep(delay);
                }
            }
        }

        throw new BadRequestException(
            `Échec de l'upload après ${RETRY_CONFIG.maxRetries} tentatives: ${lastError?.message || 'Unknown error'}`,
        );
    }

    /**
     * Upload un fichier AUDIO (messages vocaux du chat).
     * Cloudinary traite l'audio via resource_type "video".
     */
    async uploadAudioBuffer(
        buffer: Buffer,
        folder: string = 'alloartisan/audio',
    ): Promise<{ url: string; publicId: string }> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'video',
                    timeout: 60000,
                },
                (error, result) => {
                    if (error) {
                        reject(
                            new BadRequestException(`Upload audio impossible: ${error.message}`),
                        );
                    } else if (result) {
                        resolve({ url: result.secure_url, publicId: result.public_id });
                    } else {
                        reject(new BadRequestException('Upload audio: réponse vide'));
                    }
                },
            );
            uploadStream.end(buffer);
        });
    }

    /**
     * Upload un DOCUMENT DE CERTIFICATION (image sanitisée ou PDF).
     * Les PDF sont stockés en resource_type "image" (support natif Cloudinary),
     * ce qui permet de les supprimer avec deleteImage comme les autres.
     * Le dossier "certifications" n'est PAS purgé par le job de rétention.
     */
    async uploadCertificationDocument(
        buffer: Buffer,
        isPdf: boolean,
    ): Promise<{ url: string; publicId: string }> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'alloartisan/certifications',
                    resource_type: 'image',
                    ...(isPdf ? { format: 'pdf' } : {}),
                    timeout: 60000,
                },
                (error, result) => {
                    if (error) {
                        reject(
                            new BadRequestException(`Upload document impossible: ${error.message}`),
                        );
                    } else if (result) {
                        resolve({ url: result.secure_url, publicId: result.public_id });
                    } else {
                        reject(new BadRequestException('Upload document: réponse vide'));
                    }
                },
            );
            uploadStream.end(buffer);
        });
    }

    /**
     * Upload une VIDÉO (chat : filmer une panne).
     * Retourne une URL de LIVRAISON COMPRESSÉE : Cloudinary transcode à la
     * volée (720p max, codec/qualité auto) — le destinataire télécharge un
     * fichier bien plus léger que l'original, quel que soit le téléphone
     * qui a filmé. L'original est purgé par le job de rétention.
     */
    async uploadVideoBuffer(
        buffer: Buffer,
        folder: string = 'alloartisan/videos',
    ): Promise<{ url: string; publicId: string }> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'video',
                    timeout: 180000,
                    // Transcodage PENDANT l'upload (synchrone) : l'URL renvoyée
                    // est lisible immédiatement. Une transformation « à la
                    // volée » renverrait 423 (en cours) à la première lecture.
                    eager: [
                        {
                            width: 720,
                            crop: 'limit',
                            quality: 'auto:eco',
                            video_codec: 'auto',
                            format: 'mp4',
                        },
                    ],
                    eager_async: false,
                },
                (error, result) => {
                    if (error) {
                        reject(
                            new BadRequestException(`Upload vidéo impossible: ${error.message}`),
                        );
                    } else if (result) {
                        const eager = (result.eager as { secure_url?: string }[] | undefined)?.[0];
                        resolve({
                            // Version compressée prête ; repli : l'originale
                            url: eager?.secure_url ?? result.secure_url,
                            publicId: result.public_id,
                        });
                    } else {
                        reject(new BadRequestException('Upload vidéo: réponse vide'));
                    }
                },
            );
            uploadStream.end(buffer);
        });
    }

    /**
     * Supprime un média (image OU audio/vidéo) — utilisé par le job de
     * rétention des médias de chat.
     */
    async deleteMedia(publicId: string, resourceType: 'image' | 'video'): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        } catch (error) {
            this.logger.warn(
                `Suppression média échouée [${resourceType}:${publicId}]: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    /**
     * Effectue l'upload réel vers Cloudinary
     */
    private async performUpload(buffer: Buffer, folder: string): Promise<UploadResult> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'image',
                    transformation: [
                        {
                            width: IMAGE_SIZES.original.width,
                            height: IMAGE_SIZES.original.height,
                            crop: IMAGE_SIZES.original.crop,
                            ...CLOUDINARY_BASE_TRANSFORMS,
                        },
                    ],
                    eager: [
                        { ...IMAGE_SIZES.thumbnail, ...CLOUDINARY_BASE_TRANSFORMS },
                        { ...IMAGE_SIZES.medium, ...CLOUDINARY_BASE_TRANSFORMS },
                    ],
                    eager_async: true,
                    timeout: 60000, // 60 secondes timeout
                },
                (error, result) => {
                    if (error) {
                        reject(new Error(`Cloudinary error: ${error.message}`));
                    } else if (result) {
                        const variants = this.generateVariantUrls(result.public_id);
                        resolve({
                            publicId: result.public_id,
                            variants,
                        });
                    } else {
                        reject(new Error('Cloudinary returned empty result'));
                    }
                },
            );

            uploadStream.end(buffer);
        });
    }

    /**
     * Upload une image depuis un fichier Express.Multer.File (legacy)
     * Préférer uploadImageBuffer avec sanitization préalable
     */
    async uploadImage(
        file: Express.Multer.File,
        folder: string = 'alloartisan',
    ): Promise<UploadResult> {
        return this.uploadImageBuffer(file.buffer, folder);
    }

    /**
     * Génère les URLs des différentes variantes d'image
     */
    generateVariantUrls(publicId: string): ImageVariants {
        const baseUrl = cloudinary.url(publicId, { secure: true });

        return {
            thumbnail: cloudinary.url(publicId, {
                secure: true,
                transformation: [{ ...IMAGE_SIZES.thumbnail, ...CLOUDINARY_BASE_TRANSFORMS }],
            }),
            medium: cloudinary.url(publicId, {
                secure: true,
                transformation: [{ ...IMAGE_SIZES.medium, ...CLOUDINARY_BASE_TRANSFORMS }],
            }),
            original: cloudinary.url(publicId, {
                secure: true,
                transformation: [{ ...IMAGE_SIZES.original, ...CLOUDINARY_BASE_TRANSFORMS }],
            }),
            placeholder: cloudinary.url(publicId, {
                secure: true,
                transformation: [{ ...IMAGE_SIZES.placeholder, fetch_format: 'auto' }],
            }),
            baseUrl,
        };
    }

    /**
     * Upload photo de profil utilisateur (synchrone, pour usage direct)
     */
    async uploadProfilePhoto(buffer: Buffer, _userId: string): Promise<ImageVariants> {
        const result = await this.uploadImageBuffer(buffer, 'alloartisan/users/profiles');
        return result.variants;
    }

    /**
     * Upload photo de profil artisan
     */
    async uploadArtisanProfilePhoto(buffer: Buffer, _artisanId: string): Promise<ImageVariants> {
        const result = await this.uploadImageBuffer(buffer, 'alloartisan/artisans/profiles');
        return result.variants;
    }

    /**
     * Upload photo de couverture artisan
     */
    async uploadArtisanCoverPhoto(buffer: Buffer, _artisanId: string): Promise<ImageVariants> {
        const result = await this.uploadImageBuffer(buffer, 'alloartisan/artisans/covers');
        return result.variants;
    }

    /**
     * Upload photo pour portfolio artisan
     */
    async uploadPortfolioPhoto(buffer: Buffer, artisanId: string): Promise<ImageVariants> {
        const result = await this.uploadImageBuffer(
            buffer,
            `alloartisan/artisans/${artisanId}/portfolio`,
        );
        return result.variants;
    }

    /**
     * Supprime une image de Cloudinary avec retry
     */
    async deleteImage(publicId: string): Promise<void> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
            try {
                await cloudinary.uploader.destroy(publicId);
                return;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                this.logger.warn(
                    `Delete attempt ${attempt}/${RETRY_CONFIG.maxRetries} failed: ${lastError.message}`,
                );

                if (attempt < RETRY_CONFIG.maxRetries) {
                    await this.sleep(RETRY_CONFIG.baseDelay * attempt);
                }
            }
        }

        throw new BadRequestException(
            `Erreur suppression image: ${lastError?.message || 'Unknown error'}`,
        );
    }

    /**
     * Supprime plusieurs images en batch
     */
    async deleteImages(publicIds: string[]): Promise<void> {
        if (publicIds.length === 0) return;

        try {
            await cloudinary.api.delete_resources(publicIds);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to batch delete images: ${errorMessage}`);
            // Fallback: supprimer une par une
            for (const publicId of publicIds) {
                await this.deleteImage(publicId).catch(() => {});
            }
        }
    }

    /**
     * Extrait le public_id depuis une URL Cloudinary
     *
     * Formats supportés:
     * - https://res.cloudinary.com/xxx/image/upload/v123/folder/file.jpg
     * - https://res.cloudinary.com/xxx/image/upload/c_fill,w_200/v123/folder/file.jpg
     * - https://res.cloudinary.com/xxx/image/upload/c_fill,w_200/folder/file.jpg
     */
    extractPublicIdFromUrl(url: string): string | null {
        if (!url) return null;

        try {
            // Supprimer les query params (?_a=xxx)
            const urlWithoutParams = url.split('?')[0];

            // Pattern pour extraire le public_id après /upload/ et les transformations
            // Le public_id est tout ce qui vient après /upload/[transformations/][version/] jusqu'à l'extension
            const regex = /\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/;
            const match = urlWithoutParams.match(regex);

            if (match && match[1]) {
                // Nettoyer: enlever les transformations qui pourraient rester
                const publicId = match[1];

                // Si le publicId commence par des transformations (c_, w_, h_, etc.), les enlever
                const parts = publicId.split('/');
                const cleanParts = parts.filter((part) => {
                    // Filtrer les parties qui ressemblent à des transformations
                    const isTransformation =
                        /^[a-z]_[^/]+$/.test(part) ||
                        /^[a-z]+:[^/]+$/.test(part) ||
                        /^v\d+$/.test(part);
                    return !isTransformation;
                });

                return cleanParts.join('/') || null;
            }

            return null;
        } catch (error) {
            console.error('Error extracting publicId:', error);
            return null;
        }
    }

    /**
     * Génère une URL responsive avec srcset
     */
    generateSrcSet(publicId: string): string {
        const sizes = [200, 400, 800, 1200, 1920];
        return sizes
            .map((width) => {
                const url = cloudinary.url(publicId, {
                    secure: true,
                    transformation: [{ width, crop: 'limit', ...CLOUDINARY_BASE_TRANSFORMS }],
                });
                return `${url} ${width}w`;
            })
            .join(', ');
    }

    /**
     * Vérifie si Cloudinary est accessible
     */
    async healthCheck(): Promise<boolean> {
        try {
            await cloudinary.api.ping();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Utilitaire sleep pour les retries
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
