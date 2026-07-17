import { Module } from '@nestjs/common';
import { DemandesExpressService } from './demandes-express.service';
import { DemandesExpressController } from './demandes-express.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
    imports: [PrismaModule, NotificationModule],
    controllers: [DemandesExpressController],
    providers: [DemandesExpressService],
    exports: [DemandesExpressService],
})
export class DemandesExpressModule {}
