# Guide Développeur - Authentification AlloArtisan

Ce guide explique pas à pas comment implémenter les fonctionnalités d'authentification avancées.

---

## Table des matières

1. [Prérequis et Installation](#1-prérequis-et-installation)
2. [Configuration Redis](#2-configuration-redis)
3. [Mise à jour du schéma Prisma](#3-mise-à-jour-du-schéma-prisma)
4. [Types TypeScript](#4-types-typescript)
5. [Service de Sessions (Redis)](#5-service-de-sessions-redis)
6. [Service OTP](#6-service-otp)
7. [Service Email](#7-service-email)
8. [Service Anti Brute-Force](#8-service-anti-brute-force)
9. [DTOs (Validation)](#9-dtos-validation)
10. [Strategies Passport JWT](#10-strategies-passport-jwt)
11. [Service Auth Principal](#11-service-auth-principal)
12. [Controller Auth](#12-controller-auth)
13. [Configuration des Modules](#13-configuration-des-modules)

---

## 1. Prérequis et Installation

### Packages à installer

```bash
# Packages principaux
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm add argon2
pnpm add otplib qrcode
pnpm add resend
pnpm add cache-manager cache-manager-redis-yet

# Types TypeScript
pnpm add -D @types/passport-jwt @types/qrcode
```

### Variables d'environnement (.env)

```env
# JWT Secrets (générer des chaînes aléatoires de 32+ caractères)
JWT_ACCESS_SECRET=votre_secret_access_token_tres_long_et_securise
JWT_REFRESH_SECRET=votre_secret_refresh_token_tres_long_et_securise

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (Resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@votredomaine.com
```

---

## 2. Configuration Redis

### Fichier : `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),

        // Configuration Redis
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                store: await redisStore({
                    socket: {
                        host: config.get('REDIS_HOST', 'localhost'),
                        port: config.get('REDIS_PORT', 6379),
                    },
                    password: config.get('REDIS_PASSWORD'),
                }),
            }),
        }),

        // ... autres modules
    ],
})
export class AppModule {}
```

---

## 3. Mise à jour du schéma Prisma

### Fichier : `prisma/schema.prisma`

Ajouter les champs MFA au modèle User :

```prisma
model User {
  id            String   @id @default(uuid()) @db.VarChar(36)
  email         String   @unique
  passwordHash  String   @map("password_hash") @db.VarChar(255)

  // Vérification
  emailVerified Boolean  @default(false) @map("email_verified")

  // MFA (TOTP)
  mfaEnabled    Boolean  @default(false) @map("mfa_enabled")
  mfaSecret     String?  @db.VarChar(255) @map("mfa_secret")

  // Statut
  statut        Statut   @default(EN_ATTENTE)
  role          Role     @default(CLIENT)

  // Métadonnées
  derniereConnexion DateTime? @map("derniere_connexion")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("users")
}

enum Statut {
  EN_ATTENTE
  ACTIF
  SUSPENDU
  BANNI
}

enum Role {
  CLIENT
  ARTISAN
  ADMIN
}
```

### Commandes à exécuter

```bash
# Créer la migration
npx prisma migrate dev --name add_mfa_fields

# Générer le client
npx prisma generate
```

---

## 4. Types TypeScript

### Fichier : `src/common/types/session.types.ts`

```typescript
export interface SessionData {
    sessionId: string;
    userId: string;
    tokenHash: string;
    deviceName?: string;
    deviceType?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: number;
    lastUsedAt: number;
}

export interface SessionInfo {
    sessionId: string;
    deviceName?: string;
    deviceType?: string;
    ipAddress?: string;
    createdAt: Date;
    lastUsedAt: Date;
    isCurrent: boolean;
}

export interface CreateSessionInput {
    userId: string;
    refreshToken: string;
    deviceName?: string;
    deviceType?: string;
    ipAddress?: string;
    userAgent?: string;
}
```

### Fichier : `src/common/types/otp.types.ts`

```typescript
export enum OtpType {
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
    PHONE_VERIFICATION = 'PHONE_VERIFICATION',
    PASSWORD_RESET = 'PASSWORD_RESET',
    TWO_FACTOR_AUTH = 'TWO_FACTOR_AUTH',
}

export interface StoredOtpData {
    codeHash: string;
    userId: string;
    type: OtpType;
    attempts: number;
    maxAttempts: number;
    createdAt: number;
}
```

### Fichier : `src/common/types/index.ts`

```typescript
export * from './otp.types';
export * from './session.types';
```

### Fichier : `src/auth/types/tokens.type.ts`

```typescript
export type Tokens = {
    access_token: string;
    refresh_token: string;
    session_id: string;
};

export type LoginResponse = Tokens | { mfa_required: true; mfa_token: string };
```

### Fichier : `src/auth/types/index.ts`

```typescript
export * from './tokens.type';
```

---

## 5. Service de Sessions (Redis)

### Fichier : `src/common/services/session.service.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as argon from 'argon2';
import { randomUUID } from 'crypto';
import { SessionData, SessionInfo, CreateSessionInput } from '../types';

@Injectable()
export class SessionService {
    private readonly SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 jours en ms
    private readonly MAX_SESSIONS_PER_USER = 5;

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    /**
     * Génère la clé Redis pour une session
     */
    private getSessionKey(userId: string, sessionId: string): string {
        return `session:${userId}:${sessionId}`;
    }

    /**
     * Génère la clé Redis pour la liste des sessions d'un utilisateur
     */
    private getUserSessionsKey(userId: string): string {
        return `sessions:${userId}`;
    }

    /**
     * Crée une nouvelle session
     * @returns sessionId généré
     */
    async create(input: CreateSessionInput): Promise<string> {
        const sessionId = randomUUID();
        const tokenHash = await argon.hash(input.refreshToken);

        const sessionData: SessionData = {
            sessionId,
            userId: input.userId,
            tokenHash,
            deviceName: input.deviceName,
            deviceType: input.deviceType,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
        };

        // Stocker la session
        const sessionKey = this.getSessionKey(input.userId, sessionId);
        await this.cacheManager.set(sessionKey, JSON.stringify(sessionData), this.SESSION_TTL);

        // Ajouter à la liste des sessions de l'utilisateur
        await this.addSessionToUserList(input.userId, sessionId);

        // Nettoyer si trop de sessions
        await this.enforceSessionLimit(input.userId);

        return sessionId;
    }

    /**
     * Valide un refresh token pour une session
     */
    async validate(userId: string, sessionId: string, refreshToken: string): Promise<boolean> {
        const sessionKey = this.getSessionKey(userId, sessionId);
        const storedData = await this.cacheManager.get<string>(sessionKey);

        if (!storedData) {
            return false;
        }

        const sessionData = JSON.parse(storedData) as SessionData;
        const isValid = await argon.verify(sessionData.tokenHash, refreshToken);

        if (isValid) {
            // Mettre à jour lastUsedAt
            sessionData.lastUsedAt = Date.now();
            await this.cacheManager.set(sessionKey, JSON.stringify(sessionData), this.SESSION_TTL);
        }

        return isValid;
    }

    /**
     * Vérifie si une session existe (sans vérifier le token)
     */
    async exists(userId: string, sessionId: string): Promise<boolean> {
        const sessionKey = this.getSessionKey(userId, sessionId);
        const data = await this.cacheManager.get<string>(sessionKey);
        return data !== undefined && data !== null;
    }

    /**
     * Met à jour le refresh token d'une session
     */
    async updateToken(userId: string, sessionId: string, newRefreshToken: string): Promise<void> {
        const sessionKey = this.getSessionKey(userId, sessionId);
        const storedData = await this.cacheManager.get<string>(sessionKey);

        if (!storedData) {
            return;
        }

        const sessionData = JSON.parse(storedData) as SessionData;
        sessionData.tokenHash = await argon.hash(newRefreshToken);
        sessionData.lastUsedAt = Date.now();

        await this.cacheManager.set(sessionKey, JSON.stringify(sessionData), this.SESSION_TTL);
    }

    /**
     * Révoque une session spécifique
     */
    async revoke(userId: string, sessionId: string): Promise<void> {
        const sessionKey = this.getSessionKey(userId, sessionId);
        await this.cacheManager.del(sessionKey);
        await this.removeSessionFromUserList(userId, sessionId);
    }

    /**
     * Révoque toutes les sessions d'un utilisateur
     */
    async revokeAll(userId: string): Promise<void> {
        const sessionIds = await this.getUserSessionIds(userId);

        for (const sessionId of sessionIds) {
            const sessionKey = this.getSessionKey(userId, sessionId);
            await this.cacheManager.del(sessionKey);
        }

        const userSessionsKey = this.getUserSessionsKey(userId);
        await this.cacheManager.del(userSessionsKey);
    }

    /**
     * Révoque toutes les sessions sauf la session courante
     */
    async revokeAllExcept(userId: string, currentSessionId: string): Promise<void> {
        const sessionIds = await this.getUserSessionIds(userId);

        for (const sessionId of sessionIds) {
            if (sessionId !== currentSessionId) {
                const sessionKey = this.getSessionKey(userId, sessionId);
                await this.cacheManager.del(sessionKey);
            }
        }

        const userSessionsKey = this.getUserSessionsKey(userId);
        await this.cacheManager.set(
            userSessionsKey,
            JSON.stringify([currentSessionId]),
            this.SESSION_TTL,
        );
    }

    /**
     * Récupère la liste des sessions d'un utilisateur
     */
    async getUserSessions(userId: string, currentSessionId?: string): Promise<SessionInfo[]> {
        const sessionIds = await this.getUserSessionIds(userId);
        const sessions: SessionInfo[] = [];

        for (const sessionId of sessionIds) {
            const sessionKey = this.getSessionKey(userId, sessionId);
            const storedData = await this.cacheManager.get<string>(sessionKey);

            if (storedData) {
                const sessionData = JSON.parse(storedData) as SessionData;
                sessions.push({
                    sessionId: sessionData.sessionId,
                    deviceName: sessionData.deviceName,
                    deviceType: sessionData.deviceType,
                    ipAddress: sessionData.ipAddress,
                    createdAt: new Date(sessionData.createdAt),
                    lastUsedAt: new Date(sessionData.lastUsedAt),
                    isCurrent: sessionId === currentSessionId,
                });
            }
        }

        return sessions.sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime());
    }

    /**
     * Récupère les IDs de sessions d'un utilisateur
     */
    private async getUserSessionIds(userId: string): Promise<string[]> {
        const userSessionsKey = this.getUserSessionsKey(userId);
        const data = await this.cacheManager.get<string>(userSessionsKey);
        return data ? (JSON.parse(data) as string[]) : [];
    }

    /**
     * Ajoute une session à la liste de l'utilisateur
     */
    private async addSessionToUserList(userId: string, sessionId: string): Promise<void> {
        const sessionIds = await this.getUserSessionIds(userId);
        sessionIds.push(sessionId);
        const userSessionsKey = this.getUserSessionsKey(userId);
        await this.cacheManager.set(userSessionsKey, JSON.stringify(sessionIds), this.SESSION_TTL);
    }

    /**
     * Retire une session de la liste de l'utilisateur
     */
    private async removeSessionFromUserList(userId: string, sessionId: string): Promise<void> {
        const sessionIds = await this.getUserSessionIds(userId);
        const filtered = sessionIds.filter((id) => id !== sessionId);
        const userSessionsKey = this.getUserSessionsKey(userId);
        await this.cacheManager.set(userSessionsKey, JSON.stringify(filtered), this.SESSION_TTL);
    }

    /**
     * Supprime les sessions les plus anciennes si limite dépassée
     */
    private async enforceSessionLimit(userId: string): Promise<void> {
        const sessionIds = await this.getUserSessionIds(userId);

        if (sessionIds.length <= this.MAX_SESSIONS_PER_USER) {
            return;
        }

        const sessionsWithTime: { sessionId: string; lastUsedAt: number }[] = [];

        for (const sessionId of sessionIds) {
            const sessionKey = this.getSessionKey(userId, sessionId);
            const storedData = await this.cacheManager.get<string>(sessionKey);

            if (storedData) {
                const sessionData = JSON.parse(storedData) as SessionData;
                sessionsWithTime.push({ sessionId, lastUsedAt: sessionData.lastUsedAt });
            }
        }

        // Trier par lastUsedAt (les plus anciennes en premier)
        sessionsWithTime.sort((a, b) => a.lastUsedAt - b.lastUsedAt);

        // Supprimer les sessions les plus anciennes
        const toRemove = sessionsWithTime.slice(
            0,
            sessionsWithTime.length - this.MAX_SESSIONS_PER_USER,
        );

        for (const session of toRemove) {
            await this.revoke(userId, session.sessionId);
        }
    }
}
```

---

## 6. Service OTP

### Fichier : `src/common/services/otp.service.ts`

```typescript
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as argon from 'argon2';
import { OtpType, StoredOtpData } from '../types';

@Injectable()
export class OtpService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    /**
     * Génère un code OTP aléatoire (6 chiffres)
     */
    private generateCode(length: number = 6): string {
        const digits = '0123456789';
        let code = '';
        for (let i = 0; i < length; i++) {
            code += digits[Math.floor(Math.random() * digits.length)];
        }
        return code;
    }

    /**
     * Génère la clé Redis
     */
    private getRedisKey(userId: string, type: OtpType): string {
        return `otp:${userId}:${type}`;
    }

    /**
     * Crée et stocke un nouveau OTP
     * @returns Le code OTP en clair (à envoyer par email/SMS)
     */
    async create(userId: string, type: OtpType, ttl: number = 600): Promise<string> {
        const code = this.generateCode();
        const codeHash = await argon.hash(code);

        const otpData: StoredOtpData = {
            codeHash,
            userId,
            type,
            attempts: 0,
            maxAttempts: 3,
            createdAt: Date.now(),
        };

        const key = this.getRedisKey(userId, type);
        await this.cacheManager.set(key, JSON.stringify(otpData), ttl * 1000);

        return code;
    }

    /**
     * Vérifie un code OTP
     */
    async verify(userId: string, type: OtpType, code: string): Promise<boolean> {
        const key = this.getRedisKey(userId, type);
        const storedData = await this.cacheManager.get<string>(key);

        if (!storedData) {
            throw new BadRequestException('Code OTP expiré ou invalide');
        }

        const otpData = JSON.parse(storedData) as StoredOtpData;

        // Vérifier le nombre de tentatives
        if (otpData.attempts >= otpData.maxAttempts) {
            await this.cacheManager.del(key);
            throw new BadRequestException(
                'Nombre maximum de tentatives atteint. Demandez un nouveau code.',
            );
        }

        // Incrémenter les tentatives
        otpData.attempts += 1;

        // Calculer le TTL restant
        const ttlMs = 600 * 1000;
        const elapsed = Date.now() - otpData.createdAt;
        const remainingTtl = Math.max(ttlMs - elapsed, 1000);

        await this.cacheManager.set(key, JSON.stringify(otpData), remainingTtl);

        // Vérifier le code
        const isValid = await argon.verify(otpData.codeHash, code);

        if (isValid) {
            await this.cacheManager.del(key);
            return true;
        }

        return false;
    }

    /**
     * Supprime un OTP
     */
    async revoke(userId: string, type: OtpType): Promise<void> {
        const key = this.getRedisKey(userId, type);
        await this.cacheManager.del(key);
    }

    /**
     * Vérifie si un OTP existe
     */
    async exists(userId: string, type: OtpType): Promise<boolean> {
        const key = this.getRedisKey(userId, type);
        const data = await this.cacheManager.get<string>(key);
        return data !== undefined && data !== null;
    }
}
```

---

## 7. Service Email

### Fichier : `src/common/services/email.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly resend: Resend;
    private readonly fromEmail: string;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('RESEND_API_KEY');
        if (!apiKey) {
            this.logger.warn('RESEND_API_KEY is not configured.');
        }
        this.resend = new Resend(apiKey);
        this.fromEmail =
            this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
    }

    /**
     * Envoie un email générique
     */
    async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: [to],
                subject,
                html,
            });

            if (error) {
                this.logger.error(`Failed to send email to ${to}: ${error.message}`);
                return false;
            }

            this.logger.log(`Email sent successfully to ${to} (ID: ${data?.id})`);
            return true;
        } catch (error) {
            this.logger.error(`Error sending email to ${to}`, error);
            return false;
        }
    }

    /**
     * Email de vérification de compte
     */
    async sendVerificationEmail(to: string, otpCode: string): Promise<boolean> {
        const subject = 'Vérification de votre compte AlloArtisan';
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;"><tr><td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;"><h1 style="color: white; margin: 0; font-size: 28px;">AlloArtisan</h1></td></tr><tr><td style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px;"><h2 style="color: #333; margin: 0 0 20px 0;">Vérification de votre compte</h2><p style="margin: 0 0 20px 0; color: #555;">Votre code de vérification :</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 32px; font-weight: bold; padding: 20px 40px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">${otpCode}</div></td></tr></table><p style="color: #666; font-size: 14px; margin: 25px 0 10px 0;">Ce code expire dans <strong>10 minutes</strong>.</p></td></tr></table></body></html>`;
        return this.sendEmail(to, subject, html);
    }

    /**
     * Email de réinitialisation de mot de passe
     */
    async sendPasswordResetEmail(to: string, otpCode: string): Promise<boolean> {
        const subject = 'Réinitialisation de votre mot de passe AlloArtisan';
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;"><tr><td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;"><h1 style="color: white; margin: 0; font-size: 28px;">AlloArtisan</h1></td></tr><tr><td style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px;"><h2 style="color: #333; margin: 0 0 20px 0;">Réinitialisation du mot de passe</h2><p style="margin: 0 0 20px 0; color: #555;">Votre code de réinitialisation :</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 32px; font-weight: bold; padding: 20px 40px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">${otpCode}</div></td></tr></table><p style="color: #666; font-size: 14px; margin: 25px 0 10px 0;">Ce code expire dans <strong>10 minutes</strong>.</p><p style="color: #888; font-size: 13px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p></td></tr></table></body></html>`;
        return this.sendEmail(to, subject, html);
    }

    /**
     * Email de statut de compte (verrouillé, non vérifié)
     */
    async sendAccountStatusEmail(to: string, status: 'locked' | 'not_verified'): Promise<boolean> {
        const subject =
            status === 'locked'
                ? 'Tentative de connexion - Compte verrouillé'
                : 'Tentative de connexion - Vérification requise';

        const html =
            status === 'locked'
                ? `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif;"><h2 style="color: #e74c3c;">Compte verrouillé</h2><p>Votre compte a été temporairement verrouillé pendant 15 minutes suite à plusieurs tentatives de connexion échouées.</p></body></html>`
                : `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif;"><h2 style="color: #f39c12;">Vérification requise</h2><p>Votre compte n'est pas encore vérifié. Veuillez vérifier votre email.</p></body></html>`;

        return this.sendEmail(to, subject, html);
    }
}
```

---

## 8. Service Anti Brute-Force

### Fichier : `src/auth/services/login-attempt.service.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

