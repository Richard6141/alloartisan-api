import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService, ImageVariants } from './upload.service';
import { ImageValidatorService } from './image-validator.service';

export interface UploadJobData {
    userId: string;
    buffer: number[]; // Buffer sérialisé en array
    type: 'profile' | 'artisan-profile' | 'artisan-cover' | 'portfolio';
    artisanId?: string;
}

export interface UploadJobResult {
    success: boolean;
    variants?: ImageVariants;
    error?: string;
}

@Processor('upload')
export class UploadProcessor {
    private readonly logger = new Logger(UploadProcessor.name);

    constructor(
        private prisma: PrismaService,
        private uploadService: UploadService,
        private imageValidator: ImageValidatorService,
    ) {}

    @Process('profile-photo')
    async handleProfilePhoto(job: Job<UploadJobData>): Promise<UploadJobResult> {
        const { userId, buffer: bufferArray } = job.data;

        try {
            this.logger.log(`Processing profile photo for user ${userId}`);

            // Reconvertir l'array en Buffer
            const buffer = Buffer.from(bufferArray);

            // 1. Sanitization
            const sanitizedBuffer = await this.imageValidator.sanitizeImage(buffer, {
                maxWidth: 1920,
                maxHeight: 1920,
                quality: 85,
                format: 'webp',
                stripMetadata: true,
            });

            // 2. Récupérer l'ancienne photo pour suppression
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { photoUrl: true },
            });

            // 3. Supprimer l'ancienne photo si elle existe
            if (user?.photoUrl) {
                const publicId = this.uploadService.extractPublicIdFromUrl(user.photoUrl);
                if (publicId) {
                    await this.uploadService.deleteImage(publicId).catch((err: Error) => {
                        this.logger.warn(`Failed to delete old photo: ${err.message}`);
                    });
                }
            }

            // 4. Upload vers Cloudinary
            const variants = await this.uploadService.uploadProfilePhoto(sanitizedBuffer, userId);

            // 5. Mettre à jour la DB
            await this.prisma.user.update({
                where: { id: userId },
                data: { photoUrl: variants.medium },
            });

            this.logger.log(`Profile photo uploaded successfully for user ${userId}`);

            return { success: true, variants };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to process profile photo: ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    }

    @Process('artisan-photo')
    async handleArtisanPhoto(job: Job<UploadJobData>): Promise<UploadJobResult> {
        const { artisanId, buffer: bufferArray, type } = job.data;

        if (!artisanId) {
            return { success: false, error: 'Artisan ID required' };
        }

        try {
            this.logger.log(`Processing ${type} for artisan ${artisanId}`);

            const buffer = Buffer.from(bufferArray);

            const sanitizedBuffer = await this.imageValidator.sanitizeImage(buffer, {
                maxWidth: 1920,
                maxHeight: 1920,
                quality: 85,
                format: 'webp',
                stripMetadata: true,
            });

            let variants: ImageVariants | undefined;
            if (type === 'artisan-profile') {
                variants = await this.uploadService.uploadArtisanProfilePhoto(
                    sanitizedBuffer,
                    artisanId,
                );
                await this.prisma.artisan.update({
                    where: { id: artisanId },
                    data: { photoProfilUrl: variants.medium },
                });
            } else if (type === 'artisan-cover') {
                variants = await this.uploadService.uploadArtisanCoverPhoto(
                    sanitizedBuffer,
                    artisanId,
                );
                await this.prisma.artisan.update({
                    where: { id: artisanId },
                    data: { photoCouvertureUrl: variants.medium },
                });
            } else if (type === 'portfolio') {
                variants = await this.uploadService.uploadPortfolioPhoto(
                    sanitizedBuffer,
                    artisanId,
                );
                // Portfolio photos sont gérées différemment (table séparée)
            }

            this.logger.log(`${type} uploaded successfully for artisan ${artisanId}`);

            return { success: true, variants };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to process ${type}: ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    }
}
