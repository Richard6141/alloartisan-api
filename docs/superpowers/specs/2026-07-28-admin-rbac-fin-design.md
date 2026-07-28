# RBAC admin fin — permissions granulaires, rôles configurables, surcharges

Date : 2026-07-28
Statut : validé (direction) — spec de référence
Portée : cross-repo `alloartisan-api` (moteur) + `alloartisan-admin` (front + UI de gestion)

## 1. Objectif

Remplacer le RBAC actuel (4 rôles fixes × 13 sections × `none/read/write`, codé en dur) par un
modèle **unifié à permissions granulaires** :
- **Actions fines** (`valider`, `suspendre`, `bannir`, `rembourser`, `diffuser`, `exporter`, `gérer`…)
  au lieu du seul `write`.
- **Rôles configurables stockés en base** (au-delà des 4 rôles codés).
- **Surcharges par admin** (accorder/retirer des permissions précises à un admin donné).
- **Écran de gestion clair** (matrice visuelle rôles × permissions, surcharges, journal).

**Décisions validées** : approche unifiée (clé `ressource.action`) ; les **4 rôles built-in sont
VERROUILLÉS** (non éditables) mais **CLONABLES** pour créer des rôles custom ; migration **sans
lockout** et **sans changement de comportement**.

## 2. Modèle de permissions

Une permission = une clé **`ressource.action`**. Catalogue (source de vérité, backend) :

| Ressource | Actions |
|---|---|
| dashboard | `view` |
| users | `view` `edit` `suspend` `ban` `export` |
| artisans | `view` `edit` `validate` `reject` `export` |
| bookings | `view` `export` |
| express | `view` `export` |
| maindoeuvre | `view` `export` |
| ambassadeurs | `view` `export` |
| finances | `view` `refund` `export` |
| avis | `view` `moderate` |
| metiers | `view` `manage` |
| diffusion | `view` `broadcast` |
| audit | `view` |
| admins | `view` `manage` |

- Clé spéciale **`*`** = toutes les permissions (super-admin).
- `.export` gate surtout le **bouton d'export** côté front (l'export CSV réutilise l'endpoint de
  liste, garde `.view`) ; si un endpoint d'export serveur existe, il est gardé par `.export`.
- Le catalogue (ressources + actions + libellés FR) est exposé par `GET /admin/permissions` pour
  piloter l'UI et garantir front/back synchronisés.

## 3. Données (Prisma) + migration

### 3.1 Schéma
- Nouvelle table **`AdminRoleDef`** :
  `id (uuid)`, `name (unique)`, `description?`, `isBuiltin Boolean @default(false)`,
  `permissions String[]` (clés du catalogue), `createdAt`, `updatedAt`.
- Sur `User` (ajouts, nullable) :
  - `adminRoleId String?` → FK `AdminRoleDef.id` (rôle assigné).
  - `permGranted String[] @default([])` (surcharges : clés accordées en plus du rôle).
  - `permRevoked String[] @default([])` (surcharges : clés retirées du rôle).
- On **conserve** la colonne enum `adminRole` (compat/rollback) le temps de la bascule ; elle n'est
  plus la source d'autorité une fois `adminRoleId` renseigné.

### 3.2 Résolution des permissions effectives
```
effective(user):
  if user.role != ADMIN → aucune permission admin
  base = role.permissions (via adminRoleId) OU, si adminRoleId null,
         permissions du built-in correspondant à l'ancien enum adminRole
         (legacy null → SUPER_ADMIN)
  if base contient '*' → toutes (court-circuit)
  return (base ∪ permGranted) − permRevoked
```
`can(user, 'users.suspend')` = `'*' ∈ eff || 'users.suspend' ∈ eff`.

