import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';
import { KkiaPayProvider } from 'src/payment/providers/kkiapay.provider';
import { FedaPayProvider } from 'src/payment/providers/fedapay.provider';

/**
 * SubscriptionsModule — LE modèle de revenus de la plateforme.
 *
 * Plans : GRATUIT (2/mois) | STANDARD (8/mois) | PREMIUM (50/mois) | GOLD (illimité)
 * Paiement Mobile Money via KkiaPay (le provider est déclaré ici directement
 * pour éviter un cycle avec PaymentModule, qui importe ce module pour le webhook).
 *
 * Exporte SubscriptionsService pour :
 * - BookingService  : vérification quota avant acceptation
 * - PaymentModule   : confirmation d'un paiement d'abonnement via webhook
 * - SchedulerModule : downgrade automatique expiré (via scheduler)
 */
@Module({
    imports: [PrismaModule, NotificationModule],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService, KkiaPayProvider, FedaPayProvider],
    exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
