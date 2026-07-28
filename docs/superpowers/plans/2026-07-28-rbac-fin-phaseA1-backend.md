# RBAC admin fin — Phase A1 (Moteur backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le RBAC backend (4 rôles enum × sections × read/write codé en dur) par un moteur unifié à permissions granulaires (`ressource.action`), avec rôles configurables en base, surcharges par admin, et endpoints de gestion — sans lockout ni changement de comportement à la migration.

**Architecture:** Un catalogue de permissions (source de vérité TS) + un résolveur pur `role.permissions ∪ granted − revoked` (`*` = tout). Les rôles sont stockés dans une nouvelle table `AdminRoleDef` ; chaque `User` admin porte `adminRoleId` + surcharges `permGranted`/`permRevoked`. Les 4 rôles built-in sont seedés/backfillés au bootstrap (idempotent) à partir du catalogue, verrouillés (`isBuiltin`) et clonables. Le guard relit les permissions effectives en base à chaque requête via des fonctions pures (pas d'injection de service → utilisable cross-module).

**Tech Stack:** NestJS 11, Prisma 7 (postgres, driver adapters, client généré dans `src/generated/prisma`), Jest (`*.spec.ts`), pnpm.

## Global Constraints

- **Sans changement de comportement à la migration** : les 4 rôles built-in reproduisent la matrice actuelle à l'identique (`write` d'une section → TOUTES ses actions fines ; `read` → `.view` seule).
- **Sans lockout** : toujours ≥ 1 admin effectif avec `admins.manage` (ou `*`) ; refuser toute opération qui violerait cet invariant.
- **`*`** dans un ensemble de permissions = court-circuit (toutes permissions, ignore granted/revoked).
- Les rôles `isBuiltin=true` sont **non éditables / non supprimables** ; clonables.
- Permissions stockées en **`String[]`** Postgres natif (pas `Json`), typées `Permission`.
- Le catalogue TS (`permissions.catalog.ts`) est l'**unique source de vérité** : seed + backfill au bootstrap, pas de données en SQL de migration (migration = DDL pure).
- Ne jamais pousser d'information sensible sur un dépôt distant (contrainte projet).
- Vérification par tâche : `pnpm run build` PASSE et les specs concernées PASSENT. Commits fréquents.
- Fin de chaque message de commit : `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Base client Prisma : après tout changement de `schema.prisma`, lancer `pnpm exec prisma generate` avant `pnpm run build`.

---

## Structure des fichiers (Phase A1)

- **Create** `src/admin/permissions.catalog.ts` — catalogue (clés, libellés FR, groupes), `Permission` type, `ALL_PERMISSIONS`, `WILDCARD`, `BUILTIN_ROLE_PERMISSIONS`. (T1)
- **Create** `src/admin/permissions.resolve.ts` — `resolveEffectivePermissions`, `hasPermission`, `toPermissionList`. (T2)
- **Create** `src/admin/permissions.catalog.spec.ts`, `src/admin/permissions.resolve.spec.ts` — tests. (T1, T2)
- **Modify** `prisma/schema.prisma` — modèle `AdminRoleDef`, champs `User.adminRoleId/permGranted/permRevoked` + relation. (T3)
- **Create** `prisma/migrations/<ts>_admin_rbac_fin/migration.sql` — DDL. (T3)
- **Create** `src/admin/roles.service.ts` (+ `.spec.ts`) — CRUD rôles, assign, overrides, résolveur, seed/backfill `onModuleInit`, anti-lockout. (T4)
- **Modify** `src/admin/admin.module.ts` — enregistrer/exporter `RolesService`. (T4)
- **Modify** `src/admin/rbac.guard.ts` — décorateur `RequirePerm(key)`, guard sur permissions effectives. (T5)
- **Delete** `src/admin/rbac.ts` — ancien matrix/`can` supprimé. (T5)
- **Modify** 5 contrôleurs (`admin`, `admin-growth`, `artisans`, `avis`, `metiers`) — ré-annotation des 48 `@RequirePerm`. (T5)
- **Modify** `src/admin/admin.service.ts` — contrôle `users.ban` sur bannissement. (T5)
- **Create** `src/admin/roles.controller.ts` (+ DTOs `src/admin/dto/role.dto.ts`) — endpoints permissions/rôles/assign/overrides. (T6)
- **Modify** `src/admin/admin-growth.{controller,service}.ts` + `src/admin/dto/admin-role.dto.ts` — grant/revoke sur `roleId`, retrait de `changeAdminRole` (déplacé en T6). (T6)
- **Modify** `src/users/user.service.ts` + `src/users/dto/get-profile.response.dto.ts` — `adminPermissions`/`adminRoleName` dans `/users/me`. (T7)

---

### Task 1 : Catalogue de permissions + définitions des rôles built-in

**Files:**
- Create: `src/admin/permissions.catalog.ts`
- Test: `src/admin/permissions.catalog.spec.ts`

**Interfaces:**
- Produces:
  - `type Permission` (union des clés `ressource.action`)
  - `const WILDCARD = '*'`
  - `const ALL_PERMISSIONS: readonly Permission[]`
  - `const PERMISSION_CATALOG: PermissionGroup[]` où `type PermissionGroup = { resource: string; label: string; actions: { key: Permission; action: string; label: string }[] }`
  - `const BUILTIN_ROLE_PERMISSIONS: Record<'SUPER_ADMIN'|'MODERATEUR'|'SUPPORT'|'FINANCE', readonly (Permission | '*')[]>`
  - `const BUILTIN_ROLE_DESCRIPTION: Record<..., string>`

- [ ] **Step 1: Écrire le test qui échoue** — `src/admin/permissions.catalog.spec.ts`

```typescript
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
```

- [ ] **Step 2: Lancer le test → échec** — `pnpm test -- permissions.catalog` → FAIL (module introuvable).

- [ ] **Step 3: Écrire `src/admin/permissions.catalog.ts`**

```typescript
/**
 * Catalogue des permissions du back-office (source de vérité unique).
 * Une permission = une clé `ressource.action`. Le wildcard `*` = toutes permissions.
 * Note : certaines clés (`*.export`, `finances.refund`, `diffusion.view`) n'ont pas
 * encore d'endpoint backend et servent au gating de l'UI (boutons/onglets).
 */
export const WILDCARD = '*' as const;

