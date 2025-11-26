import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
    private client: PrismaClient;
    private pool: Pool;

    constructor(config: ConfigService) {
        this.pool = new Pool({
            connectionString: config.getOrThrow('DATABASE_URL'),
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
}
