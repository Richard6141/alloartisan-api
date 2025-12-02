import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { apiReference } from '@scalar/nestjs-api-reference';
import { join } from 'path';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

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

    const customCss = `
        /* ===== Variables CSS ===== */
        :root {
            --aa-primary: #FF6B35;
            --aa-primary-hover: #E85A2A;
            --aa-secondary: #2D3436;
            --aa-accent: #00B894;
            --aa-bg-light: #FAFAFA;
            --aa-bg-dark: #1E272E;
            --aa-text-light: #2D3436;
            --aa-text-dark: #F5F6FA;
            --aa-card-light: #FFFFFF;
            --aa-card-dark: #2D3436;
            --aa-border-light: #E0E0E0;
            --aa-border-dark: #3D4852;
        }

        /* ===== Base Styles ===== */
        body {
            transition: background-color 0.3s ease, color 0.3s ease;
        }

        .swagger-ui {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* ===== Hide Default Topbar ===== */
        .swagger-ui .topbar {
            display: none;
        }

        /* ===== Custom Header ===== */
        .custom-header {
            background: linear-gradient(135deg, var(--aa-secondary) 0%, #3D4852 100%);
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .custom-header img {
            height: 40px;
        }

        .theme-toggle {
            background: var(--aa-primary);
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .theme-toggle:hover {
            background: var(--aa-primary-hover);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
        }

        /* ===== Info Section ===== */
        .swagger-ui .info {
            margin: 30px 0;
        }

        .swagger-ui .info .title {
            font-size: 2.2em;
            font-weight: 700;
            color: var(--aa-secondary);
        }

        .swagger-ui .info .title small.version-stamp {
            background: var(--aa-primary);
            border-radius: 20px;
            padding: 4px 12px;
            font-size: 14px;
            vertical-align: middle;
        }

        /* ===== Operations ===== */
        .swagger-ui .opblock-tag {
            font-size: 1.3em;
            font-weight: 600;
            border-bottom: 2px solid var(--aa-primary);
            padding-bottom: 10px;
        }

        .swagger-ui .opblock {
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            margin-bottom: 15px;
            border: none;
        }

        .swagger-ui .opblock .opblock-summary {
            border-radius: 8px;
            padding: 12px 15px;
        }

        .swagger-ui .opblock.opblock-get {
            background: rgba(0, 184, 148, 0.1);
            border-left: 4px solid var(--aa-accent);
        }

        .swagger-ui .opblock.opblock-get .opblock-summary {
            border-color: var(--aa-accent);
        }

        .swagger-ui .opblock.opblock-post {
            background: rgba(255, 107, 53, 0.1);
            border-left: 4px solid var(--aa-primary);
        }

        .swagger-ui .opblock.opblock-post .opblock-summary {
            border-color: var(--aa-primary);
        }

        .swagger-ui .opblock.opblock-delete {
            background: rgba(214, 48, 49, 0.1);
            border-left: 4px solid #D63031;
        }

        .swagger-ui .opblock.opblock-patch {
            background: rgba(116, 185, 255, 0.1);
            border-left: 4px solid #74B9FF;
        }

        .swagger-ui .opblock.opblock-put {
            background: rgba(253, 203, 110, 0.1);
            border-left: 4px solid #FDCB6E;
        }

        /* ===== Buttons ===== */
        .swagger-ui .btn.execute {
            background: var(--aa-primary);
            border-color: var(--aa-primary);
            border-radius: 6px;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .swagger-ui .btn.execute:hover {
            background: var(--aa-primary-hover);
            box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
        }

        .swagger-ui .btn.authorize {
            background: var(--aa-accent);
            border-color: var(--aa-accent);
            color: white;
            border-radius: 6px;
            font-weight: 600;
        }

        .swagger-ui .btn.authorize svg {
            fill: white;
        }

        /* ===== Models ===== */
        .swagger-ui section.models {
            border-radius: 8px;
            border: 1px solid var(--aa-border-light);
        }

        .swagger-ui section.models h4 {
            font-size: 1.2em;
            color: var(--aa-secondary);
        }

        /* ===== Response ===== */
        .swagger-ui .responses-inner {
            border-radius: 8px;
        }

        .swagger-ui .response-col_status {
            font-weight: 600;
        }

        /* ===== Dark Mode ===== */
        body.dark-mode {
            background: var(--aa-bg-dark);
        }

        body.dark-mode .swagger-ui {
            background: var(--aa-bg-dark);
        }

        body.dark-mode .swagger-ui .info .title,
        body.dark-mode .swagger-ui .info .base-url,
        body.dark-mode .swagger-ui .opblock-tag,
        body.dark-mode .swagger-ui .opblock .opblock-summary-description,
        body.dark-mode .swagger-ui .opblock .opblock-summary-path,
        body.dark-mode .swagger-ui .opblock .opblock-summary-operation-id,
        body.dark-mode .swagger-ui table thead tr th,
        body.dark-mode .swagger-ui table tbody tr td,
        body.dark-mode .swagger-ui .parameter__name,
        body.dark-mode .swagger-ui .parameter__type,
        body.dark-mode .swagger-ui .response-col_status,
        body.dark-mode .swagger-ui .response-col_description,
        body.dark-mode .swagger-ui .markdown p,
        body.dark-mode .swagger-ui .markdown h1,
        body.dark-mode .swagger-ui .markdown h2,
        body.dark-mode .swagger-ui .markdown h3,
        body.dark-mode .swagger-ui .markdown li,
        body.dark-mode .swagger-ui .renderedMarkdown p,
        body.dark-mode .swagger-ui label,
        body.dark-mode .swagger-ui .model-title,
        body.dark-mode .swagger-ui .model {
            color: var(--aa-text-dark) !important;
        }

        body.dark-mode .swagger-ui .opblock .opblock-section-header {
            background: var(--aa-card-dark);
        }

        body.dark-mode .swagger-ui section.models {
            background: var(--aa-card-dark);
            border-color: var(--aa-border-dark);
        }

        body.dark-mode .swagger-ui section.models h4 {
            color: var(--aa-text-dark);
        }

        body.dark-mode .swagger-ui .model-box {
            background: var(--aa-bg-dark);
        }

        body.dark-mode .swagger-ui select,
        body.dark-mode .swagger-ui input[type=text],
        body.dark-mode .swagger-ui textarea {
            background: var(--aa-card-dark);
            color: var(--aa-text-dark);
            border-color: var(--aa-border-dark);
        }

        body.dark-mode .swagger-ui .opblock-body pre {
            background: #0D1117;
        }

        body.dark-mode .custom-header {
            background: linear-gradient(135deg, #0D1117 0%, var(--aa-bg-dark) 100%);
        }

        /* ===== Scrollbar ===== */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: var(--aa-bg-light);
        }

        ::-webkit-scrollbar-thumb {
            background: var(--aa-primary);
            border-radius: 4px;
        }

        body.dark-mode ::-webkit-scrollbar-track {
            background: var(--aa-bg-dark);
        }

        /* ===== Filter Input ===== */
        .swagger-ui .filter-container input {
            border-radius: 25px;
            padding: 10px 20px;
            border: 2px solid var(--aa-border-light);
            transition: all 0.3s ease;
        }

        .swagger-ui .filter-container input:focus {
            border-color: var(--aa-primary);
            box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.2);
        }

        body.dark-mode .swagger-ui .filter-container input {
            background: var(--aa-card-dark);
            color: var(--aa-text-dark);
            border-color: var(--aa-border-dark);
        }
    `;

    const customJs = `
        window.onload = function() {
            // Créer le header personnalisé
            const header = document.createElement('div');
            header.className = 'custom-header';
            header.innerHTML = \`
                <img src="/logo.svg" alt="Allo Artisan API" />
                <button class="theme-toggle" onclick="toggleTheme()">
                    <span id="theme-icon">🌙</span>
                    <span id="theme-text">Mode sombre</span>
                </button>
            \`;

            const swaggerUi = document.querySelector('.swagger-ui');
            if (swaggerUi) {
                swaggerUi.parentNode.insertBefore(header, swaggerUi);
            }

            // Vérifier le thème sauvegardé
            const savedTheme = localStorage.getItem('swagger-theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-mode');
                updateThemeButton(true);
            }
        };

        function toggleTheme() {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('swagger-theme', isDark ? 'dark' : 'light');
            updateThemeButton(isDark);
        }

        function updateThemeButton(isDark) {
            const icon = document.getElementById('theme-icon');
            const text = document.getElementById('theme-text');
            if (icon && text) {
                icon.textContent = isDark ? '☀️' : '🌙';
                text.textContent = isDark ? 'Mode clair' : 'Mode sombre';
            }
        }
    `;

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
