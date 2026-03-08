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
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiBadRequestResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiConflictResponse,
} from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto, SearchBookingDto, ProposePriceDto, CancelBookingDto } from './dto';
import { GetCurrentUser, GetCurrentUserId, Roles } from 'src/common/decorators';
import { RolesGuard } from 'src/common/guards';
import { Role } from 'src/generated/prisma';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Bookings')
@ApiBearerAuth('access-token')
@Controller('bookings')
export class BookingController {
    constructor(private readonly bookingService: BookingService) {}

    // ============================================================
    // POST /bookings — Client crée une demande
    // ============================================================

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles(Role.CLIENT)
    @UseGuards(RolesGuard)
    @Throttle({ default: { ttl: 60000, limit: 5 } }) // Max 5 bookings/minute
    @ApiOperation({
        summary: 'Créer une demande de réservation',
        description: `
Permet à un client de créer une demande d'intervention auprès d'un artisan.

**Règles métier :**
- L'artisan doit être actif, vérifié et disponible
- Un seul booking actif par artisan/client à la fois
- Vérification du quota mensuel artisan (5 Gratuit / 30 Standard / ∞ Premium)
- Les demandes urgentes nécessitent que l'artisan accepte les urgences
    `,
    })
    @ApiResponse({ status: 201, description: 'Réservation créée avec succès' })
    @ApiConflictResponse({ description: 'Un booking actif existe déjà avec cet artisan' })
    @ApiBadRequestResponse({ description: 'Données invalides ou quota artisan dépassé' })
    @ApiNotFoundResponse({ description: 'Artisan ou métier non trouvé' })
    @ApiForbiddenResponse({ description: 'Réservé aux clients' })
    create(@GetCurrentUserId() userId: string, @Body() dto: CreateBookingDto) {
        return this.bookingService.create(userId, dto);
    }

