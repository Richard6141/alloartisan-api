import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/services';
import {
    FraudScore,
    FraudSignal,
    FraudNiveau,
    FraudAction,
    getFraudNiveau,
    getFraudAction,
} from './fraud.types';

/** Poids des signaux de fraude (total max = 100 pts) */
const WEIGHTS = {
    TAUX_ANNULATION: 30, // Taux annulation > 50% → +30 pts
    MAUVAIS_AVIS: 20, // Avis < 2 étoiles répétés (>= 3) → +20 pts
    NOUVEAU_COMPTE_GROS_TX: 25, // Compte < 7 jours + transaction > 200K FCFA → +25 pts
    FLOODING: 15, // > 10 bookings créés en 1h → +15 pts
    PROFIL_NON_VERIFIE: 10, // Non vérifié + activité élevée → +10 pts
} as const;

/** Seuils pour déclencher chaque signal */
const THRESHOLDS = {
    TAUX_ANNULATION_PCT: 50, // %
    MAUVAIS_AVIS_COUNT: 3, // nombre d'avis < 2 étoiles
    NOUVEAU_COMPTE_JOURS: 7, // jours
    GROS_TX_MONTANT: 200_000, // FCFA
    FLOODING_COUNT: 10, // bookings par heure
    PROFIL_ACTIF_BOOKINGS: 5, // bookings depuis un compte non vérifié
} as const;

const CACHE_TTL = 5 * 60; // 5 minutes TTL pour les scores de fraude
const CACHE_KEY = (artisanId: string) => `fraud:score:${artisanId}`;

@Injectable()
export class FraudService {
    private readonly logger = new Logger(FraudService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cacheService: CacheService,
    ) {}

    /**
     * Calcule le score de fraude d'un artisan.
     * Résultat mis en cache Redis 5 minutes.
     *
     * @param artisanId UUID de l'artisan à évaluer
     * @returns FraudScore complet avec signaux détaillés et action recommandée
     */
    async scoreArtisan(artisanId: string): Promise<FraudScore> {
        const cacheKey = CACHE_KEY(artisanId);
        const cached = await this.cacheService.get<FraudScore>(cacheKey);
        if (cached) return cached;

        const signaux = await this.collectSignals(artisanId);
        const score = this.computeScore(signaux);
        const niveau = getFraudNiveau(score);
        const action = getFraudAction(niveau);

        const result: FraudScore = {
            artisanId,
            score,
            niveau,
            signaux,
            action,
            calculatedAt: new Date(),
        };

        await this.cacheService.set(cacheKey, result, CACHE_TTL);

        this.logger.debug(
            `Fraud score artisan [${artisanId}]: ${score}/100 (${niveau}) → ${action}`,
        );

        return result;
    }

    /**
     * Calcule et applique les actions de fraude (blocage temporaire, notif admin).
     * Appelé par le scheduler quotidien.
     *
     * @returns Nombre d'artisans traités + résumé des actions
     */
    async runDailyFraudScan(): Promise<{ total: number; blocked: number; flagged: number }> {
        this.logger.log('Fraud scan quotidien démarré…');

        // Récupérer tous les artisans actifs
        const artisans = await this.prisma.artisan.findMany({
            where: { deletedAt: null },
            select: { id: true, statut: true },
        });

        let blocked = 0;
        let flagged = 0;

        for (const artisan of artisans) {
            try {
                // Invalider le cache pour forcer le recalcul frais
                await this.cacheService.del(CACHE_KEY(artisan.id));
                const score = await this.scoreArtisan(artisan.id);

                if (score.action === FraudAction.BLOCAGE_TEMP && artisan.statut === 'ACTIF') {
                    await this.blockArtisanTemporarily(artisan.id, score.score);
                    blocked++;
                } else if (score.action === FraudAction.NOTIF_ADMIN) {
                    await this.flagForAdminReview(artisan.id, score);
                    flagged++;
                }
            } catch (err) {
                this.logger.warn(
                    `Erreur scoring artisan [${artisan.id}]: ${(err as Error).message}`,
                );
            }
        }

        this.logger.log(
            `Fraud scan terminé: ${artisans.length} artisans analysés | ${blocked} bloqués | ${flagged} signalés`,
        );

        return { total: artisans.length, blocked, flagged };
    }

