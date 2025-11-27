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

    private getSessionKey(userId: string, sessionId: string): string {
        return `session:${userId}:${sessionId}`;
    }

    private getUserSessionsKey(userId: string): string {
        return `sessions:${userId}`;
    }

    /**
     * Crée une nouvelle session
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

        // Ajouter l'ID de session à la liste des sessions de l'utilisateur
        await this.addSessionToUserList(input.userId, sessionId);

        // Nettoyer les anciennes sessions si limite dépassée
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

        // Mettre à jour la liste pour ne garder que la session courante
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

    private async getUserSessionIds(userId: string): Promise<string[]> {
        const userSessionsKey = this.getUserSessionsKey(userId);
        const data = await this.cacheManager.get<string>(userSessionsKey);
        return data ? (JSON.parse(data) as string[]) : [];
    }

    private async addSessionToUserList(userId: string, sessionId: string): Promise<void> {
        const sessionIds = await this.getUserSessionIds(userId);
        sessionIds.push(sessionId);
        const userSessionsKey = this.getUserSessionsKey(userId);
        await this.cacheManager.set(userSessionsKey, JSON.stringify(sessionIds), this.SESSION_TTL);
    }

    private async removeSessionFromUserList(userId: string, sessionId: string): Promise<void> {
        const sessionIds = await this.getUserSessionIds(userId);
        const filtered = sessionIds.filter((id) => id !== sessionId);
        const userSessionsKey = this.getUserSessionsKey(userId);
        await this.cacheManager.set(userSessionsKey, JSON.stringify(filtered), this.SESSION_TTL);
    }

    private async enforceSessionLimit(userId: string): Promise<void> {
        const sessionIds = await this.getUserSessionIds(userId);

        if (sessionIds.length <= this.MAX_SESSIONS_PER_USER) {
            return;
        }

        // Récupérer les sessions avec leur lastUsedAt
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
