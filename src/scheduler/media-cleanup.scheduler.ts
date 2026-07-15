import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';

/**
 * Rétention des médias de chat — les fichiers ne restent JAMAIS
 * indéfiniment sur le CDN :
 *
 * - Photos / vidéos / vocaux de chat : purgés après 30 jours
 *   (les bulles restent, elles affichent « Média expiré »)
 * - Les téléphones qui ont déjà affiché le média le gardent en cache
 *   local : pour les participants, rien ne disparaît en pratique
 * - Les photos de PROFIL et de PORTFOLIO ne sont pas concernées
 *
 * Résultat : le stockage CDN reste proportionnel aux 30 derniers jours
 * d'activité, pas à l'historique complet de la plateforme.
 */
@Injectable()
export class MediaCleanupScheduler {
    private readonly logger = new Logger(MediaCleanupScheduler.name);

    /** Durée de conservation des médias de chat (jours) */
    private static readonly RETENTION_DAYS = 30;
    /** Taille de lot par exécution (le cron quotidien rattrape le reste) */
    private static readonly BATCH_SIZE = 300;
    /** Seuls NOS dossiers de chat sont purgés */
    private static readonly CLEANABLE_PREFIXES = [
        'alloartisan/chat',
        'alloartisan/audio',
        'alloartisan/videos',
    ];

    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
    ) {}

    @Cron('0 4 * * *', { name: 'media-retention' })
    async cleanupExpiredChatMedia(): Promise<void> {
        const cutoff = new Date(
            Date.now() - MediaCleanupScheduler.RETENTION_DAYS * 24 * 3600 * 1000,
        );

        try {
            const messages = await this.prisma.message.findMany({
                where: {
                    createdAt: { lt: cutoff },
                    mediaUrl: { not: null },
                },
                select: { id: true, mediaUrl: true },
                take: MediaCleanupScheduler.BATCH_SIZE,
            });
            if (messages.length === 0) return;

            let purged = 0;
            for (const message of messages) {
                const parsed = this.parseCloudinaryUrl(message.mediaUrl!);

                // URL hors de nos dossiers de chat : on détache seulement
                if (parsed && this.isCleanable(parsed.publicId)) {
                    await this.uploadService.deleteMedia(parsed.publicId, parsed.resourceType);
                }

                await this.prisma.message.update({
                    where: { id: message.id },
                    data: { mediaUrl: null, mediaDuree: null },
                });
                purged++;
            }

            this.logger.log(
                `Rétention médias : ${purged} média(s) de chat purgé(s) (> ${MediaCleanupScheduler.RETENTION_DAYS} jours)`,
            );
        } catch (error) {
            this.logger.error('Erreur purge des médias de chat', error);
        }
    }

    private isCleanable(publicId: string): boolean {
        return MediaCleanupScheduler.CLEANABLE_PREFIXES.some((p) => publicId.startsWith(p));
    }

    /**
     * Extrait le public_id et le type de ressource d'une URL Cloudinary.
     * Gère les segments de transformation (ex: "c_limit,q_auto,w_720")
     * et de version ("v1712345678") présents dans les URLs de livraison.
     */
    private parseCloudinaryUrl(
        url: string,
    ): { publicId: string; resourceType: 'image' | 'video' } | null {
        try {
            const resourceType: 'image' | 'video' = url.includes('/video/upload/')
                ? 'video'
                : 'image';
            const afterUpload = url.split('/upload/')[1];
            if (!afterUpload) return null;

            const segments = afterUpload.split('/').filter(
                (seg) =>
                    !seg.includes(',') && // transformations (c_limit,q_auto,…)
                    !/^v\d+$/.test(seg), // version
            );
            if (segments.length === 0) return null;

            const joined = segments.join('/');
            const publicId = joined.replace(/\.[a-zA-Z0-9]+(\?.*)?$/, ''); // extension + query
            return { publicId, resourceType };
        } catch {
            return null;
        }
    }
}
