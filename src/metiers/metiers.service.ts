import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/services/cache.service';
import { Prisma } from 'src/generated/prisma';
import {
    CreateMetierDto,
    UpdateMetierDto,
    MetierResponseDto,
    MetierWithCategorieResponseDto,
    SuggestMetierDto,
} from './dto';

@Injectable()
export class MetiersService {
    constructor(
        private prisma: PrismaService,
        private cacheService: CacheService,
    ) {}

    async create(dto: CreateMetierDto): Promise<MetierResponseDto> {
        // Vérifier que la catégorie existe
        const categorie = await this.prisma.categorieMetier.findUnique({
            where: { id: dto.categorieId },
        });

        if (!categorie) {
            throw new NotFoundException('Catégorie de métier non trouvée');
        }

        // Vérifier l'unicité du nom et du slug
        const existing = await this.prisma.metier.findFirst({
            where: {
                OR: [{ nom: dto.nom }, { slug: dto.slug }],
            },
        });

        if (existing) {
            if (existing.nom === dto.nom) {
                throw new ConflictException('Un métier avec ce nom existe déjà');
            }
            throw new ConflictException('Un métier avec ce slug existe déjà');
        }

        const result = await this.prisma.metier.create({
            data: {
                nom: dto.nom,
                slug: dto.slug,
                description: dto.description,
                iconUrl: dto.iconUrl,
                categorieId: dto.categorieId,
                ordreAffichage: dto.ordreAffichage ?? 0,
                populaire: dto.populaire ?? false,
                actif: dto.actif ?? true,
            },
        });

        // Invalider le cache des métiers et catégories (count des métiers)
        await this.cacheService.invalidateMetiers();
        await this.cacheService.invalidateCategories();

        return result;
    }

    async findAll(options?: {
        categorieId?: string;
        populaire?: boolean;
        includeInactive?: boolean;
    }): Promise<MetierWithCategorieResponseDto[]> {
        // Si pas de filtres spécifiques, utiliser le cache
        const includeInactive = options?.includeInactive ?? false;
        if (!options?.categorieId && options?.populaire === undefined) {
            const cached =
                await this.cacheService.getAllMetiers<MetierWithCategorieResponseDto[]>(
                    includeInactive,
                );
            if (cached) {
                return cached;
            }
        }

        const where: Prisma.MetierWhereInput = {};

        if (!includeInactive) {
            where.actif = true;
            // Route publique : ne jamais exposer les métiers suggérés non validés.
            where.valide = true;
        }

        if (options?.categorieId) {
            where.categorieId = options.categorieId;
        }

        if (options?.populaire !== undefined) {
            where.populaire = options.populaire;
        }

        const result = await this.prisma.metier.findMany({
            where,
            orderBy: [{ ordreAffichage: 'asc' }, { nom: 'asc' }],
            include: {
                categorie: {
                    select: {
                        id: true,
                        nom: true,
                        slug: true,
                    },
                },
                _count: {
                    select: { artisanMetiers: true },
                },
            },
        });

        // Mettre en cache si pas de filtres spécifiques
        if (!options?.categorieId && options?.populaire === undefined) {
            await this.cacheService.setAllMetiers(result, includeInactive);
        }

        return result;
    }

    async findOne(id: string): Promise<MetierWithCategorieResponseDto> {
        const metier = await this.prisma.metier.findUnique({
            where: { id },
            include: {
                categorie: {
                    select: {
                        id: true,
                        nom: true,
                        slug: true,
                    },
                },
                _count: {
                    select: { artisanMetiers: true },
                },
            },
        });

        if (!metier) {
            throw new NotFoundException('Métier non trouvé');
        }

        return metier;
    }

    async findBySlug(slug: string): Promise<MetierWithCategorieResponseDto> {
        const metier = await this.prisma.metier.findUnique({
            where: { slug },
            include: {
                categorie: {
                    select: {
                        id: true,
                        nom: true,
                        slug: true,
                    },
                },
                _count: {
                    select: { artisanMetiers: true },
                },
            },
        });

        if (!metier) {
            throw new NotFoundException('Métier non trouvé');
        }

        return metier;
    }

    async findByCategorie(categorieSlug: string): Promise<MetierWithCategorieResponseDto[]> {
        const categorie = await this.prisma.categorieMetier.findUnique({
            where: { slug: categorieSlug },
        });

        if (!categorie) {
            throw new NotFoundException('Catégorie de métier non trouvée');
        }

        // Vérifier le cache
        const cached = await this.cacheService.getMetiersByCategory<
            MetierWithCategorieResponseDto[]
        >(categorie.id);
        if (cached) {
            return cached;
        }

        const result = await this.prisma.metier.findMany({
            where: {
                categorieId: categorie.id,
                actif: true,
                valide: true,
            },
            orderBy: [{ ordreAffichage: 'asc' }, { nom: 'asc' }],
            include: {
                categorie: {
                    select: {
                        id: true,
                        nom: true,
                        slug: true,
                    },
                },
                _count: {
                    select: { artisanMetiers: true },
                },
            },
        });

        // Mettre en cache
        await this.cacheService.setMetiersByCategory(categorie.id, result);

        return result;
    }

    async findPopulaires(limit = 10): Promise<MetierWithCategorieResponseDto[]> {
        // Vérifier le cache
        const cached =
            await this.cacheService.getMetiersPopulaires<MetierWithCategorieResponseDto[]>(limit);
        if (cached) {
            return cached;
        }

        const result = await this.prisma.metier.findMany({
            where: {
                populaire: true,
                actif: true,
                valide: true,
            },
            take: limit,
            orderBy: [{ ordreAffichage: 'asc' }, { nom: 'asc' }],
            include: {
                categorie: {
                    select: {
                        id: true,
                        nom: true,
                        slug: true,
                    },
                },
                _count: {
                    select: { artisanMetiers: true },
                },
            },
        });

        // Mettre en cache
        await this.cacheService.setMetiersPopulaires(limit, result);

        return result;
    }

