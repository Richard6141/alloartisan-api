import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { KkiaPayProvider } from 'src/payment/providers/kkiapay.provider';
import { FedaPayProvider } from 'src/payment/providers/fedapay.provider';
import { NotificationService } from 'src/notification/notification.service';
import { PlanAbonnement } from './dto/upgrade-subscription.dto';
import { PLAN_QUOTAS, PLAN_TARIFFS, PLAN_DURATIONS, ESSAIS_GRATUITS } from 'src/config/constants';

export { PLAN_QUOTAS, PLAN_TARIFFS, PLAN_DURATIONS };

const PLAN_ORDER: PlanAbonnement[] = [
    PlanAbonnement.GRATUIT,
    PlanAbonnement.STANDARD,
    PlanAbonnement.PREMIUM,
    PlanAbonnement.GOLD,
];

@Injectable()
export class SubscriptionsService {
    private readonly logger = new Logger(SubscriptionsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly kkiaPay: KkiaPayProvider,
        private readonly fedaPay: FedaPayProvider,
        private readonly notificationService: NotificationService,
    ) {}

    // ─── Plans disponibles ───────────────────────────────────────────────────────

    getPlans() {
        return [
            {
                type: PlanAbonnement.GRATUIT,
                prix: PLAN_TARIFFS.GRATUIT,
                devise: 'XOF',
                demandesMois: PLAN_QUOTAS.GRATUIT,
                essaisGratuits: ESSAIS_GRATUITS,
                avantages: [
                    `${ESSAIS_GRATUITS} mises en relation offertes (essai découverte)`,
                    'Profil et fiche publics',
                    'Abonnement requis ensuite pour contacter vos clients',
                ],
                badge: null,
            },
            {
                type: PlanAbonnement.STANDARD,
                prix: PLAN_TARIFFS.STANDARD,
                devise: 'XOF',
                demandesMois: PLAN_QUOTAS.STANDARD,
                avantages: [
                    '8 mises en relation par mois',
                    'Priorité dans les résultats',
                ],
                badge: 'STANDARD',
            },
            {
                type: PlanAbonnement.PREMIUM,
                prix: PLAN_TARIFFS.PREMIUM,
                devise: 'XOF',
                demandesMois: PLAN_QUOTAS.PREMIUM,
                avantages: [
                    '50 mises en relation par mois',
                    'Badge TOP sur vos cartes',
                    'Haut des résultats de recherche',
                ],
                badge: 'PREMIUM',
            },
            {
                type: PlanAbonnement.GOLD,
                prix: PLAN_TARIFFS.GOLD,
                devise: 'XOF',
                demandesMois: PLAN_QUOTAS.GOLD,
                avantages: [
                    'Mises en relation ILLIMITÉES',
                    'Badge GOLD sur vos cartes',
                    'Tout en haut des résultats',
                    'Support prioritaire',
                ],
                badge: 'GOLD',
            },
        ];
    }

    // ─── Abonnement courant ──────────────────────────────────────────────────────

    async getMySubscription(userId: string) {
        const artisan = await this.prisma.artisan.findUnique({
            where: { userId },
            select: {
                id: true,
                abonnementType: true,
                abonnementExpireAt: true,
                compteurDemandesMoisCourant: true,
                essaisGratuitsUtilises: true,
            },
        });

        if (!artisan) {
            throw new NotFoundException('Profil artisan introuvable');
        }

        const plan = artisan.abonnementType as PlanAbonnement;
        const quota = PLAN_QUOTAS[plan];
        const essaisRestants = Math.max(0, ESSAIS_GRATUITS - artisan.essaisGratuitsUtilises);
        const expireBientot =
            artisan.abonnementExpireAt &&
            artisan.abonnementExpireAt > new Date() &&
            artisan.abonnementExpireAt < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        return {
            plan,
            expireAt: artisan.abonnementExpireAt,
            estActif:
                plan === PlanAbonnement.GRATUIT ||
                !artisan.abonnementExpireAt ||
                artisan.abonnementExpireAt > new Date(),
            demandesUtilisees: artisan.compteurDemandesMoisCourant,
            demandesRestantes:
                quota === null ? null : Math.max(0, quota - artisan.compteurDemandesMoisCourant),
            quotaMensuel: quota,
            // Essais découverte gratuits (à vie) encore disponibles
            essaisRestants,
            essaisGratuits: ESSAIS_GRATUITS,
            expireBientot: expireBientot ?? false,
            tarifs: PLAN_TARIFFS,
        };
    }

