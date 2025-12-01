import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { ArtisansModule } from './artisans/artisans.module';
import { PrismaModule } from './prisma/prisma.module';
import { AtGuard } from './common/guards';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CommonModule } from './common/common.module';
import { UserController } from './users/user.controller';

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
        CommonModule,
        AuthModule,
        UserModule,
        ArtisansModule,
        PrismaModule,
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
    ],
    controllers: [UserController],
})
export class AppModule {}
