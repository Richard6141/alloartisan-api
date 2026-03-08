import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class BullHealthIndicator extends HealthIndicator {
    constructor(@InjectQueue('upload') private readonly uploadQueue: Queue) {
        super();
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        try {
            await this.uploadQueue.getJobCounts();
            return this.getStatus(key, true, { queue: 'upload' });
        } catch (error) {
            throw new HealthCheckError(
                'Bull queue check failed',
                this.getStatus(key, false, {
                    queue: 'upload',
                    message: error instanceof Error ? error.message : 'Unknown error',
                }),
            );
        }
    }
}
