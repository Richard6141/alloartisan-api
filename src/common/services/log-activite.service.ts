import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma';

export interface LogActiviteData {
    userId?: string;
    action: string;
    entite?: string;
    entiteId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Service d'audit trail — enregistre toutes les actions importantes de la plateforme.
 * Implémente le OWASP A09 : Security Logging & Monitoring.
 *
 * Toutes les écritures sont fire-and-forget (ne bloquent pas la requête principale).
 */
@Injectable()
export class LogActiviteService {
    private readonly logger = new Logger(LogActiviteService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Enregistre une action dans les logs d'audit.
     * Fire-and-forget : ne lève jamais d'exception (log applicatif en cas d'erreur).
     */
    log(data: LogActiviteData): void {
        // Fire-and-forget : on ne await pas pour ne pas bloquer la requête
        this.prisma.logActivite
            .create({
                data: {
                    userId: data.userId ?? null,
                    action: data.action,
                    entite: data.entite ?? null,
                    entiteId: data.entiteId ?? null,
                    metadata: data.metadata ?? undefined,
                    ipAddress: data.ipAddress ?? null,
                    userAgent: data.userAgent ?? null,
                },
            })
            .catch((err: unknown) => {
                // On ne laisse jamais une erreur de log crasher l'application
                this.logger.error(`Failed to write audit log [${data.action}]:`, err);
            });
    }

    /**
     * Récupère les logs d'audit paginés (pour le dashboard admin).
     */
    async findAll(
        page = 1,
        limit = 50,
        filters?: {
            userId?: string;
            action?: string;
            entite?: string;
            from?: Date;
            to?: Date;
        },
    ) {
        const skip = (page - 1) * limit;

        const where: {
            userId?: string;
            action?: { contains: string; mode: 'insensitive' };
            entite?: string;
            createdAt?: { gte?: Date; lte?: Date };
        } = {};

        if (filters?.userId) where.userId = filters.userId;
        if (filters?.action) where.action = { contains: filters.action, mode: 'insensitive' };
        if (filters?.entite) where.entite = filters.entite;
        if (filters?.from || filters?.to) {
            where.createdAt = {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
            };
        }

        const [logs, total] = await Promise.all([
            this.prisma.logActivite.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.logActivite.count({ where }),
        ]);

        return {
            data: logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
