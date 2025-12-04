import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
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
        select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
            telephone: true,
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
    constructor(private prisma: PrismaService) {}

    async create(userId: string, dto: CreateArtisanDto): Promise<ArtisanDetailResponseDto> {
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

        // Vérifier qu'il n'y a qu'un seul métier principal
        const principaux = dto.metiers.filter((m) => m.estPrincipal);
        if (principaux.length > 1) {
            throw new BadRequestException("Il ne peut y avoir qu'un seul métier principal");
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

        // Mettre à jour le rôle de l'utilisateur
        await this.prisma.user.update({
            where: { id: userId },
            data: { role: Role.ARTISAN },
        });

        return this.formatArtisanResponse(artisan);
    }

    async search(dto: SearchArtisanDto): Promise<ArtisanListResponseDto> {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const skip = (page - 1) * limit;

        // Construire les conditions de recherche
        const where: Prisma.ArtisanWhereInput = {
            deletedAt: null,
        };

        // Filtrer par disponibilité si demandé
        if (dto.disponibleOnly === true) {
            where.disponible = true;
        }

        // Filtrer par statut ACTIF uniquement si demandé
        if (dto.activeOnly === true) {
            where.statut = StatutArtisan.ACTIF;
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
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const skip = (page - 1) * limit;

        // Construire les conditions de recherche
        const where: Prisma.ArtisanWhereInput = {
            deletedAt: null,
        };

        // Filtres simples
        if (dto.disponibleOnly === true) where.disponible = true;
        if (dto.activeOnly === true) where.statut = StatutArtisan.ACTIF;
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
                    noteMoyenne: true,
                    nombreAvis: true,
                    villePrincipale: true,
                    verified: true,
                    disponible: true,
                    abonnementType: true,
                    anneesExperience: true,
                    accepteUrgences: true,
                    accepteWeekend: true,
                    user: {
                        select: {
                            id: true,
                            prenom: true,
                            nom: true,
                            email: true,
                            telephone: true,
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

        return {
            data: artisans.map(
                (a): ArtisanListItemDto => ({
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
                    accepteWeekend: a.accepteWeekend,
                    metierPrincipal: a.metiers[0]?.metier ?? null,
                    user: a.user,
                }),
            ),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: string): Promise<ArtisanDetailResponseDto> {
        const artisan = await this.prisma.artisan.findUnique({
            where: { id },
            include: ARTISAN_INCLUDE,
        });

        if (!artisan || artisan.deletedAt !== null) {
            throw new NotFoundException('Artisan non trouvé');
        }

        return this.formatArtisanResponse(artisan);
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

        // Vérifier qu'il n'y a qu'un seul métier principal
        const principaux = dto.metiers.filter((m) => m.estPrincipal);
        if (principaux.length > 1) {
            throw new BadRequestException("Il ne peut y avoir qu'un seul métier principal");
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
            portfolioUrls: artisan.portfolioUrls as string[] | null,
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
            disponible: artisan.disponible,
            accepteUrgences: artisan.accepteUrgences,
            accepteWeekend: artisan.accepteWeekend,
            horairesTravail: artisan.horairesTravail,
            verified: artisan.verified,
            verifiedAt: artisan.verifiedAt,
            badges: artisan.badges,
            abonnementType: artisan.abonnementType,
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
