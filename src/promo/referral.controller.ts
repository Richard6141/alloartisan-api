import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiBadRequestResponse,
    ApiConflictResponse,
} from '@nestjs/swagger';
import { ReferralService } from './referral.service';
import { ApplyReferralDto } from './dto';
import { GetCurrentUserId } from 'src/common/decorators';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Parrainage')
@ApiBearerAuth('access-token')
@Controller('referral')
export class ReferralController {
    constructor(private readonly referralService: ReferralService) {}

    // ============================================================
    // GET /referral/my-code — Mon code parrainage
    // ============================================================

    @Get('my-code')
    @ApiOperation({
        summary: 'Mon code parrainage personnel',
        description:
            "Retourne le code parrainage de l'utilisateur (généré au premier appel). " +
            'À partager : chaque filleul qui paie sa première intervention rapporte une récompense.',
    })
    @ApiResponse({ status: 200, description: 'Code parrainage' })
    getMyCode(@GetCurrentUserId() userId: string) {
        return this.referralService.getMyCode(userId);
    }

    // ============================================================
    // POST /referral/apply — Saisir un code parrain
    // ============================================================

    @Post('apply')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { ttl: 60000, limit: 5 } }) // Anti brute-force de codes
    @ApiOperation({
        summary: "Utiliser le code parrainage d'un autre utilisateur",
        description:
            "À saisir dans les 30 jours suivant l'inscription. Un seul code parrain par compte. " +
            'Les récompenses sont versées quand le filleul paie sa première intervention.',
    })
    @ApiResponse({ status: 200, description: 'Code parrain appliqué' })
    @ApiNotFoundResponse({ description: 'Code parrain invalide' })
    @ApiBadRequestResponse({ description: 'Auto-parrainage ou délai dépassé' })
    @ApiConflictResponse({ description: 'Un code parrain a déjà été utilisé' })
    apply(@GetCurrentUserId() userId: string, @Body() dto: ApplyReferralDto) {
        return this.referralService.applyCode(userId, dto.code);
    }

    // ============================================================
    // GET /referral/my-referrals — Mes filleuls et récompenses
    // ============================================================

    @Get('my-referrals')
    @ApiOperation({
        summary: 'Mes filleuls, mon niveau Ambassadeur et ma progression',
    })
    @ApiResponse({ status: 200, description: 'Filleuls + niveau + prochain palier' })
    getMyReferrals(@GetCurrentUserId() userId: string) {
        return this.referralService.getMyReferrals(userId);
    }

    // ============================================================
    // GET /referral/leaderboard — Classement des Ambassadeurs
    // ============================================================

    @Get('leaderboard')
    @ApiOperation({ summary: 'Top des Ambassadeurs (parrains ayant le plus de filleuls abonnés)' })
    @ApiResponse({ status: 200, description: 'Classement des Ambassadeurs' })
    getLeaderboard() {
        return this.referralService.getLeaderboard(10);
    }
}
