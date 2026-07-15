import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    UseGuards,
    ParseIntPipe,
    DefaultValuePipe,
    ParseFloatPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
    ApiNotFoundResponse,
    ApiBadRequestResponse,
} from '@nestjs/swagger';
import { PromoService } from './promo.service';
import { CreateCodePromoDto, UpdateCodePromoDto } from './dto';
import { GetCurrentUserId, Roles } from 'src/common/decorators';
import { RolesGuard } from 'src/common/guards';
import { Role } from 'src/generated/prisma';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Codes promo')
@ApiBearerAuth('access-token')
@Controller('promo')
export class PromoController {
    constructor(private readonly promoService: PromoService) {}

    // ============================================================
    // GET /promo/validate — Vérifier un code avant paiement
    // ============================================================

    @Get('validate')
    @Throttle({ default: { ttl: 60000, limit: 10 } }) // Anti brute-force de codes
    @ApiOperation({
        summary: 'Valider un code promo et calculer la réduction',
        description:
            "Vérifie que le code est utilisable par l'utilisateur courant pour le montant donné. " +
            'Ne consomme pas le code — la consommation a lieu au paiement.',
    })
    @ApiQuery({ name: 'code', description: 'Code promo à valider', example: 'BIENVENUE10' })
    @ApiQuery({ name: 'montant', description: 'Montant de la commande en FCFA', example: 15000 })
    @ApiResponse({ status: 200, description: 'Code valide — détail de la réduction' })
    @ApiNotFoundResponse({ description: 'Code invalide' })
    @ApiBadRequestResponse({ description: 'Code expiré, quota atteint ou montant insuffisant' })
    validate(
        @GetCurrentUserId() userId: string,
        @Query('code') code: string,
        @Query('montant', ParseFloatPipe) montant: number,
    ) {
        return this.promoService.previewDiscount(code, userId, montant);
    }

    // ============================================================
    // GET /promo/rewards — Mes codes de récompense personnels
    // ============================================================

    @Get('rewards')
    @ApiOperation({
        summary: 'Mes codes promo personnels (récompenses de parrainage)',
    })
    @ApiResponse({ status: 200, description: 'Liste des codes personnels actifs' })
    getMyRewards(@GetCurrentUserId() userId: string) {
        return this.promoService.getMyRewards(userId);
    }

    // ============================================================
    // ADMIN — CRUD
    // ============================================================

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: '[ADMIN] Créer un code promo' })
    @ApiResponse({ status: 201, description: 'Code promo créé' })
    create(@Body() dto: CreateCodePromoDto) {
        return this.promoService.createCode(dto);
    }

    @Get()
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: '[ADMIN] Lister les codes promo' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    list(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.promoService.listCodes(page, limit);
    }

    @Patch(':id')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: '[ADMIN] Modifier un code promo (désactivation, validité, quota)' })
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCodePromoDto) {
        return this.promoService.updateCode(id, dto);
    }
}
