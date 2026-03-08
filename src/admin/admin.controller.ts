import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    ParseIntPipe,
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
@UseGuards(AtGuard, RolesGuard)
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
    @Get('stats/overview')
    getOverviewStats() {
        return this.adminService.getOverviewStats();
    }

    @ApiOperation({
        summary: 'Stats réservations',
        description: 'Répartition par statut, évolution 30 jours, top métiers.',
    })
    @Get('stats/bookings')
    getBookingStats() {
        return this.adminService.getBookingStats();
    }

    @ApiOperation({
        summary: 'Stats revenus',
        description: 'Par provider de paiement, évolution 12 mois, top artisans.',
    })
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
    @Get('logs')
    getActivityLogs(@Query() dto: AdminLogsFilterDto) {
        return this.adminService.getActivityLogs(dto);
    }
}
