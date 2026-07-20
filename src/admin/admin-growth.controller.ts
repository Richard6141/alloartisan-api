import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminGrowthService } from './admin-growth.service';
import { AdminGrowthFilterDto } from './dto/admin-growth.dto';

import { AtGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { Role } from 'src/generated/prisma';

/**
 * AdminGrowthController — routes back-office « croissance & terrain ».
 * Préfixe : /api/v1/admin — protégé par @Roles(Role.ADMIN).
 */
@ApiTags('Admin · Croissance')
@ApiBearerAuth()
@UseGuards(AtGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminGrowthController {
    constructor(private readonly growth: AdminGrowthService) {}

    // ─── Ambassadeurs ────────────────────────────────────────────────────────────

    @ApiOperation({ summary: 'Stats programme ambassadeur (parrainage)' })
    @Get('ambassadeurs/stats')
    getAmbassadeursStats() {
        return this.growth.getAmbassadeursStats();
    }

    @ApiOperation({ summary: 'Classement des meilleurs parrains' })
    @Get('ambassadeurs/leaderboard')
    getAmbassadeursLeaderboard() {
        return this.growth.getAmbassadeursLeaderboard();
    }

    @ApiOperation({ summary: "Détail d'un ambassadeur (parrain) + ses filleuls" })
    @Get('ambassadeurs/:id')
    getAmbassadeurDetail(@Param('id', ParseUUIDPipe) id: string) {
        return this.growth.getAmbassadeurDetail(id);
    }

    @ApiOperation({ summary: 'Liste des parrainages (paginée + filtrable)' })
    @Get('parrainages')
    getParrainages(@Query() dto: AdminGrowthFilterDto) {
        return this.growth.getParrainages(dto);
    }

    // ─── Main-d'œuvre ────────────────────────────────────────────────────────────

    @ApiOperation({ summary: 'Stats main-d’œuvre (travailleurs, annonces, engagements)' })
    @Get('main-doeuvre/stats')
    getMainDoeuvreStats() {
        return this.growth.getMainDoeuvreStats();
    }

    @ApiOperation({ summary: 'Annonces de chantier (paginées + filtrables)' })
    @Get('annonces')
    getAnnonces(@Query() dto: AdminGrowthFilterDto) {
        return this.growth.getAnnonces(dto);
    }

    @ApiOperation({ summary: "Détail d'une annonce de chantier + candidats" })
    @Get('annonces/:id')
    getAnnonceDetail(@Param('id', ParseUUIDPipe) id: string) {
        return this.growth.getAnnonceDetail(id);
    }

    @ApiOperation({ summary: 'Profils travailleurs (paginés + filtrables)' })
    @Get('travailleurs')
    getTravailleurs(@Query() dto: AdminGrowthFilterDto) {
        return this.growth.getTravailleurs(dto);
    }

    @ApiOperation({ summary: "Détail d'un travailleur (métiers, engagements, avis)" })
    @Get('travailleurs/:id')
    getTravailleurDetail(@Param('id', ParseUUIDPipe) id: string) {
        return this.growth.getTravailleurDetail(id);
    }

    // ─── Comptes admin ───────────────────────────────────────────────────────────

    @ApiOperation({ summary: 'Comptes administrateurs + activité (journal)' })
    @Get('admins')
    getAdmins() {
        return this.growth.getAdmins();
    }

    // ─── Demandes Express ────────────────────────────────────────────────────────

    @ApiOperation({ summary: 'Stats demandes express (dispatch urgent)' })
    @Get('demandes-express/stats')
    getExpressStats() {
        return this.growth.getExpressStats();
    }

    @ApiOperation({ summary: 'Liste des demandes express (paginée + filtrable)' })
    @Get('demandes-express')
    getDemandesExpress(@Query() dto: AdminGrowthFilterDto) {
        return this.growth.getDemandesExpress(dto);
    }

    @ApiOperation({ summary: "Détail d'une demande express + candidats notifiés" })
    @Get('demandes-express/:id')
    getDemandeExpressDetail(@Param('id', ParseUUIDPipe) id: string) {
        return this.growth.getDemandeExpressDetail(id);
    }
}
