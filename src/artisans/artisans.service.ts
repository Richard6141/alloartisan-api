import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/services/cache.service';
import { NotificationService } from 'src/notification/notification.service';
import { StatutArtisan, Role, Statut, Prisma } from 'src/generated/prisma';
import {
    CreateArtisanDto,
    UpdateArtisanDto,
    ArtisanDetailResponseDto,
    ArtisanListResponseDto,
    ArtisanSearchResponseDto,
    ArtisanListItemDto,
    SearchArtisanDto,
    SortBy,
    SortOrder,
    UpdateArtisanMetiersDto,
    UpdateArtisanStatutDto,
} from './dto';

const ARTISAN_INCLUDE = {
    user: {
        // Anti-fuite : téléphone jamais exposé sur les fiches artisan
        select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
        },
    },
    metiers: {
        include: {
            metier: {
                select: {
                    id: true,
                    nom: true,
                    slug: true,
                },
            },
        },
    },
} as const;

type ArtisanWithIncludes = Prisma.ArtisanGetPayload<{
    include: typeof ARTISAN_INCLUDE;
}>;

@Injectable()
export class ArtisansService {
    private readonly logger = new Logger(ArtisansService.name);

    constructor(
        private prisma: PrismaService,
        private cacheService: CacheService,
        private notificationService: NotificationService,
    ) {}

    /**
     * ANTI-FRAUDE : la position d'un artisan doit se trouver dans la zone de
     * service (Bénin, avec une marge frontalière). Bloque l'injection par API
     * d'une position fantaisiste pour apparaître dans d'autres villes.
     */
    private assertPositionZoneService(latitude?: number, longitude?: number): void {
        if (latitude == null || longitude == null) return;
        const auBenin = latitude >= 6.0 && latitude <= 12.6 && longitude >= 0.5 && longitude <= 4.1;
        if (!auBenin) {
            throw new BadRequestException(
                'Position hors de la zone de service (Bénin). Activez votre GPS et réessayez.',
            );
        }
    }

    /**
     * Norme des métiers : UN métier principal obligatoire + deux métiers
     * secondaires maximum. La preuve (diplôme/attestation) est exigée pour le
     * principal ; les secondaires sont jugés par l'admin au cas par cas.
     */
    private assertMetiersNorme(metiers: { estPrincipal?: boolean }[]): void {
        if (metiers.length > 3) {
            throw new BadRequestException(
                'Un métier principal et deux métiers secondaires maximum',
            );
        }
        const principaux = metiers.filter((m) => m.estPrincipal);
        if (principaux.length === 0) {
            throw new BadRequestException('Désignez votre métier principal');
        }
        if (principaux.length > 1) {
            throw new BadRequestException("Il ne peut y avoir qu'un seul métier principal");
        }
    }

    /**
     * SÉCURITÉ : les photos de profil, couverture et portfolio doivent être
     * hébergées sur NOTRE CDN (même règle que la messagerie). Refuse toute
     * URL externe qui permettrait d'afficher du contenu non contrôlé.
     */
    private assertCdnUrls(dto: UpdateArtisanDto | CreateArtisanDto): void {
        const urls = [
            dto.photoProfilUrl,
            dto.photoCouvertureUrl,
            ...(dto.portfolioUrls ?? []),
        ].filter((u): u is string => typeof u === 'string' && u.length > 0);

        for (const raw of urls) {
            let allowed = false;
            try {
                const url = new URL(raw);
                allowed = url.protocol === 'https:' && url.hostname === 'res.cloudinary.com';
            } catch {
                allowed = false;
            }
            if (!allowed) {
                throw new BadRequestException(
                    "Les photos doivent être envoyées via l'application (hébergement externe refusé)",
                );
            }
        }
    }

