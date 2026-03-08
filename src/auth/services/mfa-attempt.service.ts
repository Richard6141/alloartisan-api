import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

interface MfaAttemptData {
    attempts: number;
    lockedUntil?: number;
}

@Injectable()
export class MfaAttemptService {
    private readonly MAX_ATTEMPTS = 3;
    private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    private readonly ATTEMPT_TTL = 5 * 60 * 1000; // 5 minutes (durée du mfa_token)

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    private getKey(userId: string): string {
        return `mfa:attempts:${userId}`;
    }

    async isLocked(userId: string): Promise<boolean> {
        const data = await this.cacheManager.get<MfaAttemptData>(this.getKey(userId));

        if (!data) return false;

        if (data.lockedUntil && Date.now() < data.lockedUntil) {
            return true;
        }

        return false;
    }

    async getRemainingLockTime(userId: string): Promise<number> {
        const data = await this.cacheManager.get<MfaAttemptData>(this.getKey(userId));

        if (!data?.lockedUntil) return 0;

        const remaining = Math.ceil((data.lockedUntil - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
    }

    async recordFailedAttempt(userId: string): Promise<number> {
        const key = this.getKey(userId);
        const data = await this.cacheManager.get<MfaAttemptData>(key);

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

    async resetAttempts(userId: string): Promise<void> {
        await this.cacheManager.del(this.getKey(userId));
    }
}
