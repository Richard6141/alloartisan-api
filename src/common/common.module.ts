import { Module } from '@nestjs/common';
import {
    OtpService,
    EmailService,
    SessionService,
    CryptoService,
    CacheService,
    LogActiviteService,
} from './services';

@Module({
    providers: [
        OtpService,
        EmailService,
        SessionService,
        CryptoService,
        CacheService,
        LogActiviteService,
    ],
    exports: [
        OtpService,
        EmailService,
        SessionService,
        CryptoService,
        CacheService,
        LogActiviteService,
    ],
})
export class CommonModule {}
