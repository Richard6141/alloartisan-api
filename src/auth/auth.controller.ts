import { Tokens } from './types';
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { RtGuard } from 'src/common/guards';
import { GetCurrentUser, GetCurrentUserId, Public } from 'src/common/decorators';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    register(@Body() dto: AuthDto): Promise<Tokens> {
        return this.authService.register(dto);
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: AuthDto): Promise<Tokens> {
        return this.authService.login(dto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    logout(@GetCurrentUserId() userId: string) {
        return this.authService.logout(userId);
    }

    @Public()
    @UseGuards(RtGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refreshTokens(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('refreshToken') refreshToken: string,
    ) {
        return this.authService.refreshTokens(userId, refreshToken);
    }
}