    async update(id: string, dto: UpdateMetierDto): Promise<MetierResponseDto> {
        // Vérifier que le métier existe
        const existing = await this.prisma.metier.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Métier non trouvé');
        }

        // Vérifier que la catégorie existe si elle est modifiée
        if (dto.categorieId) {
            const categorie = await this.prisma.categorieMetier.findUnique({
                where: { id: dto.categorieId },
            });

            if (!categorie) {
                throw new NotFoundException('Catégorie de métier non trouvée');
            }
        }

        // Vérifier l'unicité du nom et du slug si modifiés
        if (dto.nom || dto.slug) {
            const duplicate = await this.prisma.metier.findFirst({
                where: {
                    AND: [
                        { id: { not: id } },
                        {
                            OR: [
                                dto.nom ? { nom: dto.nom } : {},
                                dto.slug ? { slug: dto.slug } : {},
                            ].filter((o) => Object.keys(o).length > 0),
                        },
                    ],
                },
            });

            if (duplicate) {
                if (dto.nom && duplicate.nom === dto.nom) {
                    throw new ConflictException('Un métier avec ce nom existe déjà');
                }
                if (dto.slug && duplicate.slug === dto.slug) {
                    throw new ConflictException('Un métier avec ce slug existe déjà');
                }
            }
        }

        const result = await this.prisma.metier.update({
            where: { id },
            data: {
                nom: dto.nom,
                slug: dto.slug,
                description: dto.description,
                iconUrl: dto.iconUrl,
                categorieId: dto.categorieId,
                ordreAffichage: dto.ordreAffichage,
                populaire: dto.populaire,
                actif: dto.actif,
                valide: dto.valide,
            },
        });

        // Invalider le cache des métiers
        await this.cacheService.invalidateMetiers();
        await this.cacheService.invalidateCategories();

        return result;
    }

    /**
     * Suggestion d'un métier par un artisan dont le métier n'est pas répertorié.
     * Le métier est créé « en attente » (valide=false) : invisible côté client,
     * mais l'artisan peut immédiatement s'y rattacher pour finir son inscription.
     * Un administrateur le validera ensuite (PATCH valide=true) pour le rendre
     * public. Si un métier au nom identique existe déjà, on le renvoie tel quel
     * plutôt que de créer un doublon.
     */
    async suggest(dto: SuggestMetierDto): Promise<MetierWithCategorieResponseDto> {
        const nom = dto.nom.trim();

        // La catégorie doit exister
        const categorie = await this.prisma.categorieMetier.findUnique({
            where: { id: dto.categorieId },
        });
        if (!categorie) {
            throw new NotFoundException('Catégorie de métier non trouvée');
        }

        const slug = this.slugify(nom);

        // Éviter les doublons : réutiliser un métier existant au nom/slug proche
        const existing = await this.prisma.metier.findFirst({
            where: {
                OR: [
                    { nom: { equals: nom, mode: 'insensitive' } },
                    { slug },
                ],
            },
        });
        if (existing) {
            return this.findOne(existing.id);
        }

        const created = await this.prisma.metier.create({
            data: {
                nom,
                slug,
                description: 'Métier suggéré par un artisan, en attente de validation.',
                categorieId: dto.categorieId,
                ordreAffichage: 999,
                populaire: false,
                actif: true, // l'artisan doit pouvoir s'y rattacher (create profil exige actif=true)
                valide: false, // …mais invisible côté client jusqu'à validation admin
            },
        });

        // Rafraîchir les listes admin (les listes publiques ignorent valide=false)
        await this.cacheService.invalidateMetiers();
        await this.cacheService.invalidateCategories();

        return this.findOne(created.id);
    }

    /** [Admin] Métiers suggérés en attente de validation (valide=false). */
    async findPending(): Promise<MetierWithCategorieResponseDto[]> {
        return this.prisma.metier.findMany({
            where: { valide: false },
            orderBy: [{ createdAt: 'asc' }],
            include: {
                categorie: { select: { id: true, nom: true, slug: true } },
                _count: { select: { artisanMetiers: true } },
            },
        });
    }

    /** [Admin] Valide un métier suggéré : il devient public. */
    async validate(id: string): Promise<MetierResponseDto> {
        const existing = await this.prisma.metier.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Métier non trouvé');
        }
        const result = await this.prisma.metier.update({
            where: { id },
            data: { valide: true, actif: true },
        });
        await this.cacheService.invalidateMetiers();
        await this.cacheService.invalidateCategories();
        return result;
    }

    /** Slug URL-safe à partir d'un nom (accents retirés, espaces → tirets). */
    private slugify(nom: string): string {
        return nom
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 100);
    }

    async remove(id: string): Promise<{ message: string }> {
        const metier = await this.prisma.metier.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { artisanMetiers: true },
                },
            },
        });

        if (!metier) {
            throw new NotFoundException('Métier non trouvé');
        }

        if (metier._count.artisanMetiers > 0) {
            throw new BadRequestException(
                `Impossible de supprimer ce métier car ${metier._count.artisanMetiers} artisan(s) l'exercent`,
            );
        }

        await this.prisma.metier.delete({
            where: { id },
        });

        // Invalider le cache des métiers et catégories (count des métiers)
        await this.cacheService.invalidateMetiers();
        await this.cacheService.invalidateCategories();

        return { message: 'Métier supprimé avec succès' };
    }
}
