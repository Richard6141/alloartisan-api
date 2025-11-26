import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as argon from 'argon2';
import { OtpType, StoredOtpData } from '../types';

@Injectable()
export class OtpService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    /**
     * Génère un code OTP aléatoire (6 chiffres par défaut)
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
     * Génère la clé Redis pour stocker l'OTP
     */
    private getRedisKey(userId: string, type: OtpType): string {
        return `otp:${userId}:${type}`;
    }

    /**
     * Crée et stocke un nouveau OTP dans Redis
     * @param userId - ID de l'utilisateur
     * @param type - Type d'OTP
     * @param ttl - Durée de vie en secondes (par défaut 10 minutes)
     * @returns Le code OTP en clair (à envoyer par email/SMS)
     */
    async create(
        userId: string,
        type: OtpType,
        ttl: number = 600, // 10 minutes par défaut
    ): Promise<string> {
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

        return code; // Retourne le code en clair pour l'envoyer
    }

    /**
     * Vérifie un code OTP
     * @param userId - ID de l'utilisateur
     * @param type - Type d'OTP
     * @param code - Code à vérifier
     * @returns true si valide, false sinon
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

        // Calculer le TTL restant (10 minutes depuis la création)
        const ttlMs = 600 * 1000; // 10 minutes en millisecondes
        const elapsed = Date.now() - otpData.createdAt;
        const remainingTtl = Math.max(ttlMs - elapsed, 1000); // Au moins 1 seconde

        await this.cacheManager.set(key, JSON.stringify(otpData), remainingTtl);

        // Vérifier le code
        const isValid = await argon.verify(otpData.codeHash, code);

        if (isValid) {
            // Supprimer l'OTP après vérification réussie
            await this.cacheManager.del(key);
            return true;
        }

        return false;
    }

    /**
     * Supprime un OTP (utile pour annuler/révoquer)
     */
    async revoke(userId: string, type: OtpType): Promise<void> {
        const key = this.getRedisKey(userId, type);
        await this.cacheManager.del(key);
    }

    /**
     * Vérifie si un OTP existe pour un utilisateur et un type donnés
     */
    async exists(userId: string, type: OtpType): Promise<boolean> {
        const key = this.getRedisKey(userId, type);
        const data: string | undefined = await this.cacheManager.get(key);
        return data !== undefined && data !== null;
    }
}
