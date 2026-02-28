import {
    Controller,
    Get,
    Param,
    Query,
    ParseIntPipe,
    DefaultValuePipe,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators';
import { RolesGuard } from 'src/common/guards';
import { FraudService } from './fraud.service';
import { Role } from 'src/generated/prisma';

@ApiTags('Admin - Fraud Detection')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
@Controller('admin/fraud')
export class FraudController {
    constructor(private readonly fraudService: FraudService) {}

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
