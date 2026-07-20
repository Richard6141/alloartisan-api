import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';
import { can, Section } from './rbac';

export const PERM_KEY = 'adminPerm';

/**
 * Décorateur de route : exige un niveau d'accès sur une section.
 * @example @RequirePerm('finances', 'read')
 */
export const RequirePerm = (section: Section, need: 'read' | 'write') =>
    SetMetadata(PERM_KEY, { section, need });

/**
 * Garde RBAC : à placer APRÈS AtGuard/RolesGuard dans @UseGuards (l'utilisateur
 * doit déjà être authentifié). Sans @RequirePerm sur la route → laisse passer.
 * Le rôle fin est relu en base pour prise en compte immédiate des changements.
 */
@Injectable()
export class AdminPermGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
    ) {}

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const meta = this.reflector.getAllAndOverride<{ section: Section; need: 'read' | 'write' }>(
            PERM_KEY,
            [ctx.getHandler(), ctx.getClass()],
        );
        if (!meta) return true;

        const req = ctx.switchToHttp().getRequest();
        const userId: string | undefined = req.user?.sub;
        if (!userId) throw new ForbiddenException();

        const u = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, adminRole: true },
        });
        if (u?.role !== 'ADMIN') throw new ForbiddenException();

        if (!can(u.adminRole, meta.section, meta.need)) {
            throw new ForbiddenException("Votre rôle admin n'autorise pas cette action.");
        }
        return true;
    }
}
