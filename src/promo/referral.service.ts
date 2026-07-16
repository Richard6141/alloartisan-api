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
import { StatutParrainage, AbonnementType, NiveauAmbassadeur } from 'src/generated/prisma';
import {
    REFERRAL_APPLY_WINDOW_DAYS,
    AMBASSADEUR_JOURS_PARRAIN,
    AMBASSADEUR_JOURS_FILLEUL,
    AMBASSADEUR_PALIERS,
} from 'src/config/constants';

const ORDRE_NIVEAU: Record<NiveauAmbassadeur, number> = {
    BRONZE: 1,
    ARGENT: 2,
    OR: 3,
};

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
            corps: `Quelqu'un vient de s'inscrire avec votre code. Vous gagnerez ${AMBASSADEUR_JOURS_PARRAIN} jours d'abonnement offerts dès qu'il prendra son premier abonnement.`,
            data: { event: 'REFERRAL_NEW', parrainageId: parrainage.id },
        });

        return {
            message: `Code parrain appliqué ! Vous et votre parrain gagnerez chacun ${AMBASSADEUR_JOURS_FILLEUL} jours d'abonnement offerts après votre premier abonnement.`,
            parrainageId: parrainage.id,
        };
    }

    // ============================================================
    // MES FILLEULS + STATS
    // ============================================================

    async getMyReferrals(userId: string) {
        const [parrainages, artisan] = await Promise.all([
            this.prisma.parrainage.findMany({
                where: { parrainId: userId },
                select: {
                    id: true,
                    statut: true,
                    joursParrain: true,
                    createdAt: true,
                    filleul: { select: { prenom: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
            }),
            this.prisma.artisan.findUnique({
                where: { userId },
                select: { ambassadeurNiveau: true },
            }),
        ]);

        const filleulsAbonnes = parrainages.filter(
            (p) => p.statut === StatutParrainage.RECOMPENSE,
        ).length;
        const totalJoursOfferts = parrainages.reduce((s, p) => s + (p.joursParrain ?? 0), 0);
        const prochain = AMBASSADEUR_PALIERS.find((p) => filleulsAbonnes < p.seuil) ?? null;

        return {
            filleuls: parrainages.map((p) => ({
                id: p.id,
                prenom: p.filleul.prenom ?? 'Utilisateur',
                statut: p.statut,
                jours: p.joursParrain ?? null,
                inscritLe: p.createdAt,
            })),
            filleulsAbonnes,
            totalJoursOfferts,
            niveau: artisan?.ambassadeurNiveau ?? null,
            prochainPalier: prochain
                ? {
                      seuil: prochain.seuil,
                      niveau: prochain.niveau,
                      restant: prochain.seuil - filleulsAbonnes,
                  }
                : null,
            paliers: AMBASSADEUR_PALIERS,
        };
    }

    /** Classement des Ambassadeurs (top parrains par filleuls abonnés). */
    async getLeaderboard(limit = 10) {
        const grouped = await this.prisma.parrainage.groupBy({
            by: ['parrainId'],
            where: { statut: StatutParrainage.RECOMPENSE },
            _count: { _all: true },
            orderBy: { _count: { parrainId: 'desc' } },
            take: limit,
        });
        if (grouped.length === 0) return [];

        const ids = grouped.map((g) => g.parrainId);
        const users = await this.prisma.user.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                prenom: true,
                nom: true,
                artisan: { select: { ambassadeurNiveau: true, nomEntreprise: true } },
            },
        });
        const byId = new Map(users.map((u) => [u.id, u]));

        return grouped.map((g, i) => {
            const u = byId.get(g.parrainId);
            const nom =
                u?.artisan?.nomEntreprise ||
                `${u?.prenom ?? ''} ${u?.nom ?? ''}`.replace(/\s+/g, ' ').trim() ||
                'Ambassadeur';
            return {
                rang: i + 1,
                nom,
                niveau: u?.artisan?.ambassadeurNiveau ?? null,
                filleulsAbonnes: g._count._all,
            };
        });
    }

    // ============================================================
    // DÉCLENCHEUR — quand le filleul (artisan) paie son 1er abonnement
    // ============================================================

    /**
     * Appelé (fire-and-forget) depuis SubscriptionsService.finaliserPaiement.
     * Si ce user est un filleul EN_ATTENTE → versement des récompenses en
     * TEMPS D'ABONNEMENT (zéro cash). La garde updateMany empêche un double
     * versement en cas de webhooks concurrents.
     */
    async onFirstPaidSubscription(filleulUserId: string): Promise<void> {
        try {
            const parrainage = await this.prisma.parrainage.findUnique({
                where: { filleulId: filleulUserId },
                select: { id: true, statut: true, parrainId: true },
            });
            if (!parrainage || parrainage.statut !== StatutParrainage.EN_ATTENTE) return;

            // Transition atomique EN_ATTENTE → RECOMPENSE (anti double versement)
            const updated = await this.prisma.parrainage.updateMany({
                where: { id: parrainage.id, statut: StatutParrainage.EN_ATTENTE },
                data: {
                    statut: StatutParrainage.RECOMPENSE,
                    joursParrain: AMBASSADEUR_JOURS_PARRAIN,
                    joursFilleul: AMBASSADEUR_JOURS_FILLEUL,
                    recompenseAt: new Date(),
                },
            });
            if (updated.count === 0) return;

            // Filleul : jours ajoutés à l'abonnement qu'il vient de payer
            await this.crediterJours(filleulUserId, AMBASSADEUR_JOURS_FILLEUL);
            void this.notificationService.send({
                userId: filleulUserId,
                type: 'SYSTEME',
                titre: `🎁 ${AMBASSADEUR_JOURS_FILLEUL} jours d'abonnement offerts !`,
                corps: `Grâce à votre parrain, ${AMBASSADEUR_JOURS_FILLEUL} jours d'abonnement viennent d'être ajoutés à votre compte.`,
                data: { event: 'REFERRAL_REWARD' },
            });

            // Parrain : jours offerts (s'il est artisan) + progression des paliers
            const credite = await this.crediterJours(
                parrainage.parrainId,
                AMBASSADEUR_JOURS_PARRAIN,
            );
            if (credite) {
                void this.notificationService.send({
                    userId: parrainage.parrainId,
                    type: 'SYSTEME',
                    titre: `🎉 Un filleul s'est abonné — ${AMBASSADEUR_JOURS_PARRAIN} jours offerts !`,
                    corps: `Un de vos filleuls vient de prendre son 1er abonnement. ${AMBASSADEUR_JOURS_PARRAIN} jours d'abonnement vous sont offerts.`,
                    data: { event: 'REFERRAL_REWARD' },
                });
            }
            await this.checkMilestones(parrainage.parrainId);

            this.logger.log(
                `Parrainage récompensé: ${parrainage.id} (parrain=${parrainage.parrainId}, filleul=${filleulUserId})`,
            );
        } catch (error) {
            // Ne jamais faire échouer le paiement pour un problème de parrainage
            this.logger.error(`Erreur récompense parrainage pour filleul=${filleulUserId}`, error);
        }
    }

    /** @deprecated Paiement d'intervention dé-scopé (pivot abonnements). No-op conservé. */
    async onFirstPaidBooking(_clientId: string): Promise<void> {
        return;
    }

    /**
     * Crédite N jours d'abonnement à un artisan (extension de la date
     * d'expiration). Un cadeau de jours vaut au moins le palier STANDARD.
     * Retourne false si l'utilisateur n'est pas artisan (pas d'abonnement).
     */
    private async crediterJours(userId: string, jours: number): Promise<boolean> {
        const artisan = await this.prisma.artisan.findUnique({
            where: { userId },
            select: { id: true, abonnementType: true, abonnementExpireAt: true },
        });
        if (!artisan) return false;

        const now = new Date();
        const base =
            artisan.abonnementExpireAt && artisan.abonnementExpireAt > now
                ? artisan.abonnementExpireAt
                : now;
        const nouvelleExpiration = new Date(base.getTime() + jours * 24 * 3600 * 1000);
        const nouveauType =
            artisan.abonnementType === AbonnementType.GRATUIT
                ? AbonnementType.STANDARD
                : artisan.abonnementType;

        await this.prisma.artisan.update({
            where: { id: artisan.id },
            data: { abonnementExpireAt: nouvelleExpiration, abonnementType: nouveauType },
        });
        return true;
    }

    /**
     * Recalcule le palier Ambassadeur du parrain selon son nombre de filleuls
     * abonnés. Ne rétrograde jamais ; au passage d'un nouveau palier : badge +
     * bonus de jours + notification.
     */
    private async checkMilestones(parrainUserId: string): Promise<void> {
        const filleulsAbonnes = await this.prisma.parrainage.count({
            where: { parrainId: parrainUserId, statut: StatutParrainage.RECOMPENSE },
        });
        const palier = [...AMBASSADEUR_PALIERS].reverse().find((p) => filleulsAbonnes >= p.seuil);
        if (!palier) return;

        const artisan = await this.prisma.artisan.findUnique({
            where: { userId: parrainUserId },
            select: { id: true, ambassadeurNiveau: true },
        });
        if (!artisan) return;

        const nouveau = palier.niveau as NiveauAmbassadeur;
        if (
            artisan.ambassadeurNiveau &&
            ORDRE_NIVEAU[artisan.ambassadeurNiveau] >= ORDRE_NIVEAU[nouveau]
        ) {
            return; // palier déjà atteint (ou supérieur)
        }

        await this.prisma.artisan.update({
            where: { id: artisan.id },
            data: { ambassadeurNiveau: nouveau },
        });
        await this.crediterJours(parrainUserId, palier.bonusJours);

        void this.notificationService.send({
            userId: parrainUserId,
            type: 'SYSTEME',
            titre: `🏆 Vous êtes Ambassadeur ${nouveau} !`,
            corps: `${filleulsAbonnes} filleuls abonnés ! Badge ${nouveau} débloqué + ${palier.bonusJours} jours d'abonnement offerts.`,
            data: { event: 'AMBASSADEUR_PALIER', niveau: nouveau },
        });
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
