import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChangeUserStatutDto } from './dto/change-user-statut.dto';
import { AdminBookingsFilterDto } from './dto/admin-bookings.dto';
import {
    AdminUsersFilterDto,
    AdminTransactionsFilterDto,
    BroadcastNotificationDto,
    AdminLogsFilterDto,
} from './dto/admin-stats.dto';
import { AdminTrendsDto } from './dto/admin-trends.dto';

import { Role } from 'src/generated/prisma';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(private readonly prisma: PrismaService) {}

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
     * Séries temporelles quotidiennes (inscriptions, demandes, revenus) sur
     * 7/30/90 jours. Série CONTINUE : les jours sans donnée valent 0. Alimente
     * les graphiques du dashboard admin.
     */
    async getTrends(dto: AdminTrendsDto) {
        const days = dto.range === '7d' ? 7 : dto.range === '90d' ? 90 : 30;
        const since = new Date();
        since.setUTCHours(0, 0, 0, 0);
        since.setUTCDate(since.getUTCDate() - (days - 1));

        const [inscr, dem, rev] = await Promise.all([
            this.prisma.$queryRaw<{ jour: string; n: number }[]>`
                SELECT to_char(date_trunc('day', "created_at"), 'YYYY-MM-DD') AS jour, COUNT(*)::int AS n
                FROM "users" WHERE "created_at" >= ${since} GROUP BY 1`,
            this.prisma.$queryRaw<{ jour: string; n: number }[]>`
                SELECT to_char(date_trunc('day', "created_at"), 'YYYY-MM-DD') AS jour, COUNT(*)::int AS n
                FROM "bookings" WHERE "created_at" >= ${since} GROUP BY 1`,
            this.prisma.$queryRaw<{ jour: string; montant: number }[]>`
                SELECT to_char(date_trunc('day', "created_at"), 'YYYY-MM-DD') AS jour, COALESCE(SUM("montant"),0)::int AS montant
                FROM "transactions" WHERE "statut" = 'COMPLETEE' AND "created_at" >= ${since} GROUP BY 1`,
        ]);

        const mInscr = new Map<string, number>(inscr.map((r) => [r.jour, r.n]));
        const mDem = new Map<string, number>(dem.map((r) => [r.jour, r.n]));
        const mRev = new Map<string, number>(rev.map((r) => [r.jour, r.montant]));
        const points: { date: string; inscriptions: number; demandes: number; revenus: number }[] =
            [];
        for (let i = 0; i < days; i++) {
            const d = new Date(since);
            d.setUTCDate(since.getUTCDate() + i);
            const key = d.toISOString().slice(0, 10);
            points.push({
                date: key,
                inscriptions: mInscr.get(key) ?? 0,
                demandes: mDem.get(key) ?? 0,
                revenus: mRev.get(key) ?? 0,
            });
        }
        return { range: dto.range ?? '30d', points };
    }

    /**
     * Répartitions pour le dashboard : abonnements artisans par palier, top
     * métiers, top villes.
     */
    async getBreakdown() {
        const [abon, metiers, villes] = await Promise.all([
            this.prisma.artisan.groupBy({
                by: ['abonnementType'],
                where: { deletedAt: null },
                _count: { id: true },
            }),
            this.prisma.$queryRaw<{ nom: string; count: number }[]>`
                SELECT m."nom" AS nom, COUNT(*)::int AS count
                FROM "artisan_metiers" am JOIN "metiers" m ON m."id" = am."metier_id"
                GROUP BY m."nom" ORDER BY count DESC LIMIT 8`,
            this.prisma.$queryRaw<{ ville: string; count: number }[]>`
                SELECT "ville_principale" AS ville, COUNT(*)::int AS count
                FROM "artisans" WHERE "deleted_at" IS NULL AND "ville_principale" IS NOT NULL
                GROUP BY 1 ORDER BY count DESC LIMIT 8`,
        ]);
        return {
            abonnements: abon.map((a) => ({ palier: a.abonnementType, count: a._count.id })),
            topMetiers: metiers,
            topVilles: villes,
        };
    }

    /**
     * Détail d'un utilisateur (profil + artisan lié le cas échéant).
     */
    async getUserDetail(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                telephone: true,
                role: true,
                statut: true,
                emailVerified: true,
                mfaEnabled: true,
                createdAt: true,
                ville: true,
                quartier: true,
                _count: { select: { bookingsClient: true, avisClient: true } },
                bookingsClient: {
                    take: 6,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        titre: true,
                        statut: true,
                        createdAt: true,
                        metier: { select: { nom: true } },
                        artisan: {
                            select: {
                                nomEntreprise: true,
                                user: { select: { nom: true, prenom: true } },
                            },
                        },
                    },
                },
                artisan: {
                    select: {
                        id: true,
                        nomEntreprise: true,
                        villePrincipale: true,
                        verified: true,
                        statut: true,
                        abonnementType: true,
                        abonnementExpireAt: true,
                        noteMoyenne: true,
                        nombreAvis: true,
                        ambassadeurNiveau: true,
                        metiers: {
                            select: {
                                estPrincipal: true,
                                certifie: true,
                                metier: { select: { nom: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!user) throw new NotFoundException('Utilisateur introuvable');
        return user;
    }

    /**
     * Change le statut d'un compte (ACTIF / SUSPENDU / BANNI) + journalise
     * l'action admin (audit).
     */
    async changeUserStatut(id: string, dto: ChangeUserStatutDto, adminId: string) {
        const updated = await this.prisma.user.update({
            where: { id },
            data: { statut: dto.statut },
            select: { id: true, statut: true },
        });
        await this.prisma.logActivite.create({
            data: {
                action: `ADMIN_USER_${dto.statut}`,
                entite: 'user',
                entiteId: id,
                metadata: { adminId, raison: dto.raison ?? null } as never,
            },
        });
        return updated;
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

    // ─── Réservations (navigateur admin) ─────────────────────────────────────────

    async getBookings(dto: AdminBookingsFilterDto) {
        const { page = 1, limit = 20, statut, search } = dto;
        const skip = (page - 1) * limit;
        const where = {
            ...(statut ? { statut: statut as never } : {}),
            ...(search
                ? {
                      OR: [
                          { titre: { contains: search, mode: 'insensitive' as const } },
                          {
                              adresseIntervention: {
                                  contains: search,
                                  mode: 'insensitive' as const,
                              },
                          },
                      ],
                  }
                : {}),
        };
        const [rows, total] = await Promise.all([
            this.prisma.booking.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    titre: true,
                    statut: true,
                    estUrgent: true,
                    createdAt: true,
                    datePreferee: true,
                    adresseIntervention: true,
                    client: { select: { nom: true, prenom: true } },
                    artisan: {
                        select: {
                            nomEntreprise: true,
                            user: { select: { nom: true, prenom: true } },
                        },
                    },
                    metier: { select: { nom: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.booking.count({ where }),
        ]);
        return { data: rows, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    /** Détail complet d'une réservation (parties, prix, workflow, paiement, avis). */
    async getBookingDetail(id: string) {
        const b = await this.prisma.booking.findUnique({
            where: { id },
            include: {
                client: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true,
                        telephone: true,
                        photoUrl: true,
                    },
                },
                artisan: {
                    select: {
                        id: true,
                        nomEntreprise: true,
                        villePrincipale: true,
                        user: { select: { nom: true, prenom: true, email: true, telephone: true } },
                    },
                },
                metier: { select: { nom: true, categorie: { select: { nom: true } } } },
                transaction: {
                    select: {
                        id: true,
                        montant: true,
                        commission: true,
                        montantArtisan: true,
                        statut: true,
                        provider: true,
                        createdAt: true,
                    },
                },
                avis: {
                    select: {
                        note: true,
                        commentaire: true,
                        signale: true,
                        visible: true,
                        reponseArtisan: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!b) throw new NotFoundException('Réservation introuvable');
        return b;
    }

    /** Détail complet d'un artisan (profil pro, métiers, certifications, stats). */
    async getArtisanDetail(id: string) {
        const a = await this.prisma.artisan.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true,
                        telephone: true,
                        photoUrl: true,
                        statut: true,
                        emailVerified: true,
                        mfaEnabled: true,
                        createdAt: true,
                    },
                },
                metiers: {
                    include: {
                        metier: { select: { nom: true, categorie: { select: { nom: true } } } },
                    },
                },
                certifications: {
                    select: {
                        id: true,
                        titre: true,
                        type: true,
                        documentUrl: true,
                        statutVerification: true,
                        raisonRejet: true,
                        createdAt: true,
                    },
                },
                _count: { select: { bookings: true, avis: true } },
            },
        });
        if (!a) throw new NotFoundException('Artisan introuvable');

        // Répartition des réservations de cet artisan par statut
        const parStatut = await this.prisma.booking.groupBy({
            by: ['statut'],
            where: { artisanId: id },
            _count: { id: true },
        });
        return {
            ...a,
            bookingsParStatut: parStatut.map((s) => ({ statut: s.statut, count: s._count.id })),
        };
    }

    /** Tous les métiers (avec catégorie + nb d'artisans + nb de demandes). */
    async getMetiers() {
        return this.prisma.metier.findMany({
            include: {
                categorie: { select: { nom: true } },
                _count: { select: { artisanMetiers: true, bookings: true } },
            },
            orderBy: [{ categorie: { ordreAffichage: 'asc' } }, { nom: 'asc' }],
        });
    }

    /** Toutes les catégories (avec nb de métiers). */
    async getCategories() {
        return this.prisma.categorieMetier.findMany({
            include: { _count: { select: { metiers: true } } },
            orderBy: { ordreAffichage: 'asc' },
        });
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
                        organisme: true,
                        dateObtention: true,
                        numeroCertification: true,
                        documentUrl: true,
                        verifie: true,
                        type: true,
                        metierId: true,
                        statutVerification: true,
                        raisonRejet: true,
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
                    user: { select: { nom: true, prenom: true, email: true, role: true } },
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
