import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { BullModule } from '@nestjs/bull';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { StorageService } from './storage.service';
import { ImageValidatorService } from './image-validator.service';
import { MulterConfigService } from './multer.config';
import { CloudinaryProvider } from './cloudinary.config';
import { UploadProcessor } from './upload.processor';
import { PrismaModule } from 'src/prisma/prisma.module';

@Global()
@Module({
    imports: [
        ConfigModule,
        PrismaModule,
        // Configuration Multer avec stockage disque
        MulterModule.registerAsync({
            imports: [ConfigModule],
            useClass: MulterConfigService,
        }),
        // Configuration Bull Queue pour traitement asynchrone
        BullModule.registerQueueAsync({
            name: 'upload',
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                redis: {
                    host: configService.get<string>('REDIS_HOST', 'localhost'),
                    port: configService.get<number>('REDIS_PORT', 6379),
                    password: configService.get<string>('REDIS_PASSWORD'),
                },
                defaultJobOptions: {
                    removeOnComplete: 100,
                    removeOnFail: 50,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                },
            }),
        }),
    ],
    controllers: [UploadController],
    providers: [
        CloudinaryProvider,
        UploadService,
        StorageService,
        ImageValidatorService,
        MulterConfigService,
        UploadProcessor,
    ],
    exports: [UploadService, StorageService, ImageValidatorService, MulterModule, BullModule],
})
export class UploadModule {}
