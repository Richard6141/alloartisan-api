import { Module } from '@nestjs/common';
import { ArtisansService } from './artisans.service';
import { ArtisansController } from './artisans.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { CommonModule } from 'src/common/common.module';
import { UploadModule } from 'src/upload/upload.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
    imports: [CommonModule, UploadModule, NotificationModule],
    controllers: [ArtisansController, PortfolioController],
    providers: [ArtisansService, PortfolioService],
    exports: [ArtisansService, PortfolioService],
})
export class ArtisansModule {}
