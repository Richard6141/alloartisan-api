import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from 'src/generated/prisma';
import { BookingService } from 'src/booking/booking.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { DemandesExpressService } from 'src/demandes-express/demandes-express.service';

@Injectable()
export class BookingScheduler {
    private readonly logger = new Logger(BookingScheduler.name);

    constructor(
        private readonly bookingService: BookingService,
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
        private readonly demandesExpressService: DemandesExpressService,
    ) {}

    /**
     * Expiration des demandes express sans preneur.
     * Toutes les minutes (TTL express = 15 min) : les demandes EN_RECHERCHE
     * dépassées passent EXPIREE et le client est prévenu.
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async expirerDemandesExpress(): Promise<void> {
        try {
            const count = await this.demandesExpressService.expirerDemandes();
            if (count > 0) {
                this.logger.log(`${count} demande(s) express expirée(s)`);
            }
        } catch (error) {
            this.logger.error('Erreur expiration demandes express', error);
        }
    }

    /**
     * Annulation automatique des bookings expirés
     * Toutes les heures → vérifie les bookings SOUMISE sans réponse artisan
     * - Standard: > 24h sans réponse → ANNULEE
     * - Urgent: > 2h sans réponse → ANNULEE
     */
    @Cron(CronExpression.EVERY_HOUR)
    async cancelExpiredBookings(): Promise<void> {
        this.logger.debug('Vérification des bookings expirés...');
        try {
            const count = await this.bookingService.cancelExpiredBookings();
            if (count > 0) {
                this.logger.warn(`${count} booking(s) annulés pour expiration`);
            }
        } catch (error) {
            this.logger.error('Erreur scheduler annulation bookings', error);
        }
    }

    /**
     * Réinitialisation des compteurs mensuels artisans
     * Le 1er de chaque mois à 00h01
     */
    @Cron('1 0 1 * *')
    async resetMonthlyCounters(): Promise<void> {
        this.logger.log('Réinitialisation des compteurs mensuels...');
        try {
            await this.bookingService.resetMonthlyCounters();
            this.logger.log('Compteurs mensuels réinitialisés avec succès');
        } catch (error) {
            this.logger.error('Erreur scheduler reset compteurs', error);
        }
    }

    /**
     * Rapport hebdomadaire artisan (chaque lundi à 9h00)
     * Envoie un résumé de la semaine : missions, revenus, avis
     */
    @Cron('0 9 * * 1')
    async sendWeeklyReports(): Promise<void> {
        this.logger.log('Envoi des rapports hebdomadaires artisans...');
        try {
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            // Récupérer les artisans actifs ayant eu des bookings la semaine passée
            const artisans = await this.prisma.artisan.findMany({
                where: {
                    statut: 'ACTIF',
                    deletedAt: null,
                    bookings: {
                        some: {
                            createdAt: { gte: oneWeekAgo },
                        },
                    },
                },
                select: {
                    id: true,
                    userId: true,
                    nomEntreprise: true,
                    _count: {
                        select: {
                            bookings: {
                                where: { createdAt: { gte: oneWeekAgo } },
                            },
                        },
                    },
                },
                take: 500, // Limit batch size
            });

            for (const artisan of artisans) {
                const bookingsCount = artisan._count.bookings;
                void this.notificationService.send({
                    userId: artisan.userId,
                    type: 'SYSTEME',
                    titre: '📊 Votre rapport hebdomadaire',
                    corps: `Bonjour ! Cette semaine, vous avez reçu ${bookingsCount} nouvelle(s) demande(s). Connectez-vous pour les gérer.`,
                    data: {
                        // Cible de navigation au tap : sans clé routable, l'app
                        // rendait la notif NON cliquable (destinationFromData → null).
                        // 'activite' → écran Activité artisan (« gérer mes demandes »).
                        screen: 'activite',
                        artisanId: artisan.id,
                        bookingsCount,
                        weekOf: oneWeekAgo.toISOString(),
                    },
                });
            }

            this.logger.log(`Rapports hebdomadaires envoyés à ${artisans.length} artisan(s)`);
        } catch (error) {
            this.logger.error('Erreur envoi rapports hebdomadaires', error);
        }
    }

    /**
     * Nettoyage des notifications expirées
     * Tous les jours à 3h00 du matin
     */
    @Cron('0 3 * * *')
    async cleanupExpiredNotifications(): Promise<void> {
        this.logger.debug('Nettoyage des notifications expirées...');
        try {
            // La fonction SQL cleanup_expired_notifications doit d'abord être créée (triggers.sql)
            const result: any[] = await this.prisma.$queryRaw(
                Prisma.sql`SELECT cleanup_expired_notifications() as count`,
            );
            const count = result[0]?.count ?? 0;
            if (Number(count) > 0) {
                this.logger.log(`${count} notification(s) expirées supprimées`);
            }
        } catch (error) {
            // La fonction SQL peut ne pas exister encore — non bloquant
            this.logger.warn('Nettoyage notifications: ' + (error as Error).message);
        }
    }

    /**
     * Purge des notifications LUES au-delà de la rétention courte.
     * Tous les jours à 3h15.
     */
    @Cron('15 3 * * *')
    async purgeReadNotifications(): Promise<void> {
        try {
            await this.notificationService.purgeReadNotifications();
        } catch (error) {
            this.logger.warn('Purge notifications lues: ' + (error as Error).message);
        }
    }

    /**
     * Plafond dur par utilisateur (garde les N plus récentes).
     * Chaque dimanche à 3h30.
     */
    @Cron('30 3 * * 0')
    async capNotificationsPerUser(): Promise<void> {
        try {
            await this.notificationService.capNotificationsPerUser();
        } catch (error) {
            this.logger.warn('Plafond notifications: ' + (error as Error).message);
        }
    }

    /**
     * Vérification des abonnements artisans expirés
     * Tous les jours à 8h00
     */
    @Cron('0 8 * * *')
    async checkSubscriptionExpiry(): Promise<void> {
        this.logger.debug('Vérification des abonnements expirés...');
        try {
            const result = await this.prisma.artisan.updateMany({
                where: {
                    abonnementType: { not: 'GRATUIT' },
                    abonnementExpireAt: { lt: new Date() },
                },
                data: {
                    abonnementType: 'GRATUIT',
                    abonnementExpireAt: null,
                },
            });

            if (result.count > 0) {
                this.logger.warn(
                    `${result.count} abonnement(s) artisan expiré(s) → downgrade vers GRATUIT`,
                );
            }
        } catch (error) {
            this.logger.error('Erreur scheduler vérification abonnements', error);
        }
    }
}
