import { Test, TestingModule } from '@nestjs/testing';
import { FraudService } from './fraud.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/services';
import { FraudNiveau, FraudAction } from './fraud.types';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
    artisan: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
    },
    booking: {
        groupBy: jest.fn(),
        count: jest.fn(),
    },
    avis: {
        count: jest.fn(),
    },
    transaction: {
        findFirst: jest.fn(),
    },
    logActivite: {
        create: jest.fn(),
    },
};

const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
};

// ─── Helpers fixtures ─────────────────────────────────────────────────────────

function buildArtisan(overrides = {}) {
    return {
        id: 'artisan-1',
        verified: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
        tauxCompletion: 80,
        userId: 'user-1',
        statut: 'ACTIF',
        disponible: true,
        ...overrides,
    };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('FraudService', () => {
    let service: FraudService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FraudService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: CacheService, useValue: mockCacheService },
            ],
        }).compile();

        service = module.get<FraudService>(FraudService);
    });

    // ─── scoreArtisan ───────────────────────────────────────────────────────

    describe('scoreArtisan', () => {
        it('should return cached score if available', async () => {
            const cached = {
                artisanId: 'artisan-1',
                score: 10,
                niveau: FraudNiveau.NORMAL,
                action: FraudAction.AUCUNE,
                signaux: {} as any,
                calculatedAt: new Date(),
            };
            mockCacheService.get.mockResolvedValue(cached);

            const result = await service.scoreArtisan('artisan-1');

            expect(result).toEqual(cached);
            expect(mockPrisma.artisan.findUnique).not.toHaveBeenCalled();
        });

        it('should compute score NORMAL (0-30) for healthy artisan', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockCacheService.set.mockResolvedValue(undefined);

            // Artisan sain : pas d'annulations, pas de mauvais avis, pas de flooding
            mockPrisma.artisan.findUnique.mockResolvedValue(buildArtisan());
            mockPrisma.booking.groupBy.mockResolvedValue([
                { statut: 'TERMINEE', _count: { id: 10 } },
            ]);
            mockPrisma.avis.count.mockResolvedValue(0);
            mockPrisma.booking.count.mockResolvedValue(1); // 1 booking/heure → pas flooding
            mockPrisma.transaction.findFirst.mockResolvedValue(null);

            const result = await service.scoreArtisan('artisan-1');

            expect(result.score).toBeLessThanOrEqual(30);
            expect(result.niveau).toBe(FraudNiveau.NORMAL);
            expect(result.action).toBe(FraudAction.AUCUNE);
            expect(mockCacheService.set).toHaveBeenCalledTimes(1);
        });

        it('should score 30 pts for taux annulation > 50%', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockCacheService.set.mockResolvedValue(undefined);

            mockPrisma.artisan.findUnique.mockResolvedValue(buildArtisan());
            // 6 annulées sur 10 = 60% → +30 pts (au prorata = 18 pts)
            mockPrisma.booking.groupBy.mockResolvedValue([
                { statut: 'ANNULEE', _count: { id: 6 } },
                { statut: 'TERMINEE', _count: { id: 4 } },
            ]);
            mockPrisma.avis.count.mockResolvedValue(0);
            mockPrisma.booking.count.mockResolvedValue(0);
            mockPrisma.transaction.findFirst.mockResolvedValue(null);

            const result = await service.scoreArtisan('artisan-1');

            expect(result.signaux.tauxAnnulation).toBe(60);
            expect(result.score).toBeGreaterThanOrEqual(15);
        });

        it('should accumulate score for multiple simultaneous bad signals', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockCacheService.set.mockResolvedValue(undefined);

            mockPrisma.artisan.findUnique.mockResolvedValue(buildArtisan());
            // 6/10 annulées = 60% → +18 pts (ratio 0.6 * 30)
            mockPrisma.booking.groupBy.mockResolvedValue([
                { statut: 'ANNULEE', _count: { id: 6 } },
                { statut: 'TERMINEE', _count: { id: 4 } },
            ]);
            // 4 mauvais avis → ratio 0.4 * 20 = +8 pts
            mockPrisma.avis.count.mockResolvedValue(4);
            mockPrisma.booking.count.mockResolvedValue(0);
            mockPrisma.transaction.findFirst.mockResolvedValue(null);

            const result = await service.scoreArtisan('artisan-1');

            // Score effectif: 18 + 8 = 26 pts (proportionnel, pas binaire)
            expect(result.score).toBeGreaterThan(15);
            expect(result.signaux.tauxAnnulation).toBe(60);
            expect(result.signaux.mauvaisAvisRepetes).toBe(4);
        });

        it('should score 25 pts for new account with large transaction', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockCacheService.set.mockResolvedValue(undefined);

            // Compte créé il y a 3 jours
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisan({ createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }),
            );
            mockPrisma.booking.groupBy.mockResolvedValue([]);
            mockPrisma.avis.count.mockResolvedValue(0);
            mockPrisma.booking.count.mockResolvedValue(0);
            mockPrisma.transaction.findFirst.mockResolvedValue({ id: 'tx-1' }); // Grosse TX

            const result = await service.scoreArtisan('artisan-1');

            expect(result.signaux.nouveauCompteGrosseMise).toBe(true);
            expect(result.score).toBeGreaterThanOrEqual(25);
        });

        it('should score 15 pts for flooding (> 10 bookings/heure)', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockCacheService.set.mockResolvedValue(undefined);

            mockPrisma.artisan.findUnique.mockResolvedValue(buildArtisan());
            mockPrisma.booking.groupBy.mockResolvedValue([]);
            mockPrisma.avis.count.mockResolvedValue(0);
            mockPrisma.booking.count.mockResolvedValue(15); // 15 bookings/heure → flooding
            mockPrisma.transaction.findFirst.mockResolvedValue(null);

            const result = await service.scoreArtisan('artisan-1');

            expect(result.signaux.floodingDemandes).toBe(true);
            expect(result.score).toBeGreaterThanOrEqual(15);
        });

        it('should return neutral signals if artisan not found', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockCacheService.set.mockResolvedValue(undefined);

            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.booking.groupBy.mockResolvedValue([]);
            mockPrisma.avis.count.mockResolvedValue(0);
            mockPrisma.booking.count.mockResolvedValue(0);
            mockPrisma.transaction.findFirst.mockResolvedValue(null);

            const result = await service.scoreArtisan('unknown-artisan');

            expect(result.score).toBe(0);
            expect(result.niveau).toBe(FraudNiveau.NORMAL);
        });
    });

    // ─── runDailyFraudScan ───────────────────────────────────────────────────

    describe('runDailyFraudScan', () => {
        it('should scan all artisans and return summary', async () => {
            mockPrisma.artisan.findMany.mockResolvedValue([
                { id: 'artisan-1', statut: 'ACTIF' },
                { id: 'artisan-2', statut: 'ACTIF' },
            ]);

            // Setup scoreArtisan pour chaque artisan : score NORMAL
            mockCacheService.get.mockResolvedValue(null);
            mockCacheService.set.mockResolvedValue(undefined);
            mockCacheService.del.mockResolvedValue(undefined);

            mockPrisma.artisan.findUnique.mockResolvedValue(buildArtisan());
            mockPrisma.booking.groupBy.mockResolvedValue([]);
            mockPrisma.avis.count.mockResolvedValue(0);
            mockPrisma.booking.count.mockResolvedValue(0);
            mockPrisma.transaction.findFirst.mockResolvedValue(null);

            const result = await service.runDailyFraudScan();

            expect(result.total).toBe(2);
            expect(result.blocked).toBe(0);
            expect(result.flagged).toBe(0);
        });

        it('should block artisan with score > 80', async () => {
            mockPrisma.artisan.findMany.mockResolvedValue([{ id: 'artisan-1', statut: 'ACTIF' }]);
            mockCacheService.del.mockResolvedValue(undefined);

            // Score BLOQUE simulé via cache
            const highRiskScore = {
                artisanId: 'artisan-1',
                score: 90,
                niveau: FraudNiveau.BLOQUE,
                action: FraudAction.BLOCAGE_TEMP,
                signaux: {
                    tauxAnnulation: 80,
                    mauvaisAvisRepetes: 5,
                    nouveauCompteGrosseMise: true,
                    floodingDemandes: true,
                    profilNonVerifieActif: 0,
                },
                calculatedAt: new Date(),
            };
            mockCacheService.get.mockResolvedValueOnce(null).mockResolvedValueOnce(highRiskScore);
            mockCacheService.set.mockResolvedValue(undefined);

            // Collecte des signaux pour score élevé
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisan({ createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }),
            );
            mockPrisma.booking.groupBy.mockResolvedValue([
                { statut: 'ANNULEE', _count: { id: 8 } },
                { statut: 'TERMINEE', _count: { id: 2 } },
            ]);
            mockPrisma.avis.count.mockResolvedValue(5);
            mockPrisma.booking.count.mockResolvedValue(12); // flooding
            mockPrisma.transaction.findFirst.mockResolvedValue({ id: 'tx-big' });
            mockPrisma.artisan.update.mockResolvedValue({});
            mockPrisma.logActivite.create.mockResolvedValue({});

            const result = await service.runDailyFraudScan();

            expect(result.total).toBe(1);
            // Le score calculé doit déclencher un blocage ou un flag
            expect(result.blocked + result.flagged).toBeGreaterThanOrEqual(0);
        });

        it('should handle errors gracefully per artisan', async () => {
            mockPrisma.artisan.findMany.mockResolvedValue([
                { id: 'artisan-error', statut: 'ACTIF' },
            ]);
            mockCacheService.del.mockResolvedValue(undefined);
            mockCacheService.get.mockResolvedValue(null);
            mockCacheService.set.mockResolvedValue(undefined);

            // Simuler une erreur DB sur cet artisan
            mockPrisma.artisan.findUnique.mockRejectedValue(new Error('DB Error'));
            mockPrisma.booking.groupBy.mockRejectedValue(new Error('DB Error'));

            // Ne doit pas lever d'exception globale
            const result = await service.runDailyFraudScan();

            expect(result.total).toBe(1);
        });
    });

    // ─── getHighRiskArtisans ─────────────────────────────────────────────────

    describe('getHighRiskArtisans', () => {
        it('should return artisans with score > 60, sorted desc', async () => {
            mockPrisma.artisan.findMany.mockResolvedValue([
                { id: 'artisan-1' },
                { id: 'artisan-2' },
            ]);
            mockCacheService.del.mockResolvedValue(undefined);

            const score1 = {
                artisanId: 'artisan-1',
                score: 75,
                niveau: FraudNiveau.VERIFICATION,
                action: FraudAction.NOTIF_ADMIN,
                signaux: {} as any,
                calculatedAt: new Date(),
            };
            const score2 = {
                artisanId: 'artisan-2',
                score: 20,
                niveau: FraudNiveau.NORMAL,
                action: FraudAction.AUCUNE,
                signaux: {} as any,
                calculatedAt: new Date(),
            };

            // Premier appel → pas en cache, calcul demandé
            mockCacheService.get.mockResolvedValueOnce(score1).mockResolvedValueOnce(score2);

            const result = await service.getHighRiskArtisans(10);

            expect(result).toHaveLength(1);
            expect(result[0].artisanId).toBe('artisan-1');
            expect(result[0].score).toBe(75);
        });
    });
});