    async create(userId: string, dto: CreateArtisanDto): Promise<ArtisanDetailResponseDto> {
        this.assertCdnUrls(dto);
        this.assertPositionZoneService(dto.latitude, dto.longitude);

        // Vérifier que l'utilisateur existe et n'est pas déjà artisan
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { artisan: true },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        if (user.artisan) {
            throw new ConflictException('Cet utilisateur est déjà enregistré comme artisan');
        }

        // Vérifier que l'utilisateur a un statut valide
        if (user.statut !== Statut.ACTIF && user.statut !== Statut.EN_ATTENTE) {
            throw new ForbiddenException(
                'Votre compte utilisateur doit être actif pour devenir artisan',
            );
        }

        this.assertMetiersNorme(dto.metiers);

        // Vérifier que tous les métiers existent ET sont actifs
        const metierIds = dto.metiers.map((m) => m.metierId);
        const metiers = await this.prisma.metier.findMany({
            where: {
                id: { in: metierIds },
                actif: true,
            },
        });

        if (metiers.length !== metierIds.length) {
            throw new BadRequestException('Un ou plusieurs métiers sont invalides ou inactifs');
        }

        // Créer l'artisan avec ses métiers
        const artisan = await this.prisma.artisan.create({
            data: {
                userId,
                nomEntreprise: dto.nomEntreprise,
                numeroIfu: dto.numeroIfu,
                anneesExperience: dto.anneesExperience ?? 0,
                bio: dto.bio,
                slogan: dto.slogan,
                photoProfilUrl: dto.photoProfilUrl,
                photoCouvertureUrl: dto.photoCouvertureUrl,
                portfolioUrls: dto.portfolioUrls,
                adresseAtelier: dto.adresseAtelier,
                latitude: dto.latitude,
                longitude: dto.longitude,
                villePrincipale: dto.villePrincipale,
                zoneInterventionKm: dto.zoneInterventionKm ?? 5,
                villesIntervention: dto.villesIntervention,
                disponible: dto.disponible ?? true,
                accepteUrgences: dto.accepteUrgences ?? false,
                accepteWeekend: dto.accepteWeekend ?? false,
                horairesTravail: dto.horairesTravail as unknown as Prisma.InputJsonValue,
                statut: StatutArtisan.EN_ATTENTE,
                metiers: {
                    create: dto.metiers.map((m) => ({
                        metierId: m.metierId,
                        estPrincipal: m.estPrincipal ?? false,
                        anneesExperience: m.anneesExperience,
                        certifie: m.certifie ?? false,
                        tarifHoraire: m.tarifHoraire,
                        description: m.description,
                    })),
                },
            },
            include: ARTISAN_INCLUDE,
        });

        // Mettre à jour le rôle + ASSAINISSEMENT : la ville du compte suit la
        // ville professionnelle (une seule source, jamais demandée deux fois)
        await this.prisma.user.update({
            where: { id: userId },
            data: { role: Role.ARTISAN, ville: dto.villePrincipale },
        });

        return this.formatArtisanResponse(artisan);
    }

