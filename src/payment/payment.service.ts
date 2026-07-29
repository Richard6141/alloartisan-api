import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { PromoService } from 'src/promo/promo.service';
import { ReferralService } from 'src/promo/referral.service';
import { FedaPayProvider } from './providers/fedapay.provider';
import { KkiaPayProvider } from './providers/kkiapay.provider';
import { InitiatePaymentDto, PaymentProvider } from './dto';
import { createHmac, timingSafeEqual } from 'crypto';
import { StatutBooking, StatutTransaction } from 'src/generated/prisma';
import { COMMISSION_RATE } from 'src/config/constants';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    private readonly commissionRate: number;
    private readonly fedapayWebhookSecret: string;
    private readonly kkiapayWebhookSecret: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly notificationService: NotificationService,
        private readonly promoService: PromoService,
        private readonly referralService: ReferralService,
        private readonly fedaPay: FedaPayProvider,
        private readonly kkiaPay: KkiaPayProvider,
    ) {
        this.commissionRate = config.get<number>('COMMISSION_RATE', COMMISSION_RATE);
        this.fedapayWebhookSecret = config.get<string>('FEDAPAY_WEBHOOK_SECRET', '');
        this.kkiapayWebhookSecret = config.get<string>('KKIAPAY_WEBHOOK_SECRET', '');

        if (!this.fedapayWebhookSecret) {
            this.logger.warn('FEDAPAY_WEBHOOK_SECRET manquant — webhooks FedaPay désactivés');
        }
        if (!this.kkiapayWebhookSecret) {
            this.logger.warn('KKIAPAY_WEBHOOK_SECRET manquant — webhooks KkiaPay désactivés');
        }
    }

    // ============================================================
    // INITIER UN PAIEMENT — Client paie une réservation confirmée
    // ============================================================

    async initiatePayment(bookingId: string, clientId: string, dto: InitiatePaymentDto) {
        // 1. Récupérer le booking avec toutes les relations nécessaires
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                client: { select: { id: true, email: true, nom: true, prenom: true } },
                artisan: { select: { id: true, userId: true } },
                transaction: true,
            },
        });

        if (!booking) throw new NotFoundException('Réservation non trouvée');
        if (booking.clientId !== clientId) {
            throw new ForbiddenException("Ce n'est pas votre réservation");
        }

        // 2. Règle métier : ne payer que si statut CONFIRMEE
        if (booking.statut !== StatutBooking.CONFIRMEE) {
            throw new BadRequestException(
                `Paiement impossible : la réservation doit être en statut CONFIRMEE (actuel: ${booking.statut})`,
            );
        }

        // 3. Vérifier qu'il n'y a pas déjà une transaction complétée
        if (booking.transaction?.statut === StatutTransaction.COMPLETEE) {
            throw new BadRequestException('Cette réservation a déjà été payée');
        }

        // 4. Vérifier qu'un prix final existe
        if (!booking.prixFinal) {
            throw new BadRequestException(
                'Aucun prix final défini — le client doit confirmer le prix proposé',
            );
        }

        const prixConvenu = Number(booking.prixFinal);
        let montant = prixConvenu;

        // 4b. Code promo éventuel : validation + calcul de la réduction côté serveur.
        let promoPreview: Awaited<ReturnType<PromoService['previewDiscount']>> | null = null;
        if (dto.codePromo) {
            promoPreview = await this.promoService.previewDiscount(
                dto.codePromo,
                clientId,
                prixConvenu,
            );
            montant = promoPreview.montantFinal;
        }

        // La réduction est absorbée par la plateforme : l'artisan touche toujours
        // sa part calculée sur le prix convenu. La commission peut devenir négative
        // (coût d'acquisition marketing assumé par la plateforme).
        const montantArtisan = Math.round(prixConvenu * (1 - this.commissionRate) * 100) / 100;
        const commission = Math.round((montant - montantArtisan) * 100) / 100;
        const description = `AlloArtisan - Booking #${bookingId.substring(0, 8)}`;
        const referenceInterne = bookingId;

        let paymentResult: { transactionId: string; paymentUrl?: string };

        // 5. Router vers le bon provider
        try {
            if (dto.provider === PaymentProvider.FEDAPAY) {
                const result = await this.fedaPay.initiateTransaction({
                    montant,
                    description,
                    referenceInterne,
                    email: booking.client.email,
                    nom: booking.client.nom ?? '',
                    prenom: booking.client.prenom ?? '',
                    successUrl: dto.successUrl,
                    cancelUrl: dto.cancelUrl,
                });
                paymentResult = {
                    transactionId: result.transactionId,
                    paymentUrl: result.paymentUrl,
                };
            } else if (dto.provider === PaymentProvider.KKIAPAY) {
                if (!dto.phoneNumber) {
                    throw new BadRequestException(
                        'KkiaPay requiert un numéro de téléphone (phoneNumber)',
                    );
                }
                const result = await this.kkiaPay.initiatePayment({
                    montant,
                    phoneNumber: dto.phoneNumber,
                    name: `${booking.client.prenom ?? ''} ${booking.client.nom ?? ''}`.trim(),
                    referenceInterne,
                    successUrl: dto.successUrl,
                });
                paymentResult = { transactionId: result.transactionId };
            } else if (dto.provider === PaymentProvider.CASH) {
                // Paiement en espèces — créer directement la transaction en attente
                paymentResult = {
                    transactionId: `CASH-${bookingId.substring(0, 8)}-${Date.now()}`,
                };
            } else {
                throw new BadRequestException(`Provider non supporté: ${dto.provider}`);
            }
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof ForbiddenException) {
                throw error;
            }
            this.logger.error(
                `Erreur initiation paiement bookingId=${bookingId} provider=${dto.provider}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new InternalServerErrorException(
                `Erreur communication avec le provider de paiement. Réessayez.`,
            );
        }

        // 6. Créer/mettre à jour la transaction en BDD (upsert pour idempotence)
        const transaction = await this.prisma.transaction.upsert({
            where: { bookingId },
            create: {
                bookingId,
                clientId,
                artisanId: booking.artisan.id,
                montant,
                commission,
                montantArtisan,
                statut: StatutTransaction.EN_ATTENTE,
                provider: dto.provider,
                providerTransactionId: paymentResult.transactionId,
            },
            update: {
                provider: dto.provider,
                providerTransactionId: paymentResult.transactionId,
                statut: StatutTransaction.EN_ATTENTE,
                // Recalculer si le prix a changé
                montant,
                commission,
                montantArtisan,
            },
        });

        // 7. Consommer le code promo (atomique). En cas d'échec du paiement,
        // processFailedPayment libérera l'utilisation.
        if (promoPreview && promoPreview.montantReduction > 0) {
            await this.promoService.redeemForBooking(
                promoPreview.codePromoId,
                clientId,
                bookingId,
                promoPreview.montantReduction,
            );
        }

        this.logger.log(
            `Paiement initié: booking=${bookingId} | provider=${dto.provider} | montant=${montant} FCFA` +
                (promoPreview ? ` (réduction ${promoPreview.montantReduction} FCFA)` : '') +
                ` | transactionId=${paymentResult.transactionId}`,
        );

        return {
            transactionId: transaction.id,
            providerTransactionId: paymentResult.transactionId,
            paymentUrl: paymentResult.paymentUrl,
            montant,
            reduction: promoPreview?.montantReduction ?? 0,
            codePromo: promoPreview?.code,
            commission,
            montantArtisan,
            provider: dto.provider,
            statut: StatutTransaction.EN_ATTENTE,
        };
    }

    // ============================================================
    // STATUT TRANSACTION
    // ============================================================

    async getTransactionStatus(transactionId: string, userId: string) {
        const artisan = await this.prisma.artisan.findUnique({
            where: { userId },
            select: { id: true },
        });

        const actorArtisanId = artisan?.id;

        const transaction = await this.prisma.transaction.findFirst({
            where: {
                id: transactionId,
                OR: [
                    { clientId: userId },
                    ...(actorArtisanId ? [{ artisanId: actorArtisanId }] : []),
                ],
            },
            include: {
                booking: {
                    select: { id: true, statut: true, titre: true },
                },
            },
        });

        if (!transaction) {
            throw new NotFoundException('Transaction non trouvée');
        }

        return transaction;
    }

    // ============================================================
    // HISTORIQUE TRANSACTIONS
    // ============================================================

    async getHistory(userId: string, isArtisan: boolean) {
        let where: { artisanId: string } | { clientId: string };

        if (isArtisan) {
            const artisan = await this.prisma.artisan.findUnique({
                where: { userId },
                select: { id: true },
            });

            if (!artisan) {
                return [];
            }

            where = { artisanId: artisan.id };
        } else {
            where = { clientId: userId };
        }

        const transactions = await this.prisma.transaction.findMany({
            where,
            include: {
                booking: {
                    select: {
                        id: true,
                        titre: true,
                        statut: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50, // Max 50 pour l'historique
        });

        return transactions;
    }

    // ============================================================
    // WEBHOOK FEDAPAY — Traitement sécurisé par HMAC
    // ============================================================

    /**
     * Valider la signature HMAC du webhook FedaPay
     * Critique : empêche les faux webhooks frauduleux
     */
    validateFedaPaySignature(rawBody: string, signature: string | undefined): boolean {
        if (!this.fedapayWebhookSecret) {
            this.logger.warn('FEDAPAY_WEBHOOK_SECRET non configuré — validation HMAC ignorée');
            return true; // En dev uniquement
        }

        // Secret configuré → une signature est OBLIGATOIRE.
        // Sans ce contrôle, omettre le header suffirait à contourner la validation.
        if (!signature) return false;

        try {
            const expected = createHmac('sha256', this.fedapayWebhookSecret)
                .update(rawBody)
                .digest('hex');

            const sigBuffer = Buffer.from(signature, 'hex');
            const expectedBuffer = Buffer.from(expected, 'hex');

            if (sigBuffer.length !== expectedBuffer.length) return false;

            // timingSafeEqual pour résister aux timing attacks
            return timingSafeEqual(sigBuffer, expectedBuffer);
        } catch {
            return false;
        }
    }

    /**
     * Valider la signature HMAC du webhook KkiaPay
     */
    validateKkiaPaySignature(rawBody: string, signature: string | undefined): boolean {
        if (!this.kkiapayWebhookSecret) {
            this.logger.warn('KKIAPAY_WEBHOOK_SECRET non configuré — validation HMAC ignorée');
            return true;
        }

        // Secret configuré → une signature est OBLIGATOIRE (pas de bypass par omission du header)
        if (!signature) return false;

        try {
            const expected = createHmac('sha256', this.kkiapayWebhookSecret)
                .update(rawBody)
                .digest('hex');

            const sigBuffer = Buffer.from(signature, 'hex');
            const expectedBuffer = Buffer.from(expected, 'hex');

            if (sigBuffer.length !== expectedBuffer.length) return false;
            return timingSafeEqual(sigBuffer, expectedBuffer);
        } catch {
            return false;
        }
    }

    // ============================================================
    // TRAITER UN PAIEMENT RÉUSSI (appelé depuis webhook)
    // ============================================================

    async processSuccessfulPayment(
        providerTransactionId: string,
        provider: string,
        providerResponse: Record<string, unknown>,
    ): Promise<void> {
        // Idempotence : chercher la transaction par l'ID provider
        const transaction = await this.prisma.transaction.findFirst({
            where: { providerTransactionId },
            include: { booking: true },
        });

        if (!transaction) {
            this.logger.warn(`Webhook reçu pour transaction inconnue: ${providerTransactionId}`);
            return;
        }

        // Idempotence : ne pas retraiter si déjà COMPLETEE
        if (transaction.statut === StatutTransaction.COMPLETEE) {
            this.logger.debug(`Transaction déjà traitée: ${providerTransactionId} — ignorée`);
            return;
        }

        // SÉCURITÉ CRITIQUE : ne PAS se fier au corps du webhook (statut/montant
        // falsifiables — le webhook est public). On re-vérifie le vrai statut ET
        // montant auprès du provider (source de vérité), comme le font déjà
        // confirmerPaiement()/getStatutPaiement(). Sans cela, un webhook forgé
        // validerait un paiement de mission jamais réellement effectué.
        const estKkiapay = provider === 'kkiapay';
        const remote = estKkiapay
            ? await this.kkiaPay.getTransactionStatus(providerTransactionId).catch(() => null)
            : await this.fedaPay.getTransaction(providerTransactionId).catch(() => null);
        const reussi = estKkiapay
            ? remote?.status === 'SUCCESS'
            : remote?.status === 'approved' || remote?.status === 'transferred';
        if (!remote || !reussi) {
            this.logger.warn(
                `Webhook mission NON validé [${transaction.id}] : statut provider non confirmé ` +
                    `(${remote?.status ?? 'introuvable'}) pour ${providerTransactionId}`,
            );
            return;
        }

        // Anti-fraude : le montant VÉRIFIÉ (provider) doit correspondre au montant
        // attendu. Un paiement partiel débloquerait l'intervention à prix réduit.
        const verifiedAmount = Number(remote.amount);
        if (
            !Number.isFinite(verifiedAmount) ||
            Math.abs(verifiedAmount - Number(transaction.montant)) > 1
        ) {
            this.logger.error(
                `⚠️ FRAUDE POSSIBLE — montant vérifié (${verifiedAmount} FCFA) ≠ montant attendu ` +
                    `(${transaction.montant} FCFA) pour transaction ${providerTransactionId}. Paiement NON validé.`,
            );
            await this.prisma.logActivite.create({
                data: {
                    userId: transaction.clientId,
                    action: 'PAIEMENT_MONTANT_SUSPECT',
                    entite: 'Transaction',
                    entiteId: transaction.id,
                    metadata: {
                        montantAttendu: Number(transaction.montant),
                        montantRecu: verifiedAmount,
                        provider,
                        providerTransactionId,
                    },
                },
            });
            return;
        }

        // Mettre à jour dans une transaction Prisma atomique.
        // updateMany + garde sur le statut = protection contre deux webhooks concurrents :
        // un seul des deux verra count === 1, l'autre abandonne.
        const completed = await this.prisma.$transaction(async (tx) => {
            const result = await tx.transaction.updateMany({
                where: {
                    id: transaction.id,
                    statut: { not: StatutTransaction.COMPLETEE },
                },
                data: {
                    statut: StatutTransaction.COMPLETEE,
                    providerResponse: providerResponse as any,
                    webhookReceivedAt: new Date(),
                },
            });

            if (result.count === 0) {
                return false; // Déjà traité par un webhook concurrent
            }

            await tx.logActivite.create({
                data: {
                    userId: transaction.clientId,
                    action: 'PAIEMENT_COMPLETE',
                    entite: 'Transaction',
                    entiteId: transaction.id,
                    metadata: {
                        montant: Number(transaction.montant),
                        provider,
                        providerTransactionId,
                    },
                },
            });
            return true;
        });

        if (!completed) {
            this.logger.debug(
                `Transaction ${providerTransactionId} déjà complétée par un webhook concurrent — ignorée`,
            );
            return;
        }

        this.logger.log(
            `✅ Paiement confirmé: booking=${transaction.bookingId} | montant=${transaction.montant} FCFA | provider=${provider}`,
        );

        // Parrainage : si c'est la 1ère intervention payée d'un filleul,
        // verser les récompenses (fire-and-forget, jamais bloquant)
        void this.referralService.onFirstPaidBooking(transaction.clientId);

        // 3. Notifier client et artisan (fire-and-forget)
        void this.notificationService.send({
            userId: transaction.clientId,
            type: 'PAIEMENT_RECU',
            titre: '✅ Paiement confirmé',
            corps: `Votre paiement de ${transaction.montant} FCFA a été reçu. L'artisan va commencer l'intervention.`,
            data: { bookingId: transaction.bookingId, transactionId: transaction.id },
        });

        const artisan = await this.prisma.artisan.findUnique({
            where: { id: transaction.artisanId },
            select: { userId: true },
        });

        if (artisan) {
            void this.notificationService.send({
                userId: artisan.userId,
                type: 'PAIEMENT_RECU',
                titre: '💰 Paiement reçu',
                corps: `Vous avez reçu ${transaction.montantArtisan} FCFA pour la réservation. Vous pouvez commencer l'intervention.`,
                data: { bookingId: transaction.bookingId, transactionId: transaction.id },
            });
        }
    }

    // ============================================================
    // TRAITER UN PAIEMENT ÉCHOUÉ
    // ============================================================

    async processFailedPayment(
        providerTransactionId: string,
        provider: string,
        providerResponse: Record<string, unknown>,
    ): Promise<void> {
        const transaction = await this.prisma.transaction.findFirst({
            where: { providerTransactionId },
        });

        if (!transaction || transaction.statut === StatutTransaction.ECHOUEE) {
            return;
        }

        // SÉCURITÉ : ne pas se fier au corps du webhook (falsifiable) pour marquer
        // un paiement échoué — sinon un webhook forgé « declined » ferait échouer
        // une transaction légitime en attente (griefing). On re-vérifie l'échec
        // réel auprès du provider avant d'agir.
        const estKkiapay = provider === 'kkiapay';
        const remote = estKkiapay
            ? await this.kkiaPay.getTransactionStatus(providerTransactionId).catch(() => null)
            : await this.fedaPay.getTransaction(providerTransactionId).catch(() => null);
        const echecConfirme = estKkiapay
            ? ['FAILED', 'CANCELLED'].includes(remote?.status ?? '')
            : ['declined', 'cancelled'].includes(remote?.status ?? '');
        if (!remote || !echecConfirme) {
            this.logger.warn(
                `Webhook échec ignoré [${transaction.id}] : le provider ne confirme pas ` +
                    `l'échec (${remote?.status ?? 'introuvable'}) pour ${providerTransactionId}`,
            );
            return;
        }

        await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                statut: StatutTransaction.ECHOUEE,
                providerResponse: providerResponse as any,
                webhookReceivedAt: new Date(),
            },
        });

        this.logger.warn(
            `❌ Paiement échoué: booking=${transaction.bookingId} | provider=${provider}`,
        );

        // Libérer le code promo éventuellement consommé à l'initiation :
        // le client pourra le réutiliser sur sa prochaine tentative
        try {
            await this.promoService.releaseUsageForBooking(transaction.bookingId);
        } catch (error) {
            this.logger.error(
                `Erreur libération code promo booking=${transaction.bookingId}`,
                error,
            );
        }

        // Notifier le client de l'échec
        void this.notificationService.send({
            userId: transaction.clientId,
            type: 'PAIEMENT_ECHEC',
            titre: '❌ Paiement échoué',
            corps: 'Votre paiement a échoué. Veuillez réessayer ou choisir un autre moyen de paiement.',
            data: { bookingId: transaction.bookingId, transactionId: transaction.id },
        });
    }

    // ============================================================
    // REMBOURSEMENT (ADMIN uniquement)
    // ============================================================

    async refundTransaction(transactionId: string): Promise<void> {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction) throw new NotFoundException('Transaction non trouvée');
        if (transaction.statut !== StatutTransaction.COMPLETEE) {
            throw new BadRequestException(
                `Seules les transactions COMPLETEES peuvent être remboursées (statut: ${transaction.statut})`,
            );
        }

        // Tenter le remboursement via le provider
        try {
            if (
                transaction.provider === PaymentProvider.FEDAPAY &&
                transaction.providerTransactionId
            ) {
                await this.fedaPay.refundTransaction(transaction.providerTransactionId);
            }
            // KkiaPay : remboursements manuels généralement
        } catch (error) {
            this.logger.error(
                `Erreur remboursement ${transactionId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new InternalServerErrorException(
                'Erreur lors du remboursement — contactez le support provider',
            );
        }

        await this.prisma.transaction.update({
            where: { id: transactionId },
            data: { statut: StatutTransaction.REMBOURSEE },
        });

        this.logger.log(`Remboursement effectué: ${transactionId}`);

        // Notifier le client
        void this.notificationService.send({
            userId: transaction.clientId,
            type: 'PAIEMENT_RECU',
            titre: '✅ Remboursement effectué',
            corps: `Votre remboursement de ${transaction.montant} FCFA a été initié. Comptez 1-3 jours ouvrés.`,
            data: { transactionId },
        });
    }
}