export const ALL_PERMISSIONS = [
  'dashboard.view',
  'users.view', 'users.edit', 'users.suspend', 'users.ban', 'users.export',
  'artisans.view', 'artisans.edit', 'artisans.validate', 'artisans.reject', 'artisans.export',
  'bookings.view', 'bookings.export',
  'express.view', 'express.export',
  'maindoeuvre.view', 'maindoeuvre.export',
  'ambassadeurs.view', 'ambassadeurs.export',
  'finances.view', 'finances.refund', 'finances.export',
  'avis.view', 'avis.moderate',
  'metiers.view', 'metiers.manage',
  'diffusion.view', 'diffusion.broadcast',
  'audit.view',
  'admins.view', 'admins.manage',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export type PermissionGroup = {
  resource: string;
  label: string;
  actions: { key: Permission; action: string; label: string }[];
};

const A = (key: Permission, action: string, label: string) => ({ key, action, label });

export const PERMISSION_CATALOG: PermissionGroup[] = [
  { resource: 'dashboard', label: 'Tableau de bord', actions: [A('dashboard.view', 'view', 'Consulter')] },
  { resource: 'users', label: 'Utilisateurs', actions: [
    A('users.view', 'view', 'Consulter'), A('users.edit', 'edit', 'Modifier'),
    A('users.suspend', 'suspend', 'Suspendre / réactiver'), A('users.ban', 'ban', 'Bannir'),
    A('users.export', 'export', 'Exporter'),
  ] },
  { resource: 'artisans', label: 'Artisans', actions: [
    A('artisans.view', 'view', 'Consulter'), A('artisans.edit', 'edit', 'Modifier / statut'),
    A('artisans.validate', 'validate', 'Valider'), A('artisans.reject', 'reject', 'Rejeter'),
    A('artisans.export', 'export', 'Exporter'),
  ] },
  { resource: 'bookings', label: 'Réservations', actions: [
    A('bookings.view', 'view', 'Consulter'), A('bookings.export', 'export', 'Exporter'),
  ] },
  { resource: 'express', label: 'Demandes express', actions: [
    A('express.view', 'view', 'Consulter'), A('express.export', 'export', 'Exporter'),
  ] },
  { resource: 'maindoeuvre', label: "Main-d'œuvre", actions: [
    A('maindoeuvre.view', 'view', 'Consulter'), A('maindoeuvre.export', 'export', 'Exporter'),
  ] },
  { resource: 'ambassadeurs', label: 'Ambassadeurs', actions: [
    A('ambassadeurs.view', 'view', 'Consulter'), A('ambassadeurs.export', 'export', 'Exporter'),
  ] },
  { resource: 'finances', label: 'Finances', actions: [
    A('finances.view', 'view', 'Consulter'), A('finances.refund', 'refund', 'Rembourser'),
    A('finances.export', 'export', 'Exporter'),
  ] },
  { resource: 'avis', label: 'Avis', actions: [
    A('avis.view', 'view', 'Consulter'), A('avis.moderate', 'moderate', 'Modérer'),
  ] },
  { resource: 'metiers', label: 'Métiers', actions: [
    A('metiers.view', 'view', 'Consulter'), A('metiers.manage', 'manage', 'Gérer'),
  ] },
  { resource: 'diffusion', label: 'Diffusion', actions: [
    A('diffusion.view', 'view', 'Consulter'), A('diffusion.broadcast', 'broadcast', 'Diffuser'),
  ] },
  { resource: 'audit', label: 'Journal', actions: [A('audit.view', 'view', 'Consulter')] },
  { resource: 'admins', label: 'Comptes admin', actions: [
    A('admins.view', 'view', 'Consulter'), A('admins.manage', 'manage', 'Gérer'),
  ] },
];

/**
 * Rôles built-in — reproduisent la matrice historique :
 * `write` d'une section → TOUTES ses actions fines ; `read` → `.view` seule.
 */
export const BUILTIN_ROLE_PERMISSIONS: Record<
  'SUPER_ADMIN' | 'MODERATEUR' | 'SUPPORT' | 'FINANCE',
  readonly (Permission | typeof WILDCARD)[]
> = {
  SUPER_ADMIN: [WILDCARD],
  MODERATEUR: [
    'dashboard.view',
    'users.view', 'users.edit', 'users.suspend', 'users.ban', 'users.export',
    'artisans.view', 'artisans.edit', 'artisans.validate', 'artisans.reject', 'artisans.export',
    'bookings.view', 'express.view', 'maindoeuvre.view', 'ambassadeurs.view',
    'avis.view', 'avis.moderate',
    'metiers.view', 'metiers.manage',
    'diffusion.view', 'diffusion.broadcast',
    'audit.view',
  ],
  SUPPORT: [
    'dashboard.view',
    'users.view', 'users.edit', 'users.suspend', 'users.ban', 'users.export',
    'artisans.view', 'bookings.view', 'express.view', 'maindoeuvre.view', 'ambassadeurs.view',
    'avis.view', 'audit.view',
  ],
  FINANCE: [
    'dashboard.view', 'bookings.view', 'ambassadeurs.view',
    'finances.view', 'finances.refund', 'finances.export', 'audit.view',
  ],
};

export const BUILTIN_ROLE_DESCRIPTION: Record<
  keyof typeof BUILTIN_ROLE_PERMISSIONS,
  string
> = {
  SUPER_ADMIN: 'Accès total (toutes permissions).',
  MODERATEUR: 'Modération : utilisateurs, artisans, avis, métiers, diffusion.',
  SUPPORT: 'Support client : consultation large + gestion des utilisateurs.',
  FINANCE: 'Finances : revenus, transactions, remboursements.',
};
```

- [ ] **Step 4: Lancer le test → succès** — `pnpm test -- permissions.catalog` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/admin/permissions.catalog.ts src/admin/permissions.catalog.spec.ts
git commit -m "feat(rbac): catalogue de permissions fines + roles built-in"
```

---

### Task 2 : Résolveur de permissions effectives

**Files:**
- Create: `src/admin/permissions.resolve.ts`
- Test: `src/admin/permissions.resolve.spec.ts`

**Interfaces:**
- Consumes: `WILDCARD`, `ALL_PERMISSIONS`, `BUILTIN_ROLE_PERMISSIONS`, `Permission` (Task 1).
- Produces:
  - `type ResolveInput = { role: string; adminRole: 'SUPER_ADMIN'|'MODERATEUR'|'SUPPORT'|'FINANCE'|null; roleDefPermissions: string[] | null; granted: string[]; revoked: string[] }`
  - `resolveEffectivePermissions(input: ResolveInput): Set<string>` — ensemble concret des clés (le `*` est développé en `ALL_PERMISSIONS`).
  - `hasPermission(perms: Set<string>, key: string): boolean`
  - `toPermissionList(perms: Set<string>): string[]`

- [ ] **Step 1: Écrire le test qui échoue** — `src/admin/permissions.resolve.spec.ts`

```typescript
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
```

- [ ] **Step 2: Lancer le test → échec** — `pnpm test -- permissions.resolve` → FAIL.

- [ ] **Step 3: Écrire `src/admin/permissions.resolve.ts`**

```typescript
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
```

- [ ] **Step 4: Lancer le test → succès** — `pnpm test -- permissions.resolve` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/admin/permissions.resolve.ts src/admin/permissions.resolve.spec.ts
git commit -m "feat(rbac): resolveur de permissions effectives (role union granted moins revoked)"
```

---

### Task 3 : Schéma Prisma `AdminRoleDef` + surcharges User + migration DDL

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_admin_rbac_fin/migration.sql` (généré par Prisma puis vérifié)

**Interfaces:**
- Produces (client Prisma régénéré) :
  - modèle `AdminRoleDef { id, name (unique), description?, isBuiltin, permissions String[], createdAt, updatedAt, admins User[] }`
  - `User.adminRoleId String?` (FK) + relation `adminRoleRef` ; `User.permGranted String[]` ; `User.permRevoked String[]`.

- [ ] **Step 1: Ajouter le modèle `AdminRoleDef` dans `prisma/schema.prisma`**

À placer près du modèle `User` (les fichiers qui changent ensemble vivent ensemble) :

```prisma
/// Définition d'un rôle admin (RBAC fin). isBuiltin = rôle verrouillé, non éditable.
model AdminRoleDef {
  id          String   @id @default(uuid()) @db.VarChar(36)
  name        String   @unique @db.VarChar(60)
  description String?  @db.VarChar(255)
  isBuiltin   Boolean  @default(false) @map("is_builtin")
  /// Clés du catalogue de permissions (ou "*" pour tout).
  permissions String[]
  createdAt   DateTime @default(now()) @db.Timestamptz @map("created_at")
  updatedAt   DateTime @updatedAt @db.Timestamptz @map("updated_at")

  admins User[]

  @@map("admin_role_defs")
}
```

- [ ] **Step 2: Ajouter les champs RBAC sur le modèle `User`**

Sous la ligne existante `adminRole RoleAdmin? @map("admin_role")` :

```prisma
  /// RBAC fin : rôle assigné (source d'autorité si défini). Cf. AdminRoleDef.
  adminRoleId  String?       @map("admin_role_id") @db.VarChar(36)
  adminRoleRef AdminRoleDef? @relation(fields: [adminRoleId], references: [id], onDelete: SetNull)
  /// Surcharges par admin : permissions accordées en plus / retirées du rôle.
  permGranted  String[]      @map("perm_granted")
  permRevoked  String[]      @map("perm_revoked")
```

- [ ] **Step 3: Générer la migration (DDL uniquement, sans l'appliquer d'abord)**

Run:
```bash
pnpm exec prisma migrate dev --name admin_rbac_fin --create-only
```
Expected: crée `prisma/migrations/<ts>_admin_rbac_fin/migration.sql` contenant `CREATE TABLE "admin_role_defs"`, `ALTER TABLE "users" ADD COLUMN "admin_role_id"...`, `perm_granted text[]`, `perm_revoked text[]`, la contrainte FK `users_admin_role_id_fkey`, et l'unique sur `name`.

- [ ] **Step 4: Vérifier la migration**

Ouvrir le `.sql` généré et vérifier : (a) c'est de la **DDL pure** (aucun INSERT/UPDATE de données — le seed est au bootstrap, Task 4) ; (b) les colonnes `perm_granted`/`perm_revoked` sont `text[] NOT NULL DEFAULT ARRAY[]::text[]` (Prisma applique `[]` par défaut sur `String[]`) ; (c) `admin_role_id` est nullable avec FK `ON DELETE SET NULL`. Si `permissions`/`perm_granted`/`perm_revoked` n'ont pas de `DEFAULT ARRAY[]::text[]`, l'ajouter à la main pour éviter tout `NULL` sur les lignes users existantes.

- [ ] **Step 5: Appliquer la migration + régénérer le client**

Run:
```bash
pnpm exec prisma migrate dev
pnpm exec prisma generate
```
Expected: migration appliquée sur la base de dev (aucune perte : colonnes nullable / à défaut `[]`), client régénéré dans `src/generated/prisma` avec `AdminRoleDef` et les nouveaux champs `User`.

- [ ] **Step 6: Vérifier la compilation**

Run: `pnpm run build`
Expected: build OK (le nouveau client typé compile ; aucun consommateur encore).

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(rbac): modele AdminRoleDef + surcharges par admin (migration)"
```

---

### Task 4 : `RolesService` — CRUD rôles, assign, surcharges, seed/backfill, anti-lockout

**Files:**
- Create: `src/admin/roles.service.ts`
- Test: `src/admin/roles.service.spec.ts`
- Modify: `src/admin/admin.module.ts`

**Interfaces:**
- Consumes: `PrismaService` ; `PERMISSION_CATALOG`, `ALL_PERMISSIONS`, `BUILTIN_ROLE_PERMISSIONS`, `BUILTIN_ROLE_DESCRIPTION`, `Permission` (T1) ; `resolveEffectivePermissions`, `hasPermission`, `toPermissionList` (T2).
- Produces (méthodes publiques) :
  - `onModuleInit(): Promise<void>` — seed idempotent des 4 built-in + backfill `adminRoleId`.
  - `getCatalog(): PermissionGroup[]`
  - `listRoles(): Promise<Array<{ id; name; description; isBuiltin; permissions: string[]; adminsCount: number }>>`
  - `createRole(dto: { name; description?; permissions: string[]; fromRoleId?: string }, actorId): Promise<AdminRoleDef>`
  - `updateRole(id, dto: { name?; description?; permissions?: string[] }, actorId): Promise<AdminRoleDef>`
  - `deleteRole(id, actorId): Promise<void>`
  - `assignRole(userId, roleId, actorId): Promise<void>`
  - `setOverrides(userId, dto: { granted: string[]; revoked: string[] }, actorId): Promise<void>`
  - `getEffectivePermissions(userId): Promise<string[]>`
  - `assertPermission(userId, key: Permission): Promise<void>`

- [ ] **Step 1: Écrire le test qui échoue** — `src/admin/roles.service.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { ForbiddenException, ConflictException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
  adminRoleDef: { upsert: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
  user: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
  logActivite: { create: jest.fn() },
};

const adminRow = (over: Partial<any> = {}) => ({
  role: 'ADMIN', adminRole: null, permGranted: [], permRevoked: [],
  adminRoleRef: { permissions: ['*'] }, ...over,
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
      { id: 'r-super', name: 'SUPER_ADMIN' }, { id: 'r-fin', name: 'FINANCE' },
      { id: 'r-mod', name: 'MODERATEUR' }, { id: 'r-sup', name: 'SUPPORT' },
    ]);
    mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1', adminRole: 'FINANCE' }, { id: 'u2', adminRole: null }]);
    await service.onModuleInit();
    expect(mockPrisma.adminRoleDef.upsert).toHaveBeenCalledTimes(4);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { adminRoleId: 'r-fin' } });
    expect(mockPrisma.user.update).toHaveBeenCalledWith({ where: { id: 'u2' }, data: { adminRoleId: 'r-super' } });
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
    mockPrisma.adminRoleDef.findUnique.mockResolvedValue({ id: 'r1', isBuiltin: true, name: 'SUPPORT' });
    await expect(service.updateRole('r1', { permissions: ['users.view'] }, 'actor')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('deleteRole refuse si des admins l\'utilisent', async () => {
    mockPrisma.adminRoleDef.findUnique.mockResolvedValue({ id: 'r1', isBuiltin: false, name: 'Custom' });
    mockPrisma.user.count.mockResolvedValue(2);
    await expect(service.deleteRole('r1', 'actor')).rejects.toBeInstanceOf(ConflictException);
  });

  it('setOverrides bloque le retrait du dernier gestionnaire (anti-lockout)', async () => {
    // cible = seul admin ; on lui retire admins.manage → interdit
    mockPrisma.user.findUnique.mockResolvedValue(adminRow({ adminRoleRef: { permissions: ['admins.manage'] } }));
    mockPrisma.user.findMany.mockResolvedValue([]); // aucun autre admin
    await expect(
      service.setOverrides('u1', { granted: [], revoked: ['admins.manage'] }, 'actor'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
```

- [ ] **Step 2: Lancer → échec** — `pnpm test -- roles.service` → FAIL.

- [ ] **Step 3: Écrire `src/admin/roles.service.ts`**

```typescript
import {
  ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ALL_PERMISSIONS, BUILTIN_ROLE_DESCRIPTION, BUILTIN_ROLE_PERMISSIONS,
  PERMISSION_CATALOG, Permission, WILDCARD,
} from './permissions.catalog';
import { hasPermission, resolveEffectivePermissions, toPermissionList } from './permissions.resolve';

const ADMIN_SELECT = {
  role: true, adminRole: true, permGranted: true, permRevoked: true,
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
        update: { permissions: [...permissions], isBuiltin: true, description: BUILTIN_ROLE_DESCRIPTION[name as keyof typeof BUILTIN_ROLE_DESCRIPTION] },
        create: { name, permissions: [...permissions], isBuiltin: true, description: BUILTIN_ROLE_DESCRIPTION[name as keyof typeof BUILTIN_ROLE_DESCRIPTION] },
      });
    }
    const builtins = await this.prisma.adminRoleDef.findMany({ where: { isBuiltin: true }, select: { id: true, name: true } });
    const byName = new Map(builtins.map((r) => [r.name, r.id]));
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN', adminRoleId: null }, select: { id: true, adminRole: true } });
    for (const a of admins) {
      const roleId = byName.get(a.adminRole ?? 'SUPER_ADMIN');
      if (roleId) await this.prisma.user.update({ where: { id: a.id }, data: { adminRoleId: roleId } });
    }
  }

  getCatalog() {
    return PERMISSION_CATALOG;
  }

  async listRoles() {
    const roles = await this.prisma.adminRoleDef.findMany({ orderBy: [{ isBuiltin: 'desc' }, { name: 'asc' }] });
    const counts = await this.prisma.user.groupBy({ by: ['adminRoleId'], where: { role: 'ADMIN' }, _count: true });
    const byId = new Map(counts.map((c) => [c.adminRoleId, c._count]));
    return roles.map((r) => ({
      id: r.id, name: r.name, description: r.description, isBuiltin: r.isBuiltin,
      permissions: r.permissions, adminsCount: byId.get(r.id) ?? 0,
    }));
  }

  private assertValidPermissions(keys: string[]): void {
    const valid = new Set<string>(ALL_PERMISSIONS);
    for (const k of keys) {
      if (k === WILDCARD) throw new ConflictException('Le wildcard "*" est réservé aux rôles système.');
      if (!valid.has(k)) throw new ConflictException(`Permission inconnue : ${k}`);
    }
  }

  async createRole(dto: { name: string; description?: string; permissions: string[]; fromRoleId?: string }, actorId: string) {
    let permissions = dto.permissions;
    if (dto.fromRoleId) {
      const src = await this.prisma.adminRoleDef.findUnique({ where: { id: dto.fromRoleId } });
      if (!src) throw new NotFoundException('Rôle source introuvable');
      // clone : on part des permissions de la source, sauf si une liste explicite est fournie
      if (!dto.permissions?.length) permissions = src.permissions.filter((p) => p !== WILDCARD);
    }
    this.assertValidPermissions(permissions);
    try {
      const role = await this.prisma.adminRoleDef.create({
        data: { name: dto.name, description: dto.description, permissions, isBuiltin: false },
      });
      this.audit(actorId, 'ADMIN_ROLE_CREATE', role.id, { name: role.name, permissions });
      return role;
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('Un rôle porte déjà ce nom.');
      throw e;
    }
  }

  async updateRole(id: string, dto: { name?: string; description?: string; permissions?: string[] }, actorId: string) {
    const role = await this.prisma.adminRoleDef.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Rôle introuvable');
    if (role.isBuiltin) throw new ForbiddenException('Un rôle système ne peut pas être modifié (clonez-le).');
    if (dto.permissions) this.assertValidPermissions(dto.permissions);
    try {
      const updated = await this.prisma.adminRoleDef.update({
        where: { id },
        data: { name: dto.name, description: dto.description, permissions: dto.permissions },
      });
      this.audit(actorId, 'ADMIN_ROLE_UPDATE', id, { name: updated.name, permissions: updated.permissions });
      return updated;
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('Un rôle porte déjà ce nom.');
      throw e;
    }
  }

  async deleteRole(id: string, actorId: string): Promise<void> {
    const role = await this.prisma.adminRoleDef.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Rôle introuvable');
    if (role.isBuiltin) throw new ForbiddenException('Un rôle système ne peut pas être supprimé.');
    const used = await this.prisma.user.count({ where: { adminRoleId: id } });
    if (used > 0) throw new ConflictException(`Ce rôle est assigné à ${used} admin(s).`);
    await this.prisma.adminRoleDef.delete({ where: { id } });
    this.audit(actorId, 'ADMIN_ROLE_DELETE', id, { name: role.name });
  }

  async assignRole(userId: string, roleId: string, actorId: string): Promise<void> {
    const target = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true, permGranted: true, permRevoked: true, adminRole: true } });
    if (!target || target.role !== 'ADMIN') throw new NotFoundException('Administrateur introuvable');
    const role = await this.prisma.adminRoleDef.findUnique({ where: { id: roleId }, select: { permissions: true } });
    if (!role) throw new NotFoundException('Rôle introuvable');
    const future = resolveEffectivePermissions({
      role: 'ADMIN', adminRole: target.adminRole, roleDefPermissions: role.permissions,
      granted: target.permGranted, revoked: target.permRevoked,
    });
    await this.assertKeepsAManager(userId, hasPermission(future, 'admins.manage'));
    await this.prisma.user.update({ where: { id: userId }, data: { adminRoleId: roleId } });
    this.audit(actorId, 'ADMIN_ROLE_ASSIGN', userId, { roleId });
  }

  async setOverrides(userId: string, dto: { granted: string[]; revoked: string[] }, actorId: string): Promise<void> {
    this.assertValidPermissions([...dto.granted, ...dto.revoked]);
    const target = await this.prisma.user.findUnique({ where: { id: userId }, select: ADMIN_SELECT });
    if (!target || target.role !== 'ADMIN') throw new NotFoundException('Administrateur introuvable');
    const future = resolveEffectivePermissions({
      role: 'ADMIN', adminRole: target.adminRole, roleDefPermissions: target.adminRoleRef?.permissions ?? null,
      granted: dto.granted, revoked: dto.revoked,
    });
    await this.assertKeepsAManager(userId, hasPermission(future, 'admins.manage'));
    await this.prisma.user.update({ where: { id: userId }, data: { permGranted: dto.granted, permRevoked: dto.revoked } });
    this.audit(actorId, 'ADMIN_OVERRIDES_SET', userId, { granted: dto.granted, revoked: dto.revoked });
  }

  async getEffectivePermissions(userId: string): Promise<string[]> {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: ADMIN_SELECT });
    if (!u) return [];
    return toPermissionList(resolveEffectivePermissions({
      role: u.role, adminRole: u.adminRole, roleDefPermissions: u.adminRoleRef?.permissions ?? null,
      granted: u.permGranted, revoked: u.permRevoked,
    }));
  }

  async assertPermission(userId: string, key: Permission): Promise<void> {
    const perms = await this.getEffectivePermissions(userId);
    if (!perms.includes(key)) throw new ForbiddenException(`Permission requise : ${key}`);
  }

  /** Invariant anti-lockout : au moins un admin conserve `admins.manage`. */
  private async assertKeepsAManager(targetId: string, targetKeepsManage: boolean): Promise<void> {
    if (targetKeepsManage) return;
    const others = await this.prisma.user.findMany({ where: { role: 'ADMIN', id: { not: targetId } }, select: ADMIN_SELECT });
    const someoneElseManages = others.some((a) =>
      hasPermission(
        resolveEffectivePermissions({ role: a.role, adminRole: a.adminRole, roleDefPermissions: a.adminRoleRef?.permissions ?? null, granted: a.permGranted, revoked: a.permRevoked }),
        'admins.manage',
      ),
    );
    if (!someoneElseManages) throw new ForbiddenException('Au moins un administrateur doit conserver la gestion des comptes.');
  }

  private audit(userId: string, action: string, entiteId: string, metadata: Record<string, unknown>): void {
    void this.prisma.logActivite.create({ data: { userId, action, entite: 'admin_rbac', entiteId, metadata: metadata as any } }).catch(() => undefined);
  }
}
```

- [ ] **Step 4: Enregistrer `RolesService` dans `src/admin/admin.module.ts`**

Ajouter l'import `import { RolesService } from './roles.service';`, l'ajouter à `providers` ET `exports` :

```typescript
  providers: [AdminService, AdminGrowthService, AdminPermGuard, RolesService],
  exports: [AdminService, RolesService],
