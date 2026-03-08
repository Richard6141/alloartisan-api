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
            },
        });

        // Invalider le cache des métiers
        await this.cacheService.invalidateMetiers();

        return result;
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
