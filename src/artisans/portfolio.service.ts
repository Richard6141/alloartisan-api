import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { CacheService } from 'src/common/services/cache.service';
import { Prisma } from 'src/generated/prisma';
import {
    PortfolioItemDto,
    AddPortfolioItemDto,
    ReorderPortfolioDto,
    PortfolioResponseDto,
} from './dto';

/** Maximum de photos/vidéos dans le portfolio */
const PORTFOLIO_MAX_ITEMS = 20;

/**
 * Type interne d'un item portfolio stocké en JSON.
 */
interface PortfolioItem {
    url: string;
    type: 'photo' | 'video';
    caption?: string;
    bookingId?: string;
    thumbnailUrl?: string;
    uploadedAt: string;
}

@Injectable()
export class PortfolioService {
    private readonly logger = new Logger(PortfolioService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
        private readonly cacheService: CacheService,
    ) {}

    /**
     * Récupère le portfolio d'un artisan.
     */
    async getPortfolio(artisanId: string): Promise<PortfolioResponseDto> {
        const artisan = await this.findArtisanOrFail(artisanId);
        const items = this.parsePortfolioUrls(artisan.portfolioUrls);

        return {
            artisanId,
            items: items.map((item) => this.toDto(item)),
            total: items.length,
            maxAllowed: PORTFOLIO_MAX_ITEMS,
        };
    }

    /**
     * Ajoute une photo au portfolio (upload Supabase).
     * Limite : 20 items maximum.
     *
     * @param artisanId - ID de l'artisan
     * @param userId    - ID de l'utilisateur connecté (ownership check)
     * @param buffer    - Buffer de l'image uploadée
     * @param dto       - Métadonnées (caption, bookingId)
     */
    async addPhoto(
        artisanId: string,
        userId: string,
        buffer: Buffer,
        dto: AddPortfolioItemDto,
    ): Promise<PortfolioResponseDto> {
        const artisan = await this.findArtisanOrFail(artisanId);
        this.assertOwner(artisan.userId, userId);

        const items = this.parsePortfolioUrls(artisan.portfolioUrls);

        if (items.length >= PORTFOLIO_MAX_ITEMS) {
            throw new BadRequestException(
                `Portfolio complet : maximum ${PORTFOLIO_MAX_ITEMS} photos/vidéos autorisées`,
            );
        }

        // Valider le booking si fourni
        if (dto.bookingId) {
            await this.validateBookingOwnership(dto.bookingId, artisanId);
        }

        // Upload vers Cloudinary (Supabase n'est pas configuré sur ce projet)
        const variants = await this.uploadService.uploadPortfolioPhoto(buffer, artisanId);
        this.logger.log(`Portfolio photo uploadée pour artisan ${artisanId}: ${variants.medium}`);

        // Ajouter le nouvel item au tableau
        const newItem: PortfolioItem = {
            url: variants.medium,
            type: 'photo',
            caption: dto.caption,
            bookingId: dto.bookingId,
            thumbnailUrl: variants.thumbnail,
            uploadedAt: new Date().toISOString(),
        };

        const updatedItems = [...items, newItem];
        await this.persistPortfolio(artisanId, updatedItems);
        this.logger.log(`Portfolio artisan ${artisanId} : ${updatedItems.length} items`);

        return {
            artisanId,
            items: updatedItems.map((item) => this.toDto(item)),
            total: updatedItems.length,
            maxAllowed: PORTFOLIO_MAX_ITEMS,
        };
    }

