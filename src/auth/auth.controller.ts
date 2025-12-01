import { Tokens, LoginResponse } from './types';
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

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    // ==================== REGISTER / LOGIN / LOGOUT ====================

    @Public()
    @Throttle({ short: { limit: 5, ttl: 60000 } })
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    register(@Body() dto: AuthDto, @Req() req: Request): Promise<Tokens> {
        return this.authService.register(dto, this.extractDeviceInfo(req));
    }

    @Public()
    @Throttle({ short: { limit: 5, ttl: 60000 } })
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: AuthDto, @Req() req: Request): Promise<LoginResponse> {
        return this.authService.login(dto, this.extractDeviceInfo(req));
    }

    @Public()
    @Throttle({ short: { limit: 5, ttl: 60000 } })
    @Post('login/mfa')
    @HttpCode(HttpStatus.OK)
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
    logout(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('sessionId') sessionId: string,
    ): Promise<void> {
        return this.authService.logout(userId, sessionId);
    }

    @SkipThrottle()
    @Post('logout/all')
    @HttpCode(HttpStatus.OK)
    logoutAll(@GetCurrentUserId() userId: string): Promise<void> {
        return this.authService.logoutAll(userId);
    }

    @SkipThrottle()
    @Post('logout/others')
    @HttpCode(HttpStatus.OK)
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
    getSessions(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('sessionId') sessionId: string,
    ) {
        return this.authService.getSessions(userId, sessionId);
    }

    @SkipThrottle()
    @Delete('sessions/:sessionId')
    @HttpCode(HttpStatus.OK)
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
    forgotPassword(@Body() dto: ForgotPasswordDto): Promise<string> {
        return this.authService.forgotPassword(dto);
    }

    @Public()
    @Throttle({ short: { limit: 5, ttl: 300000 } })
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    resetPassword(@Body() dto: ResetPasswordDto): Promise<string> {
        return this.authService.resetPassword(dto);
    }

    // ==================== MFA (TOTP) ====================

    // Point 10: Ajout de rate limiting sur les endpoints MFA
    @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 requêtes par minute
    @Post('mfa/generate')
    @HttpCode(HttpStatus.OK)
    generateMfaSecret(@GetCurrentUserId() userId: string) {
        return this.authService.generateMfaSecret(userId);
    }

    @Throttle({ short: { limit: 5, ttl: 300000 } }) // 5 requêtes par 5 minutes
    @Post('mfa/enable')
    @HttpCode(HttpStatus.OK)
    enableMfa(@GetCurrentUserId() userId: string, @Body() dto: EnableMfaDto): Promise<string> {
        return this.authService.enableMfa(userId, dto);
    }

    @Throttle({ short: { limit: 5, ttl: 300000 } }) // 5 requêtes par 5 minutes
    @Post('mfa/disable')
    @HttpCode(HttpStatus.OK)
    disableMfa(@GetCurrentUserId() userId: string, @Body() dto: VerifyMfaDto): Promise<string> {
        return this.authService.disableMfa(userId, dto);
    }

    // ==================== EMAIL VERIFICATION ====================

    @Public()
    @Throttle({ short: { limit: 5, ttl: 300000 } })
    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    verifyOtp(@Body() dto: EmailVerificationDto) {
        return this.authService.verifyOtp(dto);
    }

    @Public()
    @Throttle({ short: { limit: 3, ttl: 600000 } })
    @Post('new-otp-code')
    @HttpCode(HttpStatus.OK)
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
