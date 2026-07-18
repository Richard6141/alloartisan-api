import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from 'src/prisma/prisma.service';

// ─── Mock PrismaService ───────────────────────────────────────────────────────

const mockPrisma = {
    user: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    artisan: {
        count: jest.fn(),
        aggregate: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
    },
    booking: {
        count: jest.fn(),
        groupBy: jest.fn(),
        $queryRaw: jest.fn(),
    },
    transaction: {
        aggregate: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
    },
    avis: {
        count: jest.fn(),
        findMany: jest.fn(),
    },
    notification: {
        createMany: jest.fn(),
    },
    logActivite: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
    },
    $queryRaw: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdminService', () => {
    let service: AdminService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [AdminService, { provide: PrismaService, useValue: mockPrisma }],
        }).compile();

        service = module.get<AdminService>(AdminService);
    });

    // ─── getOverviewStats ─────────────────────────────────────────────────────

    describe('getOverviewStats', () => {
        it('should return aggregated platform KPIs', async () => {
            // Mocking toutes les requêtes parallèles
            mockPrisma.user.count.mockResolvedValue(500);
            mockPrisma.artisan.count
                .mockResolvedValueOnce(150) // totalArtisans
                .mockResolvedValueOnce(120) // totalArtisansActifs
                .mockResolvedValueOnce(10); // artisansEnAttente
            mockPrisma.booking.count
                .mockResolvedValueOnce(1000) // totalBookings
                .mockResolvedValueOnce(80) // bookingsCeMois
                .mockResolvedValueOnce(700) // bookingsTermines
                .mockResolvedValueOnce(50); // bookingsEnCours
            mockPrisma.transaction.aggregate
                .mockResolvedValueOnce({ _sum: { montant: '5000000' } }) // revenusTotal
                .mockResolvedValueOnce({ _sum: { montant: '500000' } }) // revenusCeMois
                .mockResolvedValueOnce({ _sum: { commission: '500000' } }); // commissions
            mockPrisma.avis.count.mockResolvedValue(300);
            mockPrisma.artisan.aggregate.mockResolvedValue({ _avg: { noteMoyenne: 4.2 } });

            const result = await service.getOverviewStats();

            expect(result.utilisateurs.total).toBe(500);
            expect(result.utilisateurs.artisans).toBe(150);
            expect(result.bookings.total).toBe(1000);
            expect(result.bookings.tauxCompletion).toBe(70); // 700/1000 * 100
            expect(result.revenus.total).toBe(5_000_000);
            expect(result.avis.total).toBe(300);
            expect(result).toHaveProperty('generatedAt');
        });

        it('should return 0 completion rate when no bookings', async () => {
            mockPrisma.user.count.mockResolvedValue(0);
            mockPrisma.artisan.count.mockResolvedValue(0).mockResolvedValue(0).mockResolvedValue(0);
            mockPrisma.booking.count.mockResolvedValue(0);
            mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { montant: null } });
            mockPrisma.avis.count.mockResolvedValue(0);
            mockPrisma.artisan.aggregate.mockResolvedValue({ _avg: { noteMoyenne: null } });

            const result = await service.getOverviewStats();

            expect(result.bookings.tauxCompletion).toBe(0);
            expect(result.revenus.total).toBe(0);
        });
    });

    // ─── getUsers ────────────────────────────────────────────────────────────

    describe('getUsers', () => {
        it('should return paginated user list', async () => {
            const users = [
                { id: 'u1', nom: 'Test', prenom: 'User', email: 'test@test.com', role: 'CLIENT' },
            ];
            mockPrisma.user.findMany.mockResolvedValue(users);
            mockPrisma.user.count.mockResolvedValue(1);

            const result = await service.getUsers({ page: 1, limit: 20 });

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
            expect(result.meta.totalPages).toBe(1);
        });

        it('should filter by role when provided', async () => {
            mockPrisma.user.findMany.mockResolvedValue([]);
            mockPrisma.user.count.mockResolvedValue(0);

            await service.getUsers({ page: 1, limit: 10, role: 'ARTISAN' as any });

            expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ role: 'ARTISAN' }),
                }),
            );
        });

        it('should filter by search string', async () => {
            mockPrisma.user.findMany.mockResolvedValue([]);
            mockPrisma.user.count.mockResolvedValue(0);

            await service.getUsers({ page: 1, limit: 10, search: 'john' });

            expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ OR: expect.any(Array) }),
                }),
            );
        });
    });

    // ─── broadcastNotification ───────────────────────────────────────────────

    describe('broadcastNotification', () => {
        it('should create notifications for all active users', async () => {
            const users = [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }];
            mockPrisma.user.findMany.mockResolvedValue(users);
            mockPrisma.notification.createMany.mockResolvedValue({ count: 3 });

            const result = await service.broadcastNotification(
                { titre: 'Test', corps: 'Message important', segment: 'ALL' },
                'admin-1',
            );

            expect(result.sent).toBe(3);
            expect(result.segment).toBe('ALL');
        });

        it('should return sent=0 if no users found', async () => {
            mockPrisma.user.findMany.mockResolvedValue([]);

            const result = await service.broadcastNotification(
                { titre: 'Test', corps: 'Message', segment: 'ALL' },
                'admin-1',
            );

            expect(result.sent).toBe(0);
        });

        it('should filter by CLIENT segment', async () => {
            mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1' }]);
            mockPrisma.notification.createMany.mockResolvedValue({ count: 1 });

            await service.broadcastNotification(
                { titre: 'Pour clients', corps: 'Message', segment: 'CLIENT' },
                'admin-1',
            );

            expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ role: 'CLIENT' }),
                }),
            );
        });
    });

    // ─── getPendingArtisans ──────────────────────────────────────────────────

    describe('getPendingArtisans', () => {
        it('should return artisans with verified=false and statut EN_ATTENTE', async () => {
            const pending = [{ id: 'artisan-1', verified: false, statut: 'EN_ATTENTE' }];
            mockPrisma.artisan.findMany.mockResolvedValue(pending);

            const result = await service.getPendingArtisans();

            expect(result).toHaveLength(1);
            expect(mockPrisma.artisan.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ verified: false, statut: 'EN_ATTENTE' }),
                }),
            );
        });
    });

    // ─── getActivityLogs ──────────────────────────────────────────────────────

    describe('getActivityLogs', () => {
        it('should return paginated activity logs', async () => {
            const logs = [{ id: 'log-1', action: 'POST /api/v1/bookings', entite: 'booking' }];
            mockPrisma.logActivite.findMany.mockResolvedValue(logs);
            mockPrisma.logActivite.count.mockResolvedValue(1);

            const result = await service.getActivityLogs({ page: 1, limit: 50 });

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
        });

        it('should filter by userId when provided', async () => {
            mockPrisma.logActivite.findMany.mockResolvedValue([]);
            mockPrisma.logActivite.count.mockResolvedValue(0);

            await service.getActivityLogs({ page: 1, limit: 50, userId: 'user-1' });

            expect(mockPrisma.logActivite.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ userId: 'user-1' }),
                }),
            );
        });
    });

    // ─── getTrends ────────────────────────────────────────────────────────────

    describe('getTrends', () => {
        it('getTrends renvoie une série continue par jour', async () => {
            mockPrisma.$queryRaw
                .mockResolvedValueOnce([{ jour: '2026-07-12', n: 3 }])
                .mockResolvedValueOnce([{ jour: '2026-07-12', n: 5 }])
                .mockResolvedValueOnce([{ jour: '2026-07-12', montant: 12000 }]);
            const res = await service.getTrends({ range: '7d' });
            expect(res.points).toHaveLength(7);
            const j12 = res.points.find((p) => p.date === '2026-07-12');
            expect(j12).toMatchObject({ inscriptions: 3, demandes: 5, revenus: 12000 });
        });
    });

    // ─── getBreakdown ───────────────────────────────────────────────────────────

    describe('getBreakdown', () => {
        it('agrège abonnements + top métiers/villes', async () => {
            (mockPrisma.artisan.groupBy as jest.Mock).mockResolvedValue([
                { abonnementType: 'GRATUIT', _count: { id: 4 } },
                { abonnementType: 'STANDARD', _count: { id: 2 } },
            ]);
            mockPrisma.$queryRaw
                .mockResolvedValueOnce([{ nom: 'Plomberie', count: 5 }])
                .mockResolvedValueOnce([{ ville: 'Cotonou', count: 7 }]);
            const res = await service.getBreakdown();
            expect(res.abonnements).toEqual([
                { palier: 'GRATUIT', count: 4 },
                { palier: 'STANDARD', count: 2 },
            ]);
            expect(res.topMetiers[0]).toEqual({ nom: 'Plomberie', count: 5 });
            expect(res.topVilles[0]).toEqual({ ville: 'Cotonou', count: 7 });
        });
    });

    // ─── changeUserStatut ───────────────────────────────────────────────────────

    describe('changeUserStatut', () => {
        it('met à jour le statut + journalise', async () => {
            (mockPrisma.user.update as jest.Mock).mockResolvedValue({ id: 'u1', statut: 'SUSPENDU' });
            (mockPrisma.logActivite.create as jest.Mock).mockResolvedValue({});
            const res = await service.changeUserStatut(
                'u1',
                { statut: 'SUSPENDU', raison: 'abus' },
                'admin1',
            );
            expect(res).toEqual({ id: 'u1', statut: 'SUSPENDU' });
            expect(mockPrisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'u1' },
                    data: expect.objectContaining({ statut: 'SUSPENDU' }),
                }),
            );
            expect(mockPrisma.logActivite.create).toHaveBeenCalled();
        });
    });
});