```

- [ ] **Step 5: Lancer → succès** — `pnpm test -- roles.service` → PASS ; puis `pnpm run build` → OK.

- [ ] **Step 6: Commit**

```bash
git add src/admin/roles.service.ts src/admin/roles.service.spec.ts src/admin/admin.module.ts
git commit -m "feat(rbac): RolesService (CRUD roles, assign, surcharges, seed/backfill, anti-lockout)"
```

---

### Task 5 : Guard + décorateur sur clés fines + ré-annotation des 48 gardes (atomique)

**Files:**
- Modify: `src/admin/rbac.guard.ts`
- Delete: `src/admin/rbac.ts`
- Modify: `src/admin/admin.controller.ts`, `src/admin/admin-growth.controller.ts`, `src/artisans/artisans.controller.ts`, `src/avis/avis.controller.ts`, `src/metiers/metiers.controller.ts`
- Modify: `src/admin/admin.service.ts` (contrôle `users.ban`)

**Interfaces:**
- Consumes: `resolveEffectivePermissions`, `hasPermission` (T2) ; `Permission` (T1) ; `RolesService` (T4, pour le contrôle `users.ban`).
- Produces: `RequirePerm(key: Permission)` (nouvelle signature à un seul argument) ; guard qui autorise selon les permissions effectives.

**Note atomique :** le changement de signature de `RequirePerm` casse simultanément les 48 sites à la compilation ; cette tâche DOIT tout mettre à jour dans le même commit pour un build vert.

- [ ] **Step 1: Réécrire `src/admin/rbac.guard.ts`**

```typescript
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
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
 * Garde RBAC : à placer APRÈS AtGuard/RolesGuard. Sans @RequirePerm → laisse passer.
 * Les permissions effectives sont relues en base à chaque requête (prise en compte
 * immédiate des changements de rôle/surcharges).
 */