    // ─── Mettre à niveau l'abonnement ───────────────────────────────────────────

    /**
     * Mise à niveau immédiate de l'abonnement.
     *
     * Note : Dans un flow de production, cette méthode serait appelée par le
     * PaymentService après confirmation du paiement (webhook). Ici, elle peut
     * être utilisée directement par les admins ou après vérification du paiement.
     *
     * @param userId  - ID de l'utilisateur (artisan)
     * @param plan    - Nouveau plan
     * @param adminId - Si fourni, c'est une action admin (bypass paiement)
     */
    async upgradeSubscription(userId: string, plan: PlanAbonnement, adminId?: string) {
        const artisan = await this.prisma.artisan.findUnique({
            where: { userId },
            select: { id: true, abonnementType: true, abonnementExpireAt: true },
        });

        if (!artisan) {
            throw new NotFoundException('Profil artisan introuvable');
        }

        // Empêcher un downgrade via cet endpoint (sauf admin)
        if (!adminId) {
            const currentIdx = PLAN_ORDER.indexOf(artisan.abonnementType as PlanAbonnement);
            const newIdx = PLAN_ORDER.indexOf(plan);

            if (newIdx < currentIdx) {
                throw new BadRequestException(
                    "Le downgrade d'abonnement n'est pas autorisé via cet endpoint. Contactez le support.",
                );
            }

            if (
                newIdx === currentIdx &&
                artisan.abonnementExpireAt &&
                artisan.abonnementExpireAt > new Date()
            ) {
                throw new BadRequestException('Vous êtes déjà sur ce plan et il est encore actif.');
            }
        }

        // Calculer la nouvelle date d'expiration
        let expireAt: Date | null = null;

        if (plan !== PlanAbonnement.GRATUIT) {
            const duration = PLAN_DURATIONS[plan];
            // Si le plan actuel n'a pas encore expiré, étendre depuis la date d'expiration
            const base =
                (artisan.abonnementType as PlanAbonnement) === plan &&
                artisan.abonnementExpireAt &&
                artisan.abonnementExpireAt > new Date()
                    ? artisan.abonnementExpireAt
                    : new Date();

            expireAt = new Date(base.getTime() + duration * 24 * 60 * 60 * 1000);
        }

        const updated = await this.prisma.artisan.update({
            where: { id: artisan.id },
            data: {
                abonnementType: plan,
                abonnementExpireAt: expireAt,
                // Activer une formule payante donne un quota NEUF : les mises en
                // relation déjà consommées (ex. sur GRATUIT) ne sont pas reportées
                ...(plan !== PlanAbonnement.GRATUIT ? { compteurDemandesMoisCourant: 0 } : {}),
            },
            select: {
                id: true,
                abonnementType: true,
                abonnementExpireAt: true,
            },
        });

        this.logger.log(
            `Abonnement mis à jour [artisan:${artisan.id}] → ${plan} ` +
                `(expire: ${expireAt?.toISOString() ?? 'jamais'})` +
                (adminId ? ` [par admin:${adminId}]` : ''),
        );

        return {
            success: true,
            plan: updated.abonnementType,
            expireAt: updated.abonnementExpireAt,
            message: `Abonnement ${plan} activé avec succès.`,
        };
    }

    // ─── Downgrade automatique (appelé par le scheduler) ────────────────────────

    /**
     * Vérifie et downgrade les artisans avec abonnement expiré.
     * Retourne le nombre d'artisans downgradés.
     */
    async downgradeExpiredSubscriptions(): Promise<number> {
        const result = await this.prisma.artisan.updateMany({
            where: {
                abonnementType: { not: 'GRATUIT' },
                abonnementExpireAt: { lt: new Date() },
            },
            data: {
                abonnementType: PlanAbonnement.GRATUIT,
                abonnementExpireAt: null,
            },
        });

        if (result.count > 0) {
            this.logger.log(
                `[Scheduler] ${result.count} artisan(s) downgradé(s) vers GRATUIT (abonnement expiré)`,
            );
        }

        return result.count;
    }