interface LoginAttemptData {
    attempts: number;
    lockedUntil?: number;
}

@Injectable()
export class LoginAttemptService {
    private readonly MAX_ATTEMPTS = 5;
    private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes en ms
    private readonly ATTEMPT_TTL = 60 * 60 * 1000; // 1 heure en ms

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    private getKey(email: string): string {
        return `login_attempts:${email.toLowerCase()}`;
    }

    /**
     * Enregistre une tentative échouée
     * @returns Nombre de tentatives restantes
     */
    async recordFailedAttempt(email: string): Promise<number> {
        const key = this.getKey(email);
        const data = await this.getData(email);

        data.attempts += 1;

        if (data.attempts >= this.MAX_ATTEMPTS) {
            data.lockedUntil = Date.now() + this.LOCKOUT_DURATION;
        }

        await this.cacheManager.set(key, JSON.stringify(data), this.ATTEMPT_TTL);

        return Math.max(0, this.MAX_ATTEMPTS - data.attempts);
    }

    /**
     * Vérifie si le compte est verrouillé
     */
    async isLocked(email: string): Promise<boolean> {
        const data = await this.getData(email);

        if (data.lockedUntil && Date.now() < data.lockedUntil) {
            return true;
        }

        // Si le verrou a expiré, le supprimer
        if (data.lockedUntil && Date.now() >= data.lockedUntil) {
            await this.resetAttempts(email);
        }

        return false;
    }

