import { PaymentService } from './payment.service';

describe('PaymentService ownership checks', () => {
    const prisma = {
        artisan: {
            findUnique: jest.fn(),
        },
        transaction: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
        },
    };

    const config = {
        get: jest.fn((key: string, fallback?: string | number) => {
            const overrides: Record<string, string | number> = {
                FEDAPAY_WEBHOOK_SECRET: 'test-fedapay-secret',
                KKIAPAY_WEBHOOK_SECRET: 'test-kkiapay-secret',
            };
            return overrides[key] ?? fallback;
        }),
    };

    const notificationService = {
        send: jest.fn(),
    };

    const fedaPay = {};
    const kkiaPay = {};

    let service: PaymentService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new PaymentService(
            prisma as never,
            config as never,
            notificationService as never,
            fedaPay as never,
            kkiaPay as never,
        );
    });

    it('uses artisan profile id for transaction status lookup', async () => {
        prisma.artisan.findUnique.mockResolvedValueOnce({ id: 'artisan-profile-1' });
        prisma.transaction.findFirst.mockResolvedValueOnce({ id: 'tx-1' });

        await service.getTransactionStatus('tx-1', 'user-artisan-1');

        expect(prisma.transaction.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    id: 'tx-1',
                    OR: expect.arrayContaining([{ artisanId: 'artisan-profile-1' }]),
                }),
            }),
        );
    });

    it('uses artisan profile id for history lookup', async () => {
        prisma.artisan.findUnique.mockResolvedValueOnce({ id: 'artisan-profile-2' });
        prisma.transaction.findMany.mockResolvedValueOnce([]);

        await service.getHistory('user-artisan-2', true);

        expect(prisma.transaction.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { artisanId: 'artisan-profile-2' },
            }),
        );
    });
});