    // ─── Vérification quota (appelé par BookingService) ─────────────────────────

    /**
     * Vérifie si un artisan peut encore accepter des demandes ce mois-ci.
     * Retourne true si le quota n'est pas atteint.
     */
    async hasRemainingQuota(artisanId: string): Promise<boolean> {
        const artisan = await this.prisma.artisan.findUnique({
            where: { id: artisanId },
            select: {
                abonnementType: true,
                abonnementExpireAt: true,
                compteurDemandesMoisCourant: true,
            },
        });

        if (!artisan) return false;

        const plan = artisan.abonnementType as PlanAbonnement;

        // Vérifier si l'abonnement payant est encore actif
        if (
            plan !== PlanAbonnement.GRATUIT &&
            artisan.abonnementExpireAt &&
            artisan.abonnementExpireAt < new Date()
        ) {
            // Abonnement expiré → traiter comme GRATUIT
            const gratuitQuota = PLAN_QUOTAS[PlanAbonnement.GRATUIT]!;
            return artisan.compteurDemandesMoisCourant < gratuitQuota;
        }

        const quota = PLAN_QUOTAS[plan];
        if (quota === null) return true; // GOLD : illimité

        return artisan.compteurDemandesMoisCourant < quota;
    }

    // ─── Paiement Mobile Money de l'abonnement (KkiaPay) ────────────────────────

