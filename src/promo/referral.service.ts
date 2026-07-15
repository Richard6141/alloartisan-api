import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { PromoService } from './promo.service';
import { StatutParrainage } from 'src/generated/prisma';
import {
    REFERRAL_REWARD_PARRAIN,
    REFERRAL_REWARD_FILLEUL,
    REFERRAL_REWARD_VALIDITY_DAYS,
    REFERRAL_APPLY_WINDOW_DAYS,
} from 'src/config/constants';

/**
 * ReferralService — Parrainage (moteur de croissance virale)
 *
 * Cycle de vie :
 * 1. Chaque utilisateur possède un code parrainage personnel (généré à la demande)
 * 2. Un nouvel inscrit saisit le code d'un parrain (dans les 30 jours) → Parrainage EN_ATTENTE
 * 3. Quand le filleul paie sa PREMIÈRE intervention → statut RECOMPENSE :
 *    le parrain ET le filleul reçoivent chacun un code promo personnel
 *    (1000 FCFA parrain / 500 FCFA filleul, valables 90 jours)
 */
@Injectable()
export class ReferralService {
    private readonly logger = new Logger(ReferralService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly promoService: PromoService,
        private readonly notificationService: NotificationService,
    ) {}

    // ============================================================
    // MON CODE PARRAINAGE
    // ============================================================

