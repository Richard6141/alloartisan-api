import { Module } from '@nestjs/common';
import { ArtisansService } from './artisans.service';
import { ArtisansController } from './artisans.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { CommonModule } from 'src/common/common.module';
import { UploadModule } from 'src/upload/upload.module';

@Module({
    imports: [CommonModule, UploadModule],
    controllers: [ArtisansController, PortfolioController],
    providers: [ArtisansService, PortfolioService],
    exports: [ArtisansService, PortfolioService],
})
export class ArtisansModule {}
