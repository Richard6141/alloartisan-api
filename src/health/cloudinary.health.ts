import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class CloudinaryHealthIndicator extends HealthIndicator {
    constructor(private readonly configService: ConfigService) {
        super();
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
        const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
        const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

        if (!cloudName || !apiKey || !apiSecret) {
            return this.getStatus(key, true, {
                skipped: true,
                reason: 'cloudinary_not_configured',
            });
        }

        try {
            cloudinary.config({
                cloud_name: cloudName,
                api_key: apiKey,
                api_secret: apiSecret,
            });

            await cloudinary.api.ping();
            return this.getStatus(key, true);
        } catch (error) {
            throw new HealthCheckError(
                'Cloudinary check failed',
                this.getStatus(key, false, {
                    message: error instanceof Error ? error.message : 'Unknown error',
                }),
            );
        }
    }
}
