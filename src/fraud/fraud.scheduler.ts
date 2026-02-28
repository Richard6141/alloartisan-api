import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FraudService } from './fraud.service';

/**
 * FraudScheduler — Sprint 12
 *
 * Exécute le scan de fraude quotidien à 3h00 UTC.
 * Heure creuse pour minimiser l'impact sur la DB.
 */
@Injectable()
export class FraudScheduler {
    private readonly logger = new Logger(FraudScheduler.name);

    constructor(private readonly fraudService: FraudService) {}

    /**
     * Scan quotidien : calcul des scores de fraude pour tous les artisans.
     * Actions automatiques appliquées selon le niveau de risque :
     * - 81-100 : blocage temporaire (disponible=false)
     * - 61-80 : log pour revue admin
     */
    @Cron('0 3 * * *', { name: 'fraud-daily-scan', timeZone: 'UTC' })
    async runDailyFraudScan(): Promise<void> {
        this.logger.log('🔍 Démarrage scan fraude quotidien…');

        try {
            const result = await this.fraudService.runDailyFraudScan();
            this.logger.log(
                `✅ Scan fraude terminé: ${result.total} artisans | ${result.blocked} bloqués | ${result.flagged} signalés`,
            );
        } catch (err) {
            this.logger.error(
                `❌ Échec scan fraude: ${(err as Error).message}`,
                (err as Error).stack,
            );
        }
    }
}
