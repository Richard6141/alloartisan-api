import { Module } from '@nestjs/common';
import { OtpService, EmailService, SessionService, CryptoService, CacheService } from './services';

@Module({
    providers: [OtpService, EmailService, SessionService, CryptoService, CacheService],
    exports: [OtpService, EmailService, SessionService, CryptoService, CacheService],
})
export class CommonModule {}
