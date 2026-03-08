import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';

/**
 * SubscriptionScheduler — Tâches planifiées pour les abonnements artisans
 *
 * - Downgrade vers GRATUIT des artisans avec abonnement expiré (tous les jours à 8h)
 */
@Injectable()
export class SubscriptionScheduler {
    private readonly logger = new Logger(SubscriptionScheduler.name);

    constructor(private readonly subscriptionsService: SubscriptionsService) {}

    /**
     * Vérifie chaque matin à 8h00 si des abonnements ont expiré.
     * Downgrade automatiquement vers GRATUIT.
     */
    @Cron('0 8 * * *', { name: 'subscription-expiry-check' })
    async checkSubscriptionExpiry() {
        this.logger.log('[Cron 0 8 * * *] Vérification des abonnements expirés...');
        try {
            const count = await this.subscriptionsService.downgradeExpiredSubscriptions();
            if (count > 0) {
                this.logger.warn(`[Abonnements] ${count} artisan(s) downgradé(s) vers GRATUIT`);
            } else {
                this.logger.debug('[Abonnements] Aucun abonnement expiré');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`[Abonnements] Erreur lors du downgrade : ${message}`);
        }
    }
}
