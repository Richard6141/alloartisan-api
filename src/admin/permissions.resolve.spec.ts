import { resolveEffectivePermissions, hasPermission } from './permissions.resolve';
import { ALL_PERMISSIONS } from './permissions.catalog';

const base = {
  role: 'ADMIN' as const, adminRole: null, roleDefPermissions: null,
  granted: [] as string[], revoked: [] as string[],
};

describe('resolveEffectivePermissions', () => {
  it('non-admin → ensemble vide', () => {
    const p = resolveEffectivePermissions({ ...base, role: 'CLIENT' });
    expect(p.size).toBe(0);
  });

  it('rôle de la table (roleDefPermissions) est la base', () => {
    const p = resolveEffectivePermissions({ ...base, roleDefPermissions: ['users.view', 'avis.view'] });
    expect([...p].sort()).toEqual(['avis.view', 'users.view']);
  });

  it('wildcard "*" → toutes les permissions, ignore revoked', () => {
    const p = resolveEffectivePermissions({ ...base, roleDefPermissions: ['*'], revoked: ['users.view'] });
    expect(p.size).toBe(ALL_PERMISSIONS.length);
    expect(hasPermission(p, 'users.view')).toBe(true);
  });

  it('granted ajoute, revoked retire (revoked prioritaire)', () => {
    const p = resolveEffectivePermissions({
      ...base, roleDefPermissions: ['users.view'],
      granted: ['finances.view', 'users.edit'], revoked: ['users.view'],
    });
    expect(hasPermission(p, 'finances.view')).toBe(true);
    expect(hasPermission(p, 'users.edit')).toBe(true);
    expect(hasPermission(p, 'users.view')).toBe(false);
  });

  it('legacy : adminRoleId null + enum → permissions du built-in correspondant', () => {
    const p = resolveEffectivePermissions({ ...base, adminRole: 'FINANCE', roleDefPermissions: null });
    expect(hasPermission(p, 'finances.refund')).toBe(true);
    expect(hasPermission(p, 'users.view')).toBe(false);
  });

  it('legacy : adminRole null (héritage) → super-admin (tout)', () => {
    const p = resolveEffectivePermissions({ ...base, adminRole: null, roleDefPermissions: null });
    expect(p.size).toBe(ALL_PERMISSIONS.length);
  });

  it('hasPermission direct', () => {
    const p = new Set(['users.view']);
    expect(hasPermission(p, 'users.view')).toBe(true);
    expect(hasPermission(p, 'users.edit')).toBe(false);
  });
});
