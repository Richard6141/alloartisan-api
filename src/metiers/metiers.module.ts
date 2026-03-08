import { Module } from '@nestjs/common';
import { MetiersService } from './metiers.service';
import { MetiersController } from './metiers.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
    imports: [CommonModule],
    controllers: [MetiersController],
    providers: [MetiersService],
    exports: [MetiersService],
})
export class MetiersModule {}
