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
import { FaceBiometrieService } from './face-biometrie.service';
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
        private readonly faceBiometrie: FaceBiometrieService,
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
     * GET /api/v1/admin/fraud/identite/doc-matches/:certificationId
     * L'IMAGE de cette pièce d'identité (empreinte calculée à l'upload)
     * correspond-elle à un document déjà soumis par un autre compte ?
     * Détection AUTOMATIQUE, sans aucune saisie.
     */
    @Get('identite/doc-matches/:certificationId')
    @ApiOperation({ summary: 'Anti-doublon : image de pièce déjà soumise ? (ADMIN)' })
    @ApiParam({ name: 'certificationId', description: 'UUID de la certification IDENTITE' })
    async docMatches(@Param('certificationId') certificationId: string) {
        const matches = await this.identiteService.docMatchesForCertification(certificationId);
        return { matches };
    }

    /**
     * GET /api/v1/admin/fraud/identite/face-matches/:certificationId
     * Le VISAGE de cette pièce ressemble-t-il à celui d'un autre compte ?
     * (biométrie Phase 2 — renvoie [] si le moteur est désactivé). Alerte
     * uniquement, jamais de blocage automatique.
     */
    @Get('identite/face-matches/:certificationId')
    @ApiOperation({ summary: 'Anti-doublon : visage ressemblant à un autre compte ? (ADMIN)' })
    @ApiParam({ name: 'certificationId', description: 'UUID de la certification IDENTITE' })
    async faceMatches(@Param('certificationId') certificationId: string) {
        const matches = await this.faceBiometrie.faceMatchesForCertification(certificationId);
        return { matches, enabled: this.faceBiometrie.enabled };
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
