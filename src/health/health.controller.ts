import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    MemoryHealthIndicator,
    DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from 'src/common/decorators';
import { PrismaHealthIndicator } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';
import { BullHealthIndicator } from './bull.health';
import { CloudinaryHealthIndicator } from './cloudinary.health';

/**
 * Health Check Controller
 * GET /health -> etat des dependances critiques
 */
@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly prismaIndicator: PrismaHealthIndicator,
        private readonly redisIndicator: RedisHealthIndicator,
        private readonly bullIndicator: BullHealthIndicator,
        private readonly cloudinaryIndicator: CloudinaryHealthIndicator,
        private readonly memory: MemoryHealthIndicator,
        private readonly disk: DiskHealthIndicator,
    ) {}

    @Get()
    @Public()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.prismaIndicator.isHealthy('database'),
            () => this.redisIndicator.isHealthy('redis'),
            () => this.bullIndicator.isHealthy('bull_queue'),
            () => this.cloudinaryIndicator.isHealthy('cloudinary'),
            () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
            () =>
                this.disk.checkStorage('storage', {
                    thresholdPercent: 0.9,
                    path: process.platform === 'win32' ? 'C:\\' : '/',
                }),
        ]);
    }
}
