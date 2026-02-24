import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from 'src/generated/prisma';
import { Request } from 'express';

// Define a type for the user object expected on the request
interface UserWithRole {
    role: Role;
    // Add other properties of the user object if needed, e.g., id: string;
}

// Extend the Request type to include our custom user property
interface AuthenticatedRequest extends Request {
    user?: UserWithRole;
}

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Si pas de @Roles() décorateur, la route est accessible à tous les authentifiés
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const user = request.user;

        if (!user) {
            return false;
        }

        return requiredRoles.some((role) => user.role === role);
    }
}
