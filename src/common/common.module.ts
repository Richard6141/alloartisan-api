import { Module } from '@nestjs/common';
import { OtpService } from './services';

@Module({
    providers: [OtpService],
    exports: [OtpService],
})
export class CommonModule {}
