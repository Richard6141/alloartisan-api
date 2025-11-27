import { Module } from '@nestjs/common';
import { OtpService, EmailService, SessionService } from './services';

@Module({
    providers: [OtpService, EmailService, SessionService],
    exports: [OtpService, EmailService, SessionService],
})
export class CommonModule {}
