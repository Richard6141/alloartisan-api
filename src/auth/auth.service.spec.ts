import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';

// Mock argon2 at module level so getter override works
jest.mock('argon2', () => ({
    verify: jest.fn(),
    hash: jest.fn().mockResolvedValue('hashed'),
}));

// ---------------------------------------------------------------------------
// Original test — register ConflictException
// ---------------------------------------------------------------------------
describe('AuthService.register', () => {
    const dto: AuthDto = {
        email: 'existing@example.com',
        password: 'Password123!',
    };

    const buildService = (createImpl: () => Promise<unknown>) => {
        const prisma = {
            user: {
                create: jest.fn().mockImplementation(createImpl),
            },
        };

        const service = new AuthService(
            prisma as any,
            {} as any,
            { get: jest.fn() } as any, // ConfigService (ex. AUTO_ACTIVATE_USERS)
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
        );

        return { service, prisma };
    };

    it('should throw ConflictException when email already exists (P2002)', async () => {
        const { service } = buildService(async () => {
            const error = new Error('Unique constraint failed');
            (error as any).code = 'P2002';
            throw error;
        });

        await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictException);
    });
});

// ---------------------------------------------------------------------------
// 2FA email admin — login branch tests
// ---------------------------------------------------------------------------
describe('login — 2FA email admin', () => {
    const adminBase = {
        id: 'a1',
        email: 'admin@x.io',
        role: 'ADMIN',
        statut: 'ACTIF',
        emailVerified: true,
        mfaEnabled: false,
        mfaSecret: null,
        passwordHash: 'h',
        deletedAt: null,
    };

    // Shared mocks — extended versions for this describe block
    let mockPrisma: any;
    let mockOtp: any;
    let mockEmail: any;
    let mockJwt: any;
    let mockLoginAttempt: any;
    let mockSession: any;
    let service: AuthService;

    beforeEach(() => {
        mockPrisma = {
            user: {
                findUnique: jest.fn(),
                update: jest.fn().mockResolvedValue({}),
            },
            trustedDevice: {
                findUnique: jest.fn(),
                upsert: jest.fn().mockResolvedValue({}),
            },
            logActivite: {
                create: jest.fn().mockResolvedValue({}),
            },
        };

        mockOtp = {
            create: jest.fn(),
            verify: jest.fn(),
            exists: jest.fn(),
        };

        mockEmail = {
            sendLoginCodeEmail: jest.fn().mockResolvedValue(true),
            sendNewLoginAlertEmail: jest.fn().mockResolvedValue(true),
            sendVerificationEmail: jest.fn().mockResolvedValue(true),
            sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
            sendAccountStatusEmail: jest.fn().mockResolvedValue(true),
        };

        mockJwt = {
            signAsync: jest.fn().mockResolvedValue('signed-token'),
            verifyAsync: jest.fn(),
        };

        mockLoginAttempt = {
            isLocked: jest.fn().mockResolvedValue(false),
            getRemainingLockTime: jest.fn().mockResolvedValue(0),
            recordFailedAttempt: jest.fn().mockResolvedValue(3),
            resetAttempts: jest.fn().mockResolvedValue(undefined),
        };

        mockSession = {
            create: jest.fn().mockResolvedValue('sess-123'),
            updateToken: jest.fn().mockResolvedValue(undefined),
            revoke: jest.fn(),
            revokeAll: jest.fn(),
            revokeAllExcept: jest.fn(),
            getUserSessions: jest.fn(),
            validate: jest.fn(),
        };

        const mockConfig = {
            get: jest.fn((key: string, fallback?: unknown) => fallback),
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
        };

        const mockMfaAttempt = {
            isLocked: jest.fn().mockResolvedValue(false),
            getRemainingLockTime: jest.fn().mockResolvedValue(0),
            recordFailedAttempt: jest.fn().mockResolvedValue(3),
            resetAttempts: jest.fn().mockResolvedValue(undefined),
        };

        const mockCrypto = {
            encrypt: jest.fn(),
            decrypt: jest.fn().mockReturnValue(null),
        };

        const mockCacheManager = {
            get: jest.fn().mockResolvedValue(0),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        };

        service = new AuthService(
            mockPrisma as any,
            mockJwt as any,
            mockConfig as any,
            mockOtp as any,
            mockEmail as any,
            mockSession as any,
            mockLoginAttempt as any,
            mockMfaAttempt as any,
            mockCrypto as any,
            mockCacheManager as any,
        );

        // Default argon mock — password match
        (argon.verify as jest.Mock).mockResolvedValue(true);
    });

    it('nouvel appareil admin -> verification_required + code envoyé', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(adminBase);
        mockPrisma.trustedDevice.findUnique.mockResolvedValue(null); // pas de confiance
        mockOtp.create.mockResolvedValue('123456');
        mockJwt.signAsync.mockResolvedValue('vtok');

        const res = await service.login(
            { email: adminBase.email, password: 'p' } as any,
            { deviceId: 'd1', ipAddress: '1.2.3.4' },
        );

        expect((res as any).verification_required).toBe(true);
        expect((res as any).email_masked).toContain('@');
        expect((res as any).verify_token).toBe('vtok');
        // sendLoginCodeEmail is called inside setImmediate — force flush
        await new Promise((r) => setImmediate(r));
        expect(mockEmail.sendLoginCodeEmail).toHaveBeenCalled();
    });

    it('appareil de confiance (même IP, non expiré) -> pas de code, session créée', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(adminBase);
        mockPrisma.trustedDevice.findUnique.mockResolvedValue({
            trustedUntil: new Date(Date.now() + 1e6),
            ipAddress: '1.2.3.4',
        });
        mockPrisma.trustedDevice.upsert.mockResolvedValue({});
        // createSession calls signAsync twice (at + rt) and session.create
        mockJwt.signAsync.mockResolvedValue('access-tok');

        const res = await service.login(
            { email: adminBase.email, password: 'p' } as any,
            { deviceId: 'd1', ipAddress: '1.2.3.4' },
        );

        expect((res as any).access_token).toBeDefined();
        expect(mockEmail.sendLoginCodeEmail).not.toHaveBeenCalled();
    });

    it('IP différente sur appareil connu -> code exigé', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(adminBase);
        mockPrisma.trustedDevice.findUnique.mockResolvedValue({
            trustedUntil: new Date(Date.now() + 1e6),
            ipAddress: '9.9.9.9', // different IP
        });
        mockOtp.create.mockResolvedValue('123456');
        mockJwt.signAsync.mockResolvedValue('vtok');

        const res = await service.login(
            { email: adminBase.email, password: 'p' } as any,
            { deviceId: 'd1', ipAddress: '1.2.3.4' },
        );

        expect((res as any).verification_required).toBe(true);
    });
});
