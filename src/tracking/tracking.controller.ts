import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
} from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { GetCurrentUserId } from 'src/common/decorators';

@ApiTags('Tracking (Suivi temps réel)')
@ApiBearerAuth('access-token')
@Controller('tracking')
export class TrackingController {
    constructor(private readonly trackingService: TrackingService) {}

    // ============================================================
    // GET /tracking/:bookingId — État du suivi (fallback REST)
    // ============================================================

    @Get(':bookingId')
    @ApiOperation({
        summary: "État du suivi temps réel d'une réservation",
        description: `
Retourne la dernière position connue de l'artisan, sa phase de déplacement
(EN_ROUTE, ARRIVE, EN_INTERVENTION, TERMINE) et les coordonnées de destination.

**Usage :**
- Au chargement de l'écran de suivi (cold start), avant la connexion WebSocket
- En fallback si le WebSocket est indisponible (polling léger)

Le flux temps réel passe par le namespace WebSocket \`/tracking\`
(événements \`subscribe_tracking\`, \`tracking:position\`, \`tracking:phase\`).

**Accès :** réservé au client et à l'artisan de la réservation.
        `,
    })
    @ApiParam({ name: 'bookingId', description: 'UUID de la réservation' })
    @ApiResponse({ status: 200, description: 'État du tracking (position, phase, destination)' })
    @ApiForbiddenResponse({ description: 'Vous ne participez pas à cette réservation' })
    @ApiNotFoundResponse({ description: 'Réservation non trouvée' })
    getTrackingState(
        @Param('bookingId', ParseUUIDPipe) bookingId: string,
        @GetCurrentUserId() userId: string,
    ) {
        return this.trackingService.getTrackingState(bookingId, userId);
    }
}
