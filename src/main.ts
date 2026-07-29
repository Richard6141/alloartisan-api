import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { apiReference } from '@scalar/nestjs-api-reference';
import { join } from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { swaggerCustomCss, swaggerCustomJs } from './docs/swagger-ui.config';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';

async function bootstrap() {
    // Filet de sécurité : un incident isolé (socket Redis coupé, promesse
    // oubliée) ne doit JAMAIS tuer l'API entière. On loggue fort, on continue.
    const processLogger = new Logger('Process');
    process.on('unhandledRejection', (reason) => {
        processLogger.error(
            `Promesse rejetée non gérée : ${reason instanceof Error ? reason.stack : String(reason)}`,
        );
    });
    process.on('uncaughtException', (err) => {
        processLogger.error(`Exception non capturée : ${err.stack ?? err.message}`);
    });

    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    // derrière reverse proxy (Plesk/Passenger) : req.ip = vraie IP client
    app.set('trust proxy', 1);
    app.enableShutdownHooks();

    // WebSockets scalables multi-instances (chat + tracking) via Redis pub/sub
    const redisHost = process.env.REDIS_HOST ?? 'localhost';
    const redisPort = process.env.REDIS_PORT ?? '6379';
    const redisPassword = process.env.REDIS_PASSWORD;
    const redisUrl = redisPassword
        ? `redis://:${encodeURIComponent(redisPassword)}@${redisHost}:${redisPort}`
        : `redis://${redisHost}:${redisPort}`;
    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis(redisUrl);
    app.useWebSocketAdapter(redisIoAdapter);

    // Servir les fichiers statiques (logo, favicon)
    app.useStaticAssets(join(__dirname, '..', 'public'));

    // Compression des reponses (gzip/deflate)
    // Reduit significativement la taille des payloads JSON
    app.use(
        compression({
            // Compresser uniquement si > 1KB
            threshold: 1024,
            // Niveau de compression (1-9, 6 est un bon compromis vitesse/taille)
            level: 6,
            // Ne pas compresser si le client ne supporte pas
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression.filter(req, res);
            },
        }),
    );

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
        'http://localhost:3001',
        'http://localhost:3002', // back-office admin (dev)
        'http://localhost:4200',
    ];

    const port = process.env.PORT ?? 3001;

    app.enableCors({
        origin: (
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void,
        ) => {
            // Autoriser les requêtes sans origin (Postman, curl, mobile apps, Swagger UI same-origin)
            if (!origin) {
                callback(null, true);
                return;
            }
            // Autoriser same-origin pour Scalar/Swagger (documentation API)
            if (origin === `http://localhost:${port}`) {
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

    app.useGlobalFilters(new HttpExceptionFilter());

    // Préfixe global pour tous les endpoints
    app.setGlobalPrefix('api/v1');

    // Configuration Swagger
    const config = new DocumentBuilder()
        .setTitle('Allo Artisan API')
        .setDescription(
            `API REST pour la plateforme Allo Artisan.

## Authentification
Cette API utilise JWT Bearer Token pour l'authentification.
- Obtenez un token via \`POST /api/v1/auth/login\`
- Incluez le token dans le header : \`Authorization: Bearer <token>\`

## Rate Limiting
- **Short** : 3 requêtes/seconde
- **Medium** : 20 requêtes/10 secondes
- **Long** : 100 requêtes/minute`,
        )
        .setVersion('1.0')
        .addServer(`http://localhost:${port}`, 'Local Development')
        .setContact('Allo Artisan', 'https://alloartisan.com', 'contact@alloartisan.com')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'Authorization',
                description: 'Entrez votre JWT token',
                in: 'header',
            },
            'access-token',
        )
        .addTag('Auth', 'Authentification et gestion des sessions')
        .addTag('Users', 'Gestion du profil utilisateur')
        .addTag('Artisans', 'Gestion des artisans')
        .build();

    const document = SwaggerModule.createDocument(app, config);

    const customCss = swaggerCustomCss;
    const customJs = swaggerCustomJs;

    SwaggerModule.setup('docs', app, document, {
        customSiteTitle: 'Allo Artisan API Docs',
        customfavIcon: '/favicon.svg',
        customCss,
        customJs,
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'list',
            filter: true,
            showRequestDuration: true,
            syntaxHighlight: {
                activate: true,
                theme: 'monokai',
            },
        },
    });

    // Configuration Scalar - Documentation moderne avec sidebar et Try it
    app.use(
        '/reference',
        apiReference({
            content: document,
            theme: 'kepler',
            darkMode: true,
            hideDarkModeToggle: false,
            hideModels: false,
            hideDownloadButton: true,
            hideClientButton: true,
            hideTestRequestButton: false,
            hiddenClients: true,
            showSidebar: true,
            customCss: `
                :root {
                    --scalar-color-1: #FF6B35;
                    --scalar-color-2: #2D3436;
                    --scalar-color-3: #636E72;
                    --scalar-color-accent: #FF6B35;
                    --scalar-color-green: #00B894;
                    --scalar-color-red: #D63031;
                    --scalar-color-yellow: #FDCB6E;
                    --scalar-color-blue: #74B9FF;
                    --scalar-color-orange: #FF6B35;
                    --scalar-background-1: #FFFFFF;
                    --scalar-background-2: #FAFAFA;
                    --scalar-background-3: #F0F0F0;
                    --scalar-border-color: #E0E0E0;
                    --scalar-sidebar-background: #FAFAFA;
                    --scalar-card-background: #FFFFFF;
                }
                .dark-mode {
                    --scalar-background-1: #1E272E;
                    --scalar-background-2: #2D3436;
                    --scalar-background-3: #3D4852;
                    --scalar-border-color: #3D4852;
                    --scalar-sidebar-background: #1E272E;
                    --scalar-card-background: #2D3436;
                }
                .sidebar-heading {
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 11px;
                    letter-spacing: 0.5px;
                }
                .scalar-card {
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }
                .http-method-badge {
                    border-radius: 6px;
                    font-weight: 600;
                }
                /* Masquer "Powered by Scalar" et les boutons indésirables */
                .scalar-api-reference__powered-by,
                [class*="powered-by"],
                [class*="PoweredBy"],
                a[href*="scalar.com"],
                /* Masquer Developer Tools, Share, Generate SDKs, Configure */
                [class*="developer"],
                [class*="Developer"],
                [class*="share"],
                [class*="Share"]:not([class*="SharePoint"]),
                [class*="sdk"],
                [class*="Sdk"],
                [class*="SDK"],
                [class*="configure"],
                [class*="Configure"],
                [class*="settings"],
                [class*="Settings"],
                [class*="client-libraries"],
                [class*="ClientLibraries"],
                [class*="code-generator"],
                [class*="CodeGenerator"],
                /* Boutons du header Scalar */
                .scalar-header-actions button:not([class*="dark"]):not([class*="Dark"]),
                .t-doc__header-actions > *:not([class*="theme"]),
                [data-v-inspector],
                .scalar-button-group,
                /* Menu dropdown et options */
                [class*="dropdown"][class*="menu"],
                [class*="Dropdown"][class*="Menu"],
                .more-options,
                .options-menu {
                    display: none !important;
                }
                /* Header personnalisé avec infos statiques */
                .references-header::before {
                    content: 'Version 1.0 | Environnement: Développement | Contact: contact@alloartisan.com';
                    display: block;
                    background: linear-gradient(135deg, var(--scalar-color-1), #E85A2A);
                    color: white;
                    padding: 8px 16px;
                    font-size: 12px;
                    text-align: center;
                    font-weight: 500;
                }
                /* Footer personnalisé */
                body::after {
                    content: 'Développé par Richard SALANON | Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}';
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: var(--scalar-background-2);
                    border-top: 1px solid var(--scalar-border-color);
                    padding: 10px 16px;
                    font-size: 12px;
                    color: var(--scalar-color-3);
                    text-align: center;
                    z-index: 1000;
                }
            `,
            metaData: {
                title: 'Allo Artisan API',
                description: "Documentation interactive de l'API Allo Artisan",
                ogImage: '/logo.svg',
            },
            favicon: '/favicon.svg',
        }),
    );

    await app.listen(port);
}
void bootstrap();
