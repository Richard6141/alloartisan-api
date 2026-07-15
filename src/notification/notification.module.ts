import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MessagingModule } from 'src/messaging/messaging.module';
import { PushModule } from 'src/push/push.module';

@Module({
    // MessagingModule fournit la gateway WebSocket (push temps réel in-app).
    // PushModule fournit l'envoi FCM (partagé avec la messagerie, sans cycle).
    imports: [PrismaModule, MessagingModule, PushModule],
    controllers: [NotificationController],
    providers: [NotificationService],
    // NotificationService est exporté pour être utilisé dans BookingService, etc.
    exports: [NotificationService],
})
export class NotificationModule {}
