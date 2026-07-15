/**
 * Validation stricte d'origine CORS pour les gateways WebSocket.
 *
 * Comparaison sur l'origine PARSÉE (schéma + hôte + port), jamais par préfixe :
 * avec un startsWith, "https://app.alloartisan.bj" laisserait passer
 * "https://app.alloartisan.bj.evil.com".
 *
 * L'absence d'Origin est acceptée : les clients natifs (React Native,
 * socket.io natif) n'envoient pas ce header, et l'authentification réelle
 * repose sur le JWT vérifié au handshake — CORS n'est ici qu'une défense
 * supplémentaire contre les navigateurs.
 */
export function buildWsOriginValidator() {
    const allowed = new Set(
        (process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'])
            .map((o) => {
                try {
                    return new URL(o.trim()).origin;
                } catch {
                    return null;
                }
            })
            .filter((o): o is string => o !== null),
    );

    return (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) {
            cb(null, true); // Client natif sans header Origin — le JWT fait foi
            return;
        }
        try {
            if (allowed.has(new URL(origin).origin)) {
                cb(null, true);
                return;
            }
        } catch {
            // Origin malformé → refus
        }
        cb(new Error('CORS: origine non autorisée'));
    };
}
