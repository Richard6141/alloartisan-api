import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from 'src/generated/prisma';
import { BookingService } from 'src/booking/booking.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BookingScheduler {
    private readonly logger = new Logger(BookingScheduler.name);

    constructor(
        private readonly bookingService: BookingService,
        private readonly prisma: PrismaService,
    ) {}

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
    sendWeeklyReports(): void {
        this.logger.log('Envoi des rapports hebdomadaires artisans...');
        // TODO Sprint 2 : Implémenter via NotificationService
        // Pour l'instant, simple log
        this.logger.log('Rapports hebdomadaires programmés (NotificationModule requis - Sprint 2)');
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
