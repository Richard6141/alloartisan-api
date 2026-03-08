import { Module } from '@nestjs/common';
import { FavorisService } from './favoris.service';
import { FavorisController } from './favoris.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FavorisController],
    providers: [FavorisService],
    exports: [FavorisService],
})
export class FavorisModule {}
