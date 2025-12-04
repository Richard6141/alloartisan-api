import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * Interface pour typer la requête avec user
 */
interface AuthenticatedRequest extends Request {
    user?: {
        sub?: string;
        id?: string;
    };
    file?: Express.Multer.File;
}

/**
 * Configuration du rate limiting pour les uploads
 */
interface UploadThrottleConfig {
    /** Nombre max d'uploads par période */
    limit: number;
    /** Période en secondes */
    ttl: number;
    /** Message d'erreur */
    message: string;
}

const UPLOAD_THROTTLE_CONFIGS: Record<string, UploadThrottleConfig> = {
    // Photo de profil: 5 uploads par heure
    'profile-photo': {
        limit: 5,
        ttl: 3600,
        message: 'Trop de mises à jour de photo de profil. Réessayez dans 1 heure.',
    },
    // Photo de couverture: 5 uploads par heure
    'cover-photo': {
        limit: 5,
        ttl: 3600,
        message: 'Trop de mises à jour de photo de couverture. Réessayez dans 1 heure.',
    },
    // Portfolio: 20 uploads par heure
    'portfolio-photo': {
        limit: 20,
        ttl: 3600,
        message: 'Trop de photos ajoutées au portfolio. Réessayez dans 1 heure.',
    },
    // Par défaut: 10 uploads par heure
    default: {
        limit: 10,
        ttl: 3600,
        message: "Trop d'uploads. Réessayez plus tard.",
    },
};

/**
 * Guard de rate limiting spécifique aux uploads
 * Empêche les abus et protège contre les attaques par déni de service
 */
@Injectable()
export class UploadThrottleGuard implements CanActivate {
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private configService: ConfigService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const userId = request.user?.sub || request.user?.id;

        if (!userId) {
            return true; // Pas d'utilisateur, laisser passer (sera bloqué par AuthGuard)
        }

        // Déterminer le type d'upload depuis la route
        const path = request.path;
        const uploadType = this.getUploadType(path);
        const config = UPLOAD_THROTTLE_CONFIGS[uploadType] || UPLOAD_THROTTLE_CONFIGS.default;

        const key = `upload_throttle:${uploadType}:${userId}`;
        const current = await this.cacheManager.get<number>(key);

        if (current && current >= config.limit) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: config.message,
                    retryAfter: config.ttl,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        // Incrémenter le compteur
        await this.cacheManager.set(key, (current || 0) + 1, config.ttl * 1000);

        return true;
    }

    private getUploadType(path: string): string {
        if (path.includes('/photo') && path.includes('/users')) {
            return 'profile-photo';
        }
        if (path.includes('/cover')) {
            return 'cover-photo';
        }
        if (path.includes('/portfolio')) {
            return 'portfolio-photo';
        }
        return 'default';
    }
}

/**
 * Guard pour limiter la taille totale des uploads par utilisateur par jour
 */
@Injectable()
export class UploadSizeLimitGuard implements CanActivate {
    private readonly maxDailyBytes: number;

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private configService: ConfigService,
    ) {
        // 50MB par jour par défaut
        this.maxDailyBytes = this.configService.get<number>(
            'UPLOAD_MAX_DAILY_BYTES',
            50 * 1024 * 1024,
        );
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const userId = request.user?.sub || request.user?.id;
        const file = request.file;

        if (!userId || !file) {
            return true;
        }

        const key = `upload_daily_size:${userId}`;
        const currentBytes = (await this.cacheManager.get<number>(key)) || 0;
        const fileSize = file.size;

        if (currentBytes + fileSize > this.maxDailyBytes) {
            const remainingMB = Math.max(0, (this.maxDailyBytes - currentBytes) / (1024 * 1024));
            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: `Limite quotidienne d'upload atteinte. Reste: ${remainingMB.toFixed(1)}MB`,
                    remainingBytes: this.maxDailyBytes - currentBytes,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        // Mettre à jour le compteur (TTL de 24h)
        await this.cacheManager.set(key, currentBytes + fileSize, 86400 * 1000);

        return true;
    }
}
