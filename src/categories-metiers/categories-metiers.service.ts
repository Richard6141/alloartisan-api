import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    CreateCategorieMetierDto,
    UpdateCategorieMetierDto,
    CategorieMetierResponseDto,
    CategorieMetierWithMetiersResponseDto,
} from './dto';

@Injectable()
export class CategoriesMetiersService {
    constructor(private prisma: PrismaService) {}

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

        return this.prisma.categorieMetier.create({
            data: {
                nom: dto.nom,
                slug: dto.slug,
                description: dto.description,
                iconUrl: dto.iconUrl,
                ordreAffichage: dto.ordreAffichage ?? 0,
                actif: dto.actif ?? true,
            },
        });
    }

    async findAll(includeInactive = false): Promise<CategorieMetierWithMetiersResponseDto[]> {
        const where = includeInactive ? {} : { actif: true };

        return this.prisma.categorieMetier.findMany({
            where,
            orderBy: [{ ordreAffichage: 'asc' }, { nom: 'asc' }],
            include: {
                _count: {
                    select: { metiers: true },
                },
            },
        });
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

        return this.prisma.categorieMetier.update({
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

        return { message: 'Catégorie supprimée avec succès' };
    }
}
