import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/services/cache.service';
import {
    CreateCategorieMetierDto,
    UpdateCategorieMetierDto,
    CategorieMetierResponseDto,
    CategorieMetierWithMetiersResponseDto,
} from './dto';

@Injectable()
export class CategoriesMetiersService {
    constructor(
        private prisma: PrismaService,
        private cacheService: CacheService,
    ) {}

    async create(dto: CreateCategorieMetierDto): Promise<CategorieMetierResponseDto> {
        // Vérifier l'unicité du nom et du slug
        const existing = await this.prisma.categorieMetier.findFirst({
            where: {
                OR: [{ nom: dto.nom }, { slug: dto.slug }],
            },
        });

        if (existing) {
            if (existing.nom === dto.nom) {
                throw new ConflictException('Une catégorie avec ce nom existe déjà');
            }
            throw new ConflictException('Une catégorie avec ce slug existe déjà');
        }

        const result = await this.prisma.categorieMetier.create({
            data: {
                nom: dto.nom,
                slug: dto.slug,
                description: dto.description,
                iconUrl: dto.iconUrl,
                ordreAffichage: dto.ordreAffichage ?? 0,
                actif: dto.actif ?? true,
            },
        });

        // Invalider le cache des catégories
        await this.cacheService.invalidateCategories();

        return result;
    }

    async findAll(includeInactive = false): Promise<CategorieMetierWithMetiersResponseDto[]> {
        // Vérifier le cache d'abord
        const cached =
            await this.cacheService.getCategories<CategorieMetierWithMetiersResponseDto[]>(
                includeInactive,
            );
        if (cached) {
            return cached;
        }

        const where = includeInactive ? {} : { actif: true };

        const result = await this.prisma.categorieMetier.findMany({
            where,
            orderBy: [{ ordreAffichage: 'asc' }, { nom: 'asc' }],
            include: {
                _count: {
                    select: { metiers: true },
                },
            },
        });

        // Mettre en cache
        await this.cacheService.setCategories(result, includeInactive);

        return result;
    }

    async findOne(id: string): Promise<CategorieMetierWithMetiersResponseDto> {
        const categorie = await this.prisma.categorieMetier.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { metiers: true },
                },
            },
        });

        if (!categorie) {
            throw new NotFoundException('Catégorie de métier non trouvée');
        }

        return categorie;
    }

    async findBySlug(slug: string): Promise<CategorieMetierWithMetiersResponseDto> {
        const categorie = await this.prisma.categorieMetier.findUnique({
            where: { slug },
            include: {
                _count: {
                    select: { metiers: true },
                },
            },
        });

        if (!categorie) {
            throw new NotFoundException('Catégorie de métier non trouvée');
        }

        return categorie;
    }

    async update(id: string, dto: UpdateCategorieMetierDto): Promise<CategorieMetierResponseDto> {
        // Vérifier que la catégorie existe
        const existing = await this.prisma.categorieMetier.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Catégorie de métier non trouvée');
        }

        // Vérifier l'unicité du nom et du slug si modifiés
        if (dto.nom || dto.slug) {
            const duplicate = await this.prisma.categorieMetier.findFirst({
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
                    throw new ConflictException('Une catégorie avec ce nom existe déjà');
                }
                if (dto.slug && duplicate.slug === dto.slug) {
                    throw new ConflictException('Une catégorie avec ce slug existe déjà');
                }
            }
        }

        const result = await this.prisma.categorieMetier.update({
            where: { id },
            data: {
                nom: dto.nom,
                slug: dto.slug,
                description: dto.description,
                iconUrl: dto.iconUrl,
                ordreAffichage: dto.ordreAffichage,
                actif: dto.actif,
            },
        });

        // Invalider le cache des catégories et métiers (car les métiers référencent les catégories)
        await this.cacheService.invalidateCategories();
        await this.cacheService.invalidateMetiers();

        return result;
    }

    async remove(id: string): Promise<{ message: string }> {
        const categorie = await this.prisma.categorieMetier.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { metiers: true },
                },
            },
        });

        if (!categorie) {
            throw new NotFoundException('Catégorie de métier non trouvée');
        }

        if (categorie._count.metiers > 0) {
            throw new BadRequestException(
                `Impossible de supprimer cette catégorie car elle contient ${categorie._count.metiers} métier(s)`,
            );
        }

        await this.prisma.categorieMetier.delete({
            where: { id },
        });

        // Invalider le cache des catégories
        await this.cacheService.invalidateCategories();

        return { message: 'Catégorie supprimée avec succès' };
    }
}
