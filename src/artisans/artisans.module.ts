import { Module } from '@nestjs/common';
import { ArtisansService } from './artisans.service';
import { ArtisansController } from './artisans.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
    imports: [CommonModule],
    controllers: [ArtisansController],
    providers: [ArtisansService],
    exports: [ArtisansService],
})
export class ArtisansModule { }
