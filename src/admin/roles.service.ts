import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    ALL_PERMISSIONS,
    BUILTIN_ROLE_DESCRIPTION,
    BUILTIN_ROLE_PERMISSIONS,
    PERMISSION_CATALOG,
    Permission,
    WILDCARD,
} from './permissions.catalog';
import {
    hasPermission,
    resolveEffectivePermissions,
    toPermissionList,
} from './permissions.resolve';

const ADMIN_SELECT = {
    role: true,
    adminRole: true,
    permGranted: true,
    permRevoked: true,
    adminRoleRef: { select: { permissions: true } },
} as const;

@Injectable()
export class RolesService implements OnModuleInit {
    constructor(private readonly prisma: PrismaService) {}

    /** Seed idempotent des rôles built-in (source de vérité = catalogue) + backfill adminRoleId. */
    async onModuleInit(): Promise<void> {
        for (const [name, permissions] of Object.entries(BUILTIN_ROLE_PERMISSIONS)) {
            await this.prisma.adminRoleDef.upsert({
                where: { name },
                update: {
                    permissions: [...permissions],
                    isBuiltin: true,
                    description:
                        BUILTIN_ROLE_DESCRIPTION[name as keyof typeof BUILTIN_ROLE_DESCRIPTION],
                },
                create: {
                    name,
                    permissions: [...permissions],
                    isBuiltin: true,
                    description:
                        BUILTIN_ROLE_DESCRIPTION[name as keyof typeof BUILTIN_ROLE_DESCRIPTION],
                },
            });
        }
        const builtins = await this.prisma.adminRoleDef.findMany({
            where: { isBuiltin: true },
            select: { id: true, name: true },
        });
        const byName = new Map(builtins.map((r) => [r.name, r.id]));
        const admins = await this.prisma.user.findMany({
            where: { role: 'ADMIN', adminRoleId: null },
            select: { id: true, adminRole: true },
        });
        for (const a of admins) {
            const roleId = byName.get(a.adminRole ?? 'SUPER_ADMIN');
            if (roleId)
                await this.prisma.user.update({
                    where: { id: a.id },
                    data: { adminRoleId: roleId },
                });
        }
    }

    getCatalog() {
        return PERMISSION_CATALOG;
    }

