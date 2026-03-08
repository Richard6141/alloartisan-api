import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

interface LoginAttemptData {
    attempts: number;
    lockedUntil?: number;
}

@Injectable()
export class LoginAttemptService {
    private readonly MAX_ATTEMPTS = 5;
    private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    private readonly ATTEMPT_TTL = 15 * 60 * 1000; // Reset après 15 min d'inactivité

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    private getKey(email: string): string {
        return `login:attempts:${email.toLowerCase()}`;
    }

    async isLocked(email: string): Promise<boolean> {
        const data = await this.cacheManager.get<LoginAttemptData>(this.getKey(email));

        if (!data) return false;

        if (data.lockedUntil && Date.now() < data.lockedUntil) {
            return true;
        }

        return false;
    }

    async getRemainingLockTime(email: string): Promise<number> {
        const data = await this.cacheManager.get<LoginAttemptData>(this.getKey(email));

        if (!data?.lockedUntil) return 0;

        const remaining = Math.ceil((data.lockedUntil - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
    }

    async recordFailedAttempt(email: string): Promise<number> {
        const key = this.getKey(email);
        const data = await this.cacheManager.get<LoginAttemptData>(key);

        const attempts = (data?.attempts || 0) + 1;
        const remainingAttempts = this.MAX_ATTEMPTS - attempts;

        if (attempts >= this.MAX_ATTEMPTS) {
            await this.cacheManager.set(
                key,
                {
                    attempts,
                    lockedUntil: Date.now() + this.LOCKOUT_DURATION,
                },
                this.LOCKOUT_DURATION,
            );
        } else {
            await this.cacheManager.set(key, { attempts }, this.ATTEMPT_TTL);
        }

        return remainingAttempts > 0 ? remainingAttempts : 0;
    }

    async resetAttempts(email: string): Promise<void> {
        await this.cacheManager.del(this.getKey(email));
    }

    async getAttempts(email: string): Promise<number> {
        const data = await this.cacheManager.get<LoginAttemptData>(this.getKey(email));
        return data?.attempts || 0;
    }
}
