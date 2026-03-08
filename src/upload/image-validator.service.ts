import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import * as fs from 'fs/promises';

/**
 * Types MIME autorisés avec leurs signatures (magic bytes)
 */
const ALLOWED_MIME_TYPES = new Map([
    ['image/jpeg', { extensions: ['jpg', 'jpeg'], maxSize: 10 * 1024 * 1024 }],
    ['image/png', { extensions: ['png'], maxSize: 10 * 1024 * 1024 }],
    ['image/webp', { extensions: ['webp'], maxSize: 10 * 1024 * 1024 }],
]);

/**
 * Dimensions maximales autorisées
 */
const MAX_DIMENSIONS = {
    width: 8000,
    height: 8000,
    megapixels: 40, // 40 megapixels max
};

/**
 * Résultat de la validation d'image
 */
export interface ImageValidationResult {
    isValid: boolean;
    mimeType: string;
    width: number;
    height: number;
    format: string;
    size: number;
    hasExif: boolean;
    error?: string;
}

/**
 * Options de sanitization d'image
 */
export interface SanitizeOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
    stripMetadata?: boolean;
}

@Injectable()
export class ImageValidatorService {
    /**
     * Valide une image de manière approfondie
     * - Vérifie les magic bytes (signature réelle du fichier)
     * - Vérifie que c'est une vraie image avec sharp
     * - Vérifie les dimensions
     * - Détecte les fichiers malveillants déguisés
     */
    async validateImage(buffer: Buffer, maxSize?: number): Promise<ImageValidationResult> {
        // 1. Vérification taille
        const size = buffer.length;
        const effectiveMaxSize = maxSize || 10 * 1024 * 1024;

        if (size > effectiveMaxSize) {
            return {
                isValid: false,
                mimeType: '',
                width: 0,
                height: 0,
                format: '',
                size,
                hasExif: false,
                error: `Fichier trop volumineux: ${Math.round(size / 1024 / 1024)}MB (max: ${Math.round(effectiveMaxSize / 1024 / 1024)}MB)`,
            };
        }

        // 2. Vérification magic bytes (signature réelle du fichier)
        const fileTypeResult = await fileTypeFromBuffer(buffer);

        if (!fileTypeResult) {
            return {
                isValid: false,
                mimeType: '',
                width: 0,
                height: 0,
                format: '',
                size,
                hasExif: false,
                error: 'Type de fichier non reconnu',
            };
        }

        if (!ALLOWED_MIME_TYPES.has(fileTypeResult.mime)) {
            return {
                isValid: false,
                mimeType: fileTypeResult.mime,
                width: 0,
                height: 0,
                format: fileTypeResult.ext,
                size,
                hasExif: false,
                error: `Type de fichier non autorisé: ${fileTypeResult.mime}. Autorisés: JPEG, PNG, WebP`,
            };
        }

        // 3. Validation avec Sharp (vérifie que c'est une vraie image)
        try {
            const metadata = await sharp(buffer).metadata();

            if (!metadata.width || !metadata.height) {
                return {
                    isValid: false,
                    mimeType: fileTypeResult.mime,
                    width: 0,
                    height: 0,
                    format: metadata.format || '',
                    size,
                    hasExif: false,
                    error: 'Image corrompue ou invalide',
                };
            }

            // 4. Vérification dimensions
            if (metadata.width > MAX_DIMENSIONS.width || metadata.height > MAX_DIMENSIONS.height) {
                return {
                    isValid: false,
                    mimeType: fileTypeResult.mime,
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format || '',
                    size,
                    hasExif: !!metadata.exif,
                    error: `Dimensions trop grandes: ${metadata.width}x${metadata.height} (max: ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height})`,
                };
            }

            // 5. Vérification megapixels (protection contre les bombes d'images)
            const megapixels = (metadata.width * metadata.height) / 1_000_000;
            if (megapixels > MAX_DIMENSIONS.megapixels) {
                return {
                    isValid: false,
                    mimeType: fileTypeResult.mime,
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format || '',
                    size,
                    hasExif: !!metadata.exif,
                    error: `Image trop grande: ${megapixels.toFixed(1)} megapixels (max: ${MAX_DIMENSIONS.megapixels})`,
                };
            }

            return {
                isValid: true,
                mimeType: fileTypeResult.mime,
                width: metadata.width,
                height: metadata.height,
                format: metadata.format || fileTypeResult.ext,
                size,
                hasExif: !!metadata.exif,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                isValid: false,
                mimeType: fileTypeResult.mime,
                width: 0,
                height: 0,
                format: '',
                size,
                hasExif: false,
                error: `Erreur de traitement image: ${errorMessage}`,
            };
        }
    }

