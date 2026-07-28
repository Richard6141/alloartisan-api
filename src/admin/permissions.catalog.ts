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
