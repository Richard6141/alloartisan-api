import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma.health';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisHealthIndicator } from './redis.health';
import { BullHealthIndicator } from './bull.health';
import { CloudinaryHealthIndicator } from './cloudinary.health';
import { UploadModule } from 'src/upload/upload.module';

@Module({
    imports: [TerminusModule, PrismaModule, UploadModule],
    controllers: [HealthController],
    providers: [
        PrismaHealthIndicator,
        RedisHealthIndicator,
        BullHealthIndicator,
        CloudinaryHealthIndicator,
    ],
})
export class HealthModule {}
