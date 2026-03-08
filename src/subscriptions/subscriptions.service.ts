import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlanAbonnement } from './dto/upgrade-subscription.dto';
import { PLAN_QUOTAS, PLAN_TARIFFS, PLAN_DURATIONS } from 'src/config/constants';

export { PLAN_QUOTAS, PLAN_TARIFFS, PLAN_DURATIONS };

@Injectable()
export class SubscriptionsService {
    private readonly logger = new Logger(SubscriptionsService.name);

    constructor(private readonly prisma: PrismaService) {}

    // ─── Plans disponibles ───────────────────────────────────────────────────────

    getPlans() {
        return [
            {
                type: PlanAbonnement.GRATUIT,
                prix: PLAN_TARIFFS.GRATUIT,
                devise: 'XOF',
                demandesMois: PLAN_QUOTAS.GRATUIT,
                avantages: ['5 demandes par mois', 'Profil visible', 'Support standard'],
                badge: null,
            },
            {
                type: PlanAbonnement.STANDARD,
                prix: PLAN_TARIFFS.STANDARD,
                devise: 'XOF',
                demandesMois: PLAN_QUOTAS.STANDARD,
                avantages: [
                    '30 demandes par mois',
                    'Priorité dans les résultats de recherche',
                    "Badge 'Artisan Vérifié'",
                    'Support prioritaire',
                ],
                badge: 'STANDARD',
            },
            {
                type: PlanAbonnement.PREMIUM,
                prix: PLAN_TARIFFS.PREMIUM,
                devise: 'XOF',
                demandesMois: null,
                avantages: [
                    'Demandes illimitées',
                    'Top des résultats de recherche',
                    "Badge 'Artisan Premium'",
                    'Statistiques avancées',
                    'Support VIP 24/7',
                ],
                badge: 'PREMIUM',
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
            },
        });

        if (!artisan) {
            throw new NotFoundException('Profil artisan introuvable');
        }

        const plan = artisan.abonnementType as PlanAbonnement;
        const quota = PLAN_QUOTAS[plan];
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
            const currentPlanOrder = [
                PlanAbonnement.GRATUIT,
                PlanAbonnement.STANDARD,
                PlanAbonnement.PREMIUM,
            ];
            const currentIdx = currentPlanOrder.indexOf(artisan.abonnementType as PlanAbonnement);
            const newIdx = currentPlanOrder.indexOf(plan);

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
        if (quota === null) return true; // PREMIUM illimité

        return artisan.compteurDemandesMoisCourant < quota;
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
