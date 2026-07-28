import {
  ALL_PERMISSIONS,
  PERMISSION_CATALOG,
  BUILTIN_ROLE_PERMISSIONS,
  WILDCARD,
} from './permissions.catalog';

describe('permissions.catalog', () => {
  it('ALL_PERMISSIONS ne contient aucun doublon', () => {
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
  });

  it('ALL_PERMISSIONS = à plat toutes les clés du catalogue', () => {
    const flat = PERMISSION_CATALOG.flatMap((g) => g.actions.map((a) => a.key));
    expect([...ALL_PERMISSIONS].sort()).toEqual([...flat].sort());
  });

  it('chaque clé vaut "<resource>.<action>"', () => {
    for (const key of ALL_PERMISSIONS) expect(key).toMatch(/^[a-z]+\.[a-z]+$/);
  });

  it('les rôles built-in ne référencent que des clés valides ou le wildcard', () => {
    const valid = new Set<string>([WILDCARD, ...ALL_PERMISSIONS]);
    for (const perms of Object.values(BUILTIN_ROLE_PERMISSIONS))
      for (const p of perms) expect(valid.has(p)).toBe(true);
  });

  it('SUPER_ADMIN = wildcard uniquement', () => {
    expect(BUILTIN_ROLE_PERMISSIONS.SUPER_ADMIN).toEqual([WILDCARD]);
  });

  it('FINANCE a finances.refund mais pas users.view', () => {
    expect(BUILTIN_ROLE_PERMISSIONS.FINANCE).toContain('finances.refund');
    expect(BUILTIN_ROLE_PERMISSIONS.FINANCE).not.toContain('users.view');
  });

  it('SUPPORT (users était write) a users.ban ; MODERATEUR a diffusion.broadcast', () => {
    expect(BUILTIN_ROLE_PERMISSIONS.SUPPORT).toContain('users.ban');
    expect(BUILTIN_ROLE_PERMISSIONS.MODERATEUR).toContain('diffusion.broadcast');
  });
});
