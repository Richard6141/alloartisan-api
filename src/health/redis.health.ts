import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
        super();
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        const probeKey = `health:redis:${Date.now()}`;

        try {
            await this.cacheManager.set(probeKey, 'ok', 5000);
            const value = await this.cacheManager.get<string>(probeKey);
            await this.cacheManager.del(probeKey);

            const isHealthy = value === 'ok';
            if (!isHealthy) {
                throw new Error('Redis cache write/read probe failed');
            }

            return this.getStatus(key, true);
        } catch (error) {
            throw new HealthCheckError(
                'Redis check failed',
                this.getStatus(key, false, {
                    message: error instanceof Error ? error.message : 'Unknown error',
                }),
            );
        }
    }
}
