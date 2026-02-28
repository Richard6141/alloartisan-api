import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { redisStore } from 'cache-manager-redis-yet';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { ArtisansModule } from './artisans/artisans.module';
import { CategoriesMetiersModule } from './categories-metiers/categories-metiers.module';
import { MetiersModule } from './metiers/metiers.module';
import { CertificationsModule } from './certifications/certifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { UploadModule } from './upload/upload.module';
import { BookingModule } from './booking/booking.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { NotificationModule } from './notification/notification.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { FavorisModule } from './favoris/favoris.module';
import { PaymentModule } from './payment/payment.module';
import { AvisModule } from './avis/avis.module';
import { MessagingModule } from './messaging/messaging.module';
import { AdminModule } from './admin/admin.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FraudModule } from './fraud/fraud.module';
import { AtGuard } from './common/guards';
import { CommonModule } from './common/common.module';
import { AuditLogInterceptor } from './common/interceptors';
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                store: await redisStore({
                    socket: {
                        host: config.get('REDIS_HOST', 'localhost'),
                        port: config.get('REDIS_PORT', 6379),
                    },
                    password: config.get('REDIS_PASSWORD'),
                }),
            }),
        }),
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                throttlers: [
                    {
                        name: 'short',
                        ttl: config.get<number>('THROTTLE_SHORT_TTL', 1000),
                        limit: config.get<number>('THROTTLE_SHORT_LIMIT', 3),
                    },
                    {
                        name: 'medium',
                        ttl: config.get<number>('THROTTLE_MEDIUM_TTL', 10000),
                        limit: config.get<number>('THROTTLE_MEDIUM_LIMIT', 20),
                    },
                    {
                        name: 'long',
                        ttl: config.get<number>('THROTTLE_LONG_TTL', 60000),
                        limit: config.get<number>('THROTTLE_LONG_LIMIT', 100),
                    },
                ],
            }),
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                redis: {
                    host: config.get<string>('REDIS_HOST', 'localhost'),
                    port: config.get<number>('REDIS_PORT', 6379),
                    password: config.get<string>('REDIS_PASSWORD'),
                },
            }),
        }),
        CommonModule,
        PrismaModule,
        AuthModule,
        UserModule,
        ArtisansModule,
        CategoriesMetiersModule,
        MetiersModule,
        CertificationsModule,
        UploadModule,
        BookingModule,
        SchedulerModule,
        NotificationModule,
        GeolocationModule,
        FavorisModule,
        PaymentModule,
        AvisModule,
        MessagingModule,
        SubscriptionsModule,
        AdminModule,
        FraudModule,
        HealthModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AtGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: AuditLogInterceptor,
        },
    ],
})
export class AppModule {}
