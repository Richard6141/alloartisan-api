import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminGrowthService } from './admin-growth.service';
import { AdminGrowthFilterDto } from './dto/admin-growth.dto';
import { GrantAdminDto, ChangeAdminRoleDto } from './dto/admin-role.dto';
import { AdminPermGuard, RequirePerm } from './rbac.guard';

import { AtGuard, RolesGuard } from 'src/common/guards';
import { GetCurrentUser, Roles } from 'src/common/decorators';
import { Role } from 'src/generated/prisma';

/**
 * AdminGrowthController — routes back-office « croissance & terrain ».
 * Préfixe : /api/v1/admin — protégé par @Roles(Role.ADMIN) + RBAC (AdminPermGuard).
 */
@ApiTags('Admin · Croissance')
@ApiBearerAuth()
@UseGuards(AtGuard, RolesGuard, AdminPermGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminGrowthController {
    constructor(private readonly growth: AdminGrowthService) {}

    // ─── Ambassadeurs ────────────────────────────────────────────────────────────

    @ApiOperation({ summary: 'Stats programme ambassadeur (parrainage)' })
    @RequirePerm('ambassadeurs.view')
    @Get('ambassadeurs/stats')
    getAmbassadeursStats() {
        return this.growth.getAmbassadeursStats();
    }

    @ApiOperation({ summary: 'Classement des meilleurs parrains' })
    @RequirePerm('ambassadeurs.view')
    @Get('ambassadeurs/leaderboard')
    getAmbassadeursLeaderboard() {
        return this.growth.getAmbassadeursLeaderboard();
    }

    @ApiOperation({ summary: "Détail d'un ambassadeur (parrain) + ses filleuls" })
    @RequirePerm('ambassadeurs.view')
    @Get('ambassadeurs/:id')
    getAmbassadeurDetail(@Param('id', ParseUUIDPipe) id: string) {
        return this.growth.getAmbassadeurDetail(id);
    }

    @ApiOperation({ summary: 'Liste des parrainages (paginée + filtrable)' })
    @RequirePerm('ambassadeurs.view')
    @Get('parrainages')
    getParrainages(@Query() dto: AdminGrowthFilterDto) {
        return this.growth.getParrainages(dto);
    }

    // ─── Main-d'œuvre ────────────────────────────────────────────────────────────

    @ApiOperation({ summary: 'Stats main-d’œuvre (travailleurs, annonces, engagements)' })
    @RequirePerm('maindoeuvre.view')
    @Get('main-doeuvre/stats')
    getMainDoeuvreStats() {
        return this.growth.getMainDoeuvreStats();
    }

    @ApiOperation({ summary: 'Annonces de chantier (paginées + filtrables)' })
    @RequirePerm('maindoeuvre.view')
    @Get('annonces')
    getAnnonces(@Query() dto: AdminGrowthFilterDto) {
        return this.growth.getAnnonces(dto);
    }

    @ApiOperation({ summary: "Détail d'une annonce de chantier + candidats" })
    @RequirePerm('maindoeuvre.view')
    @Get('annonces/:id')
    getAnnonceDetail(@Param('id', ParseUUIDPipe) id: string) {
        return this.growth.getAnnonceDetail(id);
    }

    @ApiOperation({ summary: 'Profils travailleurs (paginés + filtrables)' })
    @RequirePerm('maindoeuvre.view')
    @Get('travailleurs')
    getTravailleurs(@Query() dto: AdminGrowthFilterDto) {
        return this.growth.getTravailleurs(dto);
    }

    @ApiOperation({ summary: "Détail d'un travailleur (métiers, engagements, avis)" })
    @RequirePerm('maindoeuvre.view')
    @Get('travailleurs/:id')
    getTravailleurDetail(@Param('id', ParseUUIDPipe) id: string) {
        return this.growth.getTravailleurDetail(id);
    }

    // ─── Comptes admin (RBAC) ────────────────────────────────────────────────────

    @ApiOperation({ summary: 'Comptes administrateurs + rôle et activité' })
    @RequirePerm('admins.view')
    @Get('admins')
    getAdmins() {
        return this.growth.getAdmins();
    }

    @ApiOperation({ summary: 'Promouvoir un utilisateur en administrateur' })
    @RequirePerm('admins.manage')
    @Post('admins/grant')
    grantAdmin(@Body() dto: GrantAdminDto, @GetCurrentUser('sub') actorId: string) {
        return this.growth.grantAdmin(dto.userId, dto.adminRole, actorId);
    }

    @ApiOperation({ summary: "Changer le rôle fin d'un administrateur" })
    @RequirePerm('admins.manage')
    @Patch('admins/:id/role')
    changeAdminRole(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ChangeAdminRoleDto,
        @GetCurrentUser('sub') actorId: string,
    ) {
        return this.growth.changeAdminRole(id, dto.adminRole, actorId);
    }

    @ApiOperation({ summary: "Révoquer l'accès administrateur d'un compte" })
    @RequirePerm('admins.manage')
    @Post('admins/:id/revoke')
    revokeAdmin(@Param('id', ParseUUIDPipe) id: string, @GetCurrentUser('sub') actorId: string) {
        return this.growth.revokeAdmin(id, actorId);
    }

    // ─── Demandes Express ────────────────────────────────────────────────────────

    @ApiOperation({ summary: 'Stats demandes express (dispatch urgent)' })
    @RequirePerm('express.view')
    @Get('demandes-express/stats')
    getExpressStats() {
        return this.growth.getExpressStats();
    }

    @ApiOperation({ summary: 'Liste des demandes express (paginée + filtrable)' })
    @RequirePerm('express.view')
    @Get('demandes-express')
    getDemandesExpress(@Query() dto: AdminGrowthFilterDto) {
        return this.growth.getDemandesExpress(dto);
    }

    @ApiOperation({ summary: "Détail d'une demande express + candidats notifiés" })
    @RequirePerm('express.view')
    @Get('demandes-express/:id')
    getDemandeExpressDetail(@Param('id', ParseUUIDPipe) id: string) {
        return this.growth.getDemandeExpressDetail(id);
    }
}