    /**
     * Prépare le paiement d'un palier via FEDAPAY : crée l'intention en base,
     * crée la transaction FedaPay et renvoie l'URL de paiement (page de
     * checkout ouverte dans l'app). Le serveur VÉRIFIE ensuite la transaction
     * (verifierPaiement) avant toute activation.
     *
     * KkiaPay est désactivé pour l'instant (le flux widget/confirmerPaiement
     * reste en place) : l'admin gérera le choix des deux moyens plus tard.
     */
    async initierPaiement(userId: string, plan: PlanAbonnement) {
        const artisan = await this.prisma.artisan.findUnique({
            where: { userId },
            select: {
                id: true,
                abonnementType: true,
                user: { select: { email: true, nom: true, prenom: true } },
            },
        });
        if (!artisan) throw new NotFoundException('Profil artisan introuvable');

        if (PLAN_ORDER.indexOf(plan) < PLAN_ORDER.indexOf(artisan.abonnementType as PlanAbonnement)) {
            throw new BadRequestException(
                'Ce palier est inférieur à votre palier actuel. Contactez le support pour un changement.',
            );
        }

        const montant = PLAN_TARIFFS[plan];
        if (!montant) throw new BadRequestException('Ce palier ne nécessite pas de paiement');

        const paiement = await this.prisma.abonnementPaiement.create({
            data: { artisanId: artisan.id, plan, montant, provider: 'fedapay' },
        });

        try {
            const result = await this.fedaPay.initiateTransaction({
                montant,
                description: `Abonnement ${plan} AlloArtisan (30 jours)`,
                referenceInterne: `SUB-${paiement.id}`,
                email: artisan.user.email,
                nom: artisan.user.nom ?? 'Artisan',
                prenom: artisan.user.prenom ?? '',
                // Marqueur de fin : l'app ferme le paiement quand FedaPay
                // redirige vers cette URL (elle n'a pas besoin d'exister)
                successUrl: 'https://paiement.alloartisan.retour/termine',
            });

            await this.prisma.abonnementPaiement.update({
                where: { id: paiement.id },
                data: { providerTransactionId: result.transactionId },
            });

            this.logger.log(
                `Paiement abonnement initié [${paiement.id}] ${plan} ${montant} FCFA → fedapay:${result.transactionId}`,
            );

            return {
                paiementId: paiement.id,
                plan,
                montant,
                provider: 'fedapay' as const,
                paymentUrl: result.paymentUrl,
            };
        } catch (error) {
            await this.prisma.abonnementPaiement.update({
                where: { id: paiement.id },
                data: { statut: 'ECHOUEE' },
            });
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Initiation paiement FedaPay échouée: ${msg}`);
            throw new BadRequestException('Paiement indisponible pour le moment. Réessayez.');
        }
    }

    /**
     * Le widget a rendu un transactionId : on le VÉRIFIE auprès de KkiaPay
     * (statut + montant, anti-fraude) puis on active le palier.
     */
    async confirmerPaiement(userId: string, paiementId: string, transactionId: string) {
        const paiement = await this.prisma.abonnementPaiement.findUnique({
            where: { id: paiementId },
            include: { artisan: { select: { id: true, userId: true } } },
        });
        if (!paiement || paiement.artisan.userId !== userId) {
            throw new NotFoundException('Paiement introuvable');
        }
        if (paiement.statut === 'COMPLETEE') {
            return { statut: 'COMPLETEE', plan: paiement.plan };
        }

        // Anti-fraude : un transactionId ne peut pas servir deux fois
        const dejaUtilise = await this.prisma.abonnementPaiement.findFirst({
            where: { providerTransactionId: transactionId, NOT: { id: paiementId } },
            select: { id: true },
        });
        if (dejaUtilise) {
            throw new BadRequestException('Cette transaction a déjà été utilisée');
        }

        const remote = await this.kkiaPay.getTransactionStatus(transactionId);

        if (remote.status === 'SUCCESS') {
            // Anti-fraude : le montant payé doit couvrir le palier (FAIL-CLOSED :
            // un montant absent/0/NaN doit ÊTRE rejeté, pas ignoré).
            const paid = Number(remote.amount);
            if (!Number.isFinite(paid) || paid <= 0 || paid < Number(paiement.montant)) {
                this.logger.warn(
                    `Montant suspect paiement [${paiementId}]: attendu ${paiement.montant}, reçu ${remote.amount}`,
                );
                throw new BadRequestException('Le montant payé ne correspond pas au palier');
            }
            await this.prisma.abonnementPaiement.update({
                where: { id: paiement.id },
                data: { providerTransactionId: transactionId },
            });
            await this.finaliserPaiement(paiement.id, remote as unknown as Record<string, unknown>);
            return { statut: 'COMPLETEE', plan: paiement.plan };
        }

        if (['FAILED', 'CANCELLED', 'DECLINED', 'TRANSACTION_NOT_FOUND'].includes(remote.status)) {
            await this.prisma.abonnementPaiement.update({
                where: { id: paiement.id },
                data: { statut: 'ECHOUEE' },
            });
            return { statut: 'ECHOUEE', plan: paiement.plan };
        }

        return { statut: 'EN_ATTENTE', plan: paiement.plan };
    }

    /**
     * Vérifie le statut d'un paiement auprès du provider (FedaPay ou KkiaPay)
     * et active le palier si le paiement est passé. Appelé par l'app après le
     * checkout — sans risque de double activation (garde sur le statut).
     */
    async verifierPaiement(userId: string, paiementId: string) {
        const paiement = await this.prisma.abonnementPaiement.findUnique({
            where: { id: paiementId },
            include: { artisan: { select: { id: true, userId: true } } },
        });
        if (!paiement || paiement.artisan.userId !== userId) {
            throw new NotFoundException('Paiement introuvable');
        }

        if (paiement.statut === 'COMPLETEE') {
            return { statut: 'COMPLETEE', plan: paiement.plan };
        }
        if (!paiement.providerTransactionId) {
            return { statut: 'ECHOUEE', plan: paiement.plan };
        }

        let statutDistant: 'REUSSI' | 'ECHOUE' | 'EN_ATTENTE' = 'EN_ATTENTE';
        let reponse: Record<string, unknown> = {};
        let montantPaye = 0;

        if (paiement.provider === 'fedapay') {
            const remote = await this.fedaPay
                .getTransaction(paiement.providerTransactionId)
                .catch(() => null);
            reponse = (remote ?? {}) as unknown as Record<string, unknown>;
            montantPaye = Number(remote?.amount ?? 0);
            if (remote?.status === 'approved' || remote?.status === 'transferred') {
                statutDistant = 'REUSSI';
            } else if (['declined', 'canceled', 'cancelled', 'refunded'].includes(remote?.status ?? '')) {
                statutDistant = 'ECHOUE';
            }
        } else {
            const remote = await this.kkiaPay
                .getTransactionStatus(paiement.providerTransactionId)
                .catch(() => null);
            reponse = (remote ?? {}) as unknown as Record<string, unknown>;
            montantPaye = Number(remote?.amount ?? 0);
            if (remote?.status === 'SUCCESS') statutDistant = 'REUSSI';
            else if (['FAILED', 'CANCELLED'].includes(remote?.status ?? '')) statutDistant = 'ECHOUE';
        }

        if (statutDistant === 'REUSSI') {
            // Anti-fraude : le montant payé doit couvrir le palier (fail-closed)
            if (
                !Number.isFinite(montantPaye) ||
                montantPaye <= 0 ||
                montantPaye < Number(paiement.montant)
            ) {
                this.logger.warn(
                    `Montant suspect paiement [${paiementId}]: attendu ${paiement.montant}, reçu ${montantPaye}`,
                );
                await this.prisma.abonnementPaiement.update({
                    where: { id: paiement.id },
                    data: { statut: 'ECHOUEE' },
                });
                throw new BadRequestException('Le montant payé ne correspond pas au palier');
            }
            await this.finaliserPaiement(paiement.id, reponse);
            return { statut: 'COMPLETEE', plan: paiement.plan };
        }
        if (statutDistant === 'ECHOUE') {
            await this.prisma.abonnementPaiement.update({
                where: { id: paiement.id },
                data: { statut: 'ECHOUEE' },
            });
            return { statut: 'ECHOUEE', plan: paiement.plan };
        }
        return { statut: 'EN_ATTENTE', plan: paiement.plan };
    }

    /**
     * Webhook KkiaPay : si la transaction correspond à un paiement
     * d'abonnement, l'activer. Retourne false si ce n'en est pas un
     * (le circuit paiement de mission prend alors le relais).
     */
    async confirmerViaWebhook(
        providerTransactionId: string,
        providerResponse: Record<string, unknown>,
    ): Promise<boolean> {
        const paiement = await this.prisma.abonnementPaiement.findFirst({
            where: { providerTransactionId },
            select: { id: true },
        });
        if (!paiement) return false;

        await this.finaliserPaiement(paiement.id, providerResponse);
        return true;
    }

    /** Marque le paiement complété et active le palier (idempotent) */
    private async finaliserPaiement(
        paiementId: string,
        providerResponse: Record<string, unknown>,
    ): Promise<void> {
        // Garde d'idempotence : un seul passage active le palier
        const result = await this.prisma.abonnementPaiement.updateMany({
            where: { id: paiementId, statut: { not: 'COMPLETEE' } },
            data: {
                statut: 'COMPLETEE',
                providerResponse: providerResponse as never,
            },
        });
        if (result.count === 0) return;

        const paiement = await this.prisma.abonnementPaiement.findUnique({
            where: { id: paiementId },
            include: { artisan: { select: { id: true, userId: true } } },
        });
        if (!paiement) return;

        await this.upgradeSubscription(
            paiement.artisan.userId,
            paiement.plan as PlanAbonnement,
            // adminId 'paiement' = bypass des gardes (renouvellement du même plan autorisé)
            `paiement:${paiementId}`,
        );

        void this.notificationService.send({
            userId: paiement.artisan.userId,
            type: 'SYSTEME',
            titre: `Palier ${paiement.plan} activé 🎉`,
            corps: `Votre paiement de ${Number(paiement.montant).toLocaleString('fr-FR')} FCFA est confirmé. Votre abonnement ${paiement.plan} est actif pour 30 jours.`,
            data: { screen: 'activite' },
        });

        this.logger.log(`Abonnement ${paiement.plan} activé via paiement [${paiementId}]`);
    }

    // ─── Admin : forcer un plan ───────────────────────────────────────────────────

    async adminSetPlan(artisanId: string, plan: PlanAbonnement, adminId: string) {
        const artisan = await this.prisma.artisan.findUnique({
            where: { id: artisanId },
            select: { id: true, userId: true },
        });
        if (!artisan) throw new NotFoundException('Artisan introuvable');

        return this.upgradeSubscription(artisan.userId, plan, adminId);
    }
}
