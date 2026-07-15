import { Module } from '@nestjs/common';
import { PushService } from './push.service';
import { PrismaModule } from 'src/prisma/prisma.module';

/**
 * PushModule — envoi FCM isolé, sans dépendance vers Notification/Messaging.
 * Importé par les deux, il casse le cycle Notification <-> Messaging.
 */
@Module({
    imports: [PrismaModule],
    providers: [PushService],
    exports: [PushService],
})
export class PushModule {}
