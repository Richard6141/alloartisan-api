import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [NotificationController],
    providers: [NotificationService],
    // NotificationService est exporté pour être utilisé dans BookingService, etc.
    exports: [NotificationService],
})
export class NotificationModule {}
