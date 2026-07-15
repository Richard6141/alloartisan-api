import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentWebhookController } from './payment.webhook.controller';
import { FedaPayProvider } from './providers/fedapay.provider';
import { KkiaPayProvider } from './providers/kkiapay.provider';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';
import { PromoModule } from 'src/promo/promo.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';

/**
 * PaymentModule — Ne nécessite pas @nestjs/axios.
 * Les providers FedaPay et KkiaPay utilisent axios directement
 * (déjà embarqué comme dépendance transitive de NestJS).
 */
@Module({
    // SubscriptionsModule : le webhook KkiaPay confirme aussi les paiements d'abonnement
    imports: [PrismaModule, NotificationModule, PromoModule, SubscriptionsModule],
    controllers: [PaymentController, PaymentWebhookController],
    providers: [PaymentService, FedaPayProvider, KkiaPayProvider],
    exports: [PaymentService],
})
export class PaymentModule {}
