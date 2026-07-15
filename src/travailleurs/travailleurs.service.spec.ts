import { Test } from '@nestjs/testing';
import { TravailleursService } from './travailleurs.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

const mockPrisma = {
    profilTravailleur: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
    },
    profilTravailleurMetier: { deleteMany: jest.fn(), createMany: jest.fn() },
    engagementTravail: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    avisTravail: { create: jest.fn() },
    $transaction: jest.fn((ops: unknown) =>
        Array.isArray(ops) ? Promise.resolve(ops) : (ops as (p: unknown) => unknown)(mockPrisma),
    ),
    $queryRawUnsafe: jest.fn(),
};

describe('TravailleursService', () => {
    let service: TravailleursService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [TravailleursService, { provide: PrismaService, useValue: mockPrisma }],
        }).compile();
        service = module.get(TravailleursService);
        jest.clearAllMocks();
    });

    // ─── Profil ─────────────────────────────────────────────────────────────

    it('upsertMonProfil rejette plus de 2 metiers', async () => {
        await expect(
            service.upsertMonProfil('u1', {
                type: 'OUVRIER',
                latitude: 6.3,
                longitude: 2.4,
                villePrincipale: 'Cotonou',
                disponibilite: 'PONCTUEL',
                metiers: [{ metierId: 'm1' }, { metierId: 'm2' }, { metierId: 'm3' }],
            } as never),
        ).rejects.toThrow(BadRequestException);
    });

    it('upsertMonProfil cree/maj le profil', async () => {
        mockPrisma.profilTravailleur.upsert.mockResolvedValue({ id: 'p1', userId: 'u1' });
        const res = await service.upsertMonProfil('u1', {
            type: 'AIDE',
            polyvalent: true,
            latitude: 6.3,
            longitude: 2.4,
            villePrincipale: 'Cotonou',
            disponibilite: 'PONCTUEL',
        } as never);
        expect(res.id).toBe('p1');
        expect(mockPrisma.profilTravailleur.upsert).toHaveBeenCalled();
    });

    // ─── Recherche ──────────────────────────────────────────────────────────

    it('search renvoie les profils proches actifs avec distance', async () => {
        mockPrisma.$queryRawUnsafe.mockResolvedValue([{ id: 'p1', distance_km: 1.2 }]);
        mockPrisma.profilTravailleur.findMany.mockResolvedValue([{ id: 'p1', type: 'OUVRIER' }]);
        const res = await service.search({
            latitude: 6.37,
            longitude: 2.39,
            rayonKm: 25,
        } as never);
        expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
        expect(res[0].id).toBe('p1');
        expect(res[0].distanceKm).toBe(1.2);
    });

    // ─── Embauche + avis ────────────────────────────────────────────────────

    it('embaucher cree un engagement EN_COURS', async () => {
        mockPrisma.profilTravailleur.findUnique.mockResolvedValue({ id: 'p1', userId: 'w1' });
        mockPrisma.engagementTravail.create.mockResolvedValue({ id: 'e1', statut: 'EN_COURS' });
        const res = await service.embaucher('patron1', { profilTravailleurId: 'p1' } as never);
        expect(res.statut).toBe('EN_COURS');
    });

    it('embaucher refuse de s embaucher soi-meme', async () => {
        mockPrisma.profilTravailleur.findUnique.mockResolvedValue({ id: 'p1', userId: 'patron1' });
        await expect(
            service.embaucher('patron1', { profilTravailleurId: 'p1' } as never),
        ).rejects.toThrow(BadRequestException);
    });

    it('deposerAvis refuse si engagement pas termine', async () => {
        mockPrisma.engagementTravail.findUnique.mockResolvedValue({
            id: 'e1',
            statut: 'EN_COURS',
            patronUserId: 'patron1',
            profil: { userId: 'w1' },
        });
        await expect(
            service.deposerAvis('patron1', 'e1', { note: 5 } as never),
        ).rejects.toThrow(BadRequestException);
    });

    it('deposerAvis (patron) cree un avis PATRON_VERS_TRAVAILLEUR', async () => {
        mockPrisma.engagementTravail.findUnique.mockResolvedValue({
            id: 'e1',
            statut: 'TERMINE',
            patronUserId: 'patron1',
            profil: { userId: 'w1' },
        });
        mockPrisma.avisTravail.create.mockResolvedValue({
            id: 'a1',
            sens: 'PATRON_VERS_TRAVAILLEUR',
        });
        const res = await service.deposerAvis('patron1', 'e1', { note: 5 } as never);
        expect(res.sens).toBe('PATRON_VERS_TRAVAILLEUR');
    });

    it('deposerAvis refuse un tiers', async () => {
        mockPrisma.engagementTravail.findUnique.mockResolvedValue({
            id: 'e1',
            statut: 'TERMINE',
            patronUserId: 'patron1',
            profil: { userId: 'w1' },
        });
        await expect(
            service.deposerAvis('etranger', 'e1', { note: 5 } as never),
        ).rejects.toThrow(ForbiddenException);
    });
});
