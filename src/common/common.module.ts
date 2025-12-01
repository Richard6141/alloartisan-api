import { Module } from '@nestjs/common';
import { OtpService, EmailService, SessionService, CryptoService } from './services';

@Module({
    providers: [OtpService, EmailService, SessionService, CryptoService],
    exports: [OtpService, EmailService, SessionService, CryptoService],
})
export class CommonModule {}