@Injectable()
export class AdminPermGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const key = this.reflector.getAllAndOverride<Permission | undefined>(PERM_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!key) return true;

    const req = ctx.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.sub;
    if (!userId) throw new ForbiddenException();

    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true, adminRole: true, permGranted: true, permRevoked: true,
        adminRoleRef: { select: { permissions: true } },
      },
    });
    if (u?.role !== 'ADMIN') throw new ForbiddenException();

    const perms = resolveEffectivePermissions({
      role: u.role, adminRole: u.adminRole, roleDefPermissions: u.adminRoleRef?.permissions ?? null,
      granted: u.permGranted, revoked: u.permRevoked,
    });
    if (!hasPermission(perms, key)) {
      throw new ForbiddenException("Votre rôle admin n'autorise pas cette action.");
    }
    return true;
  }
}
```

- [ ] **Step 2: Supprimer l'ancien fichier**

```bash
git rm src/admin/rbac.ts
```
(Vérifier d'abord qu'aucun fichier hors `rbac.guard.ts` n'importe de `./rbac` : `grep -rn "admin/rbac'" src` et `grep -rn "from './rbac'" src`. Le seul consommateur attendu est l'ancien guard, désormais réécrit.)

- [ ] **Step 3: Ré-annoter les 48 `@RequirePerm` selon la table de correspondance**

Pour chaque site, remplacer l'ancien `@RequirePerm('<section>', '<read|write>')` par `@RequirePerm('<clé fine>')`. Table exhaustive :

**`src/admin/admin.controller.ts`**
| Ligne (≈) | Route | Ancien | Nouveau |
|---|---|---|---|
| 52 | `Get stats/overview` | dashboard,read | `dashboard.view` |
| 62 | `Get stats/trends` | dashboard,read | `dashboard.view` |
| 72 | `Get stats/breakdown` | dashboard,read | `dashboard.view` |
| 79 | `Get users/:id` | users,read | `users.view` |
| 86 | `Patch users/:id` | users,write | `users.edit` |
| 97 | `Patch users/:id/statut` | users,write | `users.suspend` |
| 108 | `Get bookings` | bookings,read | `bookings.view` |
| 115 | `Get bookings/:id` | bookings,read | `bookings.view` |
| 122 | `Get artisans/:id` | artisans,read | `artisans.view` |
| 129 | `Patch artisans/:id` | artisans,write | `artisans.edit` |
| 140 | `Get metiers` | metiers,read | `metiers.view` |
| 147 | `Get categories` | metiers,read | `metiers.view` |
| 157 | `Get stats/bookings` | dashboard,read | `dashboard.view` |
| 167 | `Get stats/revenue` | finances,read | `finances.view` |
| 180 | `Get users` | users,read | `users.view` |
| 193 | `Get artisans/pending` | artisans,read | `artisans.view` |
| 208 | `Get avis/reported` | avis,read | `avis.view` |
| 224 | `Get transactions` | finances,read | `finances.view` |
| 237 | `Post notifications/broadcast` | diffusion,write | `diffusion.broadcast` |
| 253 | `Get logs` | audit,read | `audit.view` |

**`src/admin/admin-growth.controller.ts`**
| Ligne (≈) | Route | Nouveau |
|---|---|---|
| 37 | `ambassadeurs/stats` | `ambassadeurs.view` |
| 44 | `ambassadeurs/leaderboard` | `ambassadeurs.view` |
| 51 | `ambassadeurs/:id` | `ambassadeurs.view` |
| 58 | `parrainages` | `ambassadeurs.view` |
| 67 | `main-doeuvre/stats` | `maindoeuvre.view` |
| 74 | `annonces` | `maindoeuvre.view` |
| 81 | `annonces/:id` | `maindoeuvre.view` |
| 88 | `travailleurs` | `maindoeuvre.view` |
| 95 | `travailleurs/:id` | `maindoeuvre.view` |
| 104 | `Get admins` | `admins.view` |
| 111 | `Post admins/grant` | `admins.manage` |
| 118 | `Patch admins/:id/role` | `admins.manage` |
| 129 | `Post admins/:id/revoke` | `admins.manage` |
| 138 | `demandes-express/stats` | `express.view` |
| 145 | `demandes-express` | `express.view` |
| 152 | `demandes-express/:id` | `express.view` |

**`src/artisans/artisans.controller.ts`**
| Ligne (≈) | Route | Nouveau |
|---|---|---|
| 235 | `Patch :id/verify` | `artisans.validate` |
| 268 | `Patch :id/reject` | `artisans.reject` |
| 300 | `Patch :id/statut` | `artisans.edit` |
| 333 | `Delete :id` | `artisans.edit` |

**`src/avis/avis.controller.ts`**
| Ligne (≈) | Route | Nouveau |
|---|---|---|
| 149 | `Patch :id/moderate` | `avis.moderate` |

**`src/metiers/metiers.controller.ts`**
| Ligne (≈) | Route | Nouveau |
|---|---|---|
| 48 | `Post ()` | `metiers.manage` |
| 138 | `Get admin/all` | `metiers.view` |
| 160 | `Get admin/pending` | `metiers.view` |
| 179 | `Patch :id/valider` | `metiers.manage` |
| 295 | `Patch :id` | `metiers.manage` |
| 327 | `Delete :id` | `metiers.manage` |

Dans chaque fichier, corriger l'import : `import { AdminPermGuard, RequirePerm } from '<chemin>/rbac.guard';` reste valide (mêmes exports). Les numéros de ligne sont indicatifs — **repérer par la route/le décorateur HTTP**, pas par la ligne.

- [ ] **Step 4: Ajouter le contrôle `users.ban` sur le bannissement dans `src/admin/admin.service.ts`**

Le endpoint `PATCH users/:id/statut` est gardé par `users.suspend` (baseline). Le **bannissement** (statut cible `BANNI`) exige en plus `users.ban`. Dans `AdminService`, injecter `RolesService` et vérifier au début de `changeUserStatut` :

```typescript
// constructeur : ajouter le paramètre
constructor(
  // ...dépendances existantes...
  private readonly roles: RolesService,
) {}

