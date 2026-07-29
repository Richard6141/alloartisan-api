import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    Logger,
    SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';
import { Permission } from './permissions.catalog';
import { hasPermission, resolveEffectivePermissions } from './permissions.resolve';

export const PERM_KEY = 'adminPerm';

/**
 * Décorateur de route : exige une permission fine.
 * @example @RequirePerm('artisans.validate')
 */
export const RequirePerm = (key: Permission) => SetMetadata(PERM_KEY, key);

/**
 * Garde RBAC : à placer APRÈS AtGuard/RolesGuard. FAIL-CLOSED — une route
 * protégée par ce guard DOIT déclarer @RequirePerm ; sans clé, on REFUSE (au
 * lieu d'ouvrir à tout admin), pour qu'un oubli de décorateur ne devienne pas
 * une faille. Les permissions effectives sont relues en base à chaque requête
 * (prise en compte immédiate des changements de rôle/surcharges).
 */
@Injectable()
export class AdminPermGuard implements CanActivate {
    private readonly logger = new Logger(AdminPermGuard.name);

    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
    ) {}

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const key = this.reflector.getAllAndOverride<Permission | undefined>(PERM_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (!key) {
            // Fail-closed : route sous AdminPermGuard sans @RequirePerm = erreur de
            // développement. On refuse et on trace pour correction immédiate.
            this.logger.error(
                `Route protégée par AdminPermGuard sans @RequirePerm (${ctx.getClass().name}.${ctx.getHandler().name}) — accès refusé par défaut.`,
            );
            throw new ForbiddenException('Permission requise non déclarée pour cette route.');
        }

        const req = ctx.switchToHttp().getRequest();
        const userId: string | undefined = req.user?.sub;
        if (!userId) throw new ForbiddenException();

        const u = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                adminRole: true,
                permGranted: true,
                permRevoked: true,
                adminRoleRef: { select: { permissions: true } },
            },
        });
        if (u?.role !== 'ADMIN') throw new ForbiddenException();

        const perms = resolveEffectivePermissions({
            role: u.role,
            adminRole: u.adminRole,
            roleDefPermissions: u.adminRoleRef?.permissions ?? null,
            granted: u.permGranted,
            revoked: u.permRevoked,
        });
        if (!hasPermission(perms, key)) {
            throw new ForbiddenException("Votre rôle admin n'autorise pas cette action.");
        }
        return true;
    }
}
