import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Configuration Helmet optimisée pour API REST
    app.use(
        helmet({
            // Désactiver CSP pour API (pas de contenu HTML)
            contentSecurityPolicy: false,
            // Empêcher l'ouverture dans un iframe (clickjacking)
            frameguard: { action: 'deny' },
            // HSTS - Force HTTPS en production
            hsts: {
                maxAge: 31536000, // 1 an
                includeSubDomains: true,
                preload: true,
            },
            // Cacher X-Powered-By header
            hidePoweredBy: true,
            // Empêcher le sniffing MIME
            noSniff: true,
            // Protection XSS
            xssFilter: true,
        }),
    );

    // Configuration CORS
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:4200',
    ];

    app.enableCors({
        origin: (
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void,
        ) => {
            // Autoriser les requêtes sans origin (Postman, curl, mobile apps)
            if (!origin) {
                callback(null, true);
                return;
            }
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
        maxAge: 86400, // Cache preflight 24h
    });

    // Validation globale
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Préfixe global pour tous les endpoints
    app.setGlobalPrefix('api/v1');

    await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
