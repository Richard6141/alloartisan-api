import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class NotificationScheduler {
    private readonly logger = new Logger(NotificationScheduler.name);

    constructor(private readonly notificationService: NotificationService) {}

    /**
     * Tous les jours à 3h00 : supprimer les notifications expirées
     * Évite l'accumulation de données inutiles en BDD
     */
    @Cron('0 3 * * *', { name: 'clean-expired-notifications' })
    async cleanExpiredNotifications(): Promise<void> {
        this.logger.log('Scheduler: Nettoyage des notifications expirées...');
        const count = await this.notificationService.deleteExpiredNotifications();
        this.logger.log(`Scheduler: ${count} notification(s) expirée(s) supprimées`);
    }
}
