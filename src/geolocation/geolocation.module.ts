import { Module } from '@nestjs/common';
import { GeolocationService } from './geolocation.service';
import { GeolocationController } from './geolocation.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [GeolocationController],
    providers: [GeolocationService],
    exports: [GeolocationService],
})
export class GeolocationModule {}