### 3.3 Migration / seed (sans lockout, sans changement de comportement)
- Migration Prisma : `CREATE TABLE AdminRoleDef` + colonnes `User.adminRoleId/permGranted/permRevoked`.
- **Seed des 4 rôles built-in** (`isBuiltin = true`), dérivés fidèlement de la matrice actuelle
  (`write` d'une section → TOUTES ses actions fines ; `read` → `.view`) :
  - **SUPER_ADMIN** = `['*']`
  - **MODERATEUR** = dashboard.view, users.{view,edit,suspend,ban,export}, artisans.{view,edit,validate,reject,export}, bookings.view, express.view, maindoeuvre.view, ambassadeurs.view, avis.{view,moderate}, metiers.{view,manage}, diffusion.{view,broadcast}, audit.view
  - **SUPPORT** = dashboard.view, users.{view,edit,suspend,ban,export}, artisans.view, bookings.view, express.view, maindoeuvre.view, ambassadeurs.view, avis.view, audit.view
  - **FINANCE** = dashboard.view, bookings.view, ambassadeurs.view, finances.{view,refund,export}, audit.view
- **Rattachement des admins existants** : `UPDATE users SET admin_role_id = (built-in correspondant à admin_role)`. Les legacy `admin_role IS NULL` → rôle SUPER_ADMIN. **Aucun admin ne perd d'accès.**
- Les 4 built-in sont **verrouillés** (`isBuiltin`) : non éditables/supprimables ; **clonables** (crée un rôle custom `isBuiltin=false` pré-rempli).

## 4. Backend — gardes & endpoints

### 4.1 Décorateur & guard
- `@RequirePerm(key)` prend désormais une **clé fine** (ex. `@RequirePerm('artisans.validate')`).
- Ré-annoter les ~48 `@RequirePerm(section, 'read'|'write')` existants vers la bonne clé :
  `read` → `<section>.view` ; `write` → l'action fine réelle de l'endpoint. Exemples :
  - artisans `verify` → `artisans.validate` ; `reject` → `artisans.reject` ; `DELETE`/edit → `artisans.edit`
  - users `PATCH statut` (suspend/ban) → `users.suspend` (et `users.ban` pour BANNI si séparé au niveau service ; sinon `users.suspend` couvre statut, à trancher en plan) ; edit → `users.edit`
  - avis `moderate` → `avis.moderate` ; metiers create/valider/edit/delete → `metiers.manage`
  - diffusion broadcast → `diffusion.broadcast` ; finances remboursement → `finances.refund`
  - admins (grant/role/revoke/roles CRUD) → `admins.manage` ; listes admin → `admins.view`
- `AdminPermGuard` : lit l'admin en base à chaque requête (comme aujourd'hui), calcule les
  permissions effectives (§3.2), autorise si la clé requise y est (ou `*`).
- **Defense-in-depth cross-module** préservée (artisans/avis/metiers controllers hors AdminModule
  gardés par les clés fines correspondantes).

### 4.2 Endpoints (gardés par `admins.manage`, sauf lecture par `admins.view`)
- `GET /admin/permissions` — catalogue (ressources, actions, libellés FR).
- `GET /admin/roles` — rôles (built-in + custom) avec leurs permissions.
- `POST /admin/roles` — créer un rôle custom (ou **cloner** un rôle : `{ name, description?, fromRoleId? , permissions[] }`).
- `PATCH /admin/roles/:id` — éditer nom/description/permissions d'un rôle **custom** (refus 409 si `isBuiltin`).
- `DELETE /admin/roles/:id` — supprimer un rôle **custom** (refus si built-in ou si assigné à des admins → 409 avec le compte).
- `PATCH /admin/admins/:id/role` — assigner un `adminRoleId`.
- `PATCH /admin/admins/:id/overrides` — définir `permGranted[]` / `permRevoked[]`.
- Les endpoints existants `grant/role/revoke` s'adaptent au nouveau modèle.
- **Anti-lockout** : refuser toute opération qui retirerait le dernier accès `admins.manage`
  (dernier super-admin effectif). Toute mutation est **journalisée** (LogActivite : ancien→nouveau).