// dans changeUserStatut(userId, dto, adminId), tout au début :
if (dto.statut === 'BANNI') {
  await this.roles.assertPermission(adminId, 'users.ban');
}
```

Ajouter l'import `import { RolesService } from './roles.service';`. (RolesService est déjà provider/export d'AdminModule — Task 4.) Adapter les noms exacts des paramètres à la signature réelle de `changeUserStatut` (cf. `change-user-statut.dto.ts` pour le champ `statut`).

- [ ] **Step 5: Mettre à jour le mock de `admin.service.spec.ts`**

`AdminService` a une nouvelle dépendance `RolesService`. Ajouter dans les providers du test un mock :
```typescript
const mockRolesService = { assertPermission: jest.fn().mockResolvedValue(undefined) };
// ...
{ provide: RolesService, useValue: mockRolesService },
```
(import `import { RolesService } from './roles.service';`).

- [ ] **Step 6: Vérifier**

Run: `pnpm run build && pnpm test -- admin.service permissions roles.service`
Expected: build OK (les 48 sites compilent avec la nouvelle signature ; aucun import résiduel de `./rbac`), specs PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(rbac): guard sur permissions fines + re-annotation des 48 gardes + verrou users.ban"
```

---

### Task 6 : `RolesController` (endpoints) + DTOs + bascule grant/revoke sur `roleId`

