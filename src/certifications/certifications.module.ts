import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CertificationsController } from './certifications.controller';
import { CertificationsService } from './certifications.service';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'upload',
        }),
        NotificationModule,
    ],
    controllers: [CertificationsController],
    providers: [CertificationsService],
    exports: [CertificationsService],
})
export class CertificationsModule {}
