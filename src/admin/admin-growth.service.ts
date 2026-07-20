import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma';
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
}