**Files:**
- Create: `src/admin/roles.controller.ts`
- Create: `src/admin/dto/role.dto.ts`
- Modify: `src/admin/admin.module.ts` (déclarer `RolesController`)
- Modify: `src/admin/dto/admin-role.dto.ts` (Grant sur `roleId` ; retirer `ChangeAdminRoleDto`)
- Modify: `src/admin/admin-growth.controller.ts` (retirer `changeAdminRole` ; grant sur `roleId`)
- Modify: `src/admin/admin-growth.service.ts` (grant/revoke sur nouveau modèle)
- Modify: `src/admin/roles.service.ts` (ajouter `assertNotLastManager` public)

**Interfaces:**
- Consumes: `RolesService` (T4) ; `PERMISSION_CATALOG` (T1).
- Produces (endpoints, préfixe `/admin`) : `GET permissions`, `GET roles`, `POST roles`, `PATCH roles/:id`, `DELETE roles/:id`, `PATCH admins/:id/role`, `PATCH admins/:id/overrides`.

- [ ] **Step 1: Écrire les DTOs `src/admin/dto/role.dto.ts`**

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty() @IsString() @Length(2, 60) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 255) description?: string;
  @ApiProperty({ type: [String] }) @IsArray() @ArrayUnique() @IsString({ each: true }) permissions!: string[];
  @ApiPropertyOptional({ description: 'Cloner depuis ce rôle' }) @IsOptional() @IsUUID() fromRoleId?: string;
}

export class UpdateRoleDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(2, 60) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 255) description?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayUnique() @IsString({ each: true }) permissions?: string[];
}

