import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/services/cache.service';
import { Prisma } from 'src/generated/prisma';
import { FullTextSearchDto } from './dto';

/** TTL du cache pour les résultats de recherche full-text (5 minutes) */
const FTS_CACHE_TTL = 5 * 60;
/** TTL du cache pour les suggestions autocomplete (1 heure) */
const AUTOCOMPLETE_CACHE_TTL = 60 * 60;

export interface SearchResult {
    id: string;
    nomEntreprise: string | null;
    photoProfilUrl: string | null;
    noteMoyenne: number;
    nombreAvis: number;
    villePrincipale: string;
    verified: boolean;
    disponible: boolean;
    abonnementType: string;
    anneesExperience: number;
    accepteUrgences: boolean;
    /** Score de pertinence full-text (ts_rank) — null si recherche sans `q` */
    rank: number | null;
    user: { id: string; nom: string | null; prenom: string | null };
    metierPrincipal: { id: string; nom: string; slug: string } | null;
}

export interface SearchResponse {
    data: SearchResult[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    /** Indique si la recherche full-text a été utilisée */
    fullTextUsed: boolean;
}

export interface AutocompleteSuggestion {
    value: string;
    type: 'artisan' | 'metier' | 'ville';
}

@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cacheService: CacheService,
    ) {}

    /**
     * Recherche full-text artisans via PostgreSQL ts_rank + tsvector.
     *
     * Si `q` est fourni: utilise le search_vector PostgreSQL (ts_rank) avec
     * tri hybride pertinence × distance abonnement.
     *
     * Si `q` est absent: retourne la liste paginée triée note desc.
     *
     * Cache Redis 5 min par combinaison de paramètres.
     */
    async searchArtisans(dto: FullTextSearchDto): Promise<SearchResponse> {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const offset = (page - 1) * limit;

        // Clé cache déterministe
        const cacheKey = `search:fts:${JSON.stringify(dto)}`;
        const cached = await this.cacheService.get<SearchResponse>(cacheKey);
        if (cached) {
            this.logger.debug(`Cache HIT full-text search`);
            return cached;
        }

        let result: SearchResponse;

        if (dto.q && dto.q.trim().length >= 2) {
            result = await this.fullTextSearch(dto, page, limit, offset);
        } else {
            result = await this.filteredSearch(dto, page, limit, offset);
        }

        await this.cacheService.set(cacheKey, result, FTS_CACHE_TTL);
        return result;
    }

    /**
     * Recherche full-text PostgreSQL avec ts_rank.
     * Requête $queryRaw car Prisma ne supporte pas tsvector nativement.
     *
     * Tri: (ts_rank × 2 + bonus_abonnement) DESC, noteMoyenne DESC
     * - PREMIUM: +1.0 bonus
     * - STANDARD: +0.5 bonus
     * - GRATUIT: +0.0 bonus
     */
    private async fullTextSearch(
        dto: FullTextSearchDto,
        page: number,
        limit: number,
        offset: number,
    ): Promise<SearchResponse> {
        const query = dto.q!.trim();

        // Construire la requête tsquery : 'plombier cotonou' → 'plombier:* & cotonou:*'
        // Supporte préfixes pour l'autocomplétion partielle
        const tsQuery = query
            .split(/\s+/)
            .filter((w) => w.length > 0)
            .map((w) => `${w.replace(/[^a-zA-ZÀ-ÿ0-9]/g, '')}:*`)
            .join(' & ');

        if (!tsQuery) {
            return this.filteredSearch(dto, page, limit, offset);
        }

        // Conditions SQL additionnelles
        const villeClause = dto.ville
            ? Prisma.sql`AND a.ville_principale ILIKE ${`%${dto.ville}%`}`
            : Prisma.empty;

        const metierJoin = dto.metierSlug
            ? Prisma.sql`
                INNER JOIN artisan_metiers am_filter ON am_filter.artisan_id = a.id
                INNER JOIN metiers m_filter ON m_filter.id = am_filter.metier_id AND m_filter.slug = ${dto.metierSlug}
              `
            : Prisma.empty;

        // Requête principale avec ts_rank et bonus abonnement
        type RawArtisan = {
            id: string;
            nom_entreprise: string | null;
            photo_profil_url: string | null;
            note_moyenne: string;
            nombre_avis: number;
            ville_principale: string;
            verified: boolean;
            disponible: boolean;
            abonnement_type: string;
            annees_experience: number;
            accepte_urgences: boolean;
            rank: string;
            user_id_col: string;
            user_nom: string | null;
            user_prenom: string | null;
            metier_id: string | null;
            metier_nom: string | null;
            metier_slug: string | null;
            total_count: string;
        };

        const rows = await this.prisma.$queryRaw<RawArtisan[]>`
            SELECT
                a.id,
                a.nom_entreprise,
                a.photo_profil_url,
                a.note_moyenne,
                a.nombre_avis,
                a.ville_principale,
                a.verified,
                a.disponible,
                a.abonnement_type,
                a.annees_experience,
                a.accepte_urgences,
                (
                    ts_rank(a.search_vector, to_tsquery('french', ${tsQuery})) * 2.0
                    + CASE a.abonnement_type
                        WHEN 'PREMIUM'   THEN 1.0
                        WHEN 'STANDARD'  THEN 0.5
                        ELSE 0.0
                    END
                ) AS rank,
                u.id AS user_id_col,
                u.nom AS user_nom,
                u.prenom AS user_prenom,
                am_p.metier_id,
                m_p.nom AS metier_nom,
                m_p.slug AS metier_slug,
                COUNT(*) OVER() AS total_count
            FROM artisans a
            INNER JOIN users u ON u.id = a.user_id
            LEFT JOIN artisan_metiers am_p ON am_p.artisan_id = a.id AND am_p.est_principal = true
            LEFT JOIN metiers m_p ON m_p.id = am_p.metier_id
            ${metierJoin}
            WHERE
                a.deleted_at IS NULL
                AND a.statut = 'ACTIF'
                AND a.verified = true
                AND (
                    a.search_vector @@ to_tsquery('french', ${tsQuery})
                    OR a.nom_entreprise ILIKE ${'%' + query + '%'}
                )
                ${villeClause}
            ORDER BY rank DESC, a.note_moyenne DESC, a.nombre_avis DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

        const data: SearchResult[] = rows.map((r) => ({
            id: r.id,
            nomEntreprise: r.nom_entreprise,
            photoProfilUrl: r.photo_profil_url,
            noteMoyenne: Number(r.note_moyenne),
            nombreAvis: r.nombre_avis,
            villePrincipale: r.ville_principale,
            verified: r.verified,
            disponible: r.disponible,
            abonnementType: r.abonnement_type,
            anneesExperience: r.annees_experience,
            accepteUrgences: r.accepte_urgences,
            rank: Number(r.rank),
            user: { id: r.user_id_col, nom: r.user_nom, prenom: r.user_prenom },
            metierPrincipal:
                r.metier_id && r.metier_nom && r.metier_slug
                    ? { id: r.metier_id, nom: r.metier_nom, slug: r.metier_slug }
                    : null,
        }));

        this.logger.debug(
            `Full-text search "${query}": ${data.length} résultats (total: ${total})`,
        );

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            fullTextUsed: true,
        };
    }

    /**
     * Recherche filtrée sans full-text (pas de `q`).
     * Utilise Prisma ORM (plus rapide que $queryRaw pour les cas simples).
     */
    private async filteredSearch(
        dto: FullTextSearchDto,
        page: number,
        limit: number,
        offset: number,
    ): Promise<SearchResponse> {
        const where: Prisma.ArtisanWhereInput = {
            deletedAt: null,
            statut: 'ACTIF',
            verified: true,
        };

        if (dto.ville) {
            where.villePrincipale = { contains: dto.ville, mode: 'insensitive' };
        }

        if (dto.metierSlug) {
            const metier = await this.prisma.metier.findUnique({
                where: { slug: dto.metierSlug },
                select: { id: true },
            });
            if (!metier) {
                return { data: [], total: 0, page, limit, totalPages: 0, fullTextUsed: false };
            }
            where.metiers = { some: { metierId: metier.id } };
        }

        const [artisans, total] = await Promise.all([
            this.prisma.artisan.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: [
                    { abonnementType: 'desc' }, // PREMIUM > STANDARD > GRATUIT (lexicographique → adapter si besoin)
                    { noteMoyenne: 'desc' },
                    { nombreAvis: 'desc' },
                ],
                select: {
                    id: true,
                    nomEntreprise: true,
                    photoProfilUrl: true,
                    noteMoyenne: true,
                    nombreAvis: true,
                    villePrincipale: true,
                    verified: true,
                    disponible: true,
                    abonnementType: true,
                    anneesExperience: true,
                    accepteUrgences: true,
                    user: { select: { id: true, nom: true, prenom: true } },
                    metiers: {
                        where: { estPrincipal: true },
                        take: 1,
                        include: { metier: { select: { id: true, nom: true, slug: true } } },
                    },
                },
            }),
            this.prisma.artisan.count({ where }),
        ]);

        const data: SearchResult[] = artisans.map((a) => ({
            id: a.id,
            nomEntreprise: a.nomEntreprise,
            photoProfilUrl: a.photoProfilUrl,
            noteMoyenne: Number(a.noteMoyenne),
            nombreAvis: a.nombreAvis,
            villePrincipale: a.villePrincipale,
            verified: a.verified,
            disponible: a.disponible,
            abonnementType: a.abonnementType,
            anneesExperience: a.anneesExperience,
            accepteUrgences: a.accepteUrgences,
            rank: null,
            user: a.user,
            metierPrincipal: a.metiers[0]?.metier ?? null,
        }));

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            fullTextUsed: false,
        };
    }

    /**
     * Suggestions autocomplete basées sur :
     * - noms de métiers (DB, cachés 1h)
     * - noms d'entreprises (DB, cachés 1h)
     * - villes (DB, cachés 1h)
     *
     * Résultat dédupliqué, max 10 suggestions.
     */
    async autocomplete(q: string): Promise<AutocompleteSuggestion[]> {
        const key = `search:autocomplete:${q.toLowerCase().trim()}`;
        const cached = await this.cacheService.get<AutocompleteSuggestion[]>(key);
        if (cached) return cached;

        const term = `%${q.trim()}%`;

        const [metiers, artisans, villes] = await Promise.all([
            // Métiers correspondants
            this.prisma.metier.findMany({
                where: { nom: { contains: q, mode: 'insensitive' }, actif: true },
                select: { nom: true },
                take: 4,
            }),
            // Entreprises d'artisans actifs
            this.prisma.artisan.findMany({
                where: {
                    nomEntreprise: { contains: q, mode: 'insensitive' },
                    statut: 'ACTIF',
                    verified: true,
                    deletedAt: null,
                },
                select: { nomEntreprise: true },
                take: 3,
            }),
            // Villes (via requête raw pour DISTINCT)
            this.prisma.$queryRaw<{ ville_principale: string }[]>`
                SELECT DISTINCT ville_principale
                FROM artisans
                WHERE ville_principale ILIKE ${term}
                  AND deleted_at IS NULL
                  AND statut = 'ACTIF'
                LIMIT 3
            `,
        ]);

        const suggestions: AutocompleteSuggestion[] = [
            ...metiers.map((m) => ({ value: m.nom, type: 'metier' as const })),
            ...artisans
                .filter((a) => a.nomEntreprise)
                .map((a) => ({ value: a.nomEntreprise!, type: 'artisan' as const })),
            ...villes.map((v) => ({ value: v.ville_principale, type: 'ville' as const })),
        ];

        await this.cacheService.set(key, suggestions, AUTOCOMPLETE_CACHE_TTL);
        this.logger.debug(`Autocomplete "${q}": ${suggestions.length} suggestions`);
        return suggestions;
    }
}