    async search(dto: SearchArtisanDto): Promise<ArtisanListResponseDto> {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const skip = (page - 1) * limit;

        // Construire les conditions de recherche.
        // Route publique : seuls les artisans validés (ACTIF) sont visibles,
        // jamais ceux en attente, rejetés ou suspendus.
        const where: Prisma.ArtisanWhereInput = {
            deletedAt: null,
            statut: StatutArtisan.ACTIF,
        };

        // Filtrer par disponibilité si demandé
        if (dto.disponibleOnly === true) {
            where.disponible = true;
        }

        if (dto.verifiedOnly) {
            where.verified = true;
        }

        if (dto.accepteUrgences) {
            where.accepteUrgences = true;
        }

        if (dto.accepteWeekend) {
            where.accepteWeekend = true;
        }

        if (dto.noteMin !== undefined) {
            where.noteMoyenne = { gte: dto.noteMin };
        }

        if (dto.ville) {
            where.villePrincipale = { contains: dto.ville, mode: 'insensitive' };
        }

        // Filtre par métier - Optimisation: résoudre le slug en ID d'abord pour éviter les joins
        if (dto.metierId) {
            where.metiers = { some: { metierId: dto.metierId } };
        } else if (dto.metierSlug) {
            const metier = await this.prisma.metier.findUnique({
                where: { slug: dto.metierSlug },
                select: { id: true },
            });
            if (metier) {
                where.metiers = { some: { metierId: metier.id } };
            } else {
                // Métier non trouvé, retourner une liste vide
                return { data: [], total: 0, page, limit, totalPages: 0 };
            }
        }

        // Filtre par catégorie - Optimisation: résoudre le slug/ID en liste de métiers IDs
        if (dto.categorieId || dto.categorieSlug) {
            let categoryId: string | undefined = dto.categorieId;

            // Résoudre le slug en ID si nécessaire
            if (!categoryId && dto.categorieSlug) {
                const categorie = await this.prisma.categorieMetier.findUnique({
                    where: { slug: dto.categorieSlug },
                    select: { id: true },
                });
                if (!categorie) {
                    return { data: [], total: 0, page, limit, totalPages: 0 };
                }
                categoryId = categorie.id;
            }

            // Filtrer par categorieId directement sur le métier
            if (categoryId) {
                where.metiers = { some: { metier: { categorieId: categoryId } } };
            }
        }

        // Recherche textuelle
        if (dto.q) {
            where.AND = [
                ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
                {
                    OR: [
                        { nomEntreprise: { contains: dto.q, mode: 'insensitive' } },
                        { bio: { contains: dto.q, mode: 'insensitive' } },
                        { user: { nom: { contains: dto.q, mode: 'insensitive' } } },
                        { user: { prenom: { contains: dto.q, mode: 'insensitive' } } },
                    ],
                },
            ];
        }

        // Déterminer l'ordre de tri
        let orderBy: Prisma.ArtisanOrderByWithRelationInput[] = [];

        switch (dto.sortBy) {
            case SortBy.NOTE:
                orderBy = [{ noteMoyenne: dto.sortOrder ?? SortOrder.DESC }];
                break;
            case SortBy.AVIS:
                orderBy = [{ nombreAvis: dto.sortOrder ?? SortOrder.DESC }];
                break;
            case SortBy.EXPERIENCE:
                orderBy = [{ anneesExperience: dto.sortOrder ?? SortOrder.DESC }];
                break;
            case SortBy.RECENT:
                orderBy = [{ createdAt: dto.sortOrder ?? SortOrder.DESC }];
                break;
            default:
                orderBy = [{ noteMoyenne: 'desc' }, { nombreAvis: 'desc' }];
        }

        // Exécuter la requête
        const [artisans, total] = await Promise.all([
            this.prisma.artisan.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: ARTISAN_INCLUDE,
            }),
            this.prisma.artisan.count({ where }),
        ]);

        return {
            data: artisans.map((a) => this.formatArtisanResponse(a)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Recherche optimisée avec réponse légère (40-50% plus petit)
     * Utilisée pour les listes de résultats de recherche
     */
    async searchOptimized(dto: SearchArtisanDto): Promise<ArtisanSearchResponseDto> {
        // Tenter de récupérer depuis le cache
        const cacheKey = this.buildSearchCacheKey(dto);
        const cached = await this.cacheService.get<ArtisanSearchResponseDto>(cacheKey);
        if (cached) {
            this.logger.debug(`Cache HIT search [${cacheKey}]`);
            return cached;
        }

        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const skip = (page - 1) * limit;

        // Construire les conditions de recherche.
        // Route publique : seuls les artisans validés (ACTIF) sont visibles.
        const where: Prisma.ArtisanWhereInput = {
            deletedAt: null,
            statut: StatutArtisan.ACTIF,
        };

        // Filtres simples
        if (dto.disponibleOnly === true) where.disponible = true;
        if (dto.verifiedOnly) where.verified = true;
        if (dto.accepteUrgences) where.accepteUrgences = true;
        if (dto.accepteWeekend) where.accepteWeekend = true;
        if (dto.noteMin !== undefined) where.noteMoyenne = { gte: dto.noteMin };
        if (dto.ville) where.villePrincipale = { contains: dto.ville, mode: 'insensitive' };

        // Filtre par métier - Optimisation: résoudre le slug en ID d'abord
        if (dto.metierId) {
            where.metiers = { some: { metierId: dto.metierId } };
        } else if (dto.metierSlug) {
            const metier = await this.prisma.metier.findUnique({
                where: { slug: dto.metierSlug },
                select: { id: true },
            });
            if (metier) {
                where.metiers = { some: { metierId: metier.id } };
            } else {
                return { data: [], total: 0, page, limit, totalPages: 0 };
            }
        }

        // Filtre par catégorie - Optimisation
        if (dto.categorieId || dto.categorieSlug) {
            let categoryId: string | undefined = dto.categorieId;
            if (!categoryId && dto.categorieSlug) {
                const categorie = await this.prisma.categorieMetier.findUnique({
                    where: { slug: dto.categorieSlug },
                    select: { id: true },
                });
                if (!categorie) {
                    return { data: [], total: 0, page, limit, totalPages: 0 };
                }
                categoryId = categorie.id;
            }
            if (categoryId) {
                where.metiers = { some: { metier: { categorieId: categoryId } } };
            }
        }

        // Recherche textuelle
        if (dto.q) {
            where.AND = [
                {
                    OR: [
                        { nomEntreprise: { contains: dto.q, mode: 'insensitive' } },
                        { bio: { contains: dto.q, mode: 'insensitive' } },
                        { user: { nom: { contains: dto.q, mode: 'insensitive' } } },
                        { user: { prenom: { contains: dto.q, mode: 'insensitive' } } },
                    ],
                },
            ];
        }

        // Ordre de tri
        let orderBy: Prisma.ArtisanOrderByWithRelationInput[] = [];
        switch (dto.sortBy) {
            case SortBy.NOTE:
                orderBy = [{ noteMoyenne: dto.sortOrder ?? SortOrder.DESC }];
                break;
            case SortBy.AVIS:
                orderBy = [{ nombreAvis: dto.sortOrder ?? SortOrder.DESC }];
                break;
            case SortBy.EXPERIENCE:
                orderBy = [{ anneesExperience: dto.sortOrder ?? SortOrder.DESC }];
                break;
            case SortBy.RECENT:
                orderBy = [{ createdAt: dto.sortOrder ?? SortOrder.DESC }];
                break;
            default:
                orderBy = [{ noteMoyenne: 'desc' }, { nombreAvis: 'desc' }];
        }

        // Requête optimisée avec sélection minimale
        const [artisans, total] = await Promise.all([
            this.prisma.artisan.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    nomEntreprise: true,
                    photoProfilUrl: true,
                    photoCouvertureUrl: true,
                    noteMoyenne: true,
                    nombreAvis: true,
                    villePrincipale: true,
                    tarifHoraire: true,
                    verified: true,
                    disponible: true,
                    abonnementType: true,
                    ambassadeurNiveau: true,
                    anneesExperience: true,
                    accepteUrgences: true,
                    accepteWeekend: true,
                    user: {
                        select: {
                            id: true,
                            prenom: true,
                            nom: true,
                            email: true,
                        },
                    },
                    metiers: {
                        where: { estPrincipal: true },
                        take: 1,
                        include: {
                            metier: {
                                select: {
                                    id: true,
                                    nom: true,
                                    slug: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.artisan.count({ where }),
        ]);

        // PROXIMITÉ : si le client envoie sa position, chaque résultat porte sa
        // distance réelle (PostGIS) — l'app affiche la distance, pas les prix
        const distances = await this.computeDistances(
            artisans.map((a) => a.id),
            dto.latitude,
            dto.longitude,
        );

        const result: ArtisanSearchResponseDto = {
            data: artisans.map(
                (a): ArtisanListItemDto => ({
                    id: a.id,
                    nomEntreprise: a.nomEntreprise,
                    photoProfilUrl: a.photoProfilUrl,
                    photoCouvertureUrl: a.photoCouvertureUrl,
                    noteMoyenne: Number(a.noteMoyenne),
                    nombreAvis: a.nombreAvis,
                    villePrincipale: a.villePrincipale,
                    tarifHoraire: a.tarifHoraire ? Number(a.tarifHoraire) : null,
                    verified: a.verified,
                    disponible: a.disponible,
                    abonnementType: a.abonnementType,
                    ambassadeurNiveau: a.ambassadeurNiveau,
                    anneesExperience: a.anneesExperience,
                    accepteUrgences: a.accepteUrgences,
                    accepteWeekend: a.accepteWeekend,
                    metierPrincipal: a.metiers[0]?.metier ?? null,
                    user: a.user,
                    distanceKm: distances.get(a.id) ?? null,
                }),
            ),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };

        // Mise en cache 10 minutes (invalide sur toute mutation d'artisan)
        await this.cacheService.set(cacheKey, result, CacheService.TTL.SEARCH_RESULTS);
        this.logger.debug(`Cache MISS → stored search results [${cacheKey}]`);
        return result;
    }

    /**
     * Distances PostGIS entre la position du client et une page d'artisans.
     * Une seule requête sur les ids de la page (≤ 20) : coût négligeable.
     */
    private async computeDistances(
        artisanIds: string[],
        latitude?: number,
        longitude?: number,
    ): Promise<Map<string, number>> {
        const distances = new Map<string, number>();
        if (latitude == null || longitude == null || artisanIds.length === 0) {
            return distances;
        }
        try {
            const rows = await this.prisma.$queryRaw<{ id: string; distance_km: number }[]>`
                SELECT
                    a.id,
                    ROUND(
                        ST_Distance(
                            a.location,
                            ST_SetSRID(ST_MakePoint(${longitude}::float, ${latitude}::float), 4326)::geography
                        )::numeric / 1000,
                        1
                    ) AS distance_km
                FROM artisans a
                WHERE a.id = ANY(${artisanIds})
                AND a.location IS NOT NULL
            `;
            for (const row of rows) {
                distances.set(row.id, Number(row.distance_km));
            }
        } catch (error) {
            // PostGIS indisponible : la recherche fonctionne, juste sans distances
            this.logger.warn(
                `Distances indisponibles: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
        return distances;
    }

    async findOne(id: string): Promise<ArtisanDetailResponseDto> {
        // Cache-aside : retourne depuis Redis si disponible
        const cacheKey = `${CacheService.PREFIX.ARTISAN}${id}`;
        const cached = await this.cacheService.getArtisanProfile<ArtisanDetailResponseDto>(id);
        if (cached) {
            this.logger.debug(`Cache HIT artisan profile [${id}]`);
            return cached;
        }

        const artisan = await this.prisma.artisan.findUnique({
            where: { id },
            include: ARTISAN_INCLUDE,
        });

        if (!artisan || artisan.deletedAt !== null) {
            throw new NotFoundException('Artisan non trouvé');
        }

        const response = this.formatArtisanResponse(artisan);
        // Mise en cache 5 minutes
        await this.cacheService.setArtisanProfile(id, response);
        this.logger.debug(`Cache MISS → stored artisan profile [${id}] key=${cacheKey}`);
        return response;
    }

    async findByUserId(userId: string): Promise<ArtisanDetailResponseDto> {
        const artisan = await this.prisma.artisan.findUnique({
            where: { userId },
            include: ARTISAN_INCLUDE,
        });

        if (!artisan || artisan.deletedAt !== null) {
            throw new NotFoundException('Profil artisan non trouvé');
        }

        return this.formatArtisanResponse(artisan);
    }

    async update(
        id: string,
        userId: string,
        dto: UpdateArtisanDto,
    ): Promise<ArtisanDetailResponseDto> {
        this.assertCdnUrls(dto);
        this.assertPositionZoneService(dto.latitude, dto.longitude);

        const artisan = await this.prisma.artisan.findUnique({
            where: { id },
        });

        if (!artisan || artisan.deletedAt !== null) {
            throw new NotFoundException('Artisan non trouvé');
        }

        if (artisan.userId !== userId) {
            throw new ForbiddenException('Vous ne pouvez modifier que votre propre profil');
        }

        const updated = await this.prisma.artisan.update({
            where: { id },
            data: {
                nomEntreprise: dto.nomEntreprise,
                numeroIfu: dto.numeroIfu,
                anneesExperience: dto.anneesExperience,
                bio: dto.bio,
                slogan: dto.slogan,
                photoProfilUrl: dto.photoProfilUrl,
                photoCouvertureUrl: dto.photoCouvertureUrl,
                portfolioUrls: dto.portfolioUrls,
                adresseAtelier: dto.adresseAtelier,
                latitude: dto.latitude,
                longitude: dto.longitude,
                villePrincipale: dto.villePrincipale,
                zoneInterventionKm: dto.zoneInterventionKm,
                villesIntervention: dto.villesIntervention,
                disponible: dto.disponible,
                accepteUrgences: dto.accepteUrgences,
                accepteWeekend: dto.accepteWeekend,
                horairesTravail: dto.horairesTravail as unknown as Prisma.InputJsonValue,
            },
            include: ARTISAN_INCLUDE,
        });

        // ASSAINISSEMENT : la ville du compte suit la ville professionnelle
        if (dto.villePrincipale) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { ville: dto.villePrincipale },
            });
        }

        // Invalider le cache du profil modifié + les résultats de recherche
        await Promise.all([
            this.cacheService.invalidateArtisanProfile(id),
            this.cacheService.delByPattern(`${CacheService.PREFIX.SEARCH}*`),
        ]);

        return this.formatArtisanResponse(updated);
    }

    async updateMetiers(
        id: string,
        userId: string,
        dto: UpdateArtisanMetiersDto,
    ): Promise<ArtisanDetailResponseDto> {
        const artisan = await this.prisma.artisan.findUnique({
            where: { id },
        });

        if (!artisan || artisan.deletedAt !== null) {
            throw new NotFoundException('Artisan non trouvé');
        }

        if (artisan.userId !== userId) {
            throw new ForbiddenException('Vous ne pouvez modifier que votre propre profil');
        }

        this.assertMetiersNorme(dto.metiers);

        // Vérifier que tous les métiers existent ET sont actifs
        const metierIds = dto.metiers.map((m) => m.metierId);
        const metiers = await this.prisma.metier.findMany({
            where: {
                id: { in: metierIds },
                actif: true,
            },
        });

        if (metiers.length !== metierIds.length) {
            throw new BadRequestException('Un ou plusieurs métiers sont invalides ou inactifs');
        }

        // Supprimer les anciens métiers et créer les nouveaux
        await this.prisma.artisanMetier.deleteMany({
            where: { artisanId: id },
        });

        const updated = await this.prisma.artisan.update({
            where: { id },
            data: {
                metiers: {
                    create: dto.metiers.map((m) => ({
                        metierId: m.metierId,
                        estPrincipal: m.estPrincipal ?? false,
                        anneesExperience: m.anneesExperience,
                        certifie: m.certifie ?? false,
                        tarifHoraire: m.tarifHoraire,
                        description: m.description,
                    })),
                },
            },
            include: ARTISAN_INCLUDE,
        });

        // Invalider le cache profil + recherche après changement de métiers
        await Promise.all([
            this.cacheService.invalidateArtisanProfile(id),
            this.cacheService.delByPattern(`${CacheService.PREFIX.SEARCH}*`),
        ]);

        return this.formatArtisanResponse(updated);
    }

    async toggleDisponibilite(id: string, userId: string): Promise<{ disponible: boolean }> {
        const artisan = await this.prisma.artisan.findUnique({
            where: { id },
        });

        if (!artisan || artisan.deletedAt !== null) {
            throw new NotFoundException('Artisan non trouvé');
        }

        if (artisan.userId !== userId) {
            throw new ForbiddenException('Vous ne pouvez modifier que votre propre profil');
        }

        const updated = await this.prisma.artisan.update({
            where: { id },
            data: { disponible: !artisan.disponible },
            select: { disponible: true },
        });

        // Invalider le cache (disponibilite affecte les résultats de recherche)
        await Promise.all([
            this.cacheService.invalidateArtisanProfile(id),
            this.cacheService.delByPattern(`${CacheService.PREFIX.SEARCH}*`),
        ]);

        return { disponible: updated.disponible };
    }

    // ==================== ADMIN METHODS ====================

    async verify(id: string, verifiedBy: string): Promise<ArtisanDetailResponseDto> {
        const artisan = await this.prisma.artisan.findUnique({
            where: { id },
        });

        if (!artisan || artisan.deletedAt !== null) {
            throw new NotFoundException('Artisan non trouvé');
        }

        if (artisan.verified) {
            throw new ConflictException('Cet artisan est déjà vérifié');
        }

        // RÈGLE D'ACTIVATION : pièce d'identité VALIDÉE + preuve du métier
        // principal VALIDÉE. Les métiers secondaires restent optionnels : leurs
        // preuves ne bloquent pas l'activation, elles donnent juste le badge
        // « certifié » quand elles sont approuvées.
        const [identiteValidee, principal] = await Promise.all([
            this.prisma.certification.findFirst({
                where: { artisanId: id, type: 'IDENTITE', statutVerification: 'VALIDEE' },
                select: { id: true },
            }),
            this.prisma.artisanMetier.findFirst({
                where: { artisanId: id, estPrincipal: true },
                select: { metierId: true },
            }),
        ]);
        if (!identiteValidee) {
            throw new BadRequestException(
                "Validez d'abord la pièce d'identité de l'artisan avant d'activer son profil",
            );
        }
        if (principal) {
            const preuvePrincipale = await this.prisma.certification.findFirst({
                where: {
                    artisanId: id,
                    type: 'METIER',
                    metierId: principal.metierId,
                    statutVerification: 'VALIDEE',
                },
                select: { id: true },
            });
            if (!preuvePrincipale) {
                throw new BadRequestException(
                    "Validez d'abord la preuve du métier principal (diplôme ou attestation) avant d'activer le profil",
                );
            }
        }

        const updated = await this.prisma.artisan.update({
            where: { id },
            data: {
                verified: true,
                verifiedAt: new Date(),
                verifiedBy,
                statut: StatutArtisan.ACTIF,
            },
            include: ARTISAN_INCLUDE,
        });

        // Invalider le cache — la vérification change le profil public
        await Promise.all([
            this.cacheService.invalidateArtisanProfile(id),
            this.cacheService.delByPattern(`${CacheService.PREFIX.SEARCH}*`),
        ]);

        // Prévenir l'artisan : son profil vient d'être activé
        void this.notificationService.send({
            userId: artisan.userId,
            type: 'SYSTEME',
            titre: 'Profil validé 🎉',
            corps: 'Félicitations, votre profil artisan a été vérifié ! Vous êtes maintenant visible des clients et pouvez recevoir des demandes.',
            data: { screen: 'activite', artisanId: id },
        });

        return this.formatArtisanResponse(updated);
    }

    async reject(id: string, raison: string): Promise<ArtisanDetailResponseDto> {
        const artisan = await this.prisma.artisan.findUnique({
            where: { id },
        });

        if (!artisan || artisan.deletedAt !== null) {
            throw new NotFoundException('Artisan non trouvé');
        }

        if (artisan.statut !== StatutArtisan.EN_ATTENTE) {
            throw new BadRequestException('Seuls les artisans en attente peuvent être rejetés');
        }

        const updated = await this.prisma.artisan.update({
            where: { id },
            data: {
                statut: StatutArtisan.REJETE,
                raisonSuspension: raison,
            },
            include: ARTISAN_INCLUDE,
        });

        await Promise.all([
            this.cacheService.invalidateArtisanProfile(id),
            this.cacheService.delByPattern(`${CacheService.PREFIX.SEARCH}*`),
        ]);

        // Prévenir l'artisan avec le motif : il corrige puis resoumets
        void this.notificationService.send({
            userId: artisan.userId,
            type: 'SYSTEME',
            titre: 'Profil refusé',
            corps: `Votre profil n'a pas pu être validé. Motif : ${raison} Corrigez vos justificatifs dans l'app : votre dossier repartira automatiquement en examen.`,
            data: { screen: 'justificatifs', artisanId: id },
        });

        return this.formatArtisanResponse(updated);
    }

    async updateStatut(id: string, dto: UpdateArtisanStatutDto): Promise<ArtisanDetailResponseDto> {
        const artisan = await this.prisma.artisan.findUnique({
            where: { id },
        });

        if (!artisan || artisan.deletedAt !== null) {
            throw new NotFoundException('Artisan non trouvé');
        }

        if (dto.statut === StatutArtisan.SUSPENDU && !dto.raisonSuspension) {
            throw new BadRequestException('Une raison est requise pour suspendre un artisan');
        }

        const updated = await this.prisma.artisan.update({
            where: { id },
            data: {
                statut: dto.statut,
                raisonSuspension:
                    dto.statut === StatutArtisan.SUSPENDU ? dto.raisonSuspension : null,
            },
            include: ARTISAN_INCLUDE,
        });

        await Promise.all([
            this.cacheService.invalidateArtisanProfile(id),
            this.cacheService.delByPattern(`${CacheService.PREFIX.SEARCH}*`),
        ]);

        return this.formatArtisanResponse(updated);
    }

    async softDelete(id: string): Promise<{ message: string }> {
        const artisan = await this.prisma.artisan.findUnique({
            where: { id },
        });

        if (!artisan || artisan.deletedAt !== null) {
            throw new NotFoundException('Artisan non trouvé');
        }

        await this.prisma.artisan.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                statut: StatutArtisan.SUSPENDU,
                disponible: false,
            },
        });

        // Remettre le rôle utilisateur à CLIENT
        await this.prisma.user.update({
            where: { id: artisan.userId },
            data: { role: Role.CLIENT },
        });

        return { message: 'Profil artisan supprimé avec succès' };
    }

    async incrementVuesProfil(id: string): Promise<void> {
        await this.prisma.artisan.update({
            where: { id },
            data: { totalVuesProfil: { increment: 1 } },
        });
        // Invalider le cache car totalVuesProfil est exposé dans le profil
        await this.cacheService.invalidateArtisanProfile(id);
    }

    /**
     * Génère une clé de cache déterministe pour un DTO de recherche.
     * MD5 (collision-ok ici, besoin de vitesse, pas de crypto-sécurité).
     */
    private buildSearchCacheKey(dto: SearchArtisanDto): string {
        const normalized = JSON.stringify(dto, Object.keys(dto).sort());
        const hash = createHash('md5').update(normalized).digest('hex').slice(0, 16);
        return `${CacheService.PREFIX.SEARCH}artisan:${hash}`;
    }

    private formatArtisanResponse(artisan: ArtisanWithIncludes): ArtisanDetailResponseDto {
        return {
            id: artisan.id,
            userId: artisan.userId,
            nomEntreprise: artisan.nomEntreprise,
            numeroIfu: artisan.numeroIfu,
            anneesExperience: artisan.anneesExperience,
            bio: artisan.bio,
            slogan: artisan.slogan,
            photoProfilUrl: artisan.photoProfilUrl,
            photoCouvertureUrl: artisan.photoCouvertureUrl,
            // Le portfolio est stocké soit en ["url"] (seed), soit en [{url, caption…}]
            // (module portfolio) : on expose toujours un simple tableau d'URLs ici.
            portfolioUrls: Array.isArray(artisan.portfolioUrls)
                ? artisan.portfolioUrls
                      .map((entry) =>
                          typeof entry === 'string'
                              ? entry
                              : entry && typeof entry === 'object' && 'url' in entry
                                ? (entry as { url: string }).url
                                : null,
                      )
                      .filter((u): u is string => typeof u === 'string')
                : null,
            adresseAtelier: artisan.adresseAtelier,
            latitude: Number(artisan.latitude),
            longitude: Number(artisan.longitude),
            villePrincipale: artisan.villePrincipale,
            zoneInterventionKm: Number(artisan.zoneInterventionKm),
            villesIntervention: artisan.villesIntervention as string[] | null,
            noteMoyenne: Number(artisan.noteMoyenne),
            nombreAvis: artisan.nombreAvis,
            compteurDemandesMoisCourant: artisan.compteurDemandesMoisCourant,
            nombreMissionsCompletees: artisan.nombreMissionsCompletees,
            tauxCompletion: Number(artisan.tauxCompletion),
            tauxReponseMoyen: artisan.tauxReponseMoyen,
            tarifHoraire: artisan.tarifHoraire ? Number(artisan.tarifHoraire) : null,
            tarifDeplacement: artisan.tarifDeplacement ? Number(artisan.tarifDeplacement) : null,
            disponible: artisan.disponible,
            accepteUrgences: artisan.accepteUrgences,
            accepteWeekend: artisan.accepteWeekend,
            horairesTravail: artisan.horairesTravail,
            verified: artisan.verified,
            verifiedAt: artisan.verifiedAt,
            badges: artisan.badges,
            abonnementType: artisan.abonnementType,
            ambassadeurNiveau: artisan.ambassadeurNiveau,
            abonnementExpireAt: artisan.abonnementExpireAt,
            totalVuesProfil: artisan.totalVuesProfil,
            totalContacts: artisan.totalContacts,
            statut: artisan.statut,
            raisonSuspension: artisan.raisonSuspension,
            createdAt: artisan.createdAt,
            updatedAt: artisan.updatedAt,
            user: artisan.user,
            metiers: artisan.metiers.map((am) => ({
                id: am.id,
                estPrincipal: am.estPrincipal,
                anneesExperience: am.anneesExperience,
                certifie: am.certifie,
                tarifHoraire: am.tarifHoraire ? Number(am.tarifHoraire) : null,
                description: am.description,
                metier: am.metier,
            })),
        };
    }
}
