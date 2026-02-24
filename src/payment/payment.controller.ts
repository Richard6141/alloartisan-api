import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    UseGuards,
    Logger,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto';
import { AtGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { GetCurrentUser } from 'src/common/decorators';
import { Role } from 'src/generated/prisma';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@UseGuards(AtGuard)
@Controller('payments')
export class PaymentController {
    private readonly logger = new Logger(PaymentController.name);

    constructor(private readonly paymentService: PaymentService) {}

    // ------------------------------------------------------------------
    // POST /payments/initiate/:bookingId — Initier un paiement
    // ------------------------------------------------------------------

    @ApiOperation({
        summary: 'Initier un paiement pour une réservation confirmée',
        description:
            'Crée une transaction de paiement via FedaPay ou KkiaPay. ' +
            'La réservation doit être en statut CONFIRMEE avec un prix final.',
    })
    @ApiParam({ name: 'bookingId', description: 'UUID de la réservation' })
    @ApiResponse({ status: 201, description: 'Paiement initié — URL de paiement retournée' })
    @ApiResponse({
        status: 400,
        description: 'Booking non payable (mauvais statut ou prix manquant)',
    })
    @ApiResponse({ status: 403, description: 'Accès interdit' })
    @Post('initiate/:bookingId')
    async initiatePayment(
        @Param('bookingId', ParseUUIDPipe) bookingId: string,
        @GetCurrentUser('sub') clientId: string,
        @Body() dto: InitiatePaymentDto,
    ) {
        return this.paymentService.initiatePayment(bookingId, clientId, dto);
    }

    // ------------------------------------------------------------------
    // GET /payments/:transactionId — Statut d'une transaction
    // ------------------------------------------------------------------

    @ApiOperation({ summary: "Obtenir le statut d'une transaction" })
    @ApiParam({ name: 'transactionId', description: 'UUID de la transaction interne' })
    @ApiResponse({ status: 200, description: 'Statut de la transaction' })
    @Get(':transactionId')
    async getTransactionStatus(
        @Param('transactionId', ParseUUIDPipe) transactionId: string,
        @GetCurrentUser('sub') userId: string,
    ) {
        return this.paymentService.getTransactionStatus(transactionId, userId);
    }

    // ------------------------------------------------------------------
    // GET /payments/history — Historique des paiements
    // ------------------------------------------------------------------

    @ApiOperation({
        summary: 'Historique des paiements',
        description: "Retourne les 50 dernières transactions de l'utilisateur connecté.",
    })
    @ApiResponse({ status: 200, description: 'Liste des transactions' })
    @Get('history')
    async getHistory(@GetCurrentUser('sub') userId: string, @GetCurrentUser('role') role: Role) {
        const isArtisan = role === Role.ARTISAN;
        return this.paymentService.getHistory(userId, isArtisan);
    }

    // ------------------------------------------------------------------
    // POST /payments/refund/:transactionId — Remboursement [ADMIN]
    // ------------------------------------------------------------------

    @ApiOperation({
        summary: '[ADMIN] Rembourser une transaction',
        description: 'Initie un remboursement via le provider de paiement. Réservé aux admins.',
    })
    @ApiParam({ name: 'transactionId', description: 'UUID de la transaction à rembourser' })
    @ApiResponse({ status: 200, description: 'Remboursement initié' })
    @ApiResponse({ status: 403, description: 'Réservé aux admins' })
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    @Post('refund/:transactionId')
    async refundTransaction(@Param('transactionId', ParseUUIDPipe) transactionId: string) {
        await this.paymentService.refundTransaction(transactionId);
        return { message: 'Remboursement initié avec succès' };
    }
}
