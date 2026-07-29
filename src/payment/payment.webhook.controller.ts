import { Controller, Post, Headers, Body, HttpCode, HttpStatus, Logger, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { Public } from 'src/common/decorators';

/**
 * Controller dédié aux webhooks — Route séparée intentionnellement.
 *
 * SÉCURITÉ CRITIQUE :
 * - Ces routes sont PUBLIC (pas de JWT) car appelées directement par FedaPay/KkiaPay
 * - La sécurité repose UNIQUEMENT sur la validation HMAC (secret partagé)
 * - rawBody disponible via req['rawBody'] si rawBody: true dans bootstrap()
 * - Toujours retourner HTTP 200 même en cas d'erreur interne (pour éviter les retry loops)
 */
@ApiTags('Webhooks (Paiements)')
@Controller('payments/webhook')
export class PaymentWebhookController {
    private readonly logger = new Logger(PaymentWebhookController.name);

    constructor(
        private readonly paymentService: PaymentService,
        private readonly subscriptionsService: SubscriptionsService,
    ) {}

    // ------------------------------------------------------------------
    // POST /payments/webhook/fedapay — Webhook FedaPay
    // ------------------------------------------------------------------

    @ApiOperation({
        summary: 'Webhook FedaPay [PUBLIC — validation HMAC]',
        description:
            'Reçoit les notifications de paiement FedaPay. ' +
            'Protection via HMAC-SHA256 sur le header x-fedapay-signature.',
    })
    @ApiHeader({ name: 'x-fedapay-signature', description: 'Signature HMAC-SHA256 FedaPay' })
    @ApiResponse({ status: 200, description: 'Webhook traité' })
    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('fedapay')
    async handleFedaPayWebhook(
        @Req() req: any,
        @Headers('x-fedapay-signature') signature: string,
        @Body() body: Record<string, unknown>,
    ) {
        // 1. Valider la signature HMAC (anti-fraude CRITIQUE)
        const rawBody: string = req.rawBody
            ? Buffer.isBuffer(req.rawBody)
                ? req.rawBody.toString('utf8')
                : String(req.rawBody)
            : JSON.stringify(body);

        if (!this.paymentService.validateFedaPaySignature(rawBody, signature)) {
            this.logger.warn(`⚠️ Webhook FedaPay rejeté : signature HMAC invalide — IP: ${req.ip}`);
            return { received: false, reason: 'invalid_signature' };
        }

        // 2. Extraire les données du payload FedaPay
        const transaction = body?.object as Record<string, unknown> | undefined;
        const transactionId = String(transaction?.id ?? '');
        const status = String(transaction?.status ?? '');

        this.logger.log(
            `📥 Webhook FedaPay | event=${body?.event} | transactionId=${transactionId} | status=${status}`,
        );

        try {
            if (status === 'approved') {
                // Un paiement d'ABONNEMENT artisan d'abord ; sinon paiement de mission
                const estAbonnement = await this.subscriptionsService.confirmerViaWebhook(
                    transactionId,
                    body,
                );
                if (!estAbonnement) {
                    // Le montant/statut sont re-vérifiés auprès du provider dans
                    // processSuccessfulPayment (le corps du webhook n'est pas fiable).
                    await this.paymentService.processSuccessfulPayment(
                        transactionId,
                        'fedapay',
                        body,
                    );
                }
            } else if (['declined', 'cancelled'].includes(status)) {
                await this.paymentService.processFailedPayment(transactionId, 'fedapay', body);
            } else {
                this.logger.debug(`Webhook FedaPay statut intermédiaire ignoré: ${status}`);
            }
        } catch (error) {
            this.logger.error(
                `Erreur traitement webhook FedaPay ${transactionId}: ${error instanceof Error ? error.message : String(error)}`,
            );
        }

        return { received: true };
    }

    // ------------------------------------------------------------------
    // POST /payments/webhook/kkiapay — Webhook KkiaPay
    // ------------------------------------------------------------------

    @ApiOperation({
        summary: 'Webhook KkiaPay [PUBLIC — validation HMAC]',
        description: 'Reçoit les notifications de paiement Mobile Money KkiaPay.',
    })
    @ApiHeader({ name: 'x-kkiapay-signature', description: 'Signature HMAC-SHA256 KkiaPay' })
    @ApiResponse({ status: 200, description: 'Webhook traité' })
    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('kkiapay')
    async handleKkiaPayWebhook(
        @Req() req: any,
        @Headers('x-kkiapay-signature') signature: string,
        @Body() body: Record<string, unknown>,
    ) {
        const rawBody: string = req.rawBody
            ? Buffer.isBuffer(req.rawBody)
                ? req.rawBody.toString('utf8')
                : String(req.rawBody)
            : JSON.stringify(body);

        if (!this.paymentService.validateKkiaPaySignature(rawBody, signature)) {
            this.logger.warn(`⚠️ Webhook KkiaPay rejeté : signature HMAC invalide — IP: ${req.ip}`);
            return { received: false, reason: 'invalid_signature' };
        }

        const transactionId = String(body?.transactionId ?? '');
        const status = String(body?.status ?? '');

        this.logger.log(`📥 Webhook KkiaPay | transactionId=${transactionId} | status=${status}`);

        try {
            if (status === 'SUCCESS') {
                // Un paiement d'ABONNEMENT artisan d'abord ; sinon paiement de mission
                const estAbonnement = await this.subscriptionsService.confirmerViaWebhook(
                    transactionId,
                    body,
                );
                if (!estAbonnement) {
                    // Montant/statut re-vérifiés côté provider dans processSuccessfulPayment.
                    await this.paymentService.processSuccessfulPayment(
                        transactionId,
                        'kkiapay',
                        body,
                    );
                }
            } else if (['FAILED', 'CANCELLED'].includes(status)) {
                await this.paymentService.processFailedPayment(transactionId, 'kkiapay', body);
            }
        } catch (error) {
            this.logger.error(
                `Erreur traitement webhook KkiaPay ${transactionId}: ${error instanceof Error ? error.message : String(error)}`,
            );
        }

        return { received: true };
    }
}