## 5. Frontend

### 5.1 Modèle & gates
- `src/lib/rbac.ts` : `Permission` (type union des clés) ; `can(perm)` basé sur les permissions
  effectives de l'utilisateur (renvoyées par `/users/me` : `adminPermissions: string[]`, déjà
  résolues côté serveur → le front n'a PAS à recopier la logique). `usePerm().can('users.suspend')`.
- **Nav** : `sectionForPath` + filtrage → `<section>.view`.
- **PermGuard** (route) → `<section>.view`.
- **Tous les gates UI** : boutons Valider/Rejeter/Suspendre/Bannir/Rembourser/Diffuser/Modérer/
  Exporter/Gérer conditionnés à leur clé fine (`can('artisans.validate')`, etc.).
- `/users/me` renvoie `adminPermissions: string[]` (permissions effectives) + `adminRoleName`.

### 5.2 Écran de gestion (page **Comptes admin** enrichie / nouvelle page **Rôles**)
- **Rôles** : liste (built-in badgés « verrouillé », custom éditables) ; création/édition avec une
  **matrice visuelle** ressources (lignes) × actions (colonnes) à cocher ; bouton **Cloner** sur un
  built-in ; suppression d'un rôle custom (bloquée s'il est assigné).
- **Par admin** : sélection du rôle + **interrupteurs de surcharge** (accordé/retiré) par
  permission, avec un rendu clair de la permission **effective** (rôle vs surcharge).
- **Journal** : historique des changements de rôles/permissions (depuis l'audit).
- Tout est gardé par `admins.manage` (édition) / `admins.view` (lecture).

## 6. Découpage en phases (chacune livrable/déployable)

- **A1 — Moteur backend** : catalogue + schéma Prisma + migration/seed + guard/résolution +
  ré-annotation des gardes + endpoints permissions/rôles/surcharges + `/users/me` enrichi.
- **A2 — Front : modèle & gates** : `rbac.ts` sur clés, nav, PermGuard, tous les gates UI.
- **A3 — Écran de gestion** : matrice rôles + surcharges par admin + journal.

Chaque phase = son plan d'implémentation + exécution sous-agents.

## 7. Sécurité, invariants, hors-périmètre

- **Sans lockout** : toujours ≥ 1 super-admin effectif ; un admin ne peut pas s'auto-retirer
  `admins.manage`.
- **Sans changement de comportement à la migration** : les 4 rôles seedés reproduisent la matrice
  actuelle à l'identique.
- **Journalisation** de toute mutation de rôle/permission (audit).
- **Hors-périmètre** : permissions au niveau enregistrement (record-level), permissions par
  ressource individuelle (ex. « ce booking précis »), rôles côté app mobile (client/artisan
  inchangés), 2FA/gestion de session.

## 8. Critères de succès

- Un super-admin peut : créer un rôle custom (ou cloner un built-in), cocher précisément ses
  permissions, l'assigner à un admin, et surcharger un admin ponctuellement — le tout reflété
  immédiatement (nav, gates, gardes serveur).
- Les 4 rôles built-in restent verrouillés ; aucun admin existant ne perd d'accès après migration.
- Chaque action sensible (valider, suspendre, bannir, rembourser, diffuser…) est gardée
  indépendamment, côté serveur ET masquée côté UI selon la permission.
- `tsc` + build verts (front) ; API boote, migration `deploy` OK, health 200.

## 9. Risques

- **Ré-annotation des ~48 gardes** : risque d'erreur de mapping → chaque endpoint mappé
  explicitement dans le plan A1, revue par tâche.
- **Migration prod** : seed + rattachement dans la même migration ; vérifier no-lockout avant/après.
- **Sync front/back** du catalogue : le front consomme `/admin/permissions` et
  `me.adminPermissions` (permissions résolues serveur) → pas de double source de vérité.
