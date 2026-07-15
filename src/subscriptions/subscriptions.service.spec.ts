// Mock des providers de paiement AVANT les imports (axios/ESM)
jest.mock('src/payment/providers/kkiapay.provider', () => ({
    KkiaPayProvider: class MockKkiaPayProvider {},
}));
jest.mock('src/payment/providers/fedapay.provider', () => ({
    FedaPayProvider: class MockFedaPayProvider {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { KkiaPayProvider } from 'src/payment/providers/kkiapay.provider';
import { FedaPayProvider } from 'src/payment/providers/fedapay.provider';
import { NotificationService } from 'src/notification/notification.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PlanAbonnement } from './dto/upgrade-subscription.dto';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
    artisan: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
    },
    abonnementPaiement: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
    },
};

const mockKkiaPay = {
    initiatePayment: jest.fn(),
    getTransactionStatus: jest.fn(),
};

const mockFedaPay = {
    initiateTransaction: jest.fn(),
    getTransaction: jest.fn(),
};

const mockNotifications = {
    send: jest.fn().mockResolvedValue(undefined),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildArtisan(overrides = {}) {
    return {
        id: 'artisan-1',
        abonnementType: PlanAbonnement.GRATUIT,
        abonnementExpireAt: null,
        compteurDemandesMoisCourant: 0,
        essaisGratuitsUtilises: 0,
        ...overrides,
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SubscriptionsService', () => {
    let service: SubscriptionsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionsService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: KkiaPayProvider, useValue: mockKkiaPay },
                { provide: FedaPayProvider, useValue: mockFedaPay },
                { provide: NotificationService, useValue: mockNotifications },
            ],
        }).compile();

        service = module.get<SubscriptionsService>(SubscriptionsService);
        jest.clearAllMocks();
    });

    // ─── getPlans ─────────────────────────────────────────────────────────────

    describe('getPlans', () => {
        it('should return all 4 plans', () => {
            const plans = service.getPlans();

            expect(plans).toHaveLength(4);
            expect(plans.map((p) => p.type)).toEqual([
                PlanAbonnement.GRATUIT,
                PlanAbonnement.STANDARD,
                PlanAbonnement.PREMIUM,
                PlanAbonnement.GOLD,
            ]);
        });

        it('should return GOLD plan with null demandesMois (illimité)', () => {
            const plans = service.getPlans();
            const gold = plans.find((p) => p.type === PlanAbonnement.GOLD);

            expect(gold?.demandesMois).toBeNull();
            expect(gold?.prix).toBe(25000);
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
            // Paywall : GRATUIT n'a plus de quota mensuel (0), seuls les essais
            // découverte à vie permettent de débloquer une conversation.
            expect(result.quotaMensuel).toBe(0);
            expect(result.estActif).toBe(true);
        });

        it('should return null demandesRestantes for GOLD (unlimited)', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisan({
                    abonnementType: PlanAbonnement.GOLD,
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
        it('should return true when a paid plan still has remaining quota', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisan({
                    abonnementType: PlanAbonnement.STANDARD,
                    abonnementExpireAt: new Date(Date.now() + 86400000),
                    compteurDemandesMoisCourant: 1,
                }),
            );

            const result = await service.hasRemainingQuota('artisan-1');

            expect(result).toBe(true);
        });

        it('should return false on GRATUIT (no monthly quota, lifetime trials only)', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisan({ compteurDemandesMoisCourant: 0 }),
            );

            const result = await service.hasRemainingQuota('artisan-1');

            expect(result).toBe(false);
        });

        it('should return true for GOLD (unlimited)', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisan({
                    abonnementType: PlanAbonnement.GOLD,
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
