import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
    ParseUUIDPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
    AdminUsersFilterDto,
    AdminTransactionsFilterDto,
    BroadcastNotificationDto,
    AdminLogsFilterDto,
} from './dto/admin-stats.dto';
import { AdminTrendsDto } from './dto/admin-trends.dto';
import { ChangeUserStatutDto } from './dto/change-user-statut.dto';
import { AdminBookingsFilterDto } from './dto/admin-bookings.dto';
import { UpdateUserAdminDto, UpdateArtisanAdminDto } from './dto/admin-update.dto';
import { AdminPermGuard, RequirePerm } from './rbac.guard';

import { AtGuard, RolesGuard } from 'src/common/guards';
import { GetCurrentUser, Roles } from 'src/common/decorators';
import { Role } from 'src/generated/prisma';

/**
 * AdminController — Toutes les routes protégées par @Roles(Role.ADMIN)
 *
 * Préfixe : /api/v1/admin
 */
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AtGuard, RolesGuard, AdminPermGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    // ─── Stats globales ─────────────────────────────────────────────────────────

    @ApiOperation({
        summary: 'KPIs plateforme',
        description:
            'Vue globale : utilisateurs, bookings, revenus, artisans actifs, avis. Requêtes parallèles optimisées.',
    })
    @RequirePerm('dashboard.view')
    @Get('stats/overview')
    getOverviewStats() {
        return this.adminService.getOverviewStats();
    }

    @ApiOperation({
        summary: 'Séries temporelles (inscriptions, demandes, revenus)',
        description: 'Points quotidiens sur 7/30/90 jours pour les graphiques du dashboard.',
    })
    @RequirePerm('dashboard.view')
    @Get('stats/trends')
    getTrends(@Query() dto: AdminTrendsDto) {
        return this.adminService.getTrends(dto);
    }

    @ApiOperation({
        summary: 'Répartitions (abonnements, top métiers, top villes)',
        description: 'Alimente les graphiques de répartition du dashboard.',
    })
    @RequirePerm('dashboard.view')
    @Get('stats/breakdown')
    getBreakdown() {
        return this.adminService.getBreakdown();
    }

    @ApiOperation({ summary: "Détail d'un utilisateur (profil + artisan lié)" })
    @RequirePerm('users.view')
    @Get('users/:id')
    getUserDetail(@Param('id', ParseUUIDPipe) id: string) {
        return this.adminService.getUserDetail(id);
    }

    @ApiOperation({ summary: "Éditer le profil d'un utilisateur" })
    @RequirePerm('users.edit')
    @Patch('users/:id')
    updateUser(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateUserAdminDto,
        @GetCurrentUser('sub') adminId: string,
    ) {
        return this.adminService.updateUser(id, dto, adminId);
    }

    @ApiOperation({ summary: 'Changer le statut (ACTIF/SUSPENDU/BANNI)' })
    @RequirePerm('users.suspend')
    @Patch('users/:id/statut')
    changeUserStatut(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ChangeUserStatutDto,
        @GetCurrentUser('sub') adminId: string,
    ) {
        return this.adminService.changeUserStatut(id, dto, adminId);
    }

    @ApiOperation({ summary: 'Réservations (paginées + filtrables par statut)' })
    @RequirePerm('bookings.view')
    @Get('bookings')
    getBookings(@Query() dto: AdminBookingsFilterDto) {
        return this.adminService.getBookings(dto);
    }

    @ApiOperation({ summary: "Détail complet d'une réservation" })
    @RequirePerm('bookings.view')
    @Get('bookings/:id')
    getBookingDetail(@Param('id', ParseUUIDPipe) id: string) {
        return this.adminService.getBookingDetail(id);
    }

    @ApiOperation({ summary: "Détail complet d'un artisan (profil, métiers, certifs, stats)" })
    @RequirePerm('artisans.view')
    @Get('artisans/:id')
    getArtisanDetail(@Param('id', ParseUUIDPipe) id: string) {
        return this.adminService.getArtisanDetail(id);
    }

    @ApiOperation({ summary: "Éditer le profil / abonnement d'un artisan" })
    @RequirePerm('artisans.edit')
    @Patch('artisans/:id')
    updateArtisan(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateArtisanAdminDto,
        @GetCurrentUser('sub') adminId: string,
    ) {
        return this.adminService.updateArtisan(id, dto, adminId);
    }

    @ApiOperation({ summary: 'Tous les métiers (catégorie + compteurs)' })
    @RequirePerm('metiers.view')
    @Get('metiers')
    getMetiers() {
        return this.adminService.getMetiers();
    }

    @ApiOperation({ summary: 'Toutes les catégories de métiers' })
    @RequirePerm('metiers.view')
    @Get('categories')
    getCategories() {
        return this.adminService.getCategories();
    }

    @ApiOperation({
        summary: 'Stats réservations',
        description: 'Répartition par statut, évolution 30 jours, top métiers.',
    })
    @RequirePerm('dashboard.view')
    @Get('stats/bookings')
    getBookingStats() {
        return this.adminService.getBookingStats();
    }

    @ApiOperation({
        summary: 'Stats revenus',
        description: 'Par provider de paiement, évolution 12 mois, top artisans.',
    })
    @RequirePerm('finances.view')
    @Get('stats/revenue')
    getRevenueStats() {
        return this.adminService.getRevenueStats();
    }

    // ─── Gestion utilisateurs ────────────────────────────────────────────────────

    @ApiOperation({
        summary: 'Liste des utilisateurs (paginée + filtrable)',
        description:
            'Filtres disponibles : rôle (CLIENT/ARTISAN/ADMIN), recherche textuelle (nom, email, téléphone).',
    })
    @RequirePerm('users.view')
    @Get('users')
    getUsers(@Query() dto: AdminUsersFilterDto) {
        return this.adminService.getUsers(dto);
    }

    // ─── Artisans en attente ─────────────────────────────────────────────────────

    @ApiOperation({
        summary: 'Artisans en attente de validation',
        description:
            'Liste les artisans avec verified=false et statut=EN_ATTENTE, triés FIFO. Inclut les certifications et métiers.',
    })
    @RequirePerm('artisans.view')
    @Get('artisans/pending')
    getPendingArtisans() {
        return this.adminService.getPendingArtisans();
    }

    // ─── Avis signalés ───────────────────────────────────────────────────────────

    @ApiOperation({
        summary: 'Avis signalés',
        description:
            'Tous les avis avec signale=true en attente de modération. Inclut client, artisan et booking.',
    })
    @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
    @ApiQuery({ name: 'limit', required: false, description: 'Éléments par page' })
    @RequirePerm('avis.view')
    @Get('avis/reported')
    getReportedAvis(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.adminService.getReportedAvis(page, limit);
    }

    // ─── Transactions ────────────────────────────────────────────────────────────

    @ApiOperation({
        summary: 'Toutes les transactions (paginées + filtrables)',
        description:
            'Vue admin de toutes les transactions. Filtrable par statut. Inclut les totaux sur la sélection.',
    })
    @RequirePerm('finances.view')
    @Get('transactions')
    getTransactions(@Query() dto: AdminTransactionsFilterDto) {
        return this.adminService.getTransactions(dto);
    }

    // ─── Broadcast notification ──────────────────────────────────────────────────

    @ApiOperation({
        summary: 'Notifier tous les utilisateurs (broadcast)',
        description:
            "Envoie une notification in-app à un segment d'utilisateurs (ALL/CLIENT/ARTISAN). Batch de 500 pour éviter les timeouts.",
    })
    @RequirePerm('diffusion.broadcast')
    @Post('notifications/broadcast')
    broadcastNotification(
        @Body() dto: BroadcastNotificationDto,
        @GetCurrentUser('sub') adminId: string,
    ) {
        return this.adminService.broadcastNotification(dto, adminId);
    }

    // ─── Logs d'audit ────────────────────────────────────────────────────

    @ApiOperation({
        summary: "Logs d'audit (traçabilité des actions)",
        description:
            "Retourne l'historique des actions enregistrées dans logs_activites. Filtrable par userId, action, entité et plage de dates. Paginaté (max 100/page).",
    })
    @RequirePerm('audit.view')
    @Get('logs')
    getActivityLogs(@Query() dto: AdminLogsFilterDto) {
        return this.adminService.getActivityLogs(dto);
    }
}
