import { Tokens } from './types';
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { RtGuard } from 'src/common/guards';
import { GetCurrentUser, GetCurrentUserId, Public } from 'src/common/decorators';
import { EmailVerificationDto } from 'src/common/services/dto';
import { NewOtpCodeDTO } from 'src/common/services/dto/new-otp-code.dto';
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Public()
    @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 inscriptions/minute par IP
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    register(@Body() dto: AuthDto): Promise<Tokens> {
        return this.authService.register(dto);
    }

    @Public()
    @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 tentatives/minute par IP
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: AuthDto): Promise<Tokens> {
        return this.authService.login(dto);
    }

    @SkipThrottle() // Déjà protégé par authentification
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    logout(@GetCurrentUserId() userId: string) {
        return this.authService.logout(userId);
    }

    @Public()
    @SkipThrottle() // Protégé par le refresh token
    @UseGuards(RtGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refreshTokens(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('refreshToken') refreshToken: string,
    ) {
        return this.authService.refreshTokens(userId, refreshToken);
    }

    @Public()
    @Throttle({ short: { limit: 5, ttl: 300000 } }) // 5 tentatives/5 min par IP
    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    verifyOtp(@Body() dto: EmailVerificationDto) {
        return this.authService.verifyOtp(dto);
    }

    @Public()
    @Throttle({ short: { limit: 3, ttl: 600000 } }) // 3 demandes/10 min par IP (anti-spam)
    @Post('new-otp-code')
    @HttpCode(HttpStatus.OK)
    newOtpCode(@Body() dto: NewOtpCodeDTO) {
        return this.authService.newOtpCode(dto);
    }
}
