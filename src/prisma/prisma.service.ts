import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);
    private client: PrismaClient;
    private pool: Pool;

    constructor(config: ConfigService) {
        // Configuration optimisée du pool de connexions
        this.pool = new Pool({
            connectionString: config.getOrThrow('DATABASE_URL'),
            max: config.get('DB_POOL_MAX', 20), // Nombre max de connexions
            idleTimeoutMillis: config.get('DB_POOL_IDLE_TIMEOUT', 30000), // Fermer connexions inactives après 30s
            connectionTimeoutMillis: config.get('DB_POOL_CONNECTION_TIMEOUT', 5000), // Timeout d'acquisition 5s
            allowExitOnIdle: true, // Permettre la fermeture propre en cas d'inactivité
        });

        // Log des événements du pool pour le monitoring
        this.pool.on('error', (err) => {
            this.logger.error('Unexpected pool error:', err);
        });

        this.pool.on('connect', () => {
            this.logger.debug('New client connected to pool');
        });

        const adapter = new PrismaPg(this.pool);
        this.client = new PrismaClient({ adapter });
    }

    async onModuleInit() {
        await this.client.$connect();
    }

    async onModuleDestroy() {
        await this.client.$disconnect();
        await this.pool.end();
    }

    get user() {
        return this.client.user;
    }

    get categorieMetier() {
        return this.client.categorieMetier;
    }

    get metier() {
        return this.client.metier;
    }

    get artisan() {
        return this.client.artisan;
    }

    get artisanMetier() {
        return this.client.artisanMetier;
    }
}
