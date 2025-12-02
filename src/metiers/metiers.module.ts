import { Module } from '@nestjs/common';
import { MetiersService } from './metiers.service';
import { MetiersController } from './metiers.controller';

@Module({
    controllers: [MetiersController],
    providers: [MetiersService],
    exports: [MetiersService],
})
export class MetiersModule {}
