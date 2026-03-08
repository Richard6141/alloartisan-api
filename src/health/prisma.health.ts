import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Health indicator pour la base de données PostgreSQL via PrismaService.
 */
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        try {
            // Requête légère pour valider la connexion BDD
            await this.prisma.$queryRaw`SELECT 1`;
            return this.getStatus(key, true);
        } catch (error) {
            throw new HealthCheckError(
                'Database check failed',
                this.getStatus(key, false, {
                    message: error instanceof Error ? error.message : 'Unknown error',
                }),
            );
        }
    }
}
