import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { CacheService } from 'src/common/services';
import { StatutBooking } from 'src/generated/prisma';

/**
 * ReminderScheduler — Rappels automatiques autour des rendez-vous
 *
 * - Rappel J-1 : la veille du rendez-vous (client + artisan)
 * - Rappel H-1 : une heure avant le rendez-vous (client + artisan)
 * - Relance avis : 24h après une intervention terminée sans avis client
 *
 * Déduplication via Redis : chaque rappel n'est envoyé qu'une seule fois,
 * même si le cron repasse sur la même fenêtre.
 */
@Injectable()
export class ReminderScheduler {
    private readonly logger = new Logger(ReminderScheduler.name);

    private static readonly KEY_PREFIX = 'reminder:';
    private static readonly TTL_48H = 48 * 60 * 60 * 1000;
    private static readonly TTL_6H = 6 * 60 * 60 * 1000;
    private static readonly TTL_72H = 72 * 60 * 60 * 1000;

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
        private readonly cache: CacheService,
    ) {}

    /**
     * Rappels de rendez-vous — toutes les 10 minutes.
     * Les fenêtres (2h pour J-1, 1h pour H-1) sont plus larges que l'intervalle
     * du cron : aucun rendez-vous ne passe entre les mailles.
     */
    @Cron(CronExpression.EVERY_10_MINUTES, { name: 'booking-reminders' })
    async sendBookingReminders(): Promise<void> {
        const now = Date.now();
        try {
            await Promise.all([
                // J-1 : datePreferee dans [now+23h, now+25h]
                this.remindWindow(
                    new Date(now + 23 * 3600 * 1000),
                    new Date(now + 25 * 3600 * 1000),
                    'j1',
                    ReminderScheduler.TTL_48H,
                    (titre, quand) => ({
                        client: {
                            titre: '📅 Rappel : intervention demain',
                            corps: `Votre intervention "${titre}" est prévue demain à ${quand}. L'artisan vous attend.`,
                        },
                        artisan: {
                            titre: '📅 Rappel : mission demain',
                            corps: `Votre mission "${titre}" est prévue demain à ${quand}. Pensez à préparer votre matériel.`,
                        },
                    }),
                ),
                // H-1 : datePreferee dans [now+30min, now+90min]
                this.remindWindow(
                    new Date(now + 30 * 60 * 1000),
                    new Date(now + 90 * 60 * 1000),
                    'h1',
                    ReminderScheduler.TTL_6H,
                    (titre, quand) => ({
                        client: {
                            titre: '⏰ Votre artisan arrive bientôt',
                            corps: `Votre intervention "${titre}" est prévue à ${quand}. Vous pourrez suivre l'artisan en temps réel dès son départ.`,
                        },
                        artisan: {
                            titre: "⏰ Mission dans moins d'une heure",
                            corps: `Votre mission "${titre}" commence à ${quand}. Activez le suivi "En route" quand vous partez.`,
                        },
                    }),
                ),
            ]);
        } catch (error) {
            this.logger.error('Erreur envoi rappels de rendez-vous', error);
        }
    }

    /**
     * Relance avis — toutes les heures.
     * Cible les bookings TERMINEE il y a 24-26h sans avis : le client est invité
     * à noter l'artisan (moteur de confiance de la plateforme).
     */
    @Cron(CronExpression.EVERY_HOUR, { name: 'review-reminders' })
    async sendReviewReminders(): Promise<void> {
        const now = Date.now();
        try {
            const bookings = await this.prisma.booking.findMany({
                where: {
                    statut: StatutBooking.TERMINEE,
                    finAt: {
                        gte: new Date(now - 26 * 3600 * 1000),
                        lte: new Date(now - 24 * 3600 * 1000),
                    },
                    avis: null,
                },
                select: {
                    id: true,
                    titre: true,
                    clientId: true,
                    artisan: { select: { nomEntreprise: true } },
                },
                take: 500,
            });

            let sent = 0;
            for (const booking of bookings) {
                const dedupeKey = `${ReminderScheduler.KEY_PREFIX}avis:${booking.id}`;
                if (await this.cache.get(dedupeKey)) continue;
                await this.cache.set(dedupeKey, 1, ReminderScheduler.TTL_72H);

                const artisanNom = booking.artisan.nomEntreprise ?? 'votre artisan';
                void this.notificationService.send({
                    userId: booking.clientId,
                    type: 'AVIS_NOUVEAU',
                    titre: "⭐ Comment s'est passée votre intervention ?",
                    corps: `Notez ${artisanNom} pour "${booking.titre}". Votre avis aide toute la communauté à choisir les meilleurs artisans.`,
                    data: { bookingId: booking.id, event: 'REVIEW_REMINDER' },
                });
                sent++;
            }

            if (sent > 0) this.logger.log(`${sent} relance(s) d'avis envoyée(s)`);
        } catch (error) {
            this.logger.error('Erreur envoi relances avis', error);
        }
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private async remindWindow(
        from: Date,
        to: Date,
        tag: string,
        dedupeTtl: number,
        buildMessages: (
            titre: string,
            quand: string,
        ) => {
            client: { titre: string; corps: string };
            artisan: { titre: string; corps: string };
        },
    ): Promise<void> {
        const bookings = await this.prisma.booking.findMany({
            where: {
                statut: StatutBooking.CONFIRMEE,
                datePreferee: { gte: from, lte: to },
            },
            select: {
                id: true,
                titre: true,
                datePreferee: true,
                clientId: true,
                artisan: { select: { userId: true } },
            },
            take: 500,
        });

        let sent = 0;
        for (const booking of bookings) {
            const dedupeKey = `${ReminderScheduler.KEY_PREFIX}${tag}:${booking.id}`;
            if (await this.cache.get(dedupeKey)) continue;
            await this.cache.set(dedupeKey, 1, dedupeTtl);

            const quand = booking.datePreferee!.toLocaleString('fr-FR', {
                timeZone: 'Africa/Porto-Novo',
                hour: '2-digit',
                minute: '2-digit',
            });
            const messages = buildMessages(booking.titre, quand);

            void this.notificationService.send({
                userId: booking.clientId,
                type: 'SYSTEME',
                titre: messages.client.titre,
                corps: messages.client.corps,
                data: { bookingId: booking.id, event: `REMINDER_${tag.toUpperCase()}` },
            });
            void this.notificationService.send({
                userId: booking.artisan.userId,
                type: 'SYSTEME',
                titre: messages.artisan.titre,
                corps: messages.artisan.corps,
                data: { bookingId: booking.id, event: `REMINDER_${tag.toUpperCase()}` },
            });
            sent++;
        }

        if (sent > 0) this.logger.log(`${sent} rappel(s) ${tag} envoyé(s)`);
    }
}
