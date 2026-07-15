import { Module } from '@nestjs/common';
import { PromoService } from './promo.service';
import { ReferralService } from './referral.service';
import { PromoController } from './promo.controller';
import { ReferralController } from './referral.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';

/**
 * PromoModule — Moteur de croissance
 *
 * - PromoService    : codes promo (CRUD admin, validation, consommation atomique)
 * - ReferralService : parrainage (code personnel, filleuls, récompenses)
 *
 * Intégration paiement :
 * - PaymentService consomme les codes au paiement (redeemForBooking)
 *   et les libère en cas d'échec (releaseUsageForBooking)
 * - processSuccessfulPayment déclenche onFirstPaidBooking (récompenses parrainage)
 */
@Module({
    imports: [PrismaModule, NotificationModule],
    providers: [PromoService, ReferralService],
    controllers: [PromoController, ReferralController],
    exports: [PromoService, ReferralService],
})
export class PromoModule {}
