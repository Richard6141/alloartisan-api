import {
    Controller,
    Post,
    Delete,
    Patch,
    Get,
    Param,
    Body,
    UseInterceptors,
    UploadedFile,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import * as fs from 'fs/promises';
import { GetCurrentUserId } from 'src/common/decorators';
import { ImageValidatorService } from 'src/upload';
import { PortfolioService } from './portfolio.service';
import {
    AddPortfolioItemDto,
    ReorderPortfolioDto,
    DeletePortfolioItemDto,
    PortfolioResponseDto,
} from './dto';

/** 5 MB maximum par photo */
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@ApiTags('portfolio')
@ApiBearerAuth()
@Controller('artisans/:artisanId/portfolio')
export class PortfolioController {
    constructor(
        private readonly portfolioService: PortfolioService,
        private readonly imageValidator: ImageValidatorService,
    ) {}

    /**
     * Multer stocke les uploads SUR DISQUE (pas de file.buffer) : on lit le
     * fichier temporaire, on valide type + taille + signature binaire, puis
     * on nettoie. Ne pas utiliser ParseFilePipe/FileTypeValidator ici : ils
     * attendent un buffer et rejettent des JPEG parfaitement valides.
     */
    private async readAndValidatePhoto(file: Express.Multer.File): Promise<Buffer> {
        try {
            if (!ALLOWED_PHOTO_TYPES.includes(file.mimetype)) {
                throw new BadRequestException(
                    `Type de fichier non autorisé: ${file.mimetype}. Autorisés: JPEG, PNG, WebP`,
                );
            }

            let buffer: Buffer;
            if (file.buffer) {
                buffer = file.buffer;
            } else if (file.path) {
                buffer = await fs.readFile(file.path);
            } else {
                throw new BadRequestException('Fichier invalide');
            }

            if (buffer.length > MAX_PHOTO_SIZE) {
                throw new BadRequestException(
                    `La photo dépasse la taille maximale de ${MAX_PHOTO_SIZE / (1024 * 1024)} Mo`,
                );
            }

            // Signature binaire (magic bytes) : bloque les fichiers déguisés
            const validation = await this.imageValidator.validateImage(buffer, MAX_PHOTO_SIZE);
            if (!validation.isValid) {
                throw new BadRequestException(validation.error);
            }

            return buffer;
        } finally {
            if (file?.path) {
                await fs.unlink(file.path).catch(() => {});
            }
        }
    }

    /**
     * GET /api/v1/artisans/:artisanId/portfolio
     * Récupère le portfolio public d'un artisan (pas d'auth requise).
     */
    @Get()
    @ApiOperation({ summary: "Récupère le portfolio d'un artisan" })
    @ApiResponse({ status: 200, description: 'Portfolio artisan', type: PortfolioResponseDto })
    async getPortfolio(@Param('artisanId') artisanId: string): Promise<PortfolioResponseDto> {
        return this.portfolioService.getPortfolio(artisanId);
    }

    /**
     * POST /api/v1/artisans/:artisanId/portfolio/photos
     * Upload d'une photo dans le portfolio (authentification requise, owner uniquement).
     * Multipart/form-data avec champ `file` (JPEG/PNG/WebP, max 5MB).
     */
    @Post('photos')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Ajoute une photo au portfolio',
        description:
            'Upload multipart/form-data. Champ `file` requis. Max 5MB, JPEG/PNG/WebP. Max 20 photos total.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                caption: { type: 'string', maxLength: 200 },
                bookingId: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Photo ajoutée', type: PortfolioResponseDto })
    @ApiResponse({ status: 400, description: 'Portfolio plein (max 20) ou fichier invalide' })
    @ApiResponse({ status: 403, description: 'Non propriétaire du profil' })
    async addPhoto(
        @Param('artisanId') artisanId: string,
        @GetCurrentUserId() userId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: AddPortfolioItemDto,
    ): Promise<PortfolioResponseDto> {
        if (!file) {
            throw new BadRequestException('Aucun fichier fourni');
        }
        const buffer = await this.readAndValidatePhoto(file);
        return this.portfolioService.addPhoto(artisanId, userId, buffer, dto);
    }

    /**
     * DELETE /api/v1/artisans/:artisanId/portfolio/items
     * Supprime un item du portfolio par URL.
     */
    @Delete('items')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Supprime un item du portfolio par URL' })
    @ApiResponse({ status: 200, description: 'Item supprimé', type: PortfolioResponseDto })
    @ApiResponse({ status: 404, description: 'Item non trouvé' })
    @ApiResponse({ status: 403, description: 'Non propriétaire du profil' })
    async deleteItem(
        @Param('artisanId') artisanId: string,
        @GetCurrentUserId() userId: string,
        @Body() dto: DeletePortfolioItemDto,
    ): Promise<PortfolioResponseDto> {
        return this.portfolioService.deleteItem(artisanId, userId, dto.url);
    }

    /**
     * PATCH /api/v1/artisans/:artisanId/portfolio/reorder
     * Réordonne les items du portfolio.
     */
    @Patch('reorder')
    @ApiOperation({
        summary: 'Réordonne les items du portfolio',
        description:
            'Le tableau urls doit contenir toutes les URLs actuelles dans le nouvel ordre.',
    })
    @ApiResponse({ status: 200, description: 'Ordre mis à jour', type: PortfolioResponseDto })
    @ApiResponse({ status: 400, description: 'URLs invalides' })
    async reorder(
        @Param('artisanId') artisanId: string,
        @GetCurrentUserId() userId: string,
        @Body() dto: ReorderPortfolioDto,
    ): Promise<PortfolioResponseDto> {
        return this.portfolioService.reorder(artisanId, userId, dto);
    }
}
