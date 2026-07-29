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

// ─── processSuccessfulPayment : re-vérification provider (anti webhook forgé) ───
describe('PaymentService.processSuccessfulPayment (re-vérification provider)', () => {
    const prisma = {
        transaction: { findFirst: jest.fn() },
        logActivite: { create: jest.fn().mockResolvedValue({}) },
        $transaction: jest.fn(),
    };
    const config = { get: jest.fn((_k: string, fb?: unknown) => fb) };
    const notificationService = { send: jest.fn() };
    const promoService = {};
    const referralService = { onFirstPaidBooking: jest.fn() };
    const fedaPay = { getTransaction: jest.fn() };
    const kkiaPay = { getTransactionStatus: jest.fn() };

    let service: PaymentService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new PaymentService(
            prisma as never,
            config as never,
            notificationService as never,
            promoService as never,
            referralService as never,
            fedaPay as never,
            kkiaPay as never,
        );
    });

    const pendingTx = {
        id: 'tx-1',
        statut: 'EN_ATTENTE',
        montant: 5000,
        clientId: 'c1',
        bookingId: 'b1',
        artisanId: 'a1',
    };

    it('does NOT complete when the provider does not confirm (forged webhook)', async () => {
        prisma.transaction.findFirst.mockResolvedValue({ ...pendingTx });
        fedaPay.getTransaction.mockResolvedValue({ status: 'pending', amount: 5000 });

        await service.processSuccessfulPayment('ptx-1', 'fedapay', { status: 'approved' });

        expect(fedaPay.getTransaction).toHaveBeenCalledWith('ptx-1');
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects an insufficient verified amount', async () => {
        prisma.transaction.findFirst.mockResolvedValue({ ...pendingTx });
        fedaPay.getTransaction.mockResolvedValue({ status: 'approved', amount: 100 });

        await service.processSuccessfulPayment('ptx-1', 'fedapay', {});

        expect(prisma.logActivite.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ action: 'PAIEMENT_MONTANT_SUSPECT' }),
            }),
        );
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('proceeds to completion when provider confirms status AND amount', async () => {
        prisma.transaction.findFirst.mockResolvedValue({ ...pendingTx });
        fedaPay.getTransaction.mockResolvedValue({ status: 'approved', amount: 5000 });
        // $transaction renvoie false (déjà complété par un webhook concurrent) →
        // court-circuite le reste (notifications) sans avoir à tout mocker.
        prisma.$transaction.mockResolvedValue(false);

        await service.processSuccessfulPayment('ptx-1', 'fedapay', {});

        expect(prisma.$transaction).toHaveBeenCalled();
    });
});

// ─── processFailedPayment : re-vérification provider (anti griefing) ───────────
describe('PaymentService.processFailedPayment (re-vérification provider)', () => {
    const prisma = {
        transaction: { findFirst: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    };
    const config = { get: jest.fn((_k: string, fb?: unknown) => fb) };
    const notificationService = { send: jest.fn() };
    const promoService = { releaseUsageForBooking: jest.fn().mockResolvedValue(undefined) };
    const referralService = { onFirstPaidBooking: jest.fn() };
    const fedaPay = { getTransaction: jest.fn() };
    const kkiaPay = { getTransactionStatus: jest.fn() };

    let service: PaymentService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new PaymentService(
            prisma as never,
            config as never,
            notificationService as never,
            promoService as never,
            referralService as never,
            fedaPay as never,
            kkiaPay as never,
        );
    });

    const pendingTx = { id: 'tx-1', statut: 'EN_ATTENTE', bookingId: 'b1', clientId: 'c1' };

    it('does NOT mark failed when the provider does not confirm the failure (griefing)', async () => {
        prisma.transaction.findFirst.mockResolvedValue({ ...pendingTx });
        // Le corps prétend « declined » mais le provider dit « approved ».
        fedaPay.getTransaction.mockResolvedValue({ status: 'approved', amount: 5000 });

        await service.processFailedPayment('ptx-1', 'fedapay', { status: 'declined' });

        expect(fedaPay.getTransaction).toHaveBeenCalledWith('ptx-1');
        expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

    it('marks failed when the provider confirms the failure', async () => {
        prisma.transaction.findFirst.mockResolvedValue({ ...pendingTx });
        fedaPay.getTransaction.mockResolvedValue({ status: 'declined', amount: 0 });

        await service.processFailedPayment('ptx-1', 'fedapay', { status: 'declined' });

        expect(prisma.transaction.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ statut: 'ECHOUEE' }),
            }),
        );
    });

    it('does NOT mark failed when the provider is unreachable (fail-safe)', async () => {
        prisma.transaction.findFirst.mockResolvedValue({ ...pendingTx });
        fedaPay.getTransaction.mockRejectedValue(new Error('network'));

        await service.processFailedPayment('ptx-1', 'fedapay', { status: 'declined' });

        expect(prisma.transaction.update).not.toHaveBeenCalled();
    });
});
