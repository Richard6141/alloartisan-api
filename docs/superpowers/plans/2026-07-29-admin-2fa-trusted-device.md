# 2FA admin par code email + appareil de confiance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** À la connexion d'un admin depuis un nouvel appareil OU une nouvelle IP, exiger un code à 6 chiffres envoyé par email ; mémoriser l'appareil de confiance 30 jours. Le TOTP existant et les non-admins restent inchangés.

**Architecture:** Réutiliser l'infra existante — `OtpService` (code email, type `TWO_FACTOR_AUTH`), `EmailService` (Resend), `JwtService` (verify_token court, comme le `mfa_token`), `extractDeviceInfo` (ip/userAgent/`x-device-id`). Nouvelle table `TrustedDevice`. Branche dans `auth.service.login` (admin sans TOTP + appareil non de confiance → code) + nouvel endpoint `POST /auth/login/verify`. Front : header `x-device-id` persistant + étape « code email ».

**Tech Stack:** NestJS 11, Prisma 7 (postgres, client `src/generated/prisma`), Jest, pnpm (API). Next 16 export statique, npm (admin).

## Global Constraints

- **Périmètre admins uniquement** (`user.role === 'ADMIN'`). Clients/artisans (mobile) : flux **inchangé**.
- **TOTP inchangé** : si `user.mfaEnabled && user.mfaSecret` → flux `mfa_required` actuel, AVANT toute logique email (la branche email ne s'exécute que pour les admins SANS TOTP).
- **Déclencheur** = appareil non de confiance **OU** IP différente de celle mémorisée pour cet appareil.
- **Confiance = 30 jours** (`trustedUntil = now + 30j`).
- **Code** : `OtpService` (6 chiffres, TTL 600s/10min, haché en Redis, max 3 tentatives intégré). Type = **`OtpType.TWO_FACTOR_AUTH`** (existe déjà — ne PAS ajouter de valeur d'enum).
- **`verify_token`** : JWT signé `JWT_ACCESS_SECRET`, `expiresIn: 60*10` (10 min), payload `{ sub, deviceId, type: 'login_verify' }` (miroir du `mfa_token`). Le `x-device-id` de `/verify` doit correspondre au `deviceId` du token.
- **Sécurité** : throttle sur les endpoints (comme login/mfa) ; email d'alerte « nouvelle connexion » ; audit `LogActivite` (`LOGIN_VERIFY_SENT`/`LOGIN_VERIFY_OK`) ; `email_masked` seulement (jamais l'email complet ni le code en réponse) ; break-glass = insertion manuelle `TrustedDevice`.
- **Migration additive** (`TrustedDevice`) ; `migration.sql` gitignorée (déploiement prod par tar + `prisma migrate deploy`, cf. [[alloartisan-rbac-fin]]).
- Vérif par tâche : `pnpm run build` + specs concernées vertes (API) ; `npx tsc --noEmit && npm run build` (admin). Fin de commit : `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Commitlint API : sujet < 100 car., sans parenthèses.
- **Ne jamais pousser d'info sensible sur un dépôt distant.**

## Structure des fichiers

**Backend (`alloartisan-api`)**
- **Modify** `prisma/schema.prisma` — modèle `TrustedDevice` + relation User + migration. (T1)
- **Modify** `src/common/services/email.service.ts` — `sendLoginCodeEmail`, `sendNewLoginAlertEmail`. (T2)
- **Modify** `src/auth/auth.service.ts` — `isTrustedDevice`, `trustDevice`, branche login admin, `verifyLoginCode`, `resendLoginCode`, `maskEmail`. (T3)
- **Modify** `src/auth/auth.controller.ts` + **Create** DTOs — endpoints `/auth/login/verify`, `/auth/login/verify/resend`. (T3)
- **Modify** `src/auth/types/tokens.type.ts` — `LoginVerifyRequiredResponse` + union. (T3)
- Test: `src/auth/auth.service.spec.ts`. (T3)

**Frontend (`alloartisan-admin`)**
- **Create** `src/lib/device.ts` — `getDeviceId()`. **Modify** `src/lib/api.ts` — header `x-device-id`. (T4)
- **Modify** `src/lib/auth.tsx` — login 3 issues + `verifyLoginCode` + `resendLoginCode`. (T4)
- **Modify** `src/app/login/page.tsx` — étape « code email ». (T5)

---

### Task 1 : Table `TrustedDevice` (Prisma + migration)

**Files:** Modify `prisma/schema.prisma` ; Create `prisma/migrations/<ts>_trusted_device/migration.sql`.

**Interfaces:** Produces le modèle `TrustedDevice` (`userId_deviceId` unique) + client régénéré (`prisma.trustedDevice`).

- [ ] **Step 1: Ajouter le modèle** (près du modèle `User`, en suivant le patron `FcmToken`) :

```prisma
/// Appareil de confiance pour la 2FA admin (email OTP par nouvel appareil/IP).
model TrustedDevice {
  id           String   @id @default(uuid()) @db.VarChar(36)
  userId       String   @map("user_id") @db.VarChar(36)
  deviceId     String   @map("device_id") @db.VarChar(100)
  ipAddress    String?  @map("ip_address") @db.VarChar(45)
  userAgent    String?  @map("user_agent") @db.Text
  deviceLabel  String?  @map("device_label") @db.VarChar(120)
  trustedUntil DateTime @map("trusted_until") @db.Timestamptz
  lastSeenAt   DateTime @default(now()) @map("last_seen_at") @db.Timestamptz
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, deviceId])
  @@index([userId], name: "idx_trusted_device_user")
  @@map("trusted_devices")
}
```
Et ajouter au modèle `User` la relation inverse : `trustedDevices TrustedDevice[]`.

- [ ] **Step 2: Générer + appliquer la migration**

Run: `pnpm exec prisma migrate dev --name trusted_device` (crée + applique sur la DB dev). Puis `pnpm exec prisma generate`.
Expected: migration additive (CREATE TABLE trusted_devices + FK). Aucune donnée à backfiller.

- [ ] **Step 3: Exposer le modèle sur `PrismaService`** si le wrapper expose les modèles par getter (cf. `src/prisma/prisma.service.ts` — le pattern `get adminRoleDef()`). Ajouter :
```typescript
  get trustedDevice() {
    return this.client.trustedDevice;
  }
