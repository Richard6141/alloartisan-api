import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessagingGateway } from './messaging.gateway';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

/**
 * MessagingModule — Messagerie temps réel (Sprint 5)
 *
 * Fournit :
 * - MessagingGateway  : WebSocket Socket.io namespace /chat
 * - MessagingService  : Logique métier (conversations, messages, lu/non-lu)
 * - MessagingController : API REST fallback
 *
 * Exporte MessagingGateway pour permettre aux autres modules
 * (ex: NotificationModule) d'émettre des événements WS directement.
 */
@Module({
    imports: [
        PrismaModule,
        // JwtModule nécessaire pour vérifier le token JWT sur la connexion WebSocket
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow('JWT_ACCESS_SECRET'),
            }),
        }),
    ],
    providers: [MessagingGateway, MessagingService],
    controllers: [MessagingController],
    exports: [MessagingGateway, MessagingService],
})
export class MessagingModule {}
