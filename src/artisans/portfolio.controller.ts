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
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    HttpCode,
    HttpStatus,
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
import { GetCurrentUserId } from 'src/common/decorators';
import { PortfolioService } from './portfolio.service';
import {
    AddPortfolioItemDto,
    ReorderPortfolioDto,
    DeletePortfolioItemDto,
    PortfolioResponseDto,
} from './dto';

/** 5 MB maximum par photo */
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

@ApiTags('portfolio')
@ApiBearerAuth()
@Controller('artisans/:artisanId/portfolio')
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) {}

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
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: MAX_PHOTO_SIZE }),
                    new FileTypeValidator({ fileType: /image\/(jpeg|png|webp)/ }),
                ],
            }),
        )
        file: Express.Multer.File,
        @Body() dto: AddPortfolioItemDto,
    ): Promise<PortfolioResponseDto> {
        return this.portfolioService.addPhoto(artisanId, userId, file.buffer, dto);
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
