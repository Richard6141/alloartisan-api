import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/services/cache.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
    artisan: {
        findMany: jest.fn(),
        count: jest.fn(),
    },
    metier: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
};

const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const artisanRow = {
    id: 'artisan-1',
    nom_entreprise: 'Plomberie Pro',
    photo_profil_url: null,
    note_moyenne: '4.5',
    nombre_avis: 20,
    ville_principale: 'Cotonou',
    verified: true,
    disponible: true,
    abonnement_type: 'PREMIUM',
    annees_experience: 5,
    accepte_urgences: true,
    rank: '1.35',
    user_id_col: 'user-1',
    user_nom: 'Dupont',
    user_prenom: 'Jean',
    metier_id: 'metier-1',
    metier_nom: 'Plomberie',
    metier_slug: 'plomberie',
    total_count: '1',
};

const artisanOrmRow = {
    id: 'artisan-1',
    nomEntreprise: 'Plomberie Pro',
    photoProfilUrl: null,
    noteMoyenne: 4.5,
    nombreAvis: 20,
    villePrincipale: 'Cotonou',
    verified: true,
    disponible: true,
    abonnementType: 'PREMIUM',
    anneesExperience: 5,
    accepteUrgences: true,
    user: { id: 'user-1', nom: 'Dupont', prenom: 'Jean' },
    metiers: [{ metier: { id: 'metier-1', nom: 'Plomberie', slug: 'plomberie' } }],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SearchService', () => {
    let service: SearchService;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockCacheService.get.mockResolvedValue(null);
        mockCacheService.set.mockResolvedValue(undefined);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SearchService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: CacheService, useValue: mockCacheService },
            ],
        }).compile();

        service = module.get<SearchService>(SearchService);
    });

    // ─── Cache ──────────────────────────────────────────────────────────────

    describe('cache', () => {
        it('should return cached result if available', async () => {
            const cached = {
                data: [],
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 0,
                fullTextUsed: true,
            };
            mockCacheService.get.mockResolvedValue(cached);

            const result = await service.searchArtisans({ q: 'plombier', page: 1, limit: 20 });

            expect(result).toEqual(cached);
            expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
            expect(mockPrisma.artisan.findMany).not.toHaveBeenCalled();
        });
    });

    // ─── Full-text search ($queryRaw) ───────────────────────────────────────

    describe('searchArtisans with q (full-text)', () => {
        it('should call $queryRaw when q is provided', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([artisanRow]);

            const result = await service.searchArtisans({ q: 'plombier', page: 1, limit: 20 });

            expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
            expect(result.fullTextUsed).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].nomEntreprise).toBe('Plomberie Pro');
            expect(result.data[0].rank).toBe(1.35);
        });

        it('should return total from total_count column', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([{ ...artisanRow, total_count: '42' }]);

            const result = await service.searchArtisans({ q: 'electricien', page: 1, limit: 20 });

            expect(result.total).toBe(42);
            expect(result.totalPages).toBe(3); // Math.ceil(42/20)
        });

        it('should return empty result when $queryRaw returns []', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([]);

            const result = await service.searchArtisans({ q: 'inconnu', page: 1, limit: 20 });

            expect(result.total).toBe(0);
            expect(result.data).toHaveLength(0);
            expect(result.fullTextUsed).toBe(true);
        });

        it('should fallback to filteredSearch if q is too short (< 2 chars)', async () => {
            mockPrisma.artisan.findMany.mockResolvedValue([]);
            mockPrisma.artisan.count.mockResolvedValue(0);

            const result = await service.searchArtisans({ q: 'p', page: 1, limit: 20 });

            expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
            expect(mockPrisma.artisan.findMany).toHaveBeenCalledTimes(1);
            expect(result.fullTextUsed).toBe(false);
        });
    });

    // ─── Filtered search (no q) ─────────────────────────────────────────────

    describe('searchArtisans without q (filtered)', () => {
        it('should call artisan.findMany when q is absent', async () => {
            mockPrisma.artisan.findMany.mockResolvedValue([artisanOrmRow]);
            mockPrisma.artisan.count.mockResolvedValue(1);

            const result = await service.searchArtisans({ ville: 'Cotonou', page: 1, limit: 20 });

            expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
            expect(mockPrisma.artisan.findMany).toHaveBeenCalledTimes(1);
            expect(result.fullTextUsed).toBe(false);
            expect(result.data[0].rank).toBeNull();
        });

        it('should resolve metierSlug to id before filtering', async () => {
            mockPrisma.metier.findUnique.mockResolvedValue({ id: 'metier-1' });
            mockPrisma.artisan.findMany.mockResolvedValue([]);
            mockPrisma.artisan.count.mockResolvedValue(0);

            await service.searchArtisans({ metierSlug: 'plomberie', page: 1, limit: 20 });

            expect(mockPrisma.metier.findUnique).toHaveBeenCalledWith({
                where: { slug: 'plomberie' },
                select: { id: true },
            });
            expect(mockPrisma.artisan.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        metiers: { some: { metierId: 'metier-1' } },
                    }),
                }),
            );
        });

        it('should return empty when metierSlug not found', async () => {
            mockPrisma.metier.findUnique.mockResolvedValue(null);

            const result = await service.searchArtisans({
                metierSlug: 'inexistant',
                page: 1,
                limit: 20,
            });

            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(mockPrisma.artisan.findMany).not.toHaveBeenCalled();
        });
    });

    // ─── Autocomplete ─────────────────────────────────────────────────────────

    describe('autocomplete', () => {
        it('should return cached suggestions if available', async () => {
            const suggestions = [{ value: 'Plomberie', type: 'metier' as const }];
            mockCacheService.get.mockResolvedValue(suggestions);

            const result = await service.autocomplete('plo');

            expect(result).toEqual(suggestions);
            expect(mockPrisma.metier.findMany).not.toHaveBeenCalled();
        });

        it('should aggregate suggestions from metiers, artisans, and villes', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockPrisma.metier.findMany.mockResolvedValue([{ nom: 'Plomberie' }]);
            mockPrisma.artisan.findMany.mockResolvedValue([{ nomEntreprise: 'Plomberie Pro' }]);
            mockPrisma.$queryRaw.mockResolvedValue([{ ville_principale: 'Cotonou' }]);

            const result = await service.autocomplete('plo');

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({ value: 'Plomberie', type: 'metier' });
            expect(result[1]).toEqual({ value: 'Plomberie Pro', type: 'artisan' });
            expect(result[2]).toEqual({ value: 'Cotonou', type: 'ville' });
        });

        it('should return empty array if no matches found', async () => {
            mockPrisma.metier.findMany.mockResolvedValue([]);
            mockPrisma.artisan.findMany.mockResolvedValue([]);
            mockPrisma.$queryRaw.mockResolvedValue([]);

            const result = await service.autocomplete('xyz');

            expect(result).toHaveLength(0);
            expect(mockCacheService.set).toHaveBeenCalledWith(
                expect.stringContaining('autocomplete'),
                [],
                expect.any(Number),
            );
        });

        it('should filter out artisans with null nomEntreprise', async () => {
            mockPrisma.metier.findMany.mockResolvedValue([]);
            mockPrisma.artisan.findMany.mockResolvedValue([
                { nomEntreprise: null },
                { nomEntreprise: 'Plomberie Pro' },
            ]);
            mockPrisma.$queryRaw.mockResolvedValue([]);

            const result = await service.autocomplete('plo');

            expect(result).toHaveLength(1);
            expect(result[0].value).toBe('Plomberie Pro');
        });
    });
});
