import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    CreateMetierDto,
    UpdateMetierDto,
    MetierResponseDto,
    MetierWithCategorieResponseDto,
} from './dto';

@Injectable()
export class MetiersService {
    constructor(private prisma: PrismaService) {}

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

        return this.prisma.metier.create({
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
    }

    async findAll(options?: {
        categorieId?: string;
        populaire?: boolean;
        includeInactive?: boolean;
    }): Promise<MetierWithCategorieResponseDto[]> {
        const where: any = {};

        if (!options?.includeInactive) {
            where.actif = true;
        }

        if (options?.categorieId) {
            where.categorieId = options.categorieId;
        }

        if (options?.populaire !== undefined) {
            where.populaire = options.populaire;
        }

        return this.prisma.metier.findMany({
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

        return this.prisma.metier.findMany({
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
    }

    async findPopulaires(limit = 10): Promise<MetierWithCategorieResponseDto[]> {
        return this.prisma.metier.findMany({
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

        return this.prisma.metier.update({
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

        return { message: 'Métier supprimé avec succès' };
    }
}