export class AssignRoleDto {
  @ApiProperty() @IsUUID() roleId!: string;
}

export class SetOverridesDto {
  @ApiProperty({ type: [String] }) @IsArray() @ArrayUnique() @IsString({ each: true }) granted!: string[];
  @ApiProperty({ type: [String] }) @IsArray() @ArrayUnique() @IsString({ each: true }) revoked!: string[];
}
```

- [ ] **Step 2: Écrire `src/admin/roles.controller.ts`**

Reprendre **à l'identique** les décorateurs de classe d'`AdminController` (les mêmes `@UseGuards(...)`, `@Roles(Role.ADMIN)`, `@ApiTags`, `@Controller('admin')`, `@ApiBearerAuth` — les lire dans `admin.controller.ts` et les copier).

```typescript
// ... imports NestJS + guards identiques à admin.controller.ts ...
import { AdminPermGuard, RequirePerm } from './rbac.guard';
import { RolesService } from './roles.service';
import { GetCurrentUser } from 'src/common/decorators';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto, SetOverridesDto } from './dto/role.dto';

// @UseGuards(...même pile qu'AdminController...) @Roles(Role.ADMIN) @Controller('admin')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @RequirePerm('admins.view')
  @Get('permissions')
  getPermissions() { return this.roles.getCatalog(); }

  @RequirePerm('admins.view')
  @Get('roles')
  listRoles() { return this.roles.listRoles(); }

  @RequirePerm('admins.manage')
  @Post('roles')
  createRole(@Body() dto: CreateRoleDto, @GetCurrentUser('sub') actorId: string) {
    return this.roles.createRole(dto, actorId);
  }

  @RequirePerm('admins.manage')
  @Patch('roles/:id')
  updateRole(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto, @GetCurrentUser('sub') actorId: string) {
    return this.roles.updateRole(id, dto, actorId);
  }

  @RequirePerm('admins.manage')
  @Delete('roles/:id')
  deleteRole(@Param('id', ParseUUIDPipe) id: string, @GetCurrentUser('sub') actorId: string) {
    return this.roles.deleteRole(id, actorId);
  }

  @RequirePerm('admins.manage')
  @Patch('admins/:id/role')
  assignRole(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignRoleDto, @GetCurrentUser('sub') actorId: string) {
    return this.roles.assignRole(id, dto.roleId, actorId);
  }

  @RequirePerm('admins.manage')
  @Patch('admins/:id/overrides')
  setOverrides(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetOverridesDto, @GetCurrentUser('sub') actorId: string) {
    return this.roles.setOverrides(id, dto, actorId);
  }
}
```

- [ ] **Step 3: Déclarer le contrôleur dans `src/admin/admin.module.ts`**

```typescript
  controllers: [AdminController, AdminGrowthController, RolesController],
