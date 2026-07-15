import { Test } from '@nestjs/testing';
import { AnnoncesService } from './annonces.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { ForbiddenException } from '@nestjs/common';

const mockPrisma = {
    annonceChantier: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    manifestationInteret: { upsert: jest.fn(), findMany: jest.fn() },
    profilTravailleur: { findUnique: jest.fn() },
    $queryRawUnsafe: jest.fn(),
};
const mockNotifications = { send: jest.fn().mockResolvedValue(undefined) };

describe('AnnoncesService', () => {
    let service: AnnoncesService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                AnnoncesService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: NotificationService, useValue: mockNotifications },
            ],
        }).compile();
        service = module.get(AnnoncesService);
        jest.clearAllMocks();
    });

    it('creerAnnonce crée + notifie les travailleurs ciblés', async () => {
        mockPrisma.annonceChantier.create.mockResolvedValue({ id: 'a1' });
        mockPrisma.$queryRawUnsafe.mockResolvedValue([{ user_id: 'w1' }, { user_id: 'w2' }]);

        const res = await service.creerAnnonce('patron1', {
            type: 'OUVRIER',
            latitude: 6.3,
            longitude: 2.4,
            ville: 'Cotonou',
            periode: 'UNE_JOURNEE',
            description: 'Besoin de 2 maçons',
        } as never);

        expect(res.id).toBe('a1');
        // Laisser le fire-and-forget se résoudre
        await new Promise((r) => setImmediate(r));
        expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
        expect(mockNotifications.send).toHaveBeenCalledTimes(2);
    });

    it('manifesterInteret refuse sans profil travailleur', async () => {
        mockPrisma.profilTravailleur.findUnique.mockResolvedValue(null);
        await expect(service.manifesterInteret('u1', 'a1', {} as never)).rejects.toThrow(
            ForbiddenException,
        );
    });

    it('manifesterInteret enregistre + notifie le patron', async () => {
        mockPrisma.profilTravailleur.findUnique.mockResolvedValue({
            id: 'p1',
            user: { nom: 'Kwame', prenom: 'Jean' },
        });
        mockPrisma.annonceChantier.findUnique.mockResolvedValue({
            id: 'a1',
            patronUserId: 'patron1',
            statut: 'OUVERTE',
            ville: 'Calavi',
        });
        mockPrisma.manifestationInteret.upsert.mockResolvedValue({ id: 'i1' });

        const res = await service.manifesterInteret('w1', 'a1', { message: 'Dispo' } as never);
        expect(res.id).toBe('i1');
        await new Promise((r) => setImmediate(r));
        expect(mockNotifications.send).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 'patron1' }),
        );
    });

    it('manifesterInteret refuse de répondre à sa propre annonce', async () => {
        mockPrisma.profilTravailleur.findUnique.mockResolvedValue({ id: 'p1', user: {} });
        mockPrisma.annonceChantier.findUnique.mockResolvedValue({
            id: 'a1',
            patronUserId: 'w1',
            statut: 'OUVERTE',
            ville: 'X',
        });
        await expect(service.manifesterInteret('w1', 'a1', {} as never)).rejects.toThrow(
            ForbiddenException,
        );
    });

    it('cloturer refuse si pas propriétaire', async () => {
        mockPrisma.annonceChantier.findUnique.mockResolvedValue({ patronUserId: 'autre' });
        await expect(service.cloturer('patron1', 'a1', 'POURVUE')).rejects.toThrow(
            ForbiddenException,
        );
    });

    it('annoncesAutour renvoie les annonces proches avec distance', async () => {
        mockPrisma.$queryRawUnsafe.mockResolvedValue([{ id: 'a1', distance_km: 3.5 }]);
        mockPrisma.annonceChantier.findMany.mockResolvedValue([{ id: 'a1', type: 'OUVRIER' }]);
        const res = await service.annoncesAutour({
            latitude: 6.37,
            longitude: 2.39,
            rayonKm: 25,
        } as never);
        expect(res[0].id).toBe('a1');
        expect(res[0].distanceKm).toBe(3.5);
    });
});
