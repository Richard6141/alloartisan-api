import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    AdminUsersFilterDto,
    AdminTransactionsFilterDto,
    BroadcastNotificationDto,
    AdminLogsFilterDto,
} from './dto/admin-stats.dto';

import { Role } from 'src/generated/prisma';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Stats globales ─────────────────────────────────────────────────────────

    /**
     * KPIs plateforme : utilisateurs, bookings, revenus, artisans actifs.
     * Requêtes parallèles pour minimiser le temps de réponse.
     */
    async getOverviewStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalUsers,
            totalArtisans,
            totalArtisansActifs,
            totalBookings,
            bookingsCeMois,
            bookingsTermines,
            bookingsEnCours,
            revenusTotal,
            revenusCeMois,
            commissionsTotales,
            totalAvis,
            noteMoyennePlateforme,
            artisansEnAttente,
        ] = await Promise.all([
            // Utilisateurs
            this.prisma.user.count(),
            this.prisma.artisan.count(),
            this.prisma.artisan.count({ where: { statut: 'ACTIF', verified: true } }),

            // Bookings
            this.prisma.booking.count(),
            this.prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
            this.prisma.booking.count({ where: { statut: 'TERMINEE' } }),
            this.prisma.booking.count({
                where: { statut: { in: ['ACCEPTEE', 'CONFIRMEE', 'EN_COURS'] } },
            }),

            // Revenus (transactions complétées uniquement)
            this.prisma.transaction.aggregate({
                _sum: { montant: true },
                where: { statut: 'COMPLETEE' },
            }),
            this.prisma.transaction.aggregate({
                _sum: { montant: true },
                where: { statut: 'COMPLETEE', createdAt: { gte: startOfMonth } },
            }),
            this.prisma.transaction.aggregate({
                _sum: { commission: true },
                where: { statut: 'COMPLETEE' },
            }),

            // Avis
            this.prisma.avis.count({ where: { visible: true } }),
            this.prisma.artisan.aggregate({
                _avg: { noteMoyenne: true },
                where: { noteMoyenne: { gt: 0 } },
            }),

            // Artisans en attente de validation
            this.prisma.artisan.count({ where: { verified: false, statut: 'EN_ATTENTE' } }),
        ]);

        return {
            utilisateurs: {
                total: totalUsers,
                artisans: totalArtisans,
                artisansActifs: totalArtisansActifs,
                artisansEnAttente,
            },
            bookings: {
                total: totalBookings,
                ceMois: bookingsCeMois,
                termines: bookingsTermines,
                enCours: bookingsEnCours,
                tauxCompletion:
                    totalBookings > 0 ? Math.round((bookingsTermines / totalBookings) * 100) : 0,
            },
            revenus: {
                total: Number(revenusTotal._sum.montant ?? 0),
                ceMois: Number(revenusCeMois._sum.montant ?? 0),
                commissionsTotal: Number(commissionsTotales._sum.commission ?? 0),
            },
            avis: {
                total: totalAvis,
                noteMoyennePlateforme: Number(noteMoyennePlateforme._avg.noteMoyenne ?? 0).toFixed(
                    2,
                ),
            },
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Stats détaillées des réservations (7 derniers jours par défaut).
     */
    async getBookingStats() {
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [byStatut, bookingsParJour, topMetiers] = await Promise.all([
            // Répartition par statut
            this.prisma.booking.groupBy({
                by: ['statut'],
                _count: { id: true },
            }),

            // Bookings par jour (30 derniers jours)
            this.prisma.$queryRaw<{ date: string; count: number }[]>`
                SELECT 
                    DATE(created_at AT TIME ZONE 'UTC')::text AS date,
                    COUNT(*)::int AS count
                FROM bookings
                WHERE created_at >= ${last30Days}
                GROUP BY DATE(created_at AT TIME ZONE 'UTC')
                ORDER BY date DESC
                LIMIT 30
            `,

            // Top 5 métiers demandés
            this.prisma.booking.groupBy({
                by: ['metierId'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 5,
            }),
        ]);

        return {
            parStatut: byStatut.map((s) => ({ statut: s.statut, count: s._count.id })),
            evolution30Jours: bookingsParJour,
            topMetiers: topMetiers.map((m) => ({ metierId: m.metierId, count: m._count.id })),
        };
    }

    /**
     * Stats revenus : mensuel, par provider, top artisans.
     */
    async getRevenueStats() {
        const last12Months = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

        const [parProvider, revenusParMois, topArtisans] = await Promise.all([
            // Répartition par provider de paiement
            this.prisma.transaction.groupBy({
                by: ['provider'],
                _sum: { montant: true, commission: true },
                _count: { id: true },
                where: { statut: 'COMPLETEE' },
            }),

            // Revenus par mois (12 derniers mois)
            this.prisma.$queryRaw<{ mois: string; revenus: number; commissions: number }[]>`
                SELECT 
                    TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM') AS mois,
                    SUM(montant)::float AS revenus,
                    SUM(commission)::float AS commissions
                FROM transactions
                WHERE statut = 'COMPLETEE'
                  AND created_at >= ${last12Months}
                GROUP BY TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM')
                ORDER BY mois DESC
            `,

            // Top 10 artisans par revenus générés
            this.prisma.transaction.groupBy({
                by: ['artisanId'],
                _sum: { montantArtisan: true },
                _count: { id: true },
                where: { statut: 'COMPLETEE' },
                orderBy: { _sum: { montantArtisan: 'desc' } },
                take: 10,
            }),
        ]);

        return {
            parProvider: parProvider.map((p) => ({
                provider: p.provider,
                montantTotal: Number(p._sum.montant ?? 0),
                commissionsTotal: Number(p._sum.commission ?? 0),
                nombreTransactions: p._count.id,
            })),
            evolution12Mois: revenusParMois,
            topArtisans: topArtisans.map((a) => ({
                artisanId: a.artisanId,
                montantTotal: Number(a._sum.montantArtisan ?? 0),
                nbTransactions: a._count.id,
            })),
        };
    }

    // ─── Gestion utilisateurs ────────────────────────────────────────────────────

    async getUsers(dto: AdminUsersFilterDto) {
        const { page = 1, limit = 20, role, search } = dto;
        const skip = (page - 1) * limit;

        const where = {
            ...(role ? { role } : {}),
            ...(search
                ? {
                    OR: [
                        { nom: { contains: search, mode: 'insensitive' as const } },
                        { prenom: { contains: search, mode: 'insensitive' as const } },
                        { email: { contains: search, mode: 'insensitive' as const } },
                        { telephone: { contains: search, mode: 'insensitive' as const } },
                    ],
                }
                : {}),
        };

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    nom: true,
                    prenom: true,
                    email: true,
                    telephone: true,
                    role: true,
                    statut: true,
                    createdAt: true,
                    artisan: {
                        select: {
                            id: true,
                            verified: true,
                            statut: true,
                            noteMoyenne: true,
                            nombreAvis: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── Artisans en attente de validation ──────────────────────────────────────

    async getPendingArtisans() {
        return this.prisma.artisan.findMany({
            where: {
                verified: false,
                statut: 'EN_ATTENTE',
                deletedAt: null,
            },
            include: {
                user: {
                    select: {
                        nom: true,
                        prenom: true,
                        email: true,
                        telephone: true,
                        createdAt: true,
                    },
                },
                certifications: {
                    select: {
                        id: true,
                        titre: true,
                        numeroCertification: true,
                        documentUrl: true,
                        verifie: true,
                    },
                },
                metiers: {
                    include: {
                        metier: { select: { nom: true } },
                    },
                },
            },
            orderBy: { createdAt: 'asc' }, // Plus anciens en premier (FIFO)
        });
    }

    // ─── Avis signalés ───────────────────────────────────────────────────────────

    async getReportedAvis(page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [avis, total] = await Promise.all([
            this.prisma.avis.findMany({
                where: { signale: true },
                skip,
                take: limit,
                include: {
                    client: { select: { nom: true, prenom: true, email: true } },
                    artisan: {
                        include: {
                            user: { select: { nom: true, prenom: true } },
                        },
                    },
                    booking: { select: { id: true, titre: true, createdAt: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.avis.count({ where: { signale: true } }),
        ]);

        return {
            data: avis,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── Transactions ────────────────────────────────────────────────────────────

    async getTransactions(dto: AdminTransactionsFilterDto) {
        const { page = 1, limit = 20, statut, search } = dto;
        const skip = (page - 1) * limit;

        const where = {
            ...(statut ? { statut } : {}),
            ...(search
                ? {
                    OR: [
                        { id: { contains: search } },
                        { providerTransactionId: { contains: search } },
                    ],
                }
                : {}),
        };

        const [transactions, total, aggregat] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                include: {
                    booking: {
                        select: {
                            titre: true,
                            client: { select: { nom: true, prenom: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.transaction.count({ where }),
            this.prisma.transaction.aggregate({
                _sum: { montant: true, commission: true },
                where: { ...where, statut: 'COMPLETEE' },
            }),
        ]);

        return {
            data: transactions,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
            totaux: {
                montant: Number(aggregat._sum.montant ?? 0),
                commissions: Number(aggregat._sum.commission ?? 0),
            },
        };
    }

    // ─── Broadcast notification ──────────────────────────────────────────────────

    /**
     * Envoie une notification in-app à un segment d'utilisateurs.
     * Les emails sont délégués au NotificationService (injection évitée
     * ici pour éviter la dépendance circulaire — passer par une queue Bull).
     */
    async broadcastNotification(dto: BroadcastNotificationDto, adminId: string) {
        const { titre, corps, segment = 'ALL' } = dto;

        // Cibler les utilisateurs selon le segment
        const roleFilter: { role: Role } | Record<string, never> =
            segment === 'ALL'
                ? {}
                : { role: (segment === 'CLIENT' ? Role.CLIENT : Role.ARTISAN) as Role };

        const users = await this.prisma.user.findMany({
            where: { ...roleFilter, statut: 'ACTIF' },
            select: { id: true },
        });

        if (users.length === 0) {
            return { sent: 0, segment };
        }

        // Insertion en masse des notifications in-app
        const notificationsData = users.map((u) => ({
            userId: u.id,
            type: 'SYSTEME' as const,
            canal: 'IN_APP' as const,
            titre,
            corps,
            data: { adminId, broadcast: true, segment },
        }));

        // Batch insert en chunks de 500 pour éviter les timeouts
        const CHUNK_SIZE = 500;
        let totalCreated = 0;

        for (let i = 0; i < notificationsData.length; i += CHUNK_SIZE) {
            const chunk = notificationsData.slice(i, i + CHUNK_SIZE);
            const result = await this.prisma.notification.createMany({ data: chunk });
            totalCreated += result.count;
        }

        this.logger.log(
            `Broadcast [${segment}] envoyé par admin [${adminId}] : ${totalCreated} notifications`,
        );

        return { sent: totalCreated, segment, titre };
    }

    // ─── Logs d'audit ───────────────────────────────────────────────────────────────────────

    /**
     * Historique des actions : récupère les entrées de logs_activites
     * avec filtres optionnels (user, action, entite, plage de dates).
     * Utile pour l'audit de sécurité et la traçabilité des opérations admin.
     */
    async getActivityLogs(dto: AdminLogsFilterDto) {
        const { page = 1, limit = 50, userId, action, entite, dateDebut, dateFin } = dto;
        const skip = (page - 1) * limit;

        const where = {
            ...(userId ? { userId } : {}),
            ...(action ? { action: { contains: action, mode: 'insensitive' as const } } : {}),
            ...(entite ? { entite: { contains: entite, mode: 'insensitive' as const } } : {}),
            ...(dateDebut || dateFin
                ? {
                    createdAt: {
                        ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
                        ...(dateFin ? { lte: new Date(dateFin) } : {}),
                    },
                }
                : {}),
        };

        const [logs, total] = await Promise.all([
            this.prisma.logActivite.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                // Sélection précise pour réduire le payload
                select: {
                    id: true,
                    userId: true,
                    action: true,
                    entite: true,
                    entiteId: true,
                    metadata: true,
                    ipAddress: true,
                    userAgent: true,
                    createdAt: true,
                },
            }),
            this.prisma.logActivite.count({ where }),
        ]);

        return {
            data: logs,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
}