    /**
     * Retourne le temps restant avant déverrouillage (en secondes)
     */
    async getRemainingLockTime(email: string): Promise<number> {
        const data = await this.getData(email);

        if (data.lockedUntil) {
            const remaining = Math.ceil((data.lockedUntil - Date.now()) / 1000);
            return Math.max(0, remaining);
        }

        return 0;
    }

    /**
     * Réinitialise les tentatives après un login réussi
     */
    async resetAttempts(email: string): Promise<void> {
        const key = this.getKey(email);
        await this.cacheManager.del(key);
    }

    private async getData(email: string): Promise<LoginAttemptData> {
        const key = this.getKey(email);
        const stored = await this.cacheManager.get<string>(key);

        if (stored) {
            return JSON.parse(stored) as LoginAttemptData;
        }

        return { attempts: 0 };
    }
}
```

---

## 9. DTOs (Validation)

### Fichier : `src/auth/dto/auth.dto.ts`

```typescript
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class AuthDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
    })
    password: string;
}
```

### Fichier : `src/auth/dto/password-reset.dto.ts`

```typescript
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ForgotPasswordDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class ResetPasswordDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    newPassword: string;
}
```

### Fichier : `src/auth/dto/mfa.dto.ts`

```typescript
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class EnableMfaDto {
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    code: string;
}

