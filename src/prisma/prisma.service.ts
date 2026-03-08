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
            max: config.get('DB_POOL_MAX', 20),
            idleTimeoutMillis: config.get('DB_POOL_IDLE_TIMEOUT', 30000),
            connectionTimeoutMillis: config.get('DB_POOL_CONNECTION_TIMEOUT', 5000),
            allowExitOnIdle: true,
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

    // ===== TRANSACTIONS & RAW =====

    get $transaction() {
        return this.client.$transaction.bind(this.client);
    }

    get $queryRaw() {
        return this.client.$queryRaw.bind(this.client);
    }

    get $executeRaw() {
        return this.client.$executeRaw.bind(this.client);
    }

    // ===== MODÈLES EXISTANTS =====

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

    get certification() {
        return this.client.certification;
    }

    // ===== SPRINT 1 — NOUVEAUX MODÈLES =====

    get booking() {
        return this.client.booking;
    }

    get transaction() {
        return this.client.transaction;
    }

    get avis() {
        return this.client.avis;
    }

    get conversation() {
        return this.client.conversation;
    }

    get message() {
        return this.client.message;
    }

    get notification() {
        return this.client.notification;
    }

    get fcmToken() {
        return this.client.fcmToken;
    }

    get favori() {
        return this.client.favori;
    }

    get logActivite() {
        return this.client.logActivite;
    }
}
