export const swaggerCustomCss = `
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

export const swaggerCustomJs = `
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
