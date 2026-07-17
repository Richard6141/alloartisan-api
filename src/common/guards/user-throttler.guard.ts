import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate-limiting compté PAR UTILISATEUR, pas par IP.
 *
 * Le guard par défaut trace par IP : au Bénin, plusieurs testeurs (et demain
 * plusieurs clients) partagent souvent la même IP (NAT opérateur, même Wi-Fi).
 * Ils se partageaient alors le même quota → 429 « Too Many Requests » dès que
 * deux appareils sollicitaient l'API en même temps (« avec 2 utilisateurs
 * l'app tombe »). On clé donc sur l'identifiant de l'utilisateur dès qu'un
 * token est présent (décodage léger, sans vérification : sert uniquement au
 * comptage), avec repli sur l'IP pour le trafic anonyme.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
        const auth: string | undefined = req.headers?.authorization;
        if (auth?.startsWith('Bearer ')) {
            try {
                const part = auth.slice(7).split('.')[1];
                const payload = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
                if (payload?.sub) return `user:${payload.sub}`;
            } catch {
                // token illisible : on retombe sur l'IP
            }
        }
        const ip =
            (Array.isArray(req.ips) && req.ips.length ? req.ips[0] : req.ip) ?? 'unknown';
        return `ip:${ip}`;
    }
}
