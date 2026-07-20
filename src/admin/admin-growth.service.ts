import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, RoleAdmin } from 'src/generated/prisma';
import { AdminGrowthFilterDto } from './dto/admin-growth.dto';

/**
 * AdminGrowthService — modules « croissance & terrain » du back-office :
 *   • Ambassadeurs (parrainage)
 *   • Main-d'œuvre (annonces de chantier + travailleurs)
 *   • Demandes Express (dispatch urgent)
 *
 * Lecture seule / agrégations. Même forme de pagination que AdminService :
 *   { data: [...], meta: { total, page, limit, totalPages } }
 */
@Injectable()
export class AdminGrowthService {
    constructor(private readonly prisma: PrismaService) {}

    private meta(total: number, page: number, limit: number) {
        return { total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    private dateWhere(dateDebut?: string, dateFin?: string) {
        if (!dateDebut && !dateFin) return {};
        return {
            createdAt: {
                ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
                ...(dateFin ? { lte: new Date(dateFin) } : {}),
            },
        };
    }

    // ─── Ambassadeurs (parrainage) ───────────────────────────────────────────────

    async getAmbassadeursStats() {
        const [total, recompenses, enAttente, expires, joursAgg, niveaux, avecCode] =
            await Promise.all([
                this.prisma.parrainage.count(),
                this.prisma.parrainage.count({ where: { statut: 'RECOMPENSE' } }),
                this.prisma.parrainage.count({ where: { statut: 'EN_ATTENTE' } }),
                this.prisma.parrainage.count({ where: { statut: 'EXPIRE' } }),
                this.prisma.parrainage.aggregate({
                    _sum: { joursParrain: true, joursFilleul: true },
                }),
                this.prisma.artisan.groupBy({
                    by: ['ambassadeurNiveau'],
                    _count: { _all: true },
                    where: { ambassadeurNiveau: { not: null } },
                }),
                this.prisma.user.count({ where: { codeParrainage: { not: null } } }),
            ]);

        const niveauxMap: Record<string, number> = { BRONZE: 0, ARGENT: 0, OR: 0 };
        niveaux.forEach((n) => {
            if (n.ambassadeurNiveau) niveauxMap[n.ambassadeurNiveau] = n._count._all;
        });

        const joursParrain = joursAgg._sum.joursParrain ?? 0;
        const joursFilleul = joursAgg._sum.joursFilleul ?? 0;

        return {
            total,
            recompenses,
            enAttente,
            expires,
            tauxConversion: total ? Math.round((recompenses / total) * 100) : 0,
            joursParrain,
            joursFilleul,
            joursOfferts: joursParrain + joursFilleul,
            avecCode,
            niveaux: niveauxMap,
        };
    }

    async getAmbassadeursLeaderboard(limit = 12) {
        const [grouped, recompenses] = await Promise.all([
            this.prisma.parrainage.groupBy({
                by: ['parrainId'],
                _count: { _all: true },
                _sum: { joursParrain: true },
            }),
            this.prisma.parrainage.groupBy({
                by: ['parrainId'],
                where: { statut: 'RECOMPENSE' },
                _count: { _all: true },
            }),
        ]);

        const recMap = new Map(recompenses.map((r) => [r.parrainId, r._count._all]));
        const rows = grouped
            .map((g) => ({
                parrainId: g.parrainId,
                filleulsTotal: g._count._all,
                filleulsAbonnes: recMap.get(g.parrainId) ?? 0,
                joursOfferts: g._sum.joursParrain ?? 0,
            }))
            .sort(
                (a, b) =>
                    b.filleulsAbonnes - a.filleulsAbonnes ||
                    b.filleulsTotal - a.filleulsTotal ||
                    b.joursOfferts - a.joursOfferts,
            )
            .slice(0, limit);

        const users = await this.prisma.user.findMany({
            where: { id: { in: rows.map((r) => r.parrainId) } },
            select: {
                id: true,
                nom: true,
                prenom: true,
                photoUrl: true,
                artisan: { select: { ambassadeurNiveau: true, nomEntreprise: true } },
            },
        });
        const uMap = new Map(users.map((u) => [u.id, u]));

        return rows.map((r, i) => {
            const u = uMap.get(r.parrainId);
            return {
                rang: i + 1,
                parrainId: r.parrainId,
                nom: `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim() || '—',
                photoUrl: u?.photoUrl ?? null,
                entreprise: u?.artisan?.nomEntreprise ?? null,
                niveau: u?.artisan?.ambassadeurNiveau ?? null,
                filleulsTotal: r.filleulsTotal,
                filleulsAbonnes: r.filleulsAbonnes,
                joursOfferts: r.joursOfferts,
            };
        });
    }

    async getAmbassadeurDetail(parrainId: string) {
        const parrain = await this.prisma.user.findUnique({
            where: { id: parrainId },
            select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                telephone: true,
                photoUrl: true,
                codeParrainage: true,
                createdAt: true,
                artisan: { select: { ambassadeurNiveau: true, nomEntreprise: true } },
            },
        });
        if (!parrain) throw new NotFoundException('Parrain introuvable');

        const filleuls = await this.prisma.parrainage.findMany({
            where: { parrainId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                codeUtilise: true,
                statut: true,
                joursParrain: true,
                joursFilleul: true,
                recompenseAt: true,
                createdAt: true,
                filleul: { select: { id: true, nom: true, prenom: true, createdAt: true } },
            },
        });

        const total = filleuls.length;
        const convertis = filleuls.filter((f) => f.statut === 'RECOMPENSE').length;
        const enAttente = filleuls.filter((f) => f.statut === 'EN_ATTENTE').length;
        const joursOfferts = filleuls.reduce((s, f) => s + (f.joursParrain ?? 0), 0);

        // Paliers Ambassadeur (cf. config/constants AMBASSADEUR_PALIERS)
        const paliers = [
            { seuil: 3, niveau: 'BRONZE' },
            { seuil: 5, niveau: 'ARGENT' },
            { seuil: 10, niveau: 'OR' },
        ];
        const prochain = paliers.find((p) => p.seuil > convertis);

        return {
            parrain,
            stats: {
                total,
                convertis,
                enAttente,
                joursOfferts,
                tauxConversion: total ? Math.round((convertis / total) * 100) : 0,
                prochainPalier: prochain
                    ? {
                          niveau: prochain.niveau,
                          seuil: prochain.seuil,
                          restant: prochain.seuil - convertis,
                      }
                    : null,
            },
            filleuls,
        };
    }

    async getParrainages(dto: AdminGrowthFilterDto) {
        const { page = 1, limit = 20, statut, search } = dto;
        const skip = (page - 1) * limit;
        const dir: Prisma.SortOrder = dto.sortDir === 'asc' ? 'asc' : 'desc';

        const where: Prisma.ParrainageWhereInput = {
            ...(statut ? { statut: statut as never } : {}),
            ...(search
                ? {
                      OR: [
                          { parrain: { nom: { contains: search, mode: 'insensitive' } } },
                          { parrain: { prenom: { contains: search, mode: 'insensitive' } } },
                          { filleul: { nom: { contains: search, mode: 'insensitive' } } },
                          { filleul: { prenom: { contains: search, mode: 'insensitive' } } },
                          { codeUtilise: { contains: search, mode: 'insensitive' } },
                      ],
                  }
                : {}),
            ...this.dateWhere(dto.dateDebut, dto.dateFin),
        };

        const orderBy =
            dto.sortBy === 'statut'
                ? { statut: dir }
                : dto.sortBy === 'recompenseAt'
                  ? { recompenseAt: dir }
                  : { createdAt: dir };

        const [rows, total] = await Promise.all([
            this.prisma.parrainage.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    codeUtilise: true,
                    statut: true,
                    joursParrain: true,
                    joursFilleul: true,
                    recompenseAt: true,
                    createdAt: true,
                    parrain: { select: { id: true, nom: true, prenom: true } },
                    filleul: { select: { id: true, nom: true, prenom: true } },
                },
            }),
            this.prisma.parrainage.count({ where }),
        ]);

        return { data: rows, meta: this.meta(total, page, limit) };
    }

    // ─── Main-d'œuvre ────────────────────────────────────────────────────────────

    async getMainDoeuvreStats() {
        const [
            profils,
            actifs,
            ouvriers,
            aides,
            dispoNow,
            annonces,
            annoncesOuvertes,
            annoncesPourvues,
            engagements,
            engEnCours,
            engTermines,
        ] = await Promise.all([
            this.prisma.profilTravailleur.count(),
            this.prisma.profilTravailleur.count({ where: { actif: true } }),
            this.prisma.profilTravailleur.count({ where: { type: 'OUVRIER' } }),
            this.prisma.profilTravailleur.count({ where: { type: 'AIDE' } }),
            this.prisma.profilTravailleur.count({ where: { disponibleMaintenant: true } }),
            this.prisma.annonceChantier.count(),
            this.prisma.annonceChantier.count({ where: { statut: 'OUVERTE' } }),
            this.prisma.annonceChantier.count({ where: { statut: 'POURVUE' } }),
            this.prisma.engagementTravail.count(),
            this.prisma.engagementTravail.count({ where: { statut: 'EN_COURS' } }),
            this.prisma.engagementTravail.count({ where: { statut: 'TERMINE' } }),
        ]);

        return {
            profils,
            actifs,
            ouvriers,
            aides,
            dispoNow,
            annonces,
            annoncesOuvertes,
            annoncesPourvues,
            engagements,
            engEnCours,
            engTermines,
        };
    }

    async getAnnonces(dto: AdminGrowthFilterDto) {
        const { page = 1, limit = 20, statut, type, search } = dto;
        const skip = (page - 1) * limit;
        const dir: Prisma.SortOrder = dto.sortDir === 'asc' ? 'asc' : 'desc';

        const where: Prisma.AnnonceChantierWhereInput = {
            ...(statut ? { statut: statut as never } : {}),
            ...(type ? { type: type as never } : {}),
            ...(search
                ? {
                      OR: [
                          { ville: { contains: search, mode: 'insensitive' } },
                          { description: { contains: search, mode: 'insensitive' } },
                      ],
                  }
                : {}),
            ...this.dateWhere(dto.dateDebut, dto.dateFin),
        };

        const orderBy =
            dto.sortBy === 'statut'
                ? { statut: dir }
                : dto.sortBy === 'ville'
                  ? { ville: dir }
                  : { createdAt: dir };

        const [rows, total] = await Promise.all([
            this.prisma.annonceChantier.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    type: true,
                    ville: true,
                    periode: true,
                    statut: true,
                    nombrePersonnes: true,
                    tarifJournalier: true,
                    createdAt: true,
                    patron: { select: { id: true, nom: true, prenom: true } },
                    metier: { select: { nom: true } },
                    _count: { select: { interets: true } },
                },
            }),
            this.prisma.annonceChantier.count({ where }),
        ]);

        return { data: rows, meta: this.meta(total, page, limit) };
    }

    async getTravailleurs(dto: AdminGrowthFilterDto) {
        const { page = 1, limit = 20, statut, type, search } = dto;
        const skip = (page - 1) * limit;
        const dir: Prisma.SortOrder = dto.sortDir === 'asc' ? 'asc' : 'desc';

        const where: Prisma.ProfilTravailleurWhereInput = {
            ...(type ? { type: type as never } : {}),
            ...(statut === 'ACTIF' ? { actif: true } : {}),
            ...(statut === 'INACTIF' ? { actif: false } : {}),
            ...(statut === 'DISPO' ? { disponibleMaintenant: true } : {}),
            ...(search
                ? {
                      OR: [
                          { villePrincipale: { contains: search, mode: 'insensitive' } },
                          { user: { nom: { contains: search, mode: 'insensitive' } } },
                          { user: { prenom: { contains: search, mode: 'insensitive' } } },
                      ],
                  }
                : {}),
        };

        const orderBy =
            dto.sortBy === 'noteMoyenne'
                ? { noteMoyenne: dir }
                : dto.sortBy === 'nombreAvis'
                  ? { nombreAvis: dir }
                  : dto.sortBy === 'villePrincipale'
                    ? { villePrincipale: dir }
                    : { createdAt: dir };

        const [rows, total] = await Promise.all([
            this.prisma.profilTravailleur.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    type: true,
                    actif: true,
                    disponibleMaintenant: true,
                    villePrincipale: true,
                    anneesExperience: true,
                    tarifJournalier: true,
                    identiteVerifiee: true,
                    noteMoyenne: true,
                    nombreAvis: true,
                    createdAt: true,
                    user: { select: { id: true, nom: true, prenom: true, telephone: true } },
                    _count: { select: { metiers: true, engagements: true } },
                },
            }),
            this.prisma.profilTravailleur.count({ where }),
        ]);

        return { data: rows, meta: this.meta(total, page, limit) };
    }

    // ─── Comptes admin (oversight) ───────────────────────────────────────────────

    async getAdmins() {
        const admins = await this.prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                telephone: true,
                statut: true,
                adminRole: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });
        const ids = admins.map((a) => a.id);

        const now = new Date();
        const since24 = new Date(now.getTime() - 24 * 3600 * 1000);
        const since7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

        const [agg, agg24, agg7] = await Promise.all([
            this.prisma.logActivite.groupBy({
                by: ['userId'],
                where: { userId: { in: ids } },
                _count: { _all: true },
                _max: { createdAt: true },
            }),
            this.prisma.logActivite.groupBy({
                by: ['userId'],
                where: { userId: { in: ids }, createdAt: { gte: since24 } },
                _count: { _all: true },
            }),
            this.prisma.logActivite.groupBy({
                by: ['userId'],
                where: { userId: { in: ids }, createdAt: { gte: since7 } },
                _count: { _all: true },
            }),
        ]);

        const totalMap = new Map(agg.map((a) => [a.userId, a]));
        const map24 = new Map(agg24.map((a) => [a.userId, a._count._all]));
        const map7 = new Map(agg7.map((a) => [a.userId, a._count._all]));

        return admins.map((a) => ({
            ...a,
            actionsTotal: totalMap.get(a.id)?._count._all ?? 0,
            derniereAction: totalMap.get(a.id)?._max.createdAt ?? null,
            actions24h: map24.get(a.id) ?? 0,
            actions7j: map7.get(a.id) ?? 0,
        }));
    }

    /** Nombre de super-admins actifs — garde anti-verrouillage. */
    private async countSuperAdmins() {
        return this.prisma.user.count({
            where: { role: 'ADMIN', adminRole: 'SUPER_ADMIN' },
        });
    }

    /** Promouvoir un utilisateur existant en administrateur. Super-admin uniquement. */
    async grantAdmin(userId: string, adminRole: RoleAdmin, actorId: string) {
        const target = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, prenom: true, nom: true },
        });
        if (!target) throw new NotFoundException('Utilisateur introuvable');
        if (target.role === 'ADMIN') {
            throw new BadRequestException('Cet utilisateur est déjà administrateur.');
        }

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { role: 'ADMIN', adminRole },
            select: { id: true, prenom: true, nom: true, email: true, adminRole: true },
        });
        await this.prisma.logActivite.create({
            data: {
                userId: actorId,
                action: 'ADMIN_GRANT',
                entite: 'user',
                entiteId: userId,
                metadata: { adminRole },
            },
        });
        return updated;
    }

    /** Changer le rôle fin d'un administrateur existant. Super-admin uniquement. */
    async changeAdminRole(targetId: string, adminRole: RoleAdmin, actorId: string) {
        const target = await this.prisma.user.findUnique({
            where: { id: targetId },
            select: { id: true, role: true, adminRole: true },
        });
        if (!target || target.role !== 'ADMIN') {
            throw new NotFoundException('Administrateur introuvable');
        }
        // Anti-verrouillage : ne pas rétrograder le dernier super-admin.
        if (
            target.adminRole === 'SUPER_ADMIN' &&
            adminRole !== 'SUPER_ADMIN' &&
            (await this.countSuperAdmins()) <= 1
        ) {
            throw new ForbiddenException('Impossible : au moins un super-admin doit subsister.');
        }

        const updated = await this.prisma.user.update({
            where: { id: targetId },
            data: { adminRole },
            select: { id: true, prenom: true, nom: true, email: true, adminRole: true },
        });
        await this.prisma.logActivite.create({
            data: {
                userId: actorId,
                action: 'ADMIN_ROLE_CHANGE',
                entite: 'user',
                entiteId: targetId,
                metadata: { adminRole },
            },
        });
        return updated;
    }

    /** Révoquer l'accès admin d'un compte (repasse en CLIENT). Super-admin uniquement. */
    async revokeAdmin(targetId: string, actorId: string) {
        const target = await this.prisma.user.findUnique({
            where: { id: targetId },
            select: { id: true, role: true, adminRole: true },
        });
        if (!target || target.role !== 'ADMIN') {
            throw new NotFoundException('Administrateur introuvable');
        }
        if (target.adminRole === 'SUPER_ADMIN' && (await this.countSuperAdmins()) <= 1) {
            throw new ForbiddenException('Impossible : au moins un super-admin doit subsister.');
        }

        const updated = await this.prisma.user.update({
            where: { id: targetId },
            data: { role: 'CLIENT', adminRole: null },
            select: { id: true },
        });
        await this.prisma.logActivite.create({
            data: {
                userId: actorId,
                action: 'ADMIN_REVOKE',
                entite: 'user',
                entiteId: targetId,
            },
        });
        return updated;
    }

    // ─── Demandes Express (dispatch) ─────────────────────────────────────────────

    async getExpressStats() {
        const [total, enRecherche, attribuees, expirees, annulees, urgentes] = await Promise.all([
            this.prisma.demandeExpress.count(),
            this.prisma.demandeExpress.count({ where: { statut: 'EN_RECHERCHE' } }),
            this.prisma.demandeExpress.count({ where: { statut: 'ATTRIBUEE' } }),
            this.prisma.demandeExpress.count({ where: { statut: 'EXPIREE' } }),
            this.prisma.demandeExpress.count({ where: { statut: 'ANNULEE' } }),
            this.prisma.demandeExpress.count({ where: { estUrgent: true } }),
        ]);

        return {
            total,
            enRecherche,
            attribuees,
            expirees,
            annulees,
            urgentes,
            tauxAttribution: total ? Math.round((attribuees / total) * 100) : 0,
        };
    }

    async getDemandesExpress(dto: AdminGrowthFilterDto) {
        const { page = 1, limit = 20, statut, type, search } = dto;
        const skip = (page - 1) * limit;
        const dir: Prisma.SortOrder = dto.sortDir === 'asc' ? 'asc' : 'desc';

        const where: Prisma.DemandeExpressWhereInput = {
            ...(statut ? { statut: statut as never } : {}),
            ...(type === 'URGENT' ? { estUrgent: true } : {}),
            ...(search ? { titre: { contains: search, mode: 'insensitive' } } : {}),
            ...this.dateWhere(dto.dateDebut, dto.dateFin),
        };

        const orderBy =
            dto.sortBy === 'statut'
                ? { statut: dir }
                : dto.sortBy === 'expireAt'
                  ? { expireAt: dir }
                  : { createdAt: dir };

        const [rows, total] = await Promise.all([
            this.prisma.demandeExpress.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    titre: true,
                    estUrgent: true,
                    statut: true,
                    rayonKm: true,
                    expireAt: true,
                    createdAt: true,
                    bookingId: true,
                    clientId: true,
                    metierId: true,
                    artisanId: true,
                    _count: { select: { candidats: true } },
                },
            }),
            this.prisma.demandeExpress.count({ where }),
        ]);

        // Jointures manuelles (pas de relations Prisma sur DemandeExpress)
        const clientIds = [...new Set(rows.map((r) => r.clientId))];
        const metierIds = [...new Set(rows.map((r) => r.metierId))];
        const artisanIds = [
            ...new Set(rows.map((r) => r.artisanId).filter((x): x is string => !!x)),
        ];

        const [clients, metiers, artisans] = await Promise.all([
            this.prisma.user.findMany({
                where: { id: { in: clientIds } },
                select: { id: true, nom: true, prenom: true },
            }),
            this.prisma.metier.findMany({
                where: { id: { in: metierIds } },
                select: { id: true, nom: true },
            }),
            this.prisma.artisan.findMany({
                where: { id: { in: artisanIds } },
                select: {
                    id: true,
                    nomEntreprise: true,
                    user: { select: { nom: true, prenom: true } },
                },
            }),
        ]);

        const cMap = new Map(clients.map((c) => [c.id, c]));
        const mMap = new Map(metiers.map((m) => [m.id, m]));
        const aMap = new Map(artisans.map((a) => [a.id, a]));

        const data = rows.map((r) => ({
            id: r.id,
            titre: r.titre,
            estUrgent: r.estUrgent,
            statut: r.statut,
            rayonKm: r.rayonKm,
            expireAt: r.expireAt,
            createdAt: r.createdAt,
            bookingId: r.bookingId,
            nbCandidats: r._count.candidats,
            client: cMap.get(r.clientId) ?? null,
            metier: mMap.get(r.metierId) ?? null,
            artisan: r.artisanId ? (aMap.get(r.artisanId) ?? null) : null,
        }));

        return { data, meta: this.meta(total, page, limit) };
    }

    async getDemandeExpressDetail(id: string) {
        const d = await this.prisma.demandeExpress.findUnique({
            where: { id },
            include: { candidats: true },
        });
        if (!d) throw new NotFoundException('Demande express introuvable');

        const [client, metier, artisanAttribue, booking] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: d.clientId },
                select: { id: true, nom: true, prenom: true, email: true, telephone: true },
            }),
            this.prisma.metier.findUnique({
                where: { id: d.metierId },
                select: { id: true, nom: true },
            }),
            d.artisanId
                ? this.prisma.artisan.findUnique({
                      where: { id: d.artisanId },
                      select: {
                          id: true,
                          nomEntreprise: true,
                          villePrincipale: true,
                          user: { select: { nom: true, prenom: true, telephone: true } },
                      },
                  })
                : Promise.resolve(null),
            d.bookingId
                ? this.prisma.booking.findUnique({
                      where: { id: d.bookingId },
                      select: { id: true, statut: true, titre: true },
                  })
                : Promise.resolve(null),
        ]);

        const artisanIds = [...new Set(d.candidats.map((c) => c.artisanId))];
        const artisans = await this.prisma.artisan.findMany({
            where: { id: { in: artisanIds } },
            select: {
                id: true,
                nomEntreprise: true,
                villePrincipale: true,
                noteMoyenne: true,
                user: { select: { nom: true, prenom: true } },
            },
        });
        const aMap = new Map(artisans.map((a) => [a.id, a]));

        const candidats = d.candidats
            .slice()
            .sort((a, b) => Number(a.distanceKm ?? 9999) - Number(b.distanceKm ?? 9999))
            .map((c) => ({
                id: c.id,
                distanceKm: c.distanceKm,
                createdAt: c.createdAt,
                estGagnant: !!d.artisanId && c.artisanId === d.artisanId,
                artisan: aMap.get(c.artisanId) ?? null,
            }));

        return { ...d, client, metier, artisan: artisanAttribue, booking, candidats };
    }

    async getTravailleurDetail(id: string) {
        const t = await this.prisma.profilTravailleur.findUnique({
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
                        createdAt: true,
                    },
                },
                metiers: {
                    include: { metier: { select: { nom: true } } },
                },
                engagements: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                    include: {
                        patron: { select: { nom: true, prenom: true } },
                        avis: true,
                    },
                },
                _count: { select: { engagements: true, manifestations: true } },
            },
        });
        if (!t) throw new NotFoundException('Profil travailleur introuvable');
        return t;
    }

    async getAnnonceDetail(id: string) {
        const a = await this.prisma.annonceChantier.findUnique({
            where: { id },
            include: {
                patron: {
                    select: { id: true, nom: true, prenom: true, email: true, telephone: true },
                },
                metier: { select: { nom: true } },
                interets: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        profil: {
                            select: {
                                id: true,
                                type: true,
                                villePrincipale: true,
                                noteMoyenne: true,
                                nombreAvis: true,
                                user: { select: { nom: true, prenom: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!a) throw new NotFoundException('Annonce introuvable');
        return a;
    }
}
