import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CommonModule } from 'src/common/common.module';
import { UploadThrottleGuard, UploadSizeLimitGuard } from 'src/upload/guards/upload-throttle.guard';

@Module({
    imports: [
        CommonModule,
        BullModule.registerQueue({
            name: 'upload',
        }),
    ],
    controllers: [UserController],
    providers: [UserService, UploadThrottleGuard, UploadSizeLimitGuard],
})
export class UserModule {}
