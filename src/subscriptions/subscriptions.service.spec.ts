import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PlanAbonnement } from './dto/upgrade-subscription.dto';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
    artisan: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
    },
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildArtisan(overrides = {}) {
    return {
        id: 'artisan-1',
        abonnementType: PlanAbonnement.GRATUIT,
        abonnementExpireAt: null,
        compteurDemandesMoisCourant: 0,
        ...overrides,
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SubscriptionsService', () => {
    let service: SubscriptionsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [SubscriptionsService, { provide: PrismaService, useValue: mockPrisma }],
        }).compile();

        service = module.get<SubscriptionsService>(SubscriptionsService);
        jest.clearAllMocks();
    });

    // ─── getPlans ─────────────────────────────────────────────────────────────

    describe('getPlans', () => {
        it('should return all 3 plans', () => {
            const plans = service.getPlans();

            expect(plans).toHaveLength(3);
            expect(plans.map((p) => p.type)).toEqual([
                PlanAbonnement.GRATUIT,
                PlanAbonnement.STANDARD,
                PlanAbonnement.PREMIUM,
            ]);
        });

        it('should return PREMIUM plan with null demandesMois (illimité)', () => {
            const plans = service.getPlans();
            const premium = plans.find((p) => p.type === PlanAbonnement.PREMIUM);

            expect(premium?.demandesMois).toBeNull();
        });

        it('should return correct tariffs', () => {
            const plans = service.getPlans();
            const standard = plans.find((p) => p.type === PlanAbonnement.STANDARD);

            expect(standard?.prix).toBe(5000);
        });
    });

    // ─── getMySubscription ────────────────────────────────────────────────────

    describe('getMySubscription', () => {
        it('should return subscription info for artisan on GRATUIT plan', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(buildArtisan());

            const result = await service.getMySubscription('user-1');

            expect(result.plan).toBe(PlanAbonnement.GRATUIT);
            expect(result.quotaMensuel).toBe(5);
            expect(result.estActif).toBe(true);
        });

        it('should return null demandesRestantes for PREMIUM (unlimited)', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisan({
                    abonnementType: PlanAbonnement.PREMIUM,
                    abonnementExpireAt: new Date(Date.now() + 86400000),
                }),
            );

            const result = await service.getMySubscription('user-1');

            expect(result.demandesRestantes).toBeNull();
        });

        it('should throw NotFoundException if artisan does not exist', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(null);

            await expect(service.getMySubscription('bad-user')).rejects.toThrow(NotFoundException);
        });
    });

    // ─── upgradeSubscription ──────────────────────────────────────────────────

    describe('upgradeSubscription', () => {
        it('should upgrade from GRATUIT to STANDARD', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(buildArtisan());
            mockPrisma.artisan.update.mockResolvedValue(
                buildArtisan({
                    abonnementType: PlanAbonnement.STANDARD,
                    abonnementExpireAt: new Date(Date.now() + 30 * 86400000),
                }),
            );

            const result = await service.upgradeSubscription('user-1', PlanAbonnement.STANDARD);

            expect(result.success).toBe(true);
            expect(result.plan).toBe(PlanAbonnement.STANDARD);
        });

        it('should throw BadRequestException when downgrading without admin', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisan({ abonnementType: PlanAbonnement.PREMIUM }),
            );

            await expect(
                service.upgradeSubscription('user-1', PlanAbonnement.GRATUIT),
            ).rejects.toThrow(BadRequestException);
        });

        it('should allow admin to downgrade', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisan({ abonnementType: PlanAbonnement.PREMIUM }),
            );
            mockPrisma.artisan.update.mockResolvedValue(
                buildArtisan({ abonnementType: PlanAbonnement.GRATUIT }),
            );

            const result = await service.upgradeSubscription(
                'user-1',
                PlanAbonnement.GRATUIT,
                'admin-1',
            );

            expect(result.success).toBe(true);
        });

        it('should throw NotFoundException if artisan does not exist', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(null);

            await expect(
                service.upgradeSubscription('bad-user', PlanAbonnement.STANDARD),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if already on same active plan', async () => {
            const futureDate = new Date(Date.now() + 86400000);
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisan({
                    abonnementType: PlanAbonnement.STANDARD,
                    abonnementExpireAt: futureDate,
                }),
            );

            await expect(
                service.upgradeSubscription('user-1', PlanAbonnement.STANDARD),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ─── hasRemainingQuota ────────────────────────────────────────────────────

    describe('hasRemainingQuota', () => {
        it('should return true when artisan has remaining quota on GRATUIT', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisan({ compteurDemandesMoisCourant: 2 }),
            );

            const result = await service.hasRemainingQuota('artisan-1');

            expect(result).toBe(true);
        });

        it('should return false when GRATUIT quota is exhausted', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisan({ compteurDemandesMoisCourant: 5 }),
            );

            const result = await service.hasRemainingQuota('artisan-1');

            expect(result).toBe(false);
        });

        it('should return true for PREMIUM (unlimited)', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisan({
                    abonnementType: PlanAbonnement.PREMIUM,
                    abonnementExpireAt: new Date(Date.now() + 86400000),
                    compteurDemandesMoisCourant: 9999,
                }),
            );

            const result = await service.hasRemainingQuota('artisan-1');

            expect(result).toBe(true);
        });

        it('should return false if artisan does not exist', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(null);

            const result = await service.hasRemainingQuota('bad-id');

            expect(result).toBe(false);
        });
    });

    // ─── downgradeExpiredSubscriptions ───────────────────────────────────────

    describe('downgradeExpiredSubscriptions', () => {
        it('should downgrade artisans with expired subscriptions', async () => {
            mockPrisma.artisan.updateMany.mockResolvedValue({ count: 3 });

            const count = await service.downgradeExpiredSubscriptions();

            expect(count).toBe(3);
            expect(mockPrisma.artisan.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        abonnementType: { not: 'GRATUIT' },
                    }),
                    data: expect.objectContaining({ abonnementType: PlanAbonnement.GRATUIT }),
                }),
            );
        });

        it('should return 0 if no artisans are expired', async () => {
            mockPrisma.artisan.updateMany.mockResolvedValue({ count: 0 });

            const count = await service.downgradeExpiredSubscriptions();

            expect(count).toBe(0);
        });
    });
});
