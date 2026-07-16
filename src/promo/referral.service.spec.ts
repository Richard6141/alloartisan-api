import { Test } from '@nestjs/testing';
import { ReferralService } from './referral.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';

const mockPrisma = {
    parrainage: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
    },
    artisan: { findUnique: jest.fn(), update: jest.fn() },
    user: { findUnique: jest.fn(), updateMany: jest.fn(), findMany: jest.fn() },
};
const mockNotif = { send: jest.fn().mockResolvedValue(undefined) };

describe('ReferralService — programme Ambassadeur', () => {
    let service: ReferralService;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                ReferralService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: NotificationService, useValue: mockNotif },
            ],
        }).compile();
        service = moduleRef.get(ReferralService);
        jest.clearAllMocks();
    });

    it('onFirstPaidSubscription : sans parrainage → aucun versement', async () => {
        mockPrisma.parrainage.findUnique.mockResolvedValue(null);
        await service.onFirstPaidSubscription('filleul1');
        expect(mockPrisma.parrainage.updateMany).not.toHaveBeenCalled();
        expect(mockPrisma.artisan.update).not.toHaveBeenCalled();
    });

    it('onFirstPaidSubscription : crédite filleul + parrain et notifie', async () => {
        mockPrisma.parrainage.findUnique.mockResolvedValue({
            id: 'p1',
            statut: 'EN_ATTENTE',
            parrainId: 'parrain1',
        });
        mockPrisma.parrainage.updateMany.mockResolvedValue({ count: 1 });
        // crédit de jours : les deux users sont artisans
        mockPrisma.artisan.findUnique.mockImplementation(({ where }: any) =>
            Promise.resolve({
                id: 'a-' + where.userId,
                abonnementType: 'GRATUIT',
                abonnementExpireAt: null,
                ambassadeurNiveau: null,
            }),
        );
        mockPrisma.artisan.update.mockResolvedValue({});
        mockPrisma.parrainage.count.mockResolvedValue(1); // pas encore de palier

        await service.onFirstPaidSubscription('filleul1');

        expect(mockPrisma.parrainage.updateMany).toHaveBeenCalled();
        // crédit filleul + crédit parrain = au moins 2 update d'artisan
        expect(mockPrisma.artisan.update.mock.calls.length).toBeGreaterThanOrEqual(2);
        // notification au filleul ET au parrain
        expect(mockNotif.send).toHaveBeenCalled();
    });

    it('onFirstPaidSubscription : passage du palier BRONZE à 3 filleuls', async () => {
        mockPrisma.parrainage.findUnique.mockResolvedValue({
            id: 'p3',
            statut: 'EN_ATTENTE',
            parrainId: 'parrain1',
        });
        mockPrisma.parrainage.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.artisan.findUnique.mockImplementation(({ where }: any) =>
            Promise.resolve({
                id: 'a-' + where.userId,
                abonnementType: 'STANDARD',
                abonnementExpireAt: null,
                ambassadeurNiveau: null,
            }),
        );
        mockPrisma.artisan.update.mockResolvedValue({});
        mockPrisma.parrainage.count.mockResolvedValue(3); // seuil BRONZE atteint

        await service.onFirstPaidSubscription('filleul3');

        // le badge est posé (update avec ambassadeurNiveau)
        const badgeCall = mockPrisma.artisan.update.mock.calls.find(
            (c: any[]) => c[0]?.data?.ambassadeurNiveau === 'BRONZE',
        );
        expect(badgeCall).toBeDefined();
    });

    it('onFirstPaidBooking reste un no-op (paiement intervention dé-scopé)', async () => {
        await service.onFirstPaidBooking('x');
        expect(mockPrisma.parrainage.updateMany).not.toHaveBeenCalled();
    });

    it('getLeaderboard : classe les parrains par filleuls abonnés', async () => {
        mockPrisma.parrainage.groupBy.mockResolvedValue([
            { parrainId: 'u1', _count: { _all: 5 } },
            { parrainId: 'u2', _count: { _all: 2 } },
        ]);
        mockPrisma.user.findMany.mockResolvedValue([
            {
                id: 'u1',
                prenom: 'Ada',
                nom: 'K',
                artisan: { ambassadeurNiveau: 'ARGENT', nomEntreprise: 'Ada Plomberie' },
            },
            { id: 'u2', prenom: 'Bob', nom: 'M', artisan: null },
        ]);

        const res = await service.getLeaderboard(10);
        expect(res[0]).toEqual(
            expect.objectContaining({
                rang: 1,
                nom: 'Ada Plomberie',
                niveau: 'ARGENT',
                filleulsAbonnes: 5,
            }),
        );
        expect(res[1]).toEqual(
            expect.objectContaining({ rang: 2, nom: 'Bob M', filleulsAbonnes: 2 }),
        );
    });
});