    // ============================================================
    // GET /bookings — Mes réservations
    // ============================================================

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Mes réservations',
        description: `
Retourne les réservations selon le rôle :
- **Client** : toutes ses demandes
- **Artisan** : toutes les demandes reçues
- **Admin** : toutes les réservations de la plateforme
    `,
    })
    @ApiResponse({ status: 200, description: 'Liste des réservations paginée' })
    findMine(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('role') role: Role,
        @Query() dto: SearchBookingDto,
    ) {
        return this.bookingService.findMine(userId, role, dto);
    }

    // ============================================================
    // GET /bookings/stats — Stats artisan
    // ============================================================

    @Get('stats')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ARTISAN)
    @UseGuards(RolesGuard)
    @ApiOperation({
        summary: 'Statistiques artisan',
        description:
            "Tableau de bord chiffré de l'artisan : missions, revenus, avis, taux de complétion.",
    })
    @ApiResponse({
        status: 200,
        description: "Statistiques de l'artisan",
        schema: {
            type: 'object',
            properties: {
                parStatut: { type: 'object' },
                moisCourant: { type: 'number' },
                moisPrecedent: { type: 'number' },
                evolution: { type: 'number', nullable: true },
                noteMoyenne: { type: 'number' },
                nombreAvis: { type: 'number' },
                tauxCompletion: { type: 'number' },
                revenuTotal: { type: 'number' },
                quotaRestant: { type: 'number' },
            },
        },
    })
    @ApiForbiddenResponse({ description: 'Réservé aux artisans' })
    getStats(@GetCurrentUserId() userId: string) {
        return this.bookingService.getArtisanStats(userId);
    }

    // ============================================================
    // GET /bookings/:id — Détail d'une réservation
    // ============================================================

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Détail d'une réservation" })
    @ApiParam({ name: 'id', description: 'UUID de la réservation' })
    @ApiResponse({ status: 200, description: 'Détail de la réservation' })
    @ApiNotFoundResponse({ description: 'Réservation non trouvée' })
    @ApiForbiddenResponse({ description: 'Accès refusé' })
    findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('role') role: Role,
    ) {
        return this.bookingService.findOne(id, userId, role);
    }

    // ============================================================
    // PATCH /bookings/:id/accept — Artisan accepte
    // ============================================================

    @Patch(':id/accept')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ARTISAN)
    @UseGuards(RolesGuard)
    @ApiOperation({
        summary: 'Accepter une réservation',
        description: "L'artisan accepte la demande. La réservation passe au statut ACCEPTEE.",
    })
    @ApiParam({ name: 'id', description: 'UUID de la réservation' })
    @ApiResponse({ status: 200, description: 'Réservation acceptée' })
    @ApiBadRequestResponse({ description: 'Statut incompatible' })
    @ApiForbiddenResponse({ description: "Réservé à l'artisan de cette réservation" })
    accept(@Param('id', ParseUUIDPipe) id: string, @GetCurrentUserId() userId: string) {
        return this.bookingService.accept(id, userId);
    }

    // ============================================================
    // PATCH /bookings/:id/propose-price — Artisan propose un prix
    // ============================================================

    @Patch(':id/propose-price')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ARTISAN)
    @UseGuards(RolesGuard)
    @ApiOperation({
        summary: 'Proposer un prix',
        description: "L'artisan soumet un devis. La réservation passe au statut PRIX_PROPOSE.",
    })
    @ApiParam({ name: 'id', description: 'UUID de la réservation' })
    @ApiResponse({ status: 200, description: 'Prix proposé' })
    @ApiBadRequestResponse({ description: 'Statut incompatible ou données invalides' })
    proposePrice(
        @Param('id', ParseUUIDPipe) id: string,
        @GetCurrentUserId() userId: string,
        @Body() dto: ProposePriceDto,
    ) {
        return this.bookingService.proposePrice(id, userId, dto);
    }

    // ============================================================
    // PATCH /bookings/:id/confirm — Client confirme le prix
    // ============================================================

    @Patch(':id/confirm')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.CLIENT)
    @UseGuards(RolesGuard)
    @ApiOperation({
        summary: 'Confirmer le devis',
        description: 'Le client accepte le prix proposé. La réservation passe au statut CONFIRMEE.',
    })
    @ApiParam({ name: 'id', description: 'UUID de la réservation' })
    @ApiResponse({ status: 200, description: 'Devis confirmé' })
    @ApiBadRequestResponse({ description: 'Pas de prix à confirmer ou statut incompatible' })
    confirmPrice(@Param('id', ParseUUIDPipe) id: string, @GetCurrentUserId() userId: string) {
        return this.bookingService.confirmPrice(id, userId);
    }

    // ============================================================
    // PATCH /bookings/:id/start — Artisan démarre l'intervention
    // ============================================================

    @Patch(':id/start')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ARTISAN)
    @UseGuards(RolesGuard)
    @ApiOperation({
        summary: "Démarrer l'intervention",
        description: "L'artisan démarre les travaux. La réservation passe au statut EN_COURS.",
    })
    @ApiParam({ name: 'id', description: 'UUID de la réservation' })
    @ApiResponse({ status: 200, description: 'Intervention démarrée' })
    @ApiBadRequestResponse({ description: 'La réservation doit être CONFIRMEE pour démarrer' })
    start(@Param('id', ParseUUIDPipe) id: string, @GetCurrentUserId() userId: string) {
        return this.bookingService.start(id, userId);
    }

    // ============================================================
    // PATCH /bookings/:id/complete — Artisan termine l'intervention
    // ============================================================

    @Patch(':id/complete')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ARTISAN)
    @UseGuards(RolesGuard)
    @ApiOperation({
        summary: "Terminer l'intervention",
        description: "L'artisan marque les travaux comme terminés. Statut → TERMINEE.",
    })
    @ApiParam({ name: 'id', description: 'UUID de la réservation' })
    @ApiResponse({ status: 200, description: 'Intervention terminée' })
    @ApiBadRequestResponse({ description: 'La réservation doit être EN_COURS' })
    complete(@Param('id', ParseUUIDPipe) id: string, @GetCurrentUserId() userId: string) {
        return this.bookingService.complete(id, userId);
    }

    // ============================================================
    // PATCH /bookings/:id/cancel — Annuler une réservation
    // ============================================================

    @Patch(':id/cancel')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Annuler une réservation',
        description: `
Client ou artisan peut annuler selon règles :
- Annulable si statut : SOUMISE, ACCEPTEE, PRIX_PROPOSE, CONTRE_OFFRE, CONFIRMEE
- Artisan **ne peut pas** annuler une réservation CONFIRMEE
    `,
    })
    @ApiParam({ name: 'id', description: 'UUID de la réservation' })
    @ApiResponse({ status: 200, description: 'Réservation annulée' })
    @ApiBadRequestResponse({ description: 'Statut non annulable' })
    @ApiForbiddenResponse({ description: 'Non autorisé à annuler cette réservation' })
    cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('role') role: Role,
        @Body() dto: CancelBookingDto,
    ) {
        return this.bookingService.cancel(id, userId, role, dto);
    }
}
