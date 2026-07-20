import { RoleAdmin } from 'src/generated/prisma';

/**
 * RBAC du back-office — matrice d'accès par rôle admin.
 * R = 'read' (consultation), W = 'write' (consultation + actions), none = pas d'accès.
 * SUPER_ADMIN a tout, et est le seul à gérer les comptes admin.
 */
export const SECTIONS = [
    'dashboard',
    'users',
    'artisans',
    'bookings',
    'express',
    'maindoeuvre',
    'ambassadeurs',
    'finances',
    'avis',
    'metiers',
    'diffusion',
    'audit',
    'admins',
] as const;

export type Section = (typeof SECTIONS)[number];
export type Access = 'none' | 'read' | 'write';

const ALL_WRITE = Object.fromEntries(SECTIONS.map((s) => [s, 'write'])) as Record<Section, Access>;

export const RBAC_MATRIX: Record<RoleAdmin, Record<Section, Access>> = {
    SUPER_ADMIN: ALL_WRITE,
    MODERATEUR: {
        dashboard: 'read',
        users: 'write',
        artisans: 'write',
        bookings: 'read',
        express: 'read',
        maindoeuvre: 'read',
        ambassadeurs: 'read',
        finances: 'none',
        avis: 'write',
        metiers: 'write',
        diffusion: 'write',
        audit: 'read',
        admins: 'none',
    },
    SUPPORT: {
        dashboard: 'read',
        users: 'write',
        artisans: 'read',
        bookings: 'read',
        express: 'read',
        maindoeuvre: 'read',
        ambassadeurs: 'read',
        finances: 'none',
        avis: 'read',
        metiers: 'none',
        diffusion: 'none',
        audit: 'read',
        admins: 'none',
    },
    FINANCE: {
        dashboard: 'read',
        users: 'none',
        artisans: 'none',
        bookings: 'read',
        express: 'none',
        maindoeuvre: 'none',
        ambassadeurs: 'read',
        finances: 'write',
        avis: 'none',
        metiers: 'none',
        diffusion: 'none',
        audit: 'read',
        admins: 'none',
    },
};

/**
 * Un admin sans adminRole défini (legacy) est traité comme SUPER_ADMIN
 * (les comptes existants sont migrés en SUPER_ADMIN).
 */
export function effectiveRole(adminRole: RoleAdmin | null | undefined): RoleAdmin {
    return adminRole ?? 'SUPER_ADMIN';
}

export function can(
    adminRole: RoleAdmin | null | undefined,
    section: Section,
    need: 'read' | 'write',
): boolean {
    const access = RBAC_MATRIX[effectiveRole(adminRole)]?.[section] ?? 'none';
    if (access === 'write') return true;
    if (access === 'read') return need === 'read';
    return false;
}