    /**
     * Supprime un item du portfolio par URL.
     * Supprime également le fichier du bucket Supabase.
     */
    async deleteItem(
        artisanId: string,
        userId: string,
        url: string,
    ): Promise<PortfolioResponseDto> {
        const artisan = await this.findArtisanOrFail(artisanId);
        this.assertOwner(artisan.userId, userId);

        const items = this.parsePortfolioUrls(artisan.portfolioUrls);
        const itemToDelete = items.find((i) => i.url === url);

        if (!itemToDelete) {
            throw new NotFoundException(`Item portfolio non trouvé : ${url}`);
        }

        // Supprimer du CDN (best-effort, ne bloque pas si erreur)
        const publicId = this.uploadService.extractPublicIdFromUrl(url);
        if (publicId) {
            await this.uploadService.deleteImage(publicId).catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : String(err);
                this.logger.warn(`Delete CDN échoué (non bloquant): ${msg}`);
            });
        }

        const updatedItems = items.filter((i) => i.url !== url);
        await this.persistPortfolio(artisanId, updatedItems);

        return {
            artisanId,
            items: updatedItems.map((item) => this.toDto(item)),
            total: updatedItems.length,
            maxAllowed: PORTFOLIO_MAX_ITEMS,
        };
    }

    /**
     * Réordonne les items du portfolio.
     * Le tableau `dto.urls` doit contenir exactement les mêmes URLs qu'actuellement,
     * juste dans un ordre différent.
     */
    async reorder(
        artisanId: string,
        userId: string,
        dto: ReorderPortfolioDto,
    ): Promise<PortfolioResponseDto> {
        const artisan = await this.findArtisanOrFail(artisanId);
        this.assertOwner(artisan.userId, userId);

        const items = this.parsePortfolioUrls(artisan.portfolioUrls);
        const currentUrls = new Set(items.map((i) => i.url));

        // Valider que les URLs reçues correspondent exactement
        if (dto.urls.length !== items.length || dto.urls.some((url) => !currentUrls.has(url))) {
            throw new BadRequestException(
                'Le tableau urls doit contenir exactement les mêmes URLs que le portfolio actuel',
            );
        }

        // Réordonner en suivant l'ordre du DTO
        const itemMap = new Map(items.map((i) => [i.url, i]));
        const reordered = dto.urls.map((url) => itemMap.get(url)!);

        await this.persistPortfolio(artisanId, reordered);

        return {
            artisanId,
            items: reordered.map((item) => this.toDto(item)),
            total: reordered.length,
            maxAllowed: PORTFOLIO_MAX_ITEMS,
        };
    }

    // ─── Helpers privés ───────────────────────────────────────────────────────

    private async findArtisanOrFail(artisanId: string) {
        const artisan = await this.prisma.artisan.findUnique({
            where: { id: artisanId },
            select: { id: true, userId: true, portfolioUrls: true },
        });

        if (!artisan || artisan === null) {
            throw new NotFoundException('Artisan non trouvé');
        }

        return artisan;
    }

    private assertOwner(resourceUserId: string, requestUserId: string): void {
        if (resourceUserId !== requestUserId) {
            throw new ForbiddenException('Vous ne pouvez modifier que votre propre portfolio');
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    private parsePortfolioUrls(raw: Prisma.JsonValue | null): PortfolioItem[] {
        if (!raw || !Array.isArray(raw)) return [];
        // Tolère les deux formats historiques : ["url", ...] (seed) et [{url, ...}, ...]
        return raw
            .map((entry): PortfolioItem | null => {
                if (typeof entry === 'string') {
                    return { url: entry, type: 'photo', uploadedAt: '' };
                }
                if (entry && typeof entry === 'object' && 'url' in entry) {
                    return entry as unknown as PortfolioItem;
                }
                return null;
            })
            .filter((i): i is PortfolioItem => i !== null);
    }

    private async persistPortfolio(artisanId: string, items: PortfolioItem[]): Promise<void> {
        await this.prisma.artisan.update({
            where: { id: artisanId },
            data: { portfolioUrls: items as unknown as Prisma.InputJsonValue },
        });

        // Invalider le cache profil artisan
        await this.cacheService.invalidateArtisanProfile(artisanId);
    }

    /**
     * Vérifie que le booking appartient bien à cet artisan.
     */
    private async validateBookingOwnership(bookingId: string, artisanId: string): Promise<void> {
        const booking = await this.prisma.booking.findFirst({
            where: { id: bookingId, artisanId },
            select: { id: true },
        });

        if (!booking) {
            throw new BadRequestException(
                `Booking ${bookingId} introuvable ou n'appartient pas à cet artisan`,
            );
        }
    }

    private toDto(item: PortfolioItem): PortfolioItemDto {
        return {
            url: item.url,
            type: item.type,
            caption: item.caption,
            bookingId: item.bookingId,
            thumbnailUrl: item.thumbnailUrl,
            uploadedAt: item.uploadedAt,
        };
    }
}