```
(import `import { RolesController } from './roles.controller';`)

- [ ] **Step 4: Adapter `src/admin/dto/admin-role.dto.ts`**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GrantAdminDto {
  @ApiProperty({ description: "ID de l'utilisateur à promouvoir administrateur" })
  @IsUUID()
  userId!: string;

  @ApiProperty({ description: "ID du rôle admin (AdminRoleDef) à attribuer" })
  @IsUUID()
  roleId!: string;
}
```
(Supprimer `ChangeAdminRoleDto` — l'assignation de rôle passe désormais par `AssignRoleDto`/`RolesController`.)

- [ ] **Step 5: Ajouter `assertNotLastManager` public à `src/admin/roles.service.ts`**

```typescript
  /** Anti-lockout : refuse si retirer cet admin laisserait 0 gestionnaire. */
  async assertNotLastManager(userId: string): Promise<void> {
    await this.assertKeepsAManager(userId, false);
  }
```

- [ ] **Step 6: Adapter `src/admin/admin-growth.service.ts`**

`grantAdmin` prend désormais `roleId` et vérifie l'existence du rôle :

```typescript
async grantAdmin(userId: string, roleId: string, actorId: string) {
  const target = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!target) throw new NotFoundException('Utilisateur introuvable');
  if (target.role === 'ADMIN') throw new BadRequestException('Cet utilisateur est déjà administrateur.');
  const role = await this.prisma.adminRoleDef.findUnique({ where: { id: roleId }, select: { id: true } });
  if (!role) throw new NotFoundException('Rôle introuvable');

  const updated = await this.prisma.user.update({
    where: { id: userId },
    data: { role: 'ADMIN', adminRoleId: roleId, adminRole: null, permGranted: [], permRevoked: [] },
    select: { id: true, prenom: true, nom: true, email: true, adminRoleId: true },
  });
  await this.prisma.logActivite.create({ data: { userId: actorId, action: 'ADMIN_GRANT', entite: 'user', entiteId: userId, metadata: { roleId } } });
  return updated;
}
```

`revokeAdmin` : remplacer l'ancien contrôle `countSuperAdmins` par l'anti-lockout effectif via `RolesService` (injecter `RolesService` dans le constructeur d'`AdminGrowthService`) :

```typescript
async revokeAdmin(targetId: string, actorId: string) {
  const target = await this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true, role: true } });
  if (!target || target.role !== 'ADMIN') throw new NotFoundException('Administrateur introuvable');
  await this.roles.assertNotLastManager(targetId);
  const updated = await this.prisma.user.update({
    where: { id: targetId },
    data: { role: 'CLIENT', adminRole: null, adminRoleId: null, permGranted: [], permRevoked: [] },
    select: { id: true },
  });
  await this.prisma.logActivite.create({ data: { userId: actorId, action: 'ADMIN_REVOKE', entite: 'user', entiteId: targetId } });
  return updated;
}
```

Supprimer la méthode `changeAdminRole` et l'ancien helper `countSuperAdmins` s'il n'est plus utilisé ailleurs (grep pour confirmer). Enrichir `getAdmins()` pour sélectionner `adminRoleId`, la relation `adminRoleRef: { select: { id: true, name: true } }`, `permGranted`, `permRevoked` (utile à l'écran A3) — conserver le reste tel quel.

- [ ] **Step 7: Adapter `src/admin/admin-growth.controller.ts`**

- Retirer la méthode/route `changeAdminRole` (`Patch admins/:id/role`) — déplacée dans `RolesController`.
- `grantAdmin` passe `dto.roleId` : `return this.growth.grantAdmin(dto.userId, dto.roleId, actorId);`
- Retirer l'import de `ChangeAdminRoleDto`.

- [ ] **Step 8: Mettre à jour les specs impactées**

Si `admin-growth.service.spec.ts` existe et teste grant/revoke/changeAdminRole : adapter les mocks (ajouter `adminRoleDef.findUnique` ; provider mock `RolesService` avec `assertNotLastManager: jest.fn().mockResolvedValue(undefined)` ; retirer les tests de `changeAdminRole`). Sinon, ignorer.

- [ ] **Step 9: Vérifier**

Run: `pnpm run build && pnpm test`
Expected: build OK, suite verte.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(rbac): endpoints roles/permissions/surcharges + grant/revoke sur roleId"
```

---

### Task 7 : Enrichir `/users/me` avec `adminPermissions` + `adminRoleName`

**Files:**
- Modify: `src/users/user.service.ts`
- Modify: `src/users/dto/get-profile.response.dto.ts`
- Test: `src/users/user.service.spec.ts`

**Interfaces:**
- Consumes: `resolveEffectivePermissions`, `toPermissionList` (T2, import pur cross-module — pas de DI).
- Produces: réponse `/users/me` avec `adminRoleName: string | null` et `adminPermissions: string[]` (permissions effectives, `*` développé). Le front A2 consomme ce champ comme source unique (pas de recopie de logique).

- [ ] **Step 1: Écrire le test qui échoue** — ajouter à `src/users/user.service.spec.ts`

```typescript
it('getProfile expose les permissions effectives pour un admin (wildcard développé)', async () => {
  mockPrisma.user.findUnique.mockResolvedValue({
    id: 'a1', email: 'admin@x.io', nom: 'A', prenom: 'B', telephone: null,
    dateNaissance: null, sexe: null, ville: null, quartier: null, adressePrincipale: null, photoUrl: null,
    role: 'ADMIN', adminRole: null, statut: 'ACTIF', emailVerified: true, mfaEnabled: false,
    createdAt: new Date(), updatedAt: new Date(),
    adminRoleId: 'r1', permGranted: [], permRevoked: [],
    adminRoleRef: { name: 'SUPER_ADMIN', permissions: ['*'] },
  });
  const res = await service.getProfile('a1');
  expect(res.adminRoleName).toBe('SUPER_ADMIN');
  expect(res.adminPermissions).toContain('admins.manage');
  expect(res.adminPermissions).toContain('finances.refund');
});

it('getProfile : un client a adminPermissions vide', async () => {
  mockPrisma.user.findUnique.mockResolvedValue({
    id: 'c1', email: 'c@x.io', nom: null, prenom: null, telephone: null,
    dateNaissance: null, sexe: null, ville: null, quartier: null, adressePrincipale: null, photoUrl: null,
    role: 'CLIENT', adminRole: null, statut: 'ACTIF', emailVerified: true, mfaEnabled: false,
    createdAt: new Date(), updatedAt: new Date(),
    adminRoleId: null, permGranted: [], permRevoked: [], adminRoleRef: null,
  });
  const res = await service.getProfile('c1');
  expect(res.adminPermissions).toEqual([]);
  expect(res.adminRoleName).toBeNull();
});
```
(Adapter les champs du mock à ceux réellement listés dans `USER_PROFILE_SELECT` si l'un manque.)

- [ ] **Step 2: Lancer → échec** — `pnpm test -- user.service` → FAIL.

- [ ] **Step 3: Ajouter les champs au DTO `src/users/dto/get-profile.response.dto.ts`**

Après le champ `adminRole` :
```typescript
  @ApiPropertyOptional({ description: "Nom du rôle admin assigné (null hors ADMIN)", nullable: true })
  adminRoleName?: string | null;

  @ApiProperty({ description: 'Permissions effectives de l\'admin (vide hors ADMIN)', type: [String] })
  adminPermissions: string[];
```

- [ ] **Step 4: Étendre `USER_PROFILE_SELECT` et transformer dans `getProfile` (`src/users/user.service.ts`)**

Ajouter au `USER_PROFILE_SELECT` (à côté de `adminRole: true`) :
```typescript
  adminRoleId: true,
  permGranted: true,
  permRevoked: true,
  adminRoleRef: { select: { name: true, permissions: true } },
```

Adapter `getProfile` :
```typescript
import { resolveEffectivePermissions, toPermissionList } from 'src/admin/permissions.resolve';

async getProfile(userId: string): Promise<GetProfileResponseDto> {
  const user = await this.prisma.user.findUnique({ where: { id: userId }, select: this.USER_PROFILE_SELECT });
  if (!user) throw new NotFoundException('Profil utilisateur non trouvé');

  const { adminRoleRef, permGranted, permRevoked, adminRoleId: _rid, ...rest } = user;
  const adminPermissions = toPermissionList(
    resolveEffectivePermissions({
      role: rest.role, adminRole: rest.adminRole,
      roleDefPermissions: adminRoleRef?.permissions ?? null,
      granted: permGranted ?? [], revoked: permRevoked ?? [],
    }),
  );
  return { ...rest, adminRoleName: adminRoleRef?.name ?? null, adminPermissions };
}
```
(Si `USER_PROFILE_SELECT` est défini `as const` au niveau module et non `this.`, référencer le même symbole.)

- [ ] **Step 5: Lancer → succès** — `pnpm test -- user.service` → PASS ; `pnpm run build` → OK.

- [ ] **Step 6: Commit**

```bash
git add src/users/user.service.ts src/users/dto/get-profile.response.dto.ts src/users/user.service.spec.ts
git commit -m "feat(rbac): /users/me expose adminPermissions + adminRoleName"
```

---

## Recette finale Phase A1

- [ ] `pnpm run build` vert ; `pnpm test` vert (specs catalogue, résolveur, roles.service, admin.service, user.service).
- [ ] **Boot smoke** : `pnpm run start:dev` démarre sans erreur DI ; au démarrage, `RolesService.onModuleInit` a seedé 4 lignes dans `admin_role_defs` et backfillé `admin_role_id` des admins existants (vérifier en base : `SELECT name, is_builtin FROM admin_role_defs;` → 4 rôles ; `SELECT count(*) FROM users WHERE role='ADMIN' AND admin_role_id IS NULL;` → 0).
- [ ] **Non-régression comportement** : un admin SUPER_ADMIN garde l'accès total ; un compte rattaché à MODERATEUR/SUPPORT/FINANCE conserve exactement ses accès d'avant (les endpoints gardés répondent 200/403 comme avant migration).
- [ ] **Granularité** : `GET /admin/permissions` renvoie le catalogue ; création d'un rôle custom (ou clone d'un built-in) via `POST /admin/roles` ; `PATCH /admin/roles/:id` refuse un built-in (403) ; assignation via `PATCH /admin/admins/:id/role` ; surcharge via `PATCH /admin/admins/:id/overrides` ; `/users/me` reflète les permissions effectives.
- [ ] **Anti-lockout** : impossible de retirer `admins.manage` au dernier gestionnaire (403) ; impossible de révoquer/rétrograder le dernier gestionnaire.
- [ ] **Sécurité** : aucun secret/donnée sensible commité ni poussé.

## Suite

Phase **A2** (front : `rbac.ts` sur clés, nav, PermGuard, gates UI consommant `me.adminPermissions`) et **A3** (écran de gestion : matrice rôles, surcharges par admin, journal) — chacune aura son propre plan.
