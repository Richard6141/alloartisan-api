import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import {
    UpgradeSubscriptionDto,
    PayerAbonnementDto,
    ConfirmerPaiementDto,
} from './dto/upgrade-subscription.dto';
import { AtGuard, RolesGuard } from 'src/common/guards';
import { GetCurrentUser, Roles } from 'src/common/decorators';
import { Role } from 'src/generated/prisma';

@ApiTags('Abonnements')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) {}

    // ─── Public ──────────────────────────────────────────────────────────────────

    @ApiOperation({
        summary: 'Liste des plans disponibles',
        description: 'Plans GRATUIT / STANDARD / PREMIUM avec quotas, tarifs et avantages.',
    })
    @Get('plans')
    getPlans() {
        return this.subscriptionsService.getPlans();
    }

    // ─── Artisan authentifié ─────────────────────────────────────────────────────

    @ApiOperation({
        summary: 'Mon abonnement actuel',
        description:
            "Retourne le plan actuel, la date d'expiration, les demandes utilisées et le quota restant.",
    })
    @UseGuards(AtGuard, RolesGuard)
    @Roles(Role.ARTISAN)
    @Get('my')
    getMySubscription(@GetCurrentUser('sub') userId: string) {
        return this.subscriptionsService.getMySubscription(userId);
    }

    @ApiOperation({
        summary: 'Souscrire / Mettre à niveau un plan',
        description:
            'Initie la mise à niveau du plan artisan. ' +
            'Dans un flux de production, déclenche un paiement via PaymentModule. ' +
            "Réservé aux artisans disposant d'un profil actif.",
    })
    @UseGuards(AtGuard, RolesGuard)
    @Roles(Role.ARTISAN)
    @Post('upgrade')
    upgradeSubscription(
        @GetCurrentUser('sub') userId: string,
        @Body() dto: UpgradeSubscriptionDto,
    ) {
        return this.subscriptionsService.upgradeSubscription(userId, dto.plan);
    }

    @ApiOperation({
        summary: "Préparer le paiement d'un palier (widget KkiaPay)",
        description:
            "Crée l'intention de paiement et renvoie la configuration du widget " +
            '(clé publique, sandbox). Le widget encaisse côté app, puis ' +
            'POST /pay/:paiementId/confirmer vérifie la transaction.',
    })
    @UseGuards(AtGuard, RolesGuard)
    @Roles(Role.ARTISAN)
    @Post('pay')
    payer(@GetCurrentUser('sub') userId: string, @Body() dto: PayerAbonnementDto) {
        return this.subscriptionsService.initierPaiement(userId, dto.plan);
    }

    @ApiOperation({
        summary: "Confirmer un paiement d'abonnement (transactionId du widget)",
        description:
            'Vérifie la transaction auprès de KkiaPay (statut + montant) et active le palier.',
    })
    @UseGuards(AtGuard, RolesGuard)
    @Roles(Role.ARTISAN)
    @Post('pay/:paiementId/confirmer')
    confirmerPaiement(
        @GetCurrentUser('sub') userId: string,
        @Param('paiementId', ParseUUIDPipe) paiementId: string,
        @Body() dto: ConfirmerPaiementDto,
    ) {
        return this.subscriptionsService.confirmerPaiement(userId, paiementId, dto.transactionId);
    }

    @ApiOperation({
        summary: "Re-vérifier un paiement d'abonnement",
        description:
            'Interroge KkiaPay sur un paiement déjà associé à une transaction et active le palier si confirmé.',
    })
    @UseGuards(AtGuard, RolesGuard)
    @Roles(Role.ARTISAN)
    @Post('pay/:paiementId/verifier')
    verifierPaiement(
        @GetCurrentUser('sub') userId: string,
        @Param('paiementId', ParseUUIDPipe) paiementId: string,
    ) {
        return this.subscriptionsService.verifierPaiement(userId, paiementId);
    }
}
