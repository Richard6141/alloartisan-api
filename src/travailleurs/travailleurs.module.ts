import { Module } from '@nestjs/common';
import { TravailleursController } from './travailleurs.controller';
import { TravailleursService } from './travailleurs.service';
import { AnnoncesController } from './annonces.controller';
import { AnnoncesService } from './annonces.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
    imports: [PrismaModule, NotificationModule],
    controllers: [TravailleursController, AnnoncesController],
    providers: [TravailleursService, AnnoncesService],
})
export class TravailleursModule {}
