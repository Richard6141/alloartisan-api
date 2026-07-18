import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import sharp from 'sharp';
import { createHash } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { IdentiteService } from 'src/fraud/identite.service';
import { UploadService, ImageVariants } from './upload.service';
import { ImageValidatorService } from './image-validator.service';

export interface UploadJobData {
    userId: string;
    buffer: number[]; // Buffer sérialisé en array
    type: 'profile' | 'artisan-profile' | 'artisan-cover' | 'portfolio';
    artisanId?: string;
}

export interface CertificationJobData {
    userId: string;
    artisanId: string;
    certificationId: string;
    buffer: number[]; // Buffer sérialisé en array
    originalName: string;
    isPdf: boolean;
    type: 'certification';
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
        private identiteService: IdentiteService,
    ) {}

    /**
     * Empreintes de l'IMAGE d'un document : sha256 (fichier identique) + dHash
     * perceptuel (même image ré-encodée/redimensionnée). Le dHash réduit
     * l'image en 9×8 niveaux de gris et compare les pixels adjacents (64 bits).
     */
    private async computeDocHashes(
        original: Buffer,
        isPdf: boolean,
    ): Promise<{ sha256: string; phash: string | null }> {
        const sha256 = createHash('sha256').update(original).digest('hex');
        let phash: string | null = null;
        if (!isPdf) {
            try {
                const { data, info } = await sharp(original)
                    .grayscale()
                    .resize(9, 8, { fit: 'fill' })
                    .raw()
                    .toBuffer({ resolveWithObject: true });
                const ch = info.channels;
                let bits = '';
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        const i = (row * 9 + col) * ch;
                        const j = (row * 9 + col + 1) * ch;
                        bits += data[i] > data[j] ? '1' : '0';
                    }
                }
                let hex = '';
                for (let k = 0; k < 64; k += 4) {
                    hex += parseInt(bits.slice(k, k + 4), 2).toString(16);
                }
                phash = hex;
            } catch {
                phash = null;
            }
        }
        return { sha256, phash };
    }

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

    /**
     * Documents de certification (pièce d'identité, diplômes).
     * Le contrôleur queue ces jobs depuis POST /certifications/me et
     * POST /certifications/me/:id/document — sans ce handler, les documents
     * n'arrivaient JAMAIS sur le CDN (documentUrl restait vide).
     */
    @Process('certification-document')
    async handleCertificationDocument(job: Job<CertificationJobData>): Promise<UploadJobResult> {
        const { certificationId, artisanId, userId, buffer: bufferArray, isPdf } = job.data;

        try {
            this.logger.log(`Processing certification document ${certificationId}`);
            const original = Buffer.from(bufferArray);

            // Les images sont sanitisées (métadonnées retirées, recompression) ;
            // les PDF partent tels quels (sharp ne lit pas le PDF)
            const buffer = isPdf
                ? original
                : await this.imageValidator.sanitizeImage(original, {
                      maxWidth: 1920,
                      maxHeight: 1920,
                      quality: 85,
                      format: 'webp',
                      stripMetadata: true,
                  });

            const { url } = await this.uploadService.uploadCertificationDocument(buffer, isPdf);

            await this.prisma.certification.update({
                where: { id: certificationId },
                data: { documentUrl: url },
            });

            // Resoumission : un dossier artisan rejeté repart en file d'examen
            // dès que le document corrigé est réellement en ligne
            await this.prisma.artisan.updateMany({
                where: { id: artisanId, statut: 'REJETE' },
                data: { statut: 'EN_ATTENTE', raisonSuspension: null },
            });

            // Anti-doublon (Phase 1) : pour une pièce d'IDENTITÉ, on indexe
            // l'empreinte de l'IMAGE (jamais bloquant — l'upload prime).
            try {
                const cert = await this.prisma.certification.findUnique({
                    where: { id: certificationId },
                    select: { type: true },
                });
                if (cert?.type === 'IDENTITE') {
                    const { sha256, phash } = await this.computeDocHashes(original, isPdf);
                    await this.identiteService.registerDocImage({
                        artisanId,
                        userId,
                        certificationId,
                        docSha256: sha256,
                        docPhash: phash,
                    });
                }
            } catch (e) {
                this.logger.warn(
                    `Empreinte image non calculée pour ${certificationId}: ${
                        e instanceof Error ? e.message : String(e)
                    }`,
                );
            }

            this.logger.log(`Certification document ${certificationId} uploaded: ${url}`);
            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `Failed to process certification document ${certificationId}: ${errorMessage}`,
            );
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
