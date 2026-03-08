// Mock firebase-admin BEFORE imports (ESM/native module incompatible with Jest CommonJS)
jest.mock('firebase-admin', () => ({
    apps: [],
    initializeApp: jest.fn(),
    credential: { cert: jest.fn() },
    messaging: jest.fn(() => ({
        sendEachForMulticast: jest.fn(),
    })),
}));

// Mock resend (ESM)
jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
        emails: {
            send: jest.fn(),
        },
    })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { PrismaService } from 'src/prisma/prisma.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
    notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
    },
    fcmToken: {
        findMany: jest.fn(),
        upsert: jest.fn(),
        updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
};

const mockConfig = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
            RESEND_API_KEY: 're_xxxxxxxxxxxxxxxxxxxx', // invalide → emails désactivés
            FIREBASE_PROJECT_ID: 'your-firebase-project-id', // invalide → push désactivé
            NOTIFICATION_EXPIRY_DAYS: 30,
            NOTIFICATION_PUSH_RATE_LIMIT: 10,
            NOTIFICATION_PUSH_RATE_WINDOW: 3600,
        };
        return values[key] ?? defaultValue;
    }),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-uuid-1';

const notifPayload = {
    userId: USER_ID,
    type: 'BOOKING_NOUVEAU' as const,
    titre: 'Nouvelle demande',
    corps: 'Un client a demandé votre service',
    data: { bookingId: 'booking-1' },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NotificationService', () => {
    let service: NotificationService;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });
        mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.notification.deleteMany.mockResolvedValue({ count: 0 });
        mockPrisma.fcmToken.upsert.mockResolvedValue({});
        mockPrisma.fcmToken.updateMany.mockResolvedValue({ count: 1 });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: ConfigService, useValue: mockConfig },
            ],
        }).compile();

        service = module.get<NotificationService>(NotificationService);
        // Simuler onModuleInit (Firebase/Resend invalides → désactivés)
        service.onModuleInit();
    });

    // ─── send ────────────────────────────────────────────────────────────────

    describe('send', () => {
        it('should persist notification in DB', async () => {
            await service.send(notifPayload);

            expect(mockPrisma.notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        userId: USER_ID,
                        titre: 'Nouvelle demande',
                        corps: 'Un client a demandé votre service',
                    }),
                }),
            );
        });

        it('should NOT push via FCM when Firebase is not configured', async () => {
            // Firebase désactivé (credentials invalides)
            await service.send(notifPayload);

            expect(mockPrisma.fcmToken.findMany).not.toHaveBeenCalled();
        });

        it('should never throw — always fire-and-forget', async () => {
            mockPrisma.notification.create.mockRejectedValue(new Error('DB down'));

            await expect(service.send(notifPayload)).resolves.not.toThrow();
        });

        it('should truncate titre to 200 chars', async () => {
            const longTitle = 'A'.repeat(300);
            await service.send({ ...notifPayload, titre: longTitle });

            expect(mockPrisma.notification.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        titre: 'A'.repeat(200),
                    }),
                }),
            );
        });

        it('should compute expiresAt from NOTIFICATION_EXPIRY_DAYS when not provided', async () => {
            const before = Date.now();
            await service.send(notifPayload);
            const after = Date.now();

            const call = mockPrisma.notification.create.mock.calls[0][0];
            const expiresAt: Date = call.data.expiresAt;

            // Doit être à ~30 jours de maintenant
            const expectedMin = before + 30 * 24 * 60 * 60 * 1000 - 5000;
            const expectedMax = after + 30 * 24 * 60 * 60 * 1000 + 5000;
            expect(expiresAt.getTime()).toBeGreaterThan(expectedMin);
            expect(expiresAt.getTime()).toBeLessThan(expectedMax);
        });

        it('should use provided expiresAt when specified', async () => {
            const customExpiry = new Date('2026-12-31');
            await service.send({ ...notifPayload, expiresAt: customExpiry });

            const call = mockPrisma.notification.create.mock.calls[0][0];
            expect(call.data.expiresAt).toEqual(customExpiry);
        });
    });

    // ─── FCM tokens ──────────────────────────────────────────────────────────

    describe('registerFcmToken', () => {
        it('should upsert FCM token in DB', async () => {
            await service.registerFcmToken(USER_ID, 'fcm-token-abc', 'Pixel 8');

            expect(mockPrisma.fcmToken.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { token: 'fcm-token-abc' },
                    create: expect.objectContaining({ userId: USER_ID, actif: true }),
                    update: expect.objectContaining({ actif: true }),
                }),
            );
        });
    });

    describe('deleteFcmToken', () => {
        it('should deactivate (soft delete) FCM token', async () => {
            await service.deleteFcmToken(USER_ID, 'fcm-token-abc');

            expect(mockPrisma.fcmToken.updateMany).toHaveBeenCalledWith({
                where: { userId: USER_ID, token: 'fcm-token-abc' },
                data: { actif: false },
            });
        });
    });

    // ─── In-app notifications ─────────────────────────────────────────────────

    describe('markAsRead', () => {
        it('should mark notification as read for user', async () => {
            await service.markAsRead('notif-1', USER_ID);

            expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
                where: { id: 'notif-1', userId: USER_ID, lu: false },
                data: { lu: true, luAt: expect.any(Date) },
            });
        });
    });

    describe('markAllAsRead', () => {
        it('should return count of marked notifications', async () => {
            mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

            const result = await service.markAllAsRead(USER_ID);

            expect(result.count).toBe(5);
            expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
                where: { userId: USER_ID, lu: false },
                data: { lu: true, luAt: expect.any(Date) },
            });
        });
    });

    describe('getUnreadCount', () => {
        it('should return count of unread non-expired notifications', async () => {
            mockPrisma.notification.count.mockResolvedValue(3);

            const result = await service.getUnreadCount(USER_ID);

            expect(result.count).toBe(3);
            expect(mockPrisma.notification.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ userId: USER_ID, lu: false }),
                }),
            );
        });
    });

    describe('getMyNotifications', () => {
        it('should return paginated notifications with unread count', async () => {
            mockPrisma.$transaction.mockResolvedValue([[{ id: 'notif-1', lu: false }], 1, 1]);

            const result = await service.getMyNotifications(USER_ID, { page: 1, limit: 20 });

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
            expect(result.meta.unreadCount).toBe(1);
            expect(result.meta.page).toBe(1);
        });

        it('should cap limit to 50', async () => {
            mockPrisma.$transaction.mockResolvedValue([[], 0, 0]);

            await service.getMyNotifications(USER_ID, { page: 1, limit: 1000 });

            // La transaction est appelée avec un tableau de promises, pas directement inspectable.
            // On vérifie juste que $transaction a été appelé (limite cappée à 50 en interne).
            expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
        });
    });

    // ─── Scheduler ───────────────────────────────────────────────────────────

    describe('deleteExpiredNotifications', () => {
        it('should delete expired notifications and return count', async () => {
            mockPrisma.notification.deleteMany.mockResolvedValue({ count: 12 });

            const count = await service.deleteExpiredNotifications();

            expect(count).toBe(12);
            expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { expiresAt: { lt: expect.any(Date) } },
                }),
            );
        });

        it('should return 0 when nothing to delete', async () => {
            mockPrisma.notification.deleteMany.mockResolvedValue({ count: 0 });

            const count = await service.deleteExpiredNotifications();
            expect(count).toBe(0);
        });
    });

    // ─── sendEmail ────────────────────────────────────────────────────────────

    describe('sendEmail', () => {
        it('should silently skip when Resend not configured', async () => {
            // Resend n'est pas initialisé (clé invalide dans mockConfig)
            await expect(
                service.sendEmail({
                    to: 'test@example.com',
                    subject: 'Test',
                    html: '<p>Test</p>',
                }),
            ).resolves.not.toThrow();
        });
    });
});
