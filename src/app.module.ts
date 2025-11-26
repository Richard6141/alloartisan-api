import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ArtisansModule } from './artisans/artisans.module';
import { PrismaModule } from './prisma/prisma.module';
import { AtGuard } from './common/guards';
import { MailerModule } from '@nestjs-modules/mailer';

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
        MailerModule.forRoot({
            transport: {
                host: process.env.MAIL_HOST,
                port: Number(process.env.MAIL_PORT),
                secure: false,
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                },
            },
            defaults: {
                from: '"NoReply | AlloArtisan" <vlavonou@e-bd.de>',
            },
        }),
        AuthModule,
        UsersModule,
        ArtisansModule,
        PrismaModule,
    ],
    providers: [
        {
            provide: 'APP_GUARD',
            useClass: AtGuard,
        },
    ],
})
export class AppModule { }
