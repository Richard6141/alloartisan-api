import { Module } from '@nestjs/common';
import { OtpService, EmailService } from './services';

@Module({
    providers: [OtpService, EmailService],
    exports: [OtpService, EmailService],
})
export class CommonModule {}
