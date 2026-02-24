import { Module } from '@nestjs/common';
import { AvisService } from './avis.service';
import { AvisController } from './avis.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
    imports: [PrismaModule, NotificationModule],
    controllers: [AvisController],
    providers: [AvisService],
    exports: [AvisService],
})
export class AvisModule {}
