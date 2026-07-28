import { Test } from '@nestjs/testing';
import { ForbiddenException, ConflictException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
    adminRoleDef: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    user: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
    logActivite: { create: jest.fn() },
};

const adminRow = (over: Partial<any> = {}) => ({
    role: 'ADMIN',
    adminRole: null,
    permGranted: [],
    permRevoked: [],
    adminRoleRef: { permissions: ['*'] },
    ...over,
});

describe('RolesService', () => {
    let service: RolesService;
    beforeEach(async () => {
        jest.clearAllMocks();
        const mod = await Test.createTestingModule({
            providers: [RolesService, { provide: PrismaService, useValue: mockPrisma }],
        }).compile();
        service = mod.get(RolesService);
    });

    it('onModuleInit upsert les 4 rôles built-in et backfill les admins sans rôle', async () => {
        mockPrisma.adminRoleDef.findMany.mockResolvedValue([
            { id: 'r-super', name: 'SUPER_ADMIN' },
            { id: 'r-fin', name: 'FINANCE' },
            { id: 'r-mod', name: 'MODERATEUR' },
            { id: 'r-sup', name: 'SUPPORT' },
        ]);
        mockPrisma.user.findMany.mockResolvedValue([
            { id: 'u1', adminRole: 'FINANCE' },
            { id: 'u2', adminRole: null },
        ]);
        await service.onModuleInit();
        expect(mockPrisma.adminRoleDef.upsert).toHaveBeenCalledTimes(4);
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
            where: { id: 'u1' },
            data: { adminRoleId: 'r-fin' },
        });
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
            where: { id: 'u2' },
            data: { adminRoleId: 'r-super' },
        });
    });

    it('getEffectivePermissions développe le wildcard', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(adminRow());
        const perms = await service.getEffectivePermissions('u1');
        expect(perms).toContain('finances.refund');
        expect(perms).toContain('admins.manage');
    });

    it('createRole refuse une clé inconnue', async () => {
        await expect(
            service.createRole({ name: 'X', permissions: ['users.view', 'bogus.key'] }, 'actor'),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('updateRole refuse un rôle built-in', async () => {
        mockPrisma.adminRoleDef.findUnique.mockResolvedValue({
            id: 'r1',
            isBuiltin: true,
            name: 'SUPPORT',
        });
        await expect(
            service.updateRole('r1', { permissions: ['users.view'] }, 'actor'),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("deleteRole refuse si des admins l'utilisent", async () => {
        mockPrisma.adminRoleDef.findUnique.mockResolvedValue({
            id: 'r1',
            isBuiltin: false,
            name: 'Custom',
        });
        mockPrisma.user.count.mockResolvedValue(2);
        await expect(service.deleteRole('r1', 'actor')).rejects.toBeInstanceOf(ConflictException);
    });

    it('setOverrides bloque le retrait du dernier gestionnaire (anti-lockout)', async () => {
        // cible = seul admin ; on lui retire admins.manage → interdit
        mockPrisma.user.findUnique.mockResolvedValue(
            adminRow({ adminRoleRef: { permissions: ['admins.manage'] } }),
        );
        mockPrisma.user.findMany.mockResolvedValue([]); // aucun autre admin
        await expect(
            service.setOverrides('u1', { granted: [], revoked: ['admins.manage'] }, 'actor'),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });
});
