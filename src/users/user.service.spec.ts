import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionService } from 'src/common/services/session.service';
import { CryptoService } from 'src/common/services/crypto.service';
import { CacheService } from 'src/common/services/cache.service';

// Mock the upload module to avoid 'file-type' ESM resolution issues in Jest
jest.mock('src/upload', () => ({
    UploadService: jest.fn(),
}));

import {
    NotFoundException,
    UnauthorizedException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import * as argon from 'argon2';
import { authenticator } from 'otplib';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
    user: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
};

const mockSession = {
    exists: jest.fn(),
    revokeAll: jest.fn(),
};

const mockCrypto = {
    decrypt: jest.fn(),
    encrypt: jest.fn(),
};

const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delByPattern: jest.fn(),
    invalidateArtisanProfile: jest.fn(),
};

jest.mock('argon2', () => ({
    verify: jest.fn(),
    hash: jest.fn(),
}));

jest.mock('otplib', () => ({
    authenticator: { verify: jest.fn() },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildUser(overrides = {}) {
    return {
        id: 'user-1',
        email: 'test@example.com',
        nom: 'Dupont',
        prenom: 'Jean',
        telephone: '+22900000000',
        dateNaissance: null,
        sexe: null,
        ville: 'Cotonou',
        quartier: null,
        adressePrincipale: null,
        photoUrl: null,
        role: 'CLIENT',
        adminRole: null,
        statut: 'ACTIF',
        emailVerified: true,
        mfaEnabled: false,
        mfaSecret: null,
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        adminRoleId: null,
        permGranted: [],
        permRevoked: [],
        adminRoleRef: null,
        ...overrides,
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UserService', () => {
    let service: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: SessionService, useValue: mockSession },
                { provide: CryptoService, useValue: mockCrypto },
                { provide: CacheService, useValue: mockCache },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        jest.clearAllMocks();
    });

    // ─── getProfile ───────────────────────────────────────────────────────────

    describe('getProfile', () => {
        it('should return user profile', async () => {
            const user = buildUser();
            mockPrisma.user.findUnique.mockResolvedValue(user);

            const result = await service.getProfile('user-1');

            expect(result).toMatchObject({ id: 'user-1', email: 'test@example.com' });
        });

        it('should throw NotFoundException if user does not exist', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(service.getProfile('bad-id')).rejects.toThrow(NotFoundException);
        });

        it('getProfile expose les permissions effectives pour un admin (wildcard développé)', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'a1',
                email: 'admin@x.io',
                nom: 'A',
                prenom: 'B',
                telephone: null,
                dateNaissance: null,
                sexe: null,
                ville: null,
                quartier: null,
                adressePrincipale: null,
                photoUrl: null,
                role: 'ADMIN',
                adminRole: null,
                statut: 'ACTIF',
                emailVerified: true,
                mfaEnabled: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                adminRoleId: 'r1',
                permGranted: [],
                permRevoked: [],
                adminRoleRef: { name: 'SUPER_ADMIN', permissions: ['*'] },
            });
            const res = await service.getProfile('a1');
            expect(res.adminRoleName).toBe('SUPER_ADMIN');
            expect(res.adminPermissions).toContain('admins.manage');
            expect(res.adminPermissions).toContain('finances.refund');
        });

        it('getProfile : un client a adminPermissions vide', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'c1',
                email: 'c@x.io',
                nom: null,
                prenom: null,
                telephone: null,
                dateNaissance: null,
                sexe: null,
                ville: null,
                quartier: null,
                adressePrincipale: null,
                photoUrl: null,
                role: 'CLIENT',
                adminRole: null,
                statut: 'ACTIF',
                emailVerified: true,
                mfaEnabled: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                adminRoleId: null,
                permGranted: [],
                permRevoked: [],
                adminRoleRef: null,
            });
            const res = await service.getProfile('c1');
            expect(res.adminPermissions).toEqual([]);
            expect(res.adminRoleName).toBeNull();
        });
    });

    // ─── updateProfile ────────────────────────────────────────────────────────

    describe('updateProfile', () => {
        it('should update user profile', async () => {
            const user = buildUser({ nom: 'Martin' });
            mockSession.exists.mockResolvedValue(true);
            mockPrisma.user.update.mockResolvedValue(user);

            const result = await service.updateProfile('user-1', 'session-1', {
                nom: 'Martin',
            } as any);

            expect(result.nom).toBe('Martin');
        });

        it('should throw UnauthorizedException if session is invalid', async () => {
            mockSession.exists.mockResolvedValue(false);

            await expect(
                service.updateProfile('user-1', 'bad-session', { nom: 'Martin' } as any),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('updateProfile retourne adminPermissions et adminRoleName pour un admin SUPER_ADMIN', async () => {
            const adminUser = buildUser({
                id: 'a2',
                role: 'ADMIN',
                adminRoleId: 'r2',
                permGranted: [],
                permRevoked: [],
                adminRoleRef: { name: 'SUPER_ADMIN', permissions: ['*'] },
            });
            mockSession.exists.mockResolvedValue(true);
            mockPrisma.user.update.mockResolvedValue(adminUser);

            const result = await service.updateProfile('a2', 'session-1', { nom: 'Admin' } as any);

            expect(result.adminRoleName).toBe('SUPER_ADMIN');
            expect(result.adminPermissions).toContain('admins.manage');
        });
    });

    // ─── deleteAccount ────────────────────────────────────────────────────────

    describe('deleteAccount', () => {
        it('should soft-delete the account with valid password', async () => {
            const user = buildUser({ mfaEnabled: false });
            mockSession.exists.mockResolvedValue(true);
            mockPrisma.user.findUnique.mockResolvedValue(user);
            (argon.verify as jest.Mock).mockResolvedValue(true);
            mockPrisma.user.update.mockResolvedValue({ ...user, deletedAt: new Date() });
            mockSession.revokeAll.mockResolvedValue(undefined);

            const result = await service.deleteAccount('user-1', 'session-1', {
                password: 'correct-password',
            });

            expect(result.message).toContain('supprimé');
            expect(mockSession.revokeAll).toHaveBeenCalledWith('user-1');
        });

        it('should throw ForbiddenException if password is wrong', async () => {
            const user = buildUser();
            mockSession.exists.mockResolvedValue(true);
            mockPrisma.user.findUnique.mockResolvedValue(user);
            (argon.verify as jest.Mock).mockResolvedValue(false);

            await expect(
                service.deleteAccount('user-1', 'session-1', { password: 'wrong' }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException if MFA is enabled but no code provided', async () => {
            const user = buildUser({ mfaEnabled: true, mfaSecret: 'encrypted-secret' });
            mockSession.exists.mockResolvedValue(true);
            mockPrisma.user.findUnique.mockResolvedValue(user);
            (argon.verify as jest.Mock).mockResolvedValue(true);

            await expect(
                service.deleteAccount('user-1', 'session-1', { password: 'correct' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should delete account with valid MFA code', async () => {
            const user = buildUser({ mfaEnabled: true, mfaSecret: 'encrypted-secret' });
            mockSession.exists.mockResolvedValue(true);
            mockPrisma.user.findUnique.mockResolvedValue(user);
            (argon.verify as jest.Mock).mockResolvedValue(true);
            mockCrypto.decrypt.mockReturnValue('decrypted-secret');
            (authenticator.verify as jest.Mock).mockReturnValue(true);
            mockPrisma.user.update.mockResolvedValue(user);
            mockSession.revokeAll.mockResolvedValue(undefined);

            const result = await service.deleteAccount('user-1', 'session-1', {
                password: 'correct',
                mfaCode: '123456',
            });

            expect(result.message).toContain('supprimé');
        });

        it('should throw ForbiddenException if MFA code is invalid', async () => {
            const user = buildUser({ mfaEnabled: true, mfaSecret: 'encrypted-secret' });
            mockSession.exists.mockResolvedValue(true);
            mockPrisma.user.findUnique.mockResolvedValue(user);
            (argon.verify as jest.Mock).mockResolvedValue(true);
            mockCrypto.decrypt.mockReturnValue('decrypted-secret');
            (authenticator.verify as jest.Mock).mockReturnValue(false);

            await expect(
                service.deleteAccount('user-1', 'session-1', {
                    password: 'correct',
                    mfaCode: 'wrong-code',
                }),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── updateProfilePhoto ───────────────────────────────────────────────────
    // Note: updateProfilePhoto receives UploadService as a parameter, not injected

    describe('updateProfilePhoto', () => {
        it('should upload a new profile photo and update user', async () => {
            const variants = {
                thumbnail: 'https://cdn.example.com/thumb.jpg',
                medium: 'https://cdn.example.com/medium.jpg',
                original: 'https://cdn.example.com/original.jpg',
                placeholder: 'https://cdn.example.com/placeholder.jpg',
                baseUrl: 'https://cdn.example.com/base.jpg',
            };
            const uploadServiceParam = {
                uploadProfilePhoto: jest.fn().mockResolvedValue(variants),
                extractPublicIdFromUrl: jest.fn().mockReturnValue(null),
                deleteImage: jest.fn().mockResolvedValue(undefined),
            };
            mockPrisma.user.findUnique.mockResolvedValue(buildUser({ photoUrl: null }));
            mockPrisma.user.update.mockResolvedValue(buildUser({ photoUrl: variants.medium }));

            const buffer = Buffer.from('fake-image');
            const result = await service.updateProfilePhoto(
                'user-1',
                buffer,
                uploadServiceParam as any,
            );

            expect(uploadServiceParam.uploadProfilePhoto).toHaveBeenCalledWith(buffer, 'user-1');
            expect(mockPrisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'user-1' },
                    data: expect.objectContaining({ photoUrl: variants.medium }),
                }),
            );
            expect(result).toHaveProperty('medium');
        });
    });
});
