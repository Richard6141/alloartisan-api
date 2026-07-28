import { ALL_PERMISSIONS, BUILTIN_ROLE_PERMISSIONS, WILDCARD } from './permissions.catalog';

export type ResolveInput = {
  role: string;
  adminRole: keyof typeof BUILTIN_ROLE_PERMISSIONS | null;
  /** Permissions du rôle assigné (via adminRoleId) ; null si aucun rôle en base. */
  roleDefPermissions: string[] | null;
  granted: string[];
  revoked: string[];
};

/**
 * Calcule l'ensemble concret des permissions effectives d'un admin.
 * `*` (wildcard) court-circuite : renvoie tout le catalogue (ignore granted/revoked).
 * Fallback legacy : sans rôle en base, on dérive du `adminRole` enum
 * (null → SUPER_ADMIN, comme l'ancien effectiveRole()).
 */
export function resolveEffectivePermissions(input: ResolveInput): Set<string> {
  if (input.role !== 'ADMIN') return new Set();

  const base =
    input.roleDefPermissions ??
    (BUILTIN_ROLE_PERMISSIONS[input.adminRole ?? 'SUPER_ADMIN'] as readonly string[]);

  if (base.includes(WILDCARD)) return new Set(ALL_PERMISSIONS);

  const eff = new Set<string>(base);
  for (const g of input.granted) eff.add(g);
  for (const r of input.revoked) eff.delete(r);
  return eff;
}

export function hasPermission(perms: Set<string>, key: string): boolean {
  return perms.has(WILDCARD) || perms.has(key);
}

export function toPermissionList(perms: Set<string>): string[] {
  return [...perms];
}