export class VerifyMfaDto {
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    code: string;
}

export class VerifyMfaLoginDto {
    @IsString()
    @IsNotEmpty()
    mfa_token: string;

    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    code: string;
}
```

### Fichier : `src/auth/dto/index.ts`

```typescript
export * from './auth.dto';
export * from './password-reset.dto';
export * from './mfa.dto';
```

---

## 10. Strategies Passport JWT

### Fichier : `src/auth/strategies/at.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { Statut } from 'src/generated/prisma';

type JwtPayload = {
    sub: string;
    sid: string;
};

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.getOrThrow('JWT_ACCESS_SECRET'),
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                role: true,
                statut: true,
            },
        });

        if (!user || user.statut === Statut.BANNI || user.statut === Statut.SUSPENDU) {
            throw new UnauthorizedException('Access Denied');
        }

        return {
            sub: user.id,
            email: user.email,
            role: user.role,
            sessionId: payload.sid,
        };
    }
}
```

### Fichier : `src/auth/strategies/rt.strategy.ts`

```typescript
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionService } from 'src/common/services';

type JwtPayload = {
    sub: string;
    sid: string;
};

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        config: ConfigService,
        private sessionService: SessionService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.getOrThrow('JWT_REFRESH_SECRET'),
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: JwtPayload) {
        const refreshToken = req.get('authorization')?.replace('Bearer', '').trim();

        if (!payload.sid) {
            throw new ForbiddenException('Access Denied');
        }

        // Vérifier que la session existe dans Redis
        const sessionExists = await this.sessionService.exists(payload.sub, payload.sid);
        if (!sessionExists) {
            throw new ForbiddenException('Access Denied');
        }

        return {
            sub: payload.sub,
            sessionId: payload.sid,
            refreshToken,
        };
    }
}
```

### Fichier : `src/auth/strategies/index.ts`

```typescript
export * from './at.strategy';
export * from './rt.strategy';
```

---

## 11. Service Auth Principal

### Fichier : `src/auth/auth.service.ts`

```typescript
import { ForbiddenException, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto, ForgotPasswordDto, ResetPasswordDto, EnableMfaDto, VerifyMfaDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Tokens, LoginResponse } from './types';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OtpService, EmailService, SessionService } from 'src/common/services';
import { OtpType, SessionInfo } from 'src/common/types';
import { LoginAttemptService } from './services/login-attempt.service';
import { Role, Statut } from 'src/generated/prisma';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

