import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CommonModule } from 'src/common/common.module';
import { NotificationModule } from 'src/notification/notification.module';

/**
 * TrackingModule — Suivi temps réel des déplacements artisans
 *
 * Fournit :
 * - TrackingGateway    : WebSocket Socket.io namespace /tracking
 * - TrackingService    : positions live (Redis), phases, calcul ETA
 * - TrackingController : API REST fallback (cold start / polling)
 *
 * Les positions sont éphémères (Redis, TTL 30 min) — aucune donnée de
 * déplacement n'est conservée en base.
 */
@Module({
    imports: [
        PrismaModule,
        CommonModule,
        NotificationModule,
        // JwtModule nécessaire pour vérifier le token JWT sur la connexion WebSocket
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow('JWT_ACCESS_SECRET'),
            }),
        }),
    ],
    providers: [TrackingGateway, TrackingService],
    controllers: [TrackingController],
    exports: [TrackingService],
})
export class TrackingModule {}
