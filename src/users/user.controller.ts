import { Controller, Get, Patch, Delete, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { GetCurrentUser, GetCurrentUserId } from 'src/common/decorators';
import { UpdateProfileDto, DeleteAccountDto, GetProfileResponseDto } from './dto';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    getAllUsers() {
        return this.userService.getAllUsers();
    }

    @Get('me')
    @HttpCode(HttpStatus.OK)
    getMe(@GetCurrentUserId() userId: string): Promise<GetProfileResponseDto> {
        return this.userService.getProfile(userId);
    }

    @Patch('me')
    @HttpCode(HttpStatus.OK)
    updateMe(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('sessionId') sessionId: string,
        @Body() dto: UpdateProfileDto,
    ): Promise<GetProfileResponseDto> {
        return this.userService.updateProfile(userId, sessionId, dto);
    }

    @Delete('me')
    @HttpCode(HttpStatus.OK)
    deleteMe(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('sessionId') sessionId: string,
        @Body() dto: DeleteAccountDto,
    ): Promise<{ message: string }> {
        return this.userService.deleteAccount(userId, sessionId, dto);
    }
}