    /** Retourne le code parrainage de l'utilisateur (le génère au premier appel) */
    async getMyCode(userId: string): Promise<{ code: string }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, codeParrainage: true, prenom: true, nom: true },
        });
        if (!user) throw new NotFoundException('Utilisateur non trouvé');
        if (user.codeParrainage) return { code: user.codeParrainage };

        // Préfixe lisible à partir du nom (2 lettres), suffixe aléatoire
        const prefix = ((user.prenom ?? '') + (user.nom ?? 'AA'))
            .normalize('NFD')
            .replace(/[^a-zA-Z]/g, '')
            .substring(0, 2)
            .toUpperCase()
            .padEnd(2, 'A');

        for (let attempt = 0; attempt < 5; attempt++) {
            const code = `${prefix}-${this.randomCode(6)}`;
            try {
                // updateMany + garde codeParrainage: null → pas d'écrasement si un
                // autre appel concurrent a déjà généré le code
                const result = await this.prisma.user.updateMany({
                    where: { id: userId, codeParrainage: null },
                    data: { codeParrainage: code },
                });
                if (result.count === 1) return { code };
            } catch {
                // Collision sur l'index unique — nouvelle tentative
                continue;
            }
            // count === 0 : un code a été généré en concurrence — on le relit
            const refreshed = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { codeParrainage: true },
            });
            if (refreshed?.codeParrainage) return { code: refreshed.codeParrainage };
        }
        throw new ConflictException('Impossible de générer un code parrainage unique');
    }

    // ============================================================
    // SAISIR UN CODE PARRAIN (filleul)
    // ============================================================

    async applyCode(filleulId: string, rawCode: string) {
        const code = rawCode.trim().toUpperCase();

        const filleul = await this.prisma.user.findUnique({
            where: { id: filleulId },
            select: { id: true, createdAt: true, codeParrainage: true },
        });
        if (!filleul) throw new NotFoundException('Utilisateur non trouvé');

        if (filleul.codeParrainage === code) {
            throw new BadRequestException('Vous ne pouvez pas utiliser votre propre code');
        }

        const windowMs = REFERRAL_APPLY_WINDOW_DAYS * 24 * 3600 * 1000;
        if (Date.now() - filleul.createdAt.getTime() > windowMs) {
            throw new BadRequestException(
                `Le code parrain doit être saisi dans les ${REFERRAL_APPLY_WINDOW_DAYS} jours suivant l'inscription`,
            );
        }

        const existing = await this.prisma.parrainage.findUnique({
            where: { filleulId },
        });
        if (existing) throw new ConflictException('Vous avez déjà utilisé un code parrain');

        const parrain = await this.prisma.user.findUnique({
            where: { codeParrainage: code },
            select: { id: true, prenom: true },
        });
        if (!parrain) throw new NotFoundException('Code parrain invalide');
        if (parrain.id === filleulId) {
            throw new BadRequestException('Vous ne pouvez pas vous parrainer vous-même');
        }

        const parrainage = await this.prisma.parrainage.create({
            data: {
                parrainId: parrain.id,
                filleulId,
                codeUtilise: code,
            },
        });

        // Prévenir le parrain (fire-and-forget)
        void this.notificationService.send({
            userId: parrain.id,
            type: 'SYSTEME',
            titre: '🎉 Nouveau filleul !',
            corps: `Quelqu'un vient de s'inscrire avec votre code parrainage. Vous recevrez ${REFERRAL_REWARD_PARRAIN} FCFA quand il paiera sa première intervention.`,
            data: { event: 'REFERRAL_NEW', parrainageId: parrainage.id },
        });

        return {
            message: `Code parrain appliqué ! Vous recevrez ${REFERRAL_REWARD_FILLEUL} FCFA de réduction après votre première intervention payée.`,
            parrainageId: parrainage.id,
        };
    }

    // ============================================================
    // MES FILLEULS + STATS
    // ============================================================

    async getMyReferrals(userId: string) {
        const [parrainages, stats] = await Promise.all([
            this.prisma.parrainage.findMany({
                where: { parrainId: userId },
                select: {
                    id: true,
                    statut: true,
                    recompenseParrain: true,
                    recompenseAt: true,
                    createdAt: true,
                    filleul: { select: { prenom: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
            }),
            this.prisma.parrainage.aggregate({
                where: { parrainId: userId, statut: StatutParrainage.RECOMPENSE },
                _sum: { recompenseParrain: true },
                _count: true,
            }),
        ]);

        return {
            filleuls: parrainages.map((p) => ({
                id: p.id,
                prenom: p.filleul.prenom ?? 'Utilisateur',
                statut: p.statut,
                recompense: p.recompenseParrain ? Number(p.recompenseParrain) : null,
                inscritLe: p.createdAt,
            })),
            totalRecompenses: Number(stats._sum.recompenseParrain ?? 0),
            filleulsRecompenses: stats._count,
        };
    }

    // ============================================================
    // VALIDATION — appelé quand le filleul paie sa 1ère intervention
    // ============================================================

    /**
     * Appelé (fire-and-forget) depuis PaymentService.processSuccessfulPayment.
     * Si ce client est un filleul EN_ATTENTE → versement des récompenses.
     * La garde updateMany empêche un double versement en cas de webhooks concurrents.
     */
    async onFirstPaidBooking(clientId: string): Promise<void> {
        try {
            const parrainage = await this.prisma.parrainage.findUnique({
                where: { filleulId: clientId },
                select: { id: true, statut: true, parrainId: true },
            });
            if (!parrainage || parrainage.statut !== StatutParrainage.EN_ATTENTE) return;

            // Transition atomique EN_ATTENTE → RECOMPENSE (anti double versement)
            const updated = await this.prisma.parrainage.updateMany({
                where: { id: parrainage.id, statut: StatutParrainage.EN_ATTENTE },
                data: {
                    statut: StatutParrainage.RECOMPENSE,
                    recompenseParrain: REFERRAL_REWARD_PARRAIN,
                    recompenseFilleul: REFERRAL_REWARD_FILLEUL,
                    recompenseAt: new Date(),
                },
            });
            if (updated.count === 0) return;

            // Créer les codes promo personnels de récompense
            const [codeParrain, codeFilleul] = await Promise.all([
                this.promoService.createPersonalReward(
                    parrainage.parrainId,
                    REFERRAL_REWARD_PARRAIN,
                    'Récompense de parrainage',
                    REFERRAL_REWARD_VALIDITY_DAYS,
                ),
                this.promoService.createPersonalReward(
                    clientId,
                    REFERRAL_REWARD_FILLEUL,
                    'Récompense de bienvenue (parrainage)',
                    REFERRAL_REWARD_VALIDITY_DAYS,
                ),
            ]);

            void this.notificationService.send({
                userId: parrainage.parrainId,
                type: 'SYSTEME',
                titre: `🎁 ${REFERRAL_REWARD_PARRAIN} FCFA de récompense !`,
                corps: `Votre filleul a payé sa première intervention. Utilisez le code ${codeParrain} sur votre prochaine intervention.`,
                data: { event: 'REFERRAL_REWARD', code: codeParrain },
            });
            void this.notificationService.send({
                userId: clientId,
                type: 'SYSTEME',
                titre: `🎁 ${REFERRAL_REWARD_FILLEUL} FCFA offerts !`,
                corps: `Merci pour votre première intervention ! Utilisez le code ${codeFilleul} sur la prochaine.`,
                data: { event: 'REFERRAL_REWARD', code: codeFilleul },
            });

            this.logger.log(
                `Parrainage récompensé: ${parrainage.id} (parrain=${parrainage.parrainId}, filleul=${clientId})`,
            );
        } catch (error) {
            // Ne jamais faire échouer le paiement pour un problème de parrainage
            this.logger.error(
                `Erreur versement récompense parrainage pour client=${clientId}`,
                error,
            );
        }
    }

    private randomCode(length: number): string {
        const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        let out = '';
        for (let i = 0; i < length; i++) {
            out += alphabet[randomInt(alphabet.length)];
        }
        return out;
    }
}
