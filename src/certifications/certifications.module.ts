import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CertificationsController } from './certifications.controller';
import { CertificationsService } from './certifications.service';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'upload',
        }),
    ],
    controllers: [CertificationsController],
    providers: [CertificationsService],
    exports: [CertificationsService],
})
export class CertificationsModule {}
