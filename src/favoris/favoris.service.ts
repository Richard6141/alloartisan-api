import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FavorisService {
    private readonly logger = new Logger(FavorisService.name);

    constructor(private readonly prisma: PrismaService) {}

    // ============================================================
    // AJOUTER UN ARTISAN AUX FAVORIS
    // ============================================================

    async addFavori(clientId: string, artisanId: string): Promise<{ message: string }> {
        // Vérifier que l'artisan existe
        const artisan = await this.prisma.artisan.findFirst({
            where: { id: artisanId, deletedAt: null },
        });

        if (!artisan) {
            throw new NotFoundException('Artisan non trouvé');
        }

        // Tenter l'insertion (contrainte unique gère le doublon)
        try {
            await this.prisma.favori.create({
                data: { clientId, artisanId },
            });

            this.logger.debug(`Favori ajouté: client=${clientId} → artisan=${artisanId}`);
            return { message: 'Artisan ajouté aux favoris' };
        } catch (error: any) {
            // Code d'erreur Prisma pour contrainte unique violée
            if (error?.code === 'P2002') {
                throw new ConflictException('Cet artisan est déjà dans vos favoris');
            }
            throw error;
        }
    }

    // ============================================================
    // RETIRER UN ARTISAN DES FAVORIS
    // ============================================================

    async removeFavori(clientId: string, artisanId: string): Promise<{ message: string }> {
        const result = await this.prisma.favori.deleteMany({
            where: { clientId, artisanId },
        });

        if (result.count === 0) {
            throw new NotFoundException("Cet artisan n'est pas dans vos favoris");
        }

        this.logger.debug(`Favori retiré: client=${clientId} → artisan=${artisanId}`);
        return { message: 'Artisan retiré des favoris' };
    }

    // ============================================================
    // LISTE DES FAVORIS DU CLIENT
    // ============================================================

    async getMyFavoris(clientId: string) {
        const favoris = await this.prisma.favori.findMany({
            where: { clientId },
            include: {
                artisan: {
                    select: {
                        id: true,
                        nomEntreprise: true,
                        photoProfilUrl: true,
                        noteMoyenne: true,
                        nombreAvis: true,
                        villePrincipale: true,
                        disponible: true,
                        verified: true,
                        abonnementType: true,
                        tarifHoraire: true,
                        user: {
                            // Anti-fuite : pas de téléphone dans les favoris
                            select: { nom: true, prenom: true },
                        },
                        metiers: {
                            include: {
                                metier: {
                                    select: { nom: true, iconUrl: true },
                                },
                            },
                            take: 3, // Limiter pour alléger le payload
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return {
            data: favoris.map((f) => ({
                favoriId: f.id,
                ajouteLe: f.createdAt,
                artisan: {
                    ...f.artisan,
                    noteMoyenne: Number(f.artisan.noteMoyenne),
                    tarifHoraire: f.artisan.tarifHoraire ? Number(f.artisan.tarifHoraire) : null,
                },
            })),
            total: favoris.length,
        };
    }

    // ============================================================
    // VÉRIFIER SI UN ARTISAN EST EN FAVORI
    // ============================================================

    async isFavori(clientId: string, artisanId: string): Promise<{ isFavori: boolean }> {
        const favori = await this.prisma.favori.findUnique({
            where: { clientId_artisanId: { clientId, artisanId } },
        });
        return { isFavori: !!favori };
    }
}