    /**
     * Retourne les artisans à haut risque (score > 60) pour le dashboard admin.
     */
    async getHighRiskArtisans(limit = 20): Promise<
        {
            artisanId: string;
            nom: string;
            ville: string | null;
            score: number;
            niveau: FraudNiveau;
        }[]
    > {
        const artisans = await this.prisma.artisan.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                nomEntreprise: true,
                villePrincipale: true,
                user: { select: { prenom: true, nom: true } },
            },
            take: 200, // On évalue les 200 premiers — optimisation possible via table dédiée
        });
        const infoById = new Map(artisans.map((a) => [a.id, a]));

        const scores = await Promise.all(artisans.map((a) => this.scoreArtisan(a.id)));

        return scores
            .filter((s) => s.score > 60)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((s) => {
                const info = infoById.get(s.artisanId);
                const nom =
                    info?.nomEntreprise ||
                    `${info?.user?.prenom ?? ''} ${info?.user?.nom ?? ''}`.trim() ||
                    'Artisan';
                return {
                    artisanId: s.artisanId,
                    nom,
                    ville: info?.villePrincipale ?? null,
                    score: s.score,
                    niveau: s.niveau,
                };
            });
    }

    // ─── Collecte des signaux ─────────────────────────────────────────────────

    private async collectSignals(artisanId: string): Promise<FraudSignal> {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const [artisan, cancelStats, mauvaisAvis, recentBookings, grosseTx] = await Promise.all([
            // Infos artisan (créé récemment ? vérifié ?)
            this.prisma.artisan.findUnique({
                where: { id: artisanId },
                select: {
                    verified: true,
                    createdAt: true,
                    tauxCompletion: true,
                    userId: true,
                },
            }),

            // Stats annulation
            this.prisma.booking.groupBy({
                by: ['statut'],
                where: { artisanId },
                _count: { id: true },
            }),

            // Avis < 2 étoiles
            this.prisma.avis.count({
                where: { artisanId, note: { lt: 2 }, visible: true },
            }),

            // Flooding : bookings reçus dans la dernière heure
            this.prisma.booking.count({
                where: { artisanId, createdAt: { gte: oneHourAgo } },
            }),

            // Grosse transaction sur compte récent
            this.prisma.transaction.findFirst({
                where: {
                    artisanId,
                    montant: { gte: THRESHOLDS.GROS_TX_MONTANT },
                    statut: 'COMPLETEE',
                },
                select: { id: true },
            }),
        ]);

        if (!artisan) {
            // Artisan introuvable → signaux neutres
            return {
                tauxAnnulation: 0,
                mauvaisAvisRepetes: 0,
                nouveauCompteGrosseMise: false,
                floodingDemandes: false,
                profilNonVerifieActif: 0,
            };
        }

        // Calcul taux annulation
        const totalBookings = cancelStats.reduce((sum, s) => sum + s._count.id, 0);
        const annulesCount = cancelStats.find((s) => s.statut === 'ANNULEE')?._count.id ?? 0;
        const tauxAnnulation =
            totalBookings > 0 ? Math.round((annulesCount / totalBookings) * 100) : 0;

        // Nouveau compte + grosse mise
        const compteRecent = artisan.createdAt >= sevenDaysAgo;
        const nouveauCompteGrosseMise = compteRecent && !!grosseTx;

        // Profil non vérifié avec activité
        const profilNonVerifieActif = !artisan.verified ? totalBookings : 0;

        return {
            tauxAnnulation,
            mauvaisAvisRepetes: mauvaisAvis,
            nouveauCompteGrosseMise,
            floodingDemandes: recentBookings >= THRESHOLDS.FLOODING_COUNT,
            profilNonVerifieActif,
        };
    }

    // ─── Calcul du score ─────────────────────────────────────────────────────

    private computeScore(signaux: FraudSignal): number {
        let score = 0;

        // Signal 1 : taux annulation > 50% → +30 pts (proportionnel)
        if (signaux.tauxAnnulation >= THRESHOLDS.TAUX_ANNULATION_PCT) {
            const ratio = Math.min(signaux.tauxAnnulation / 100, 1);
            score += Math.round(WEIGHTS.TAUX_ANNULATION * ratio);
        }

        // Signal 2 : avis < 2 étoiles répétés → +20 pts (plafonné)
        if (signaux.mauvaisAvisRepetes >= THRESHOLDS.MAUVAIS_AVIS_COUNT) {
            const ratio = Math.min(signaux.mauvaisAvisRepetes / 10, 1);
            score += Math.round(WEIGHTS.MAUVAIS_AVIS * ratio);
        }

        // Signal 3 : nouveau compte + grosse transaction → +25 pts (binaire)
        if (signaux.nouveauCompteGrosseMise) {
            score += WEIGHTS.NOUVEAU_COMPTE_GROS_TX;
        }

        // Signal 4 : flooding demandes → +15 pts (binaire)
        if (signaux.floodingDemandes) {
            score += WEIGHTS.FLOODING;
        }

        // Signal 5 : profil non vérifié + activité → +10 pts (proportionnel)
        if (signaux.profilNonVerifieActif >= THRESHOLDS.PROFIL_ACTIF_BOOKINGS) {
            const ratio = Math.min(signaux.profilNonVerifieActif / 20, 1);
            score += Math.round(WEIGHTS.PROFIL_NON_VERIFIE * ratio);
        }

        return Math.min(100, score);
    }

    // ─── Actions automatiques ────────────────────────────────────────────────

    private async blockArtisanTemporarily(artisanId: string, score: number): Promise<void> {
        await this.prisma.artisan.update({
            where: { id: artisanId },
            data: { disponible: false },
        });

        // Log dans les activités pour audit trail
        await this.prisma.logActivite.create({
            data: {
                action: 'FRAUD_BLOCAGE_TEMP',
                entite: 'artisan',
                entiteId: artisanId,
                metadata: {
                    score,
                    reason: 'Fraud score > 80 - blocage automatique quotidien',
                } as any,
            },
        });

        this.logger.warn(`Artisan [${artisanId}] bloqué temporairement (score fraude: ${score})`);
    }

    private async flagForAdminReview(artisanId: string, fraudScore: FraudScore): Promise<void> {
        // Serialiser les signaux pour compatibilite Prisma JSON type
        const metadataJson = JSON.parse(
            JSON.stringify({
                score: fraudScore.score,
                niveau: fraudScore.niveau,
                signaux: fraudScore.signaux,
                reason: 'Fraud score 61-80 - verification manuelle requise',
            }),
        ) as Record<string, unknown>;

        await this.prisma.logActivite.create({
            data: {
                action: 'FRAUD_FLAG_ADMIN',
                entite: 'artisan',
                entiteId: artisanId,
                metadata: metadataJson as any,
            },
        });

        this.logger.warn(
            `Artisan [${artisanId}] signalé pour revue admin (score: ${fraudScore.score})`,
        );
    }
}