interface DeviceInfo {
    deviceName?: string;
    deviceType?: string;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService,
        private otpService: OtpService,
        private emailService: EmailService,
        private sessionService: SessionService,
        private loginAttemptService: LoginAttemptService,
    ) {}

    // ==================== REGISTER ====================
    async register(dto: AuthDto, deviceInfo?: DeviceInfo): Promise<Tokens> {
        const hash = await argon.hash(dto.password);

        try {
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    passwordHash: hash,
                },
            });

            const tokens = await this.createSession(user.id, deviceInfo);

            // Envoyer email de vérification en arrière-plan
            setImmediate(() => {
                this.sendVerificationEmail(user.id, user.email).catch((error) => {
                    this.logger.error(`Failed to send verification email`, error);
                });
            });

            return tokens;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('Email already exists');
                }
            }
            throw error;
        }
    }

    // ==================== LOGIN ====================
    async login(dto: AuthDto, deviceInfo?: DeviceInfo): Promise<LoginResponse> {
        const genericError = 'Email or password incorrect';

        // Vérifier verrouillage
        const isLocked = await this.loginAttemptService.isLocked(dto.email);
        if (isLocked) {
            const remainingTime = await this.loginAttemptService.getRemainingLockTime(dto.email);
            throw new ForbiddenException(
                `Compte temporairement verrouillé. Réessayez dans ${remainingTime} secondes.`,
            );
        }

        // Trouver l'utilisateur
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user || user.statut === Statut.BANNI || user.statut === Statut.SUSPENDU) {
            await this.loginAttemptService.recordFailedAttempt(dto.email);
            throw new ForbiddenException(genericError);
        }

        // Vérifier mot de passe
        const passwordMatch = await argon.verify(user.passwordHash, dto.password);
        if (!passwordMatch) {
            const remainingAttempts = await this.loginAttemptService.recordFailedAttempt(dto.email);
            if (remainingAttempts === 0) {
                throw new ForbiddenException(
                    'Compte verrouillé pendant 15 minutes suite à trop de tentatives échouées.',
                );
            }
            throw new ForbiddenException(genericError);
        }

        // Vérifier statut
        if (!user.emailVerified || user.statut !== Statut.ACTIF) {
            this.sendAccountStatusEmail(user).catch(() => {});
            throw new ForbiddenException(genericError);
        }

        await this.loginAttemptService.resetAttempts(dto.email);

        // Vérifier MFA
        if (user.mfaEnabled && user.mfaSecret) {
            const mfaToken = await this.jwtService.signAsync(
                { sub: user.id, type: 'mfa_pending' },
                {
                    secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
                    expiresIn: 60 * 5, // 5 minutes
                },
            );
            return { mfa_required: true, mfa_token: mfaToken };
        }

        // Mettre à jour dernière connexion
        await this.prisma.user.update({
            where: { id: user.id },
            data: { derniereConnexion: new Date() },
        });

        return this.createSession(user.id, deviceInfo);
    }

    // ==================== VERIFY MFA LOGIN ====================
    async verifyMfaLogin(mfaToken: string, code: string, deviceInfo?: DeviceInfo): Promise<Tokens> {
        try {
            const payload = await this.jwtService.verifyAsync<{ sub: string; type: string }>(
                mfaToken,
                { secret: this.config.getOrThrow('JWT_ACCESS_SECRET') },
            );

            if (payload.type !== 'mfa_pending') {
                throw new ForbiddenException('Invalid MFA token');
            }

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || !user.mfaSecret) {
                throw new ForbiddenException('Invalid MFA token');
            }

            const isValid = authenticator.verify({ token: code, secret: user.mfaSecret });
            if (!isValid) {
                throw new ForbiddenException('Invalid MFA code');
            }

            await this.prisma.user.update({
                where: { id: user.id },
                data: { derniereConnexion: new Date() },
            });

            return this.createSession(user.id, deviceInfo);
        } catch {
            throw new ForbiddenException('Invalid or expired MFA token');
        }
    }

    // ==================== LOGOUT ====================
    async logout(userId: string, sessionId: string): Promise<void> {
        await this.sessionService.revoke(userId, sessionId);
    }

    async logoutAll(userId: string): Promise<void> {
        await this.sessionService.revokeAll(userId);
    }

    async logoutAllExceptCurrent(userId: string, currentSessionId: string): Promise<void> {
        await this.sessionService.revokeAllExcept(userId, currentSessionId);
    }

    // ==================== REFRESH TOKENS ====================
    async refreshTokens(userId: string, sessionId: string, rt: string): Promise<Tokens> {
        const isValid = await this.sessionService.validate(userId, sessionId, rt);
        if (!isValid) {
            throw new ForbiddenException('Access Denied');
        }

        const tokens = await this.getTokens(userId, sessionId);
        await this.sessionService.updateToken(userId, sessionId, tokens.refresh_token);
        return tokens;
    }

    // ==================== SESSIONS ====================
    async getSessions(userId: string, currentSessionId?: string): Promise<SessionInfo[]> {
        return this.sessionService.getUserSessions(userId, currentSessionId);
    }

    async revokeSession(userId: string, sessionId: string): Promise<void> {
        await this.sessionService.revoke(userId, sessionId);
    }

    // ==================== PASSWORD RESET ====================
    async forgotPassword(dto: ForgotPasswordDto): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        const successMessage = 'Si cet email existe, un code de réinitialisation a été envoyé.';

        if (!user) {
            return successMessage;
        }

        const otpExists = await this.otpService.exists(user.id, OtpType.PASSWORD_RESET);
        if (otpExists) {
            return successMessage;
        }

        const otp = await this.otpService.create(user.id, OtpType.PASSWORD_RESET);
        this.emailService.sendPasswordResetEmail(user.email, otp).catch((error) => {
            this.logger.error(`Failed to send password reset email`, error);
        });

        return successMessage;
    }

    async resetPassword(dto: ResetPasswordDto): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new ForbiddenException('Code invalide ou expiré');
        }

        const isValid = await this.otpService.verify(user.id, OtpType.PASSWORD_RESET, dto.code);
        if (!isValid) {
            throw new ForbiddenException('Code invalide ou expiré');
        }

        const hash = await argon.hash(dto.newPassword);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hash },
        });

        // Révoquer toutes les sessions
        await this.sessionService.revokeAll(user.id);

        return 'Mot de passe réinitialisé avec succès. Veuillez vous reconnecter.';
    }

    // ==================== MFA (TOTP) ====================
    async generateMfaSecret(userId: string): Promise<{ secret: string; qrCode: string }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new ForbiddenException('User not found');
        }

        if (user.mfaEnabled) {
            throw new BadRequestException('MFA is already enabled');
        }

        const secret = authenticator.generateSecret();
        const otpAuthUrl = authenticator.keyuri(user.email, 'AlloArtisan', secret);
        const qrCode = await QRCode.toDataURL(otpAuthUrl);

        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaSecret: secret },
        });

        return { secret, qrCode };
    }

    async enableMfa(userId: string, dto: EnableMfaDto): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.mfaSecret) {
            throw new ForbiddenException('Please generate MFA secret first');
        }

        if (user.mfaEnabled) {
            throw new BadRequestException('MFA is already enabled');
        }

        const isValid = authenticator.verify({ token: dto.code, secret: user.mfaSecret });
        if (!isValid) {
            throw new ForbiddenException('Invalid MFA code');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: true },
        });

        return 'MFA activé avec succès';
    }

    async disableMfa(userId: string, dto: VerifyMfaDto): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.mfaEnabled || !user.mfaSecret) {
            throw new BadRequestException('MFA is not enabled');
        }

        const isValid = authenticator.verify({ token: dto.code, secret: user.mfaSecret });
        if (!isValid) {
            throw new ForbiddenException('Invalid MFA code');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: false, mfaSecret: null },
        });

        return 'MFA désactivé avec succès';
    }

    // ==================== PRIVATE HELPERS ====================
    private async createSession(userId: string, deviceInfo?: DeviceInfo): Promise<Tokens> {
        const tokens = await this.getTokens(userId, '');
        const sessionId = await this.sessionService.create({
            userId,
            refreshToken: tokens.refresh_token,
            ...deviceInfo,
        });

        return this.getTokens(userId, sessionId);
    }

    private async getTokens(userId: string, sessionId: string): Promise<Tokens> {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(
                { sub: userId, sid: sessionId },
                {
                    secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
                    expiresIn: 60 * 15, // 15 minutes
                },
            ),
            this.jwtService.signAsync(
                { sub: userId, sid: sessionId },
                {
                    secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
                    expiresIn: 60 * 60 * 24 * 7, // 7 jours
                },
            ),
        ]);

        return {
            access_token: at,
            refresh_token: rt,
            session_id: sessionId,
        };
    }

    private async sendVerificationEmail(userId: string, email: string): Promise<void> {
        const otp = await this.otpService.create(userId, OtpType.EMAIL_VERIFICATION);
        await this.emailService.sendVerificationEmail(email, otp);
    }

    private async sendAccountStatusEmail(user: {
        id: string;
        email: string;
        emailVerified: boolean;
        statut: Statut;
    }): Promise<void> {
        if (!user.emailVerified) {
            const otp = await this.otpService.create(user.id, OtpType.EMAIL_VERIFICATION);
            await this.emailService.sendVerificationEmail(user.email, otp);
        }
    }
}
```

---

## 12. Controller Auth

### Fichier : `src/auth/auth.controller.ts`

```typescript
import { Tokens, LoginResponse } from './types';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
    AuthDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    EnableMfaDto,
    VerifyMfaDto,
    VerifyMfaLoginDto,
} from './dto';
import { RtGuard } from 'src/common/guards';
import { GetCurrentUser, GetCurrentUserId, Public } from 'src/common/decorators';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    // ==================== REGISTER / LOGIN / LOGOUT ====================

    @Public()
    @Throttle({ short: { limit: 5, ttl: 60000 } })
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    register(@Body() dto: AuthDto, @Req() req: Request): Promise<Tokens> {
        return this.authService.register(dto, this.extractDeviceInfo(req));
    }

    @Public()
    @Throttle({ short: { limit: 5, ttl: 60000 } })
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: AuthDto, @Req() req: Request): Promise<LoginResponse> {
        return this.authService.login(dto, this.extractDeviceInfo(req));
    }

    @Public()
    @Throttle({ short: { limit: 5, ttl: 60000 } })
    @Post('login/mfa')
    @HttpCode(HttpStatus.OK)
    verifyMfaLogin(@Body() dto: VerifyMfaLoginDto, @Req() req: Request): Promise<Tokens> {
        return this.authService.verifyMfaLogin(
            dto.mfa_token,
            dto.code,
            this.extractDeviceInfo(req),
        );
    }

    @SkipThrottle()
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    logout(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('sessionId') sessionId: string,
    ): Promise<void> {
        return this.authService.logout(userId, sessionId);
    }

    @SkipThrottle()
    @Post('logout/all')
    @HttpCode(HttpStatus.OK)
    logoutAll(@GetCurrentUserId() userId: string): Promise<void> {
        return this.authService.logoutAll(userId);
    }

    @SkipThrottle()
    @Post('logout/others')
    @HttpCode(HttpStatus.OK)
    logoutOthers(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('sessionId') sessionId: string,
    ): Promise<void> {
        return this.authService.logoutAllExceptCurrent(userId, sessionId);
    }

    // ==================== REFRESH TOKEN ====================

    @Public()
    @SkipThrottle()
    @UseGuards(RtGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refreshTokens(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('sessionId') sessionId: string,
        @GetCurrentUser('refreshToken') refreshToken: string,
    ): Promise<Tokens> {
        return this.authService.refreshTokens(userId, sessionId, refreshToken);
    }

    // ==================== SESSIONS ====================

    @SkipThrottle()
    @Get('sessions')
    @HttpCode(HttpStatus.OK)
    getSessions(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('sessionId') sessionId: string,
    ) {
        return this.authService.getSessions(userId, sessionId);
    }

    @SkipThrottle()
    @Delete('sessions/:sessionId')
    @HttpCode(HttpStatus.OK)
    revokeSession(
        @GetCurrentUserId() userId: string,
        @Param('sessionId') sessionId: string,
    ): Promise<void> {
        return this.authService.revokeSession(userId, sessionId);
    }

    // ==================== PASSWORD RESET ====================

    @Public()
    @Throttle({ short: { limit: 3, ttl: 600000 } })
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    forgotPassword(@Body() dto: ForgotPasswordDto): Promise<string> {
        return this.authService.forgotPassword(dto);
    }

    @Public()
    @Throttle({ short: { limit: 5, ttl: 300000 } })
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    resetPassword(@Body() dto: ResetPasswordDto): Promise<string> {
        return this.authService.resetPassword(dto);
    }

    // ==================== MFA (TOTP) ====================

    @SkipThrottle()
    @Post('mfa/generate')
    @HttpCode(HttpStatus.OK)
    generateMfaSecret(@GetCurrentUserId() userId: string) {
        return this.authService.generateMfaSecret(userId);
    }

    @SkipThrottle()
    @Post('mfa/enable')
    @HttpCode(HttpStatus.OK)
    enableMfa(@GetCurrentUserId() userId: string, @Body() dto: EnableMfaDto): Promise<string> {
        return this.authService.enableMfa(userId, dto);
    }

    @SkipThrottle()
    @Post('mfa/disable')
    @HttpCode(HttpStatus.OK)
    disableMfa(@GetCurrentUserId() userId: string, @Body() dto: VerifyMfaDto): Promise<string> {
        return this.authService.disableMfa(userId, dto);
    }

    // ==================== HELPERS ====================

    private extractDeviceInfo(req: Request) {
        const userAgent = req.get('user-agent') || '';
        const ip = req.ip || req.get('x-forwarded-for') || '';

        return {
            userAgent,
            ipAddress: ip,
            deviceName: this.parseDeviceName(userAgent),
            deviceType: this.parseDeviceType(userAgent),
        };
    }

    private parseDeviceName(userAgent: string): string {
        if (userAgent.includes('iPhone')) return 'iPhone';
        if (userAgent.includes('iPad')) return 'iPad';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('Windows')) return 'Windows PC';
        if (userAgent.includes('Mac')) return 'Mac';
        if (userAgent.includes('Linux')) return 'Linux';
        return 'Unknown Device';
    }

    private parseDeviceType(userAgent: string): string {
        if (userAgent.includes('Mobile')) return 'mobile';
        if (userAgent.includes('Tablet') || userAgent.includes('iPad')) return 'tablet';
        return 'desktop';
    }
}
```

---

## 13. Configuration des Modules

### Fichier : `src/common/services/index.ts`

```typescript
export * from './otp.service';
export * from './email.service';
export * from './session.service';
```

### Fichier : `src/common/common.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { OtpService, EmailService, SessionService } from './services';

