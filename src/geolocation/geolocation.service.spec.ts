import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GeolocationService } from './geolocation.service';
import { PrismaService } from 'src/prisma/prisma.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
    artisan: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ARTISAN_ID = 'artisan-uuid-1';

const rawPostGISRow = {
    id: ARTISAN_ID,
    nom_entreprise: 'Plomberie Pro',
    slogan: 'Votre expert rapidement',
    photo_profil_url: null,
    note_moyenne: '4.5',
    nombre_avis: 12,
    tarif_horaire: '5000',
    tarif_deplacement: '2000',
    abonnement_type: 'PREMIUM',
    ville_principale: 'Cotonou',
    disponible: true,
    nom: 'Dupont',
    prenom: 'Jean',
    user_photo_url: null,
    distance_km: '2.35',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GeolocationService', () => {
    let service: GeolocationService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [GeolocationService, { provide: PrismaService, useValue: mockPrisma }],
        }).compile();

        service = module.get<GeolocationService>(GeolocationService);
    });

    // ─── findNearbyArtisans ────────────────────────────────────────────────────

    describe('findNearbyArtisans', () => {
        const baseDto = { lat: 6.3654, lng: 2.4183, radius: 10, limit: 20 };

        it('should return formatted artisans from PostGIS query', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([rawPostGISRow]);

            const result = await service.findNearbyArtisans(baseDto);

            expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(1);
            expect(result[0].nomEntreprise).toBe('Plomberie Pro');
            expect(result[0].distanceKm).toBe(2.35);
            expect(result[0].noteMoyenne).toBe(4.5);
            expect(result[0].user.nom).toBe('Dupont');
        });

        it('should filter by metierId when provided', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([rawPostGISRow]);

            await service.findNearbyArtisans({ ...baseDto, metierId: 'metier-1' });

            expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
        });

        it('should return empty array when no artisans found', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([]);

            const result = await service.findNearbyArtisans(baseDto);
            expect(result).toHaveLength(0);
        });

        it('should throw BadRequestException for invalid coordinates (lat > 90)', async () => {
            await expect(
                service.findNearbyArtisans({ lat: 100, lng: 2.4, radius: 10 }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException for invalid coordinates (lng > 180)', async () => {
            await expect(
                service.findNearbyArtisans({ lat: 6.3, lng: 200, radius: 10 }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should fallback to city search when PostGIS not available', async () => {
            mockPrisma.$queryRaw.mockRejectedValue(new Error('function st_dwithin does not exist'));
            mockPrisma.artisan.findMany.mockResolvedValue([
                {
                    id: ARTISAN_ID,
                    nomEntreprise: 'Plomberie Pro',
                    slogan: null,
                    photoProfilUrl: null,
                    noteMoyenne: 4.5,
                    nombreAvis: 5,
                    tarifHoraire: 5000,
                    tarifDeplacement: 2000,
                    abonnementType: 'PREMIUM',
                    villePrincipale: 'Cotonou',
                    disponible: true,
                    latitude: 6.3,
                    longitude: 2.4,
                    user: { nom: 'Dupont', prenom: 'Jean', photoUrl: null },
                },
            ]);

            const result = await service.findNearbyArtisans(baseDto);

            expect(mockPrisma.artisan.findMany).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(1);
            expect(result[0].mode).toBe('fallback');
            expect(result[0].distance_km).toBeDefined();
        });

        it('should re-throw non-PostGIS errors', async () => {
            mockPrisma.$queryRaw.mockRejectedValue(new Error('DB connection lost'));

            await expect(service.findNearbyArtisans(baseDto)).rejects.toThrow('DB connection lost');
        });

        it('should convert radius to meters (km * 1000)', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([]);

            // radius = 25km → 25000m utilisés dans la requête
            await service.findNearbyArtisans({ lat: 6.3, lng: 2.4, radius: 25 });

            expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
        });
    });

    // ─── getArtisanDistance ────────────────────────────────────────────────────

    describe('getArtisanDistance', () => {
        const artisanWithGeo = {
            id: ARTISAN_ID,
            nomEntreprise: 'Plomberie Pro',
            villePrincipale: 'Cotonou',
            latitude: 6.3654,
            longitude: 2.4183,
        };

        it('should return distance via PostGIS', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue(artisanWithGeo);
            mockPrisma.$queryRaw.mockResolvedValue([{ distance_km: 3.14 }]);

            const result = await service.getArtisanDistance(ARTISAN_ID, 6.4, 2.45);

            expect(result.distanceKm).toBe(3.14);
            expect(result.dureeEstimeeMinutes).toBe(6); // 3.14 * 2 = 6.28 → arrondi 6
            expect(result.nomEntreprise).toBe('Plomberie Pro');
        });

        it('should use Haversine formula when PostGIS returns no result', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue(artisanWithGeo);
            mockPrisma.$queryRaw.mockResolvedValue([]); // Pas de résultat PostGIS

            const result = await service.getArtisanDistance(ARTISAN_ID, 6.4, 2.5);

            expect(result.distanceKm).not.toBeNull();
            expect(typeof result.distanceKm).toBe('number');
        });

        it('should return null distance when artisan has no location', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue({
                ...artisanWithGeo,
                latitude: null,
                longitude: null,
            });

            const result = await service.getArtisanDistance(ARTISAN_ID, 6.4, 2.5);

            expect(result.distanceKm).toBeNull();
            expect(result.message).toBeDefined();
        });

        it('should throw NotFoundException when artisan not found', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue(null);

            await expect(service.getArtisanDistance('nonexistent', 6.4, 2.5)).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
