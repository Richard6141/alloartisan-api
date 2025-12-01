import { Tokens, LoginResponse, MfaRequiredResponse } from './types';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
    AuthDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    EnableMfaDto,
    VerifyMfaDto,
    VerifyMfaLoginDto,
} from './dto';
import { RtGuard } from 'src/common/guards';
import { GetCurrentUser, GetCurrentUserId, Public } from 'src/common/decorators';
import { EmailVerificationDto } from 'src/common/services/dto';
import { NewOtpCodeDTO } from 'src/common/services/dto/new-otp-code.dto';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    // ==================== REGISTER / LOGIN / LOGOUT ====================

    @Public()
    @Throttle({ short: { limit: 5, ttl: 60000 } })
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Créer un compte',
        description: 'Inscrit un nouvel utilisateur et envoie un email de vérification.',
    })
    @ApiResponse({
        status: 201,
        description: 'Compte créé avec succès. Un email de vérification a été envoyé.',
        type: Tokens,
    })
    @ApiForbiddenResponse({ description: 'Email déjà utilisé' })
    register(@Body() dto: AuthDto, @Req() req: Request): Promise<Tokens> {
        return this.authService.register(dto, this.extractDeviceInfo(req));
    }

    @Public()
    @Throttle({ short: { limit: 5, ttl: 60000 } })
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Connexion',
        description:
            'Authentifie un utilisateur. Si MFA activé, retourne un mfa_token à utiliser avec /login/mfa.',
    })
    @ApiResponse({
        status: 200,
        description: 'Connexion réussie - tokens retournés',
        type: Tokens,
    })
    @ApiResponse({
        status: 200,
        description: 'MFA requis - utiliser /login/mfa avec le mfa_token',
        type: MfaRequiredResponse,
    })
    @ApiForbiddenResponse({ description: 'Identifiants incorrects ou compte non vérifié' })
    login(@Body() dto: AuthDto, @Req() req: Request): Promise<LoginResponse> {
        return this.authService.login(dto, this.extractDeviceInfo(req));
    }

    @Public()
    @Throttle({ short: { limit: 5, ttl: 60000 } })
    @Post('login/mfa')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Vérification MFA',
        description:
            'Finalise la connexion en vérifiant le code TOTP après un login avec MFA activé.',
    })
    @ApiResponse({ status: 200, description: 'MFA vérifié, tokens retournés', type: Tokens })
    @ApiForbiddenResponse({ description: 'Code MFA invalide ou expiré' })
    verifyMfaLogin(@Body() dto: VerifyMfaLoginDto, @Req() req: Request): Promise<Tokens> {
        return this.authService.verifyMfaLogin(
            dto.mfa_token,
            dto.code,
            this.extractDeviceInfo(req),
        );
    }

    @SkipThrottle()
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Déconnexion',
        description: 'Déconnecte la session actuelle.',
    })
    @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
    @ApiUnauthorizedResponse({ description: 'Token invalide' })
    logout(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('sessionId') sessionId: string,
    ): Promise<void> {
        return this.authService.logout(userId, sessionId);
    }

    @SkipThrottle()
    @Post('logout/all')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Déconnexion globale',
        description: "Déconnecte toutes les sessions de l'utilisateur sur tous les appareils.",
    })
    @ApiResponse({ status: 200, description: 'Toutes les sessions révoquées' })
    @ApiUnauthorizedResponse({ description: 'Token invalide' })
    logoutAll(@GetCurrentUserId() userId: string): Promise<void> {
        return this.authService.logoutAll(userId);
    }

    @SkipThrottle()
    @Post('logout/others')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Déconnexion autres appareils',
        description: 'Déconnecte toutes les sessions sauf la session actuelle.',
    })
    @ApiResponse({ status: 200, description: 'Autres sessions révoquées' })
    @ApiUnauthorizedResponse({ description: 'Token invalide' })
    logoutOthers(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('sessionId') sessionId: string,
    ): Promise<void> {
        return this.authService.logoutAllExceptCurrent(userId, sessionId);
    }

    // ==================== REFRESH TOKEN ====================

    @Public()
    @SkipThrottle()
    @UseGuards(RtGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Rafraîchir les tokens',
        description:
            'Génère une nouvelle paire access/refresh token. Utiliser le refresh token dans le header.',
    })
    @ApiResponse({ status: 200, description: 'Nouveaux tokens générés', type: Tokens })
    @ApiUnauthorizedResponse({ description: 'Refresh token invalide ou expiré' })
    refreshTokens(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('sessionId') sessionId: string,
        @GetCurrentUser('refreshToken') refreshToken: string,
    ): Promise<Tokens> {
        return this.authService.refreshTokens(userId, sessionId, refreshToken);
    }

    // ==================== SESSIONS ====================

    @SkipThrottle()
    @Get('sessions')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Lister mes sessions',
        description: "Récupère la liste des sessions actives avec les informations d'appareil.",
    })
    @ApiResponse({ status: 200, description: 'Liste des sessions' })
    @ApiUnauthorizedResponse({ description: 'Token invalide' })
    getSessions(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('sessionId') sessionId: string,
    ) {
        return this.authService.getSessions(userId, sessionId);
    }

    @SkipThrottle()
    @Delete('sessions/:sessionId')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Révoquer une session',
        description: 'Révoque une session spécifique par son ID.',
    })
    @ApiResponse({ status: 200, description: 'Session révoquée' })
    @ApiUnauthorizedResponse({ description: 'Token invalide' })
    revokeSession(
        @GetCurrentUserId() userId: string,
        @Param('sessionId') sessionId: string,
    ): Promise<void> {
        return this.authService.revokeSession(userId, sessionId);
    }

    // ==================== PASSWORD RESET ====================

    @Public()
    @Throttle({ short: { limit: 3, ttl: 600000 } })
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Mot de passe oublié',
        description:
            'Envoie un code de réinitialisation par email. Limité à 3 requêtes par 10 minutes.',
    })
    @ApiResponse({ status: 200, description: 'Email envoyé si le compte existe' })
    forgotPassword(@Body() dto: ForgotPasswordDto): Promise<string> {
        return this.authService.forgotPassword(dto);
    }

    @Public()
    @Throttle({ short: { limit: 5, ttl: 300000 } })
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Réinitialiser le mot de passe',
        description: 'Réinitialise le mot de passe avec le code reçu par email.',
    })
    @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé' })
    @ApiForbiddenResponse({ description: 'Code invalide ou expiré' })
    resetPassword(@Body() dto: ResetPasswordDto): Promise<string> {
        return this.authService.resetPassword(dto);
    }

    // ==================== MFA (TOTP) ====================

    @Throttle({ short: { limit: 3, ttl: 60000 } })
    @Post('mfa/generate')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Générer un secret MFA',
        description:
            "Génère un secret TOTP et retourne le QR code pour configurer une app d'authentification.",
    })
    @ApiResponse({ status: 200, description: 'Secret et QR code générés' })
    @ApiUnauthorizedResponse({ description: 'Token invalide' })
    generateMfaSecret(@GetCurrentUserId() userId: string) {
        return this.authService.generateMfaSecret(userId);
    }

    @Throttle({ short: { limit: 5, ttl: 300000 } })
    @Post('mfa/enable')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Activer le MFA',
        description: "Active l'authentification à deux facteurs après vérification du code TOTP.",
    })
    @ApiResponse({ status: 200, description: 'MFA activé' })
    @ApiForbiddenResponse({ description: 'Code TOTP invalide' })
    enableMfa(@GetCurrentUserId() userId: string, @Body() dto: EnableMfaDto): Promise<string> {
        return this.authService.enableMfa(userId, dto);
    }

    @Throttle({ short: { limit: 5, ttl: 300000 } })
    @Post('mfa/disable')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Désactiver le MFA',
        description:
            "Désactive l'authentification à deux facteurs après vérification du code TOTP.",
    })
    @ApiResponse({ status: 200, description: 'MFA désactivé' })
    @ApiForbiddenResponse({ description: 'Code TOTP invalide' })
    disableMfa(@GetCurrentUserId() userId: string, @Body() dto: VerifyMfaDto): Promise<string> {
        return this.authService.disableMfa(userId, dto);
    }

    // ==================== EMAIL VERIFICATION ====================

    @Public()
    @Throttle({ short: { limit: 5, ttl: 300000 } })
    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: "Vérifier l'email",
        description: "Vérifie l'adresse email avec le code OTP reçu.",
    })
    @ApiResponse({ status: 200, description: 'Email vérifié' })
    @ApiForbiddenResponse({ description: 'Code OTP invalide ou expiré' })
    verifyOtp(@Body() dto: EmailVerificationDto) {
        return this.authService.verifyOtp(dto);
    }

    @Public()
    @Throttle({ short: { limit: 3, ttl: 600000 } })
    @Post('new-otp-code')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Renvoyer le code OTP',
        description:
            'Envoie un nouveau code de vérification par email. Limité à 3 requêtes par 10 minutes.',
    })
    @ApiResponse({ status: 200, description: 'Nouveau code envoyé' })
    newOtpCode(@Body() dto: NewOtpCodeDTO) {
        return this.authService.newOtpCode(dto);
    }

    // ==================== HELPERS ====================

    private extractDeviceInfo(req: Request) {
        const userAgent = req.get('user-agent') || '';
        const ip = req.ip || req.get('x-forwarded-for') || '';

        return {
            userAgent,
            ipAddress: ip,
            deviceName: this.parseDeviceName(userAgent),
            deviceType: this.parseDeviceType(userAgent),
        };
    }

    private parseDeviceName(userAgent: string): string {
        if (userAgent.includes('iPhone')) return 'iPhone';
        if (userAgent.includes('iPad')) return 'iPad';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('Windows')) return 'Windows PC';
        if (userAgent.includes('Mac')) return 'Mac';
        if (userAgent.includes('Linux')) return 'Linux';
        return 'Unknown Device';
    }

    private parseDeviceType(userAgent: string): string {
        if (userAgent.includes('Mobile')) return 'mobile';
        if (userAgent.includes('Tablet') || userAgent.includes('iPad')) return 'tablet';
        return 'desktop';
    }
}