    async listRoles() {
        const roles = await this.prisma.adminRoleDef.findMany({
            orderBy: [{ isBuiltin: 'desc' }, { name: 'asc' }],
        });
        const counts = await this.prisma.user.groupBy({
            by: ['adminRoleId'],
            where: { role: 'ADMIN' },
            _count: true,
        });
        const byId = new Map(counts.map((c) => [c.adminRoleId, c._count]));
        return roles.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            isBuiltin: r.isBuiltin,
            permissions: r.permissions,
            adminsCount: byId.get(r.id) ?? 0,
        }));
    }

    private assertValidPermissions(keys: string[]): void {
        const valid = new Set<string>(ALL_PERMISSIONS);
        for (const k of keys) {
            if (k === WILDCARD)
                throw new ConflictException('Le wildcard "*" est réservé aux rôles système.');
            if (!valid.has(k)) throw new ConflictException(`Permission inconnue : ${k}`);
        }
    }

    async createRole(
        dto: { name: string; description?: string; permissions: string[]; fromRoleId?: string },
        actorId: string,
    ) {
        let permissions = dto.permissions;
        if (dto.fromRoleId) {
            const src = await this.prisma.adminRoleDef.findUnique({
                where: { id: dto.fromRoleId },
            });
            if (!src) throw new NotFoundException('Rôle source introuvable');
            // clone : on part des permissions de la source, sauf si une liste explicite est fournie
            if (!dto.permissions?.length)
                permissions = src.permissions.filter((p) => p !== WILDCARD);
        }
        this.assertValidPermissions(permissions);
        try {
            const role = await this.prisma.adminRoleDef.create({
                data: {
                    name: dto.name,
                    description: dto.description,
                    permissions,
                    isBuiltin: false,
                },
            });
            this.audit(actorId, 'ADMIN_ROLE_CREATE', role.id, { name: role.name, permissions });
            return role;
        } catch (e: any) {
            if (e?.code === 'P2002') throw new ConflictException('Un rôle porte déjà ce nom.');
            throw e;
        }
    }

    async updateRole(
        id: string,
        dto: { name?: string; description?: string; permissions?: string[] },
        actorId: string,
    ) {
        const role = await this.prisma.adminRoleDef.findUnique({ where: { id } });
        if (!role) throw new NotFoundException('Rôle introuvable');
        if (role.isBuiltin)
            throw new ForbiddenException('Un rôle système ne peut pas être modifié (clonez-le).');
        if (dto.permissions) this.assertValidPermissions(dto.permissions);
        try {
            const updated = await this.prisma.adminRoleDef.update({
                where: { id },
                data: {
                    name: dto.name,
                    description: dto.description,
                    permissions: dto.permissions,
                },
            });
            this.audit(actorId, 'ADMIN_ROLE_UPDATE', id, {
                name: updated.name,
                permissions: updated.permissions,
            });
            return updated;
        } catch (e: any) {
            if (e?.code === 'P2002') throw new ConflictException('Un rôle porte déjà ce nom.');
            throw e;
        }
    }

    async deleteRole(id: string, actorId: string): Promise<void> {
        const role = await this.prisma.adminRoleDef.findUnique({ where: { id } });
        if (!role) throw new NotFoundException('Rôle introuvable');
        if (role.isBuiltin)
            throw new ForbiddenException('Un rôle système ne peut pas être supprimé.');
        const used = await this.prisma.user.count({ where: { adminRoleId: id } });
        if (used > 0) throw new ConflictException(`Ce rôle est assigné à ${used} admin(s).`);
        await this.prisma.adminRoleDef.delete({ where: { id } });
        this.audit(actorId, 'ADMIN_ROLE_DELETE', id, { name: role.name });
    }

    async assignRole(userId: string, roleId: string, actorId: string): Promise<void> {
        const target = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, permGranted: true, permRevoked: true, adminRole: true },
        });
        if (!target || target.role !== 'ADMIN')
            throw new NotFoundException('Administrateur introuvable');
        const role = await this.prisma.adminRoleDef.findUnique({
            where: { id: roleId },
            select: { permissions: true },
        });
        if (!role) throw new NotFoundException('Rôle introuvable');
        const future = resolveEffectivePermissions({
            role: 'ADMIN',
            adminRole: target.adminRole,
            roleDefPermissions: role.permissions,
            granted: target.permGranted,
            revoked: target.permRevoked,
        });
        await this.assertKeepsAManager(userId, hasPermission(future, 'admins.manage'));
        await this.prisma.user.update({ where: { id: userId }, data: { adminRoleId: roleId } });
        this.audit(actorId, 'ADMIN_ROLE_ASSIGN', userId, { roleId });
    }

    async setOverrides(
        userId: string,
        dto: { granted: string[]; revoked: string[] },
        actorId: string,
    ): Promise<void> {
        this.assertValidPermissions([...dto.granted, ...dto.revoked]);
        const target = await this.prisma.user.findUnique({
            where: { id: userId },
            select: ADMIN_SELECT,
        });
        if (!target || target.role !== 'ADMIN')
            throw new NotFoundException('Administrateur introuvable');
        const future = resolveEffectivePermissions({
            role: 'ADMIN',
            adminRole: target.adminRole,
            roleDefPermissions: target.adminRoleRef?.permissions ?? null,
            granted: dto.granted,
            revoked: dto.revoked,
        });
        await this.assertKeepsAManager(userId, hasPermission(future, 'admins.manage'));
        await this.prisma.user.update({
            where: { id: userId },
            data: { permGranted: dto.granted, permRevoked: dto.revoked },
        });
        this.audit(actorId, 'ADMIN_OVERRIDES_SET', userId, {
            granted: dto.granted,
            revoked: dto.revoked,
        });
    }

    async getEffectivePermissions(userId: string): Promise<string[]> {
        const u = await this.prisma.user.findUnique({
            where: { id: userId },
            select: ADMIN_SELECT,
        });
        if (!u) return [];
        return toPermissionList(
            resolveEffectivePermissions({
                role: u.role,
                adminRole: u.adminRole,
                roleDefPermissions: u.adminRoleRef?.permissions ?? null,
                granted: u.permGranted,
                revoked: u.permRevoked,
            }),
        );
    }

    async assertPermission(userId: string, key: Permission): Promise<void> {
        const perms = await this.getEffectivePermissions(userId);
        if (!perms.includes(key)) throw new ForbiddenException(`Permission requise : ${key}`);
    }

    /** Invariant anti-lockout : au moins un admin conserve `admins.manage`. */
    private async assertKeepsAManager(targetId: string, targetKeepsManage: boolean): Promise<void> {
        if (targetKeepsManage) return;
        const others = await this.prisma.user.findMany({
            where: { role: 'ADMIN', id: { not: targetId } },
            select: ADMIN_SELECT,
        });
        const someoneElseManages = others.some((a) =>
            hasPermission(
                resolveEffectivePermissions({
                    role: a.role,
                    adminRole: a.adminRole,
                    roleDefPermissions: a.adminRoleRef?.permissions ?? null,
                    granted: a.permGranted,
                    revoked: a.permRevoked,
                }),
                'admins.manage',
            ),
        );
        if (!someoneElseManages)
            throw new ForbiddenException(
                'Au moins un administrateur doit conserver la gestion des comptes.',
            );
    }

    private audit(
        userId: string,
        action: string,
        entiteId: string,
        metadata: Record<string, unknown>,
    ): void {
        void this.prisma.logActivite
            .create({
                data: { userId, action, entite: 'admin_rbac', entiteId, metadata: metadata as any },
            })
            .catch(() => undefined);
    }
}
