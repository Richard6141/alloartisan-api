import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

/**
 * SubscriptionsModule — Gestion des abonnements artisans (Sprint 7)
 *
 * Plans : GRATUIT (5 dem/mois) | STANDARD (30 dem/mois) | PREMIUM (illimité)
 *
 * Exporte SubscriptionsService pour :
 * - BookingService  : vérification quota avant acceptation
 * - SchedulerModule : downgrade automatique expiré (via scheduler)
 */
@Module({
    imports: [PrismaModule],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService],
    exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
