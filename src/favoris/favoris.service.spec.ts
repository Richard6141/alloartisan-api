import { Test, TestingModule } from '@nestjs/testing';
import { FavorisService } from './favoris.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
    artisan: { findFirst: jest.fn() },
    favori: {
        create: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
    },
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildArtisan(overrides = {}) {
    return {
        id: 'artisan-1',
        nomEntreprise: 'Plomberie Dupont',
        photoProfilUrl: null,
        noteMoyenne: 4.5,
        nombreAvis: 12,
        villePrincipale: 'Cotonou',
        disponible: true,
        verified: true,
        abonnementType: 'STANDARD',
        tarifHoraire: 2500,
        deletedAt: null,
        user: { nom: 'Dupont', prenom: 'Jean', telephone: '+22900000000' },
        metiers: [],
        ...overrides,
    };
}

function buildFavori(overrides = {}) {
    return {
        id: 'favori-1',
        clientId: 'client-1',
        artisanId: 'artisan-1',
        createdAt: new Date(),
        artisan: buildArtisan(),
        ...overrides,
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FavorisService', () => {
    let service: FavorisService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [FavorisService, { provide: PrismaService, useValue: mockPrisma }],
        }).compile();

        service = module.get<FavorisService>(FavorisService);
        jest.clearAllMocks();
    });

    // ─── addFavori ────────────────────────────────────────────────────────────

    describe('addFavori', () => {
        it('should add an artisan to favorites successfully', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue(buildArtisan());
            mockPrisma.favori.create.mockResolvedValue(buildFavori());

            const result = await service.addFavori('client-1', 'artisan-1');

            expect(result.message).toContain('ajouté');
            expect(mockPrisma.favori.create).toHaveBeenCalledWith({
                data: { clientId: 'client-1', artisanId: 'artisan-1' },
            });
        });

        it('should throw NotFoundException if artisan does not exist', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue(null);

            await expect(service.addFavori('client-1', 'bad-artisan')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ConflictException on P2002 unique constraint violation', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue(buildArtisan());
            mockPrisma.favori.create.mockRejectedValue({ code: 'P2002' });

            await expect(service.addFavori('client-1', 'artisan-1')).rejects.toThrow(
                ConflictException,
            );
        });

        it('should re-throw unexpected errors', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue(buildArtisan());
            const unexpectedError = new Error('Database connection lost');
            mockPrisma.favori.create.mockRejectedValue(unexpectedError);

            await expect(service.addFavori('client-1', 'artisan-1')).rejects.toThrow(
                'Database connection lost',
            );
        });
    });

    // ─── removeFavori ─────────────────────────────────────────────────────────

    describe('removeFavori', () => {
        it('should remove an artisan from favorites', async () => {
            mockPrisma.favori.deleteMany.mockResolvedValue({ count: 1 });

            const result = await service.removeFavori('client-1', 'artisan-1');

            expect(result.message).toContain('retiré');
            expect(mockPrisma.favori.deleteMany).toHaveBeenCalledWith({
                where: { clientId: 'client-1', artisanId: 'artisan-1' },
            });
        });

        it('should throw NotFoundException if favori does not exist', async () => {
            mockPrisma.favori.deleteMany.mockResolvedValue({ count: 0 });

            await expect(service.removeFavori('client-1', 'artisan-1')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    // ─── getMyFavoris ─────────────────────────────────────────────────────────

    describe('getMyFavoris', () => {
        it('should return list of favorites with artisan details', async () => {
            const favoris = [buildFavori()];
            mockPrisma.favori.findMany.mockResolvedValue(favoris);

            const result = await service.getMyFavoris('client-1');

            expect(result.total).toBe(1);
            expect(result.data[0]).toHaveProperty('favoriId', 'favori-1');
            expect(result.data[0].artisan).toHaveProperty('noteMoyenne');
        });

        it('should convert noteMoyenne to number', async () => {
            const favori = buildFavori({
                artisan: buildArtisan({ noteMoyenne: '4.50' }),
            });
            mockPrisma.favori.findMany.mockResolvedValue([favori]);

            const result = await service.getMyFavoris('client-1');

            expect(typeof result.data[0].artisan.noteMoyenne).toBe('number');
        });

        it('should return empty list if no favorites', async () => {
            mockPrisma.favori.findMany.mockResolvedValue([]);

            const result = await service.getMyFavoris('client-1');

            expect(result.total).toBe(0);
            expect(result.data).toHaveLength(0);
        });
    });

    // ─── isFavori ─────────────────────────────────────────────────────────────

    describe('isFavori', () => {
        it('should return true if artisan is in favorites', async () => {
            mockPrisma.favori.findUnique.mockResolvedValue(buildFavori());

            const result = await service.isFavori('client-1', 'artisan-1');

            expect(result.isFavori).toBe(true);
        });

        it('should return false if artisan is not in favorites', async () => {
            mockPrisma.favori.findUnique.mockResolvedValue(null);

            const result = await service.isFavori('client-1', 'unknown-artisan');

            expect(result.isFavori).toBe(false);
        });
    });
});