    /**
     * Sanitize une image pour la sécurité
     * - Supprime les métadonnées EXIF (GPS, appareil, etc.)
     * - Re-encode l'image (élimine le code malveillant caché)
     * - Redimensionne si nécessaire
     * - Convertit au format souhaité
     */
    async sanitizeImage(buffer: Buffer, options: SanitizeOptions = {}): Promise<Buffer> {
        const {
            maxWidth = 1920,
            maxHeight = 1920,
            quality = 85,
            format = 'webp',
            stripMetadata = true,
        } = options;

        let pipeline = sharp(buffer);

        // Supprimer toutes les métadonnées (EXIF, ICC, IPTC, XMP)
        if (stripMetadata) {
            pipeline = pipeline.rotate(); // Auto-rotate based on EXIF then strip
        }

        // Redimensionner si nécessaire (garde les proportions)
        pipeline = pipeline.resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true,
        });

        // Convertir au format souhaité
        switch (format) {
            case 'jpeg':
                pipeline = pipeline.jpeg({
                    quality,
                    mozjpeg: true, // Meilleure compression
                });
                break;
            case 'png':
                pipeline = pipeline.png({
                    compressionLevel: 9,
                    palette: true,
                });
                break;
            case 'webp':
            default:
                pipeline = pipeline.webp({
                    quality,
                    effort: 6, // Meilleure compression (0-6)
                });
                break;
        }

        return pipeline.toBuffer();
    }

    /**
     * Valide et sanitize une image en une seule opération
     */
    async validateAndSanitize(
        buffer: Buffer,
        options: SanitizeOptions = {},
    ): Promise<{ buffer: Buffer; validation: ImageValidationResult }> {
        const validation = await this.validateImage(buffer);

        if (!validation.isValid) {
            throw new BadRequestException(validation.error);
        }

        const sanitizedBuffer = await this.sanitizeImage(buffer, options);

        return {
            buffer: sanitizedBuffer,
            validation,
        };
    }

    /**
     * Valide un fichier depuis le disque
     */
    async validateFile(filePath: string, maxSize?: number): Promise<ImageValidationResult> {
        try {
            const buffer = await fs.readFile(filePath);
            return this.validateImage(buffer, maxSize);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                isValid: false,
                mimeType: '',
                width: 0,
                height: 0,
                format: '',
                size: 0,
                hasExif: false,
                error: `Erreur lecture fichier: ${errorMessage}`,
            };
        }
    }

    /**
     * Génère un thumbnail optimisé
     */
    async generateThumbnail(
        buffer: Buffer,
        width: number = 200,
        height: number = 200,
    ): Promise<Buffer> {
        return sharp(buffer)
            .resize(width, height, {
                fit: 'cover',
                position: 'attention', // Focus sur la partie importante
            })
            .webp({ quality: 80 })
            .toBuffer();
    }

    /**
     * Génère un placeholder flou pour lazy loading
     */
    async generatePlaceholder(buffer: Buffer): Promise<string> {
        const placeholderBuffer = await sharp(buffer)
            .resize(20, 20, { fit: 'inside' })
            .blur(10)
            .webp({ quality: 20 })
            .toBuffer();

        return `data:image/webp;base64,${placeholderBuffer.toString('base64')}`;
    }
}
