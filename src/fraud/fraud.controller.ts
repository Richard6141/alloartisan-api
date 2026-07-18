import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    ParseIntPipe,
    DefaultValuePipe,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators';
import { RolesGuard } from 'src/common/guards';
import { FraudService } from './fraud.service';
import { IdentiteService } from './identite.service';
import { CheckIdentiteDto } from './dto/check-identite.dto';
import { Role } from 'src/generated/prisma';

@ApiTags('Admin - Fraud Detection')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
@Controller('admin/fraud')
export class FraudController {
    constructor(
        private readonly fraudService: FraudService,
        private readonly identiteService: IdentiteService,
    ) {}

    /**
     * POST /api/v1/admin/fraud/identite/check
     * Vérifie si une identité (numéro de pièce, ou nom + date de naissance)
     * correspond déjà à un AUTRE compte validé — aide à la décision, jamais
     * de blocage automatique.
     */
    @Post('identite/check')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Anti-doublon : identité déjà enregistrée ? (ADMIN)' })
    async checkIdentite(@Body() dto: CheckIdentiteDto) {
        const matches = await this.identiteService.check(
            {
                numeroPiece: dto.numeroPiece,
                nom: dto.nom,
                dateNaissance: dto.dateNaissance,
            },
            dto.excludeArtisanId,
        );
        return { matches };
    }

    /**
     * GET /api/v1/admin/fraud/artisans/:artisanId
     * Score de fraude d'un artisan specifique (ADMIN uniquement).
     */
    @Get('artisans/:artisanId')
    @ApiOperation({ summary: "Score de fraude d'un artisan (ADMIN)" })
    @ApiParam({ name: 'artisanId', description: "UUID de l'artisan" })
    async getArtisanScore(@Param('artisanId') artisanId: string) {
        return this.fraudService.scoreArtisan(artisanId);
    }

    /**
     * GET /api/v1/admin/fraud/high-risk
     * Liste des artisans a haut risque (score > 60).
     */
    @Get('high-risk')
    @ApiOperation({ summary: 'Artisans a haut risque de fraude (score > 60)' })
    @ApiQuery({ name: 'limit', required: false, description: 'Max resultats (defaut: 20)' })
    async getHighRiskArtisans(
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.fraudService.getHighRiskArtisans(limit);
    }

    /**
     * GET /api/v1/admin/fraud/scan
     * Declenche manuellement un scan de fraude complet (ADMIN uniquement).
     * Normalement execute par le scheduler quotidien.
     */
    @Get('scan')
    @ApiOperation({ summary: 'Scan manuel de fraude sur tous les artisans (ADMIN)' })
    async triggerManualScan() {
        return this.fraudService.runDailyFraudScan();
    }
}
