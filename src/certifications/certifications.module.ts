import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CertificationsController } from './certifications.controller';
import { CertificationsService } from './certifications.service';
import { NotificationModule } from 'src/notification/notification.module';
import { FraudModule } from 'src/fraud/fraud.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'upload',
        }),
        NotificationModule,
        FraudModule,
    ],
    controllers: [CertificationsController],
    providers: [CertificationsService],
    exports: [CertificationsService],
})
export class CertificationsModule {}
