import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { createKeyv } from '@keyv/redis';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserThrottlerGuard } from './common/guards/user-throttler.guard';
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
import { TravailleursModule } from './travailleurs/travailleurs.module';
import { TrackingModule } from './tracking/tracking.module';
import { DemandesExpressModule } from './demandes-express/demandes-express.module';
import { PromoModule } from './promo/promo.module';
import { AdminModule } from './admin/admin.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FraudModule } from './fraud/fraud.module';
import { SearchModule } from './search/search.module';
import { AtGuard } from './common/guards';
import { CommonModule } from './common/common.module';
import { AuditLogInterceptor } from './common/interceptors';
import { HealthModule } from './health/health.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
    imports: [
        // Back-office admin (export statique Next.js) servi sous /admin, même
        // origine que l'API → aucun CORS. Les fichiers sont déposés dans
        // <racine app>/admin-public au déploiement. serveRoot limite l'effet à
        // /admin (n'intercepte jamais /api/v1).
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'admin-public'),
            serveRoot: '/admin',
            serveStaticOptions: { index: 'index.html', redirect: true },
        }),
        ConfigModule.forRoot({ isGlobal: true }),
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                // cache-manager v7 : store Redis via Keyv (`stores: [...]`).
                // ⚠️ L'ancienne API `{ store: redisStore(...) }` (v5) était IGNORÉE
                // par cache-manager v7 → tout le cache (dont les SESSIONS) tombait
                // en MÉMOIRE → sessions perdues au recyclage du process Passenger
                // → refresh 403 → déconnexion après quelques heures d'inactivité.
                const host = config.get<string>('REDIS_HOST', 'localhost');
                const port = config.get<number>('REDIS_PORT', 6379);
                const password = config.get<string>('REDIS_PASSWORD') || undefined;
                const keyv = createKeyv({
                    url: `redis://${host}:${port}`,
                    password,
                    pingInterval: 60000, // PING périodique : la connexion ne devient jamais inactive
                    socket: {
                        keepAlive: 30000,
                        reconnectStrategy: (retries: number) => Math.min(retries * 200, 5000),
                    },
                });
                // Sans gestionnaire, un ECONNRESET sur ce client crasherait le
                // serveur ("Unhandled 'error' event"). Il se reconnecte seul.
                keyv.on('error', (err: Error) => {
                    console.error(`[CacheRedis] ${err?.message ?? err} (reconnexion automatique)`);
                });
                return { stores: [keyv] };
            },
        }),
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                // Limites PAR UTILISATEUR (voir UserThrottlerGuard). Une app
                // mobile ouvre plusieurs requêtes en rafale (liste + détail +
                // notifs) et rafraîchit périodiquement : des limites trop basses
                // (3/s) provoquaient des 429 en usage normal. Ces valeurs
                // laissent respirer l'app tout en bloquant un vrai abus.
                throttlers: [
                    {
                        name: 'short',
                        ttl: config.get<number>('THROTTLE_SHORT_TTL', 1000),
                        limit: config.get<number>('THROTTLE_SHORT_LIMIT', 30),
                    },
                    {
                        name: 'medium',
                        ttl: config.get<number>('THROTTLE_MEDIUM_TTL', 10000),
                        limit: config.get<number>('THROTTLE_MEDIUM_LIMIT', 150),
                    },
                    {
                        name: 'long',
                        ttl: config.get<number>('THROTTLE_LONG_TTL', 60000),
                        limit: config.get<number>('THROTTLE_LONG_LIMIT', 600),
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
        DemandesExpressModule,
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
        TravailleursModule,
        TrackingModule,
        PromoModule,
        SubscriptionsModule,
        AdminModule,
        FraudModule,
        SearchModule,
        HealthModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AtGuard,
        },
        {
            provide: APP_GUARD,
            useClass: UserThrottlerGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: AuditLogInterceptor,
        },
    ],
})
export class AppModule {}