@Module({
    providers: [OtpService, EmailService, SessionService],
    exports: [OtpService, EmailService, SessionService],
})
export class CommonModule {}
```

### Fichier : `src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AtStrategy, RtStrategy } from './strategies';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from 'src/common/common.module';
import { LoginAttemptService } from './services/login-attempt.service';

@Module({
    imports: [
        JwtModule.register({ global: true }),
        CommonModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        AtStrategy,
        RtStrategy,
        LoginAttemptService,
    ],
})
export class AuthModule {}
```

---

## Résumé des fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `prisma/schema.prisma` | Ajouter champs `mfaEnabled`, `mfaSecret` |
| `src/common/types/session.types.ts` | Créer |
| `src/common/types/otp.types.ts` | Créer |
| `src/common/types/index.ts` | Créer |
| `src/common/services/session.service.ts` | Créer |
| `src/common/services/otp.service.ts` | Créer |
| `src/common/services/email.service.ts` | Créer |
| `src/common/services/index.ts` | Créer |
| `src/common/common.module.ts` | Modifier |
| `src/auth/services/login-attempt.service.ts` | Créer |
| `src/auth/dto/auth.dto.ts` | Créer/Modifier |
| `src/auth/dto/password-reset.dto.ts` | Créer |
| `src/auth/dto/mfa.dto.ts` | Créer |
| `src/auth/dto/index.ts` | Modifier |
| `src/auth/types/tokens.type.ts` | Modifier |
| `src/auth/strategies/at.strategy.ts` | Modifier |
| `src/auth/strategies/rt.strategy.ts` | Modifier |
| `src/auth/auth.service.ts` | Réécrire |
| `src/auth/auth.controller.ts` | Réécrire |
| `src/auth/auth.module.ts` | Modifier |

---

## Commandes finales

```bash
# 1. Installer les dépendances
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt argon2 otplib qrcode resend cache-manager cache-manager-redis-yet
pnpm add -D @types/passport-jwt @types/qrcode

# 2. Générer la migration Prisma
npx prisma migrate dev --name add_mfa_fields

# 3. Générer le client Prisma
npx prisma generate

# 4. Lancer l'application
pnpm run start:dev
```