```
(Vérifier d'abord si `PrismaService` étend `PrismaClient` ou wrappe un `client` — s'il étend, cette étape est inutile ; lire le fichier.)

- [ ] **Step 4: Vérifier** — `pnpm run build` → OK (client typé avec `trustedDevice`).

- [ ] **Step 5: Commit**
```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(auth): table TrustedDevice pour la 2FA email admin"
```

---

### Task 2 : Emails — code de connexion + alerte nouvelle connexion

**Files:** Modify `src/common/services/email.service.ts`.

**Interfaces:**
- Produces: `sendLoginCodeEmail(to: string, otpCode: string): Promise<boolean>` ; `sendNewLoginAlertEmail(to: string, info: { deviceLabel: string; ip: string; date: string }): Promise<boolean>`.
- Consumes: le `sendEmail(to, subject, html)` existant + le style HTML des méthodes existantes (`getVerificationEmailHtml`).

- [ ] **Step 1: Ajouter les deux méthodes** (mirroir de `sendVerificationEmail`/`sendPasswordResetEmail`, même style HTML — bandeau navy, code en gros avec `letter-spacing`) :

```typescript
async sendLoginCodeEmail(to: string, otpCode: string): Promise<boolean> {
  const subject = 'Votre code de connexion AlloArtisan Admin';
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f6fb;padding:24px">
    <div style="max-width:480px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#14294d;color:#fff;padding:20px 24px;font-size:18px;font-weight:bold">AlloArtisan · Console d'administration</div>
      <div style="padding:24px">
        <p style="color:#111827">Une connexion à votre compte administrateur a été demandée depuis un nouvel appareil.</p>
        <p style="color:#374151">Votre code de vérification (valable 10 minutes) :</p>
        <div style="text-align:center;margin:20px 0">
          <span style="display:inline-block;background:#14294d;color:#fff;font-size:30px;font-weight:bold;letter-spacing:8px;padding:16px 28px;border-radius:8px">${otpCode}</span>
        </div>
        <p style="color:#6b7280;font-size:13px">Si vous n'êtes pas à l'origine de cette connexion, ignorez cet email et changez votre mot de passe.</p>
      </div>
    </div></body></html>`;
  const sent = await this.sendEmail(to, subject, html);
  if (!sent && process.env.NODE_ENV !== 'production') {
    this.logger.warn(`[DEV] Code de connexion pour ${to} : ${otpCode}`);
  }
  return sent;
}

async sendNewLoginAlertEmail(
  to: string,
  info: { deviceLabel: string; ip: string; date: string },
): Promise<boolean> {
  const subject = 'Nouvelle connexion à votre compte AlloArtisan Admin';
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f6fb;padding:24px">
    <div style="max-width:480px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#14294d;color:#fff;padding:20px 24px;font-size:18px;font-weight:bold">AlloArtisan · Sécurité</div>
      <div style="padding:24px;color:#374151">
        <p>Une nouvelle connexion à votre compte administrateur vient d'être validée :</p>
        <ul style="line-height:1.8">
          <li>Appareil : <b>${info.deviceLabel}</b></li>
          <li>Adresse IP : <b>${info.ip}</b></li>
          <li>Date : <b>${info.date}</b></li>
        </ul>
        <p style="color:#6b7280;font-size:13px">Si ce n'était pas vous, changez votre mot de passe immédiatement.</p>
      </div>
    </div></body></html>`;
  return this.sendEmail(to, subject, html);
}
```

- [ ] **Step 2: Vérifier** — `pnpm run build` → OK.

- [ ] **Step 3: Commit**
```bash
git add src/common/services/email.service.ts
git commit -m "feat(auth): emails code de connexion + alerte nouvelle connexion"
```

---

### Task 3 : Moteur backend — branche login admin + verify/resend + endpoints

**Files:** Modify `src/auth/auth.service.ts`, `src/auth/auth.controller.ts`, `src/auth/types/tokens.type.ts` ; Create `src/auth/dto/verify-login.dto.ts` ; Test `src/auth/auth.service.spec.ts`.

**Interfaces:**
- Consumes: `OtpService.create/verify` (type `OtpType.TWO_FACTOR_AUTH`), `EmailService.sendLoginCodeEmail`/`sendNewLoginAlertEmail` (T2), `JwtService`, `prisma.trustedDevice` (T1), `DeviceInfo`, `createSession`.
- Produces: `login()` renvoie aussi `LoginVerifyRequiredResponse` ; `verifyLoginCode(verifyToken, code, deviceInfo)` ; `resendLoginCode(verifyToken)` ; endpoints `POST /auth/login/verify`, `POST /auth/login/verify/resend`.

- [ ] **Step 1: Types (`src/auth/types/tokens.type.ts`)** — ajouter :
```typescript
export class LoginVerifyRequiredResponse {
  @ApiProperty({ example: true }) verification_required: true;
  @ApiProperty({ description: 'JWT court pour /login/verify' }) verify_token: string;
  @ApiProperty({ example: 'j***@gmail.com' }) email_masked: string;
}
```
Et étendre : `export type LoginResponse = Tokens | MfaRequiredResponse | LoginVerifyRequiredResponse;`

- [ ] **Step 2: DTOs (`src/auth/dto/verify-login.dto.ts`)** :
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsJWT } from 'class-validator';

export class VerifyLoginCodeDto {
  @ApiProperty() @IsJWT() verify_token!: string;
  @ApiProperty({ example: '123456' }) @IsString() @Length(6, 6) code!: string;
}
export class ResendLoginCodeDto {
  @ApiProperty() @IsJWT() verify_token!: string;
}
```
(Exporter aussi via `src/auth/dto/index.ts` s'il existe.)

- [ ] **Step 3: `auth.service.ts` — helpers privés** (ajouter dans la classe) :
```typescript
private maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  const head = name.slice(0, 1);
  return `${head}${'*'.repeat(Math.max(name.length - 1, 1))}@${domain}`;
}

/** Appareil de confiance = ligne (userId, deviceId) non expirée ET même IP. */
private async isTrustedDevice(userId: string, deviceInfo?: DeviceInfo): Promise<boolean> {
  const deviceId = deviceInfo?.deviceId;
  if (!deviceId) return false;
  const td = await this.prisma.trustedDevice.findUnique({
    where: { userId_deviceId: { userId, deviceId } },
  });
  if (!td || td.trustedUntil.getTime() <= Date.now()) return false;
  // "nouvelle IP" : si on a une IP mémorisée et qu'elle diffère → non de confiance
  if (td.ipAddress && deviceInfo?.ipAddress && td.ipAddress !== deviceInfo.ipAddress) return false;
  return true;
}

/** Crée/rafraîchit l'appareil de confiance (30 jours). */
private async trustDevice(userId: string, deviceInfo?: DeviceInfo): Promise<void> {
  const deviceId = deviceInfo?.deviceId;
  if (!deviceId) return;
  const trustedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const label = [deviceInfo?.deviceName, deviceInfo?.deviceType].filter(Boolean).join(' · ') || null;
  await this.prisma.trustedDevice.upsert({
    where: { userId_deviceId: { userId, deviceId } },
    update: { ipAddress: deviceInfo?.ipAddress, userAgent: deviceInfo?.userAgent, deviceLabel: label, trustedUntil, lastSeenAt: new Date() },
    create: { userId, deviceId, ipAddress: deviceInfo?.ipAddress, userAgent: deviceInfo?.userAgent, deviceLabel: label, trustedUntil, lastSeenAt: new Date() },
  });
}

private async signLoginVerifyToken(userId: string, deviceId?: string): Promise<string> {
  return this.jwtService.signAsync(
    { sub: userId, deviceId: deviceId ?? null, type: 'login_verify' },
    { secret: this.config.getOrThrow('JWT_ACCESS_SECRET'), expiresIn: 60 * 10 },
  );
}
```

- [ ] **Step 4: `auth.service.ts` — brancher dans `login()`**

Juste APRÈS la branche TOTP existante (`if (user.mfaEnabled && user.mfaSecret) { … return { mfa_required … }; }`) et AVANT le `update derniereConnexion` + `return this.createSession(...)`, insérer :
```typescript
// 2FA email « appareil de confiance » pour les admins SANS TOTP
if (user.role === 'ADMIN' && !(await this.isTrustedDevice(user.id, deviceInfo))) {
  const code = await this.otpService.create(user.id, OtpType.TWO_FACTOR_AUTH);
  setImmediate(() => {
    void this.emailService.sendLoginCodeEmail(user.email, code);
  });
  const verifyToken = await this.signLoginVerifyToken(user.id, deviceInfo?.deviceId);
  this.prisma.logActivite
    .create({ data: { userId: user.id, action: 'LOGIN_VERIFY_SENT', entite: 'auth', entiteId: user.id, metadata: { ip: deviceInfo?.ipAddress } } })
    .catch(() => undefined);
  return { verification_required: true, verify_token: verifyToken, email_masked: this.maskEmail(user.email) };
}
if (user.role === 'ADMIN') {
  await this.trustDevice(user.id, deviceInfo); // rafraîchit lastSeen sur appareil de confiance
}
```
(Import `OtpType` s'il ne l'est pas déjà.)

- [ ] **Step 5: `auth.service.ts` — `verifyLoginCode` + `resendLoginCode`**
```typescript
async verifyLoginCode(verifyToken: string, code: string, deviceInfo?: DeviceInfo): Promise<Tokens> {
  let payload: { sub: string; deviceId: string | null; type: string };
  try {
    payload = await this.jwtService.verifyAsync(verifyToken, { secret: this.config.getOrThrow('JWT_ACCESS_SECRET') });
  } catch {
    throw new ForbiddenException('Session de vérification expirée. Reconnectez-vous.');
  }
  if (payload.type !== 'login_verify') throw new ForbiddenException('Jeton de vérification invalide');
  // liaison appareil : le x-device-id doit correspondre à celui du token
  if (payload.deviceId && deviceInfo?.deviceId && payload.deviceId !== deviceInfo.deviceId) {
    throw new ForbiddenException('Appareil non concordant');
  }
  const ok = await this.otpService.verify(payload.sub, OtpType.TWO_FACTOR_AUTH, code); // lève si expiré/max tentatives
  if (!ok) throw new ForbiddenException('Code de vérification invalide');

  await this.trustDevice(payload.sub, { ...deviceInfo, deviceId: deviceInfo?.deviceId ?? payload.deviceId ?? undefined });
  const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { email: true } });
  if (user?.email) {
    setImmediate(() => {
      void this.emailService.sendNewLoginAlertEmail(user.email, {
        deviceLabel: [deviceInfo?.deviceName, deviceInfo?.deviceType].filter(Boolean).join(' · ') || 'Appareil inconnu',
        ip: deviceInfo?.ipAddress ?? '—',
        date: new Date().toLocaleString('fr-FR'),
      });
    });
  }
  this.prisma.logActivite
    .create({ data: { userId: payload.sub, action: 'LOGIN_VERIFY_OK', entite: 'auth', entiteId: payload.sub, metadata: { ip: deviceInfo?.ipAddress } } })
    .catch(() => undefined);
  await this.prisma.user.update({ where: { id: payload.sub }, data: { derniereConnexion: new Date() } });
  return this.createSession(payload.sub, deviceInfo);
}

async resendLoginCode(verifyToken: string): Promise<{ ok: true }> {
  let payload: { sub: string; type: string };
  try {
    payload = await this.jwtService.verifyAsync(verifyToken, { secret: this.config.getOrThrow('JWT_ACCESS_SECRET') });
  } catch {
    throw new ForbiddenException('Session de vérification expirée. Reconnectez-vous.');
  }
  if (payload.type !== 'login_verify') throw new ForbiddenException('Jeton de vérification invalide');
  const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { email: true } });
  if (user?.email) {
    const code = await this.otpService.create(payload.sub, OtpType.TWO_FACTOR_AUTH);
    setImmediate(() => { void this.emailService.sendLoginCodeEmail(user.email, code); });
  }
  return { ok: true }; // réponse neutre (ne pas révéler l'existence du compte)
}
```

- [ ] **Step 6: `auth.controller.ts` — endpoints** (Public, throttle comme login/mfa). Ajouter les imports DTO puis :
```typescript
@Public()
@Throttle({ short: { limit: 5, ttl: 900000 } })
@Post('login/verify')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Vérification code email (nouvel appareil admin)' })
verifyLoginCode(@Body() dto: VerifyLoginCodeDto, @Req() req: Request): Promise<Tokens> {
  return this.authService.verifyLoginCode(dto.verify_token, dto.code, this.extractDeviceInfo(req));
}

@Public()
@Throttle({ short: { limit: 3, ttl: 600000 } })
@Post('login/verify/resend')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Renvoyer le code email de connexion' })
resendLoginCode(@Body() dto: ResendLoginCodeDto): Promise<{ ok: true }> {
  return this.authService.resendLoginCode(dto.verify_token);
}
```

- [ ] **Step 7: Tests (`src/auth/auth.service.spec.ts`)** — ajouter au mock Prisma `trustedDevice: { findUnique: jest.fn(), upsert: jest.fn() }` et `logActivite: { create: jest.fn().mockResolvedValue({}) }`, et au mock EmailService `sendLoginCodeEmail`/`sendNewLoginAlertEmail: jest.fn().mockResolvedValue(true)`. Puis :
```typescript
describe('login — 2FA email admin', () => {
  const adminBase = { id: 'a1', email: 'admin@x.io', role: 'ADMIN', statut: 'ACTIF', emailVerified: true, mfaEnabled: false, mfaSecret: null, passwordHash: 'h' };
  beforeEach(() => {
    (argon.verify as jest.Mock) = jest.fn().mockResolvedValue(true);
    mockLoginAttempt.isLocked.mockResolvedValue(false);
    mockLoginAttempt.resetAttempts.mockResolvedValue(undefined);
  });
  it('nouvel appareil admin -> verification_required + code envoyé', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(adminBase);
    mockPrisma.trustedDevice.findUnique.mockResolvedValue(null); // pas de confiance
    mockOtp.create.mockResolvedValue('123456');
    mockJwt.signAsync.mockResolvedValue('vtok');
    const res = await service.login({ email: adminBase.email, password: 'p' } as any, { deviceId: 'd1', ipAddress: '1.2.3.4' });
    expect((res as any).verification_required).toBe(true);
    expect((res as any).email_masked).toContain('@');
    expect(mockEmail.sendLoginCodeEmail).toHaveBeenCalled();
  });
  it('appareil de confiance (même IP, non expiré) -> pas de code, session créée', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(adminBase);
    mockPrisma.trustedDevice.findUnique.mockResolvedValue({ trustedUntil: new Date(Date.now() + 1e6), ipAddress: '1.2.3.4' });
    mockPrisma.trustedDevice.upsert.mockResolvedValue({});
    const res = await service.login({ email: adminBase.email, password: 'p' } as any, { deviceId: 'd1', ipAddress: '1.2.3.4' });
    expect((res as any).access_token).toBeDefined();
    expect(mockEmail.sendLoginCodeEmail).not.toHaveBeenCalled();
  });
  it('IP différente sur appareil connu -> code exigé', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(adminBase);
    mockPrisma.trustedDevice.findUnique.mockResolvedValue({ trustedUntil: new Date(Date.now() + 1e6), ipAddress: '9.9.9.9' });
    mockOtp.create.mockResolvedValue('123456');
    mockJwt.signAsync.mockResolvedValue('vtok');
    const res = await service.login({ email: adminBase.email, password: 'p' } as any, { deviceId: 'd1', ipAddress: '1.2.3.4' });
    expect((res as any).verification_required).toBe(true);
  });
});
```
Adapter les noms de mocks (`mockOtp`, `mockEmail`, `mockJwt`, `mockLoginAttempt`) à ceux réellement utilisés dans le fichier de spec — LIRE la config existante en tête du spec avant d'écrire, réutiliser ses variables. Si `createSession` appelle `getTokens`/`sessionService`, s'assurer que `mockJwt.signAsync` renvoie une string et `mockSession.create` un id (pour que le cas « appareil de confiance » renvoie `access_token`).

- [ ] **Step 8: Vérifier** — `pnpm test -- auth.service` (vert, incl. les 3 nouveaux) puis `pnpm run build`.

- [ ] **Step 9: Commit**
```bash
git add src/auth/auth.service.ts src/auth/auth.controller.ts src/auth/types/tokens.type.ts src/auth/dto/verify-login.dto.ts src/auth/dto/index.ts src/auth/auth.service.spec.ts
git commit -m "feat(auth): 2FA email admin nouvel appareil - login branch + verify/resend"
```

> **Note repo** : les Tasks 4 et 5 sont dans le repo **`alloartisan-admin`** (front), pas `alloartisan-api`. Vérification front = `npx tsc --noEmit && npm run build` (npm, pas de tests). La Task 5 suppose la refonte login (chantier UI) **déjà faite** (elle édite le login refondu).

---

### Task 4 (repo admin) : Device-id persistant + header + `useAuth` 3 issues

**Files:** Create `src/lib/device.ts` ; Modify `src/lib/api.ts`, `src/lib/auth.tsx`.

**Interfaces:**
- Produces: `getDeviceId(): string` ; header `x-device-id` sur toutes les requêtes ; `useAuth().login()` renvoie `void | {mfaRequired,mfaToken} | {verificationRequired, verifyToken, emailMasked}` ; `verifyLoginCode(verifyToken, code)` ; `resendLoginCode(verifyToken)`.

- [ ] **Step 1: `src/lib/device.ts`**
```typescript
const KEY = "aa_admin_device_id";
/** Identifiant d'appareil stable (localStorage) pour la 2FA « appareil de confiance ». */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    localStorage.setItem(KEY, id);
  }
  return id;
}
```

- [ ] **Step 2: `src/lib/api.ts` — header `x-device-id`** dans l'intercepteur de requête existant :
```typescript
import { getDeviceId } from "./device";
// ...
api.interceptors.request.use((cfg) => {
  const t = tokens.getAccess();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  const did = getDeviceId();
  if (did) cfg.headers["x-device-id"] = did;
  return cfg;
});
```
(Le refresh utilise `axios` direct — pas critique d'y ajouter le header.)

- [ ] **Step 3: `src/lib/auth.tsx` — étendre `login` + ajouter `verifyLoginCode`/`resendLoginCode`**

Étendre le type du contexte `Ctx` :
```typescript
  login: (email: string, password: string) => Promise<
    | { mfaRequired: true; mfaToken: string }
    | { verificationRequired: true; verifyToken: string; emailMasked: string }
    | void
  >;
  verifyLoginCode: (verifyToken: string, code: string) => Promise<void>;
  resendLoginCode: (verifyToken: string) => Promise<void>;
```
Implémenter `login` (ajouter la 3e issue) :
```typescript
const login = async (email: string, password: string) => {
  const { data } = await api.post("/auth/login", { email, password });
  if (data.mfa_required && data.mfa_token) {
    return { mfaRequired: true as const, mfaToken: data.mfa_token as string };
  }
  if (data.verification_required && data.verify_token) {
    return { verificationRequired: true as const, verifyToken: data.verify_token as string, emailMasked: (data.email_masked as string) ?? "" };
  }
  tokens.set(data.access_token, data.refresh_token);
  await loadMe();
};
const verifyLoginCode = async (verifyToken: string, code: string) => {
  const { data } = await api.post("/auth/login/verify", { verify_token: verifyToken, code });
  tokens.set(data.access_token, data.refresh_token);
  await loadMe();
};
const resendLoginCode = async (verifyToken: string) => {
  await api.post("/auth/login/verify/resend", { verify_token: verifyToken });
};
```
Exposer `verifyLoginCode, resendLoginCode` dans la value du `AuthCtx.Provider`.

- [ ] **Step 4: Vérifier** — `npx tsc --noEmit && npm run build` (repo admin) → OK.

- [ ] **Step 5: Commit** (repo admin)
```bash
git add src/lib/device.ts src/lib/api.ts src/lib/auth.tsx
git commit -m "feat: x-device-id + flux verification code email (useAuth)"
```

---

### Task 5 (repo admin) : Étape « code email » sur l'écran de connexion

**Files:** Modify `src/app/login/page.tsx`.

**Interfaces:** Consumes `useAuth().login/verifyLoginCode/resendLoginCode` (T4). Réutilise la carte glassmorphism + l'input code stylés par le chantier UI.

- [ ] **Step 1: Gérer la 3e issue du login**

Ajouter les états : `const [verifyToken, setVerifyToken] = useState<string | null>(null); const [emailMasked, setEmailMasked] = useState("");` et `const { login, completeMfa, verifyLoginCode, resendLoginCode } = useAuth();`.

Dans `submit`, gérer les 3 issues :
```typescript
if (mfaToken) { await completeMfa(mfaToken, code.trim()); router.replace("/dashboard"); return; }
if (verifyToken) { await verifyLoginCode(verifyToken, code.trim()); router.replace("/dashboard"); return; }
const res = await login(email.trim().toLowerCase(), password);
if (res && "mfaRequired" in res) { setMfaToken(res.mfaToken); toast.info("Saisissez le code de votre application d'authentification."); }
else if (res && "verificationRequired" in res) { setVerifyToken(res.verifyToken); setEmailMasked(res.emailMasked); toast.info("Un code de connexion a été envoyé à votre email."); }
else { router.replace("/dashboard"); }
```

- [ ] **Step 2: Rendu de l'étape code** — étendre la condition d'affichage. Le sous-titre/titre distinguent email vs TOTP :
  - Titre : `mfaToken || verifyToken ? "Vérification en deux étapes" : "Connexion"`.
  - Sous-texte : si `verifyToken` → `Un code a été envoyé à ${emailMasked}.` ; si `mfaToken` → `Entrez le code à 6 chiffres de votre application.`
  - La condition qui affiche l'input code : `mfaToken || verifyToken` (au lieu de `mfaToken` seul) — même champ code réutilisé.
  - **Lien « Renvoyer le code »** (uniquement si `verifyToken`), avec cooldown 30s :
```tsx
{verifyToken && (
  <button type="button" disabled={resendCooldown > 0}
    onClick={async () => { await resendLoginCode(verifyToken); setResendCooldown(30); toast.success("Nouveau code envoyé."); }}
    className="mt-3 text-xs text-white/70 hover:text-white disabled:opacity-50">
    {resendCooldown > 0 ? `Renvoyer le code (${resendCooldown}s)` : "Renvoyer le code"}
  </button>
)}
```
avec un `useEffect` qui décrémente `resendCooldown` chaque seconde (guard `> 0`).
  - Le libellé du bouton principal : `mfaToken || verifyToken ? "Vérifier" : "Se connecter"`.

- [ ] **Step 3: Vérifier** — `npx tsc --noEmit && npm run build` → OK. Comportement : email admin nouvel appareil → étape « code envoyé à j***@… » → saisie → dashboard ; TOTP inchangé ; renvoi de code avec cooldown ; clair/sombre ; mobile.

- [ ] **Step 4: Commit** (repo admin)
```bash
git add "src/app/login/page.tsx"
git commit -m "feat: etape code email sur le login (2FA nouvel appareil)"
```

---

## Recette finale

- [ ] **API** : `pnpm run build` + `pnpm test -- auth.service` verts ; migration `trusted_device` appliquée ; app boote (health 200).
- [ ] **Admin** : `npx tsc --noEmit && npm run build` verts.
- [ ] **Bout-en-bout (dev)** : admin sans TOTP, appareil neuf (localStorage vidé) → reçoit un code email → le saisit → dashboard ; 2e login même appareil+IP → pas de code ; IP changée → code redemandé ; admin avec TOTP → flux TOTP inchangé ; non-admin → inchangé.
- [ ] **Sécurité** : 3 mauvais codes → « nombre maximum de tentatives » (OtpService) ; renvoi rate-limité ; email d'alerte reçu ; audit `LOGIN_VERIFY_SENT`/`_OK` ; réponses sans email complet ni code.
- [ ] **Déploiement** (ordre) : back A2FA (endpoints) déployé AVANT/AVEC le front ; back rétro-compatible (sans `x-device-id`, admin traité « nouvel appareil » → code email — sûr). Tar `src prisma` + `prisma migrate deploy` + build + restart (cf. [[alloartisan-rbac-fin]]) ; front → `admin-public/`.

## Ordre d'exécution des chantiers

1. **UI** (`alloartisan-admin/.../2026-07-29-admin-branding-login.md`) — refond le login (stylise l'étape code).
2. **Ce plan 2FA** — Tasks 1→3 (API) puis 4→5 (admin, sur le login refondu).

