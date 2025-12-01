import { Controller, Get, Patch, Delete, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { GetCurrentUser, GetCurrentUserId } from 'src/common/decorators';
import { UpdateProfileDto, DeleteAccountDto, GetProfileResponseDto } from './dto';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    @ApiOperation({
        summary: 'Liste tous les utilisateurs',
        description: 'Récupère la liste de tous les utilisateurs. Réservé aux administrateurs.',
    })
    getAllUsers() {
        return this.userService.getAllUsers();
    }

    @Get('me')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Mon profil',
        description: 'Récupère les informations du profil de l\'utilisateur connecté.',
    })
    @ApiResponse({
        status: 200,
        description: 'Profil récupéré avec succès',
        type: GetProfileResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Token invalide ou expiré',
    })
    @ApiNotFoundResponse({
        description: 'Profil utilisateur non trouvé',
    })
    getMe(@GetCurrentUserId() userId: string): Promise<GetProfileResponseDto> {
        return this.userService.getProfile(userId);
    }

    @Patch('me')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Modifier mon profil',
        description: 'Met à jour les informations du profil. Seuls les champs fournis sont modifiés.',
    })
    @ApiResponse({
        status: 200,
        description: 'Profil mis à jour avec succès',
        type: GetProfileResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Token ou session invalide',
    })
    updateMe(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('sessionId') sessionId: string,
        @Body() dto: UpdateProfileDto,
    ): Promise<GetProfileResponseDto> {
        return this.userService.updateProfile(userId, sessionId, dto);
    }

    @Delete('me')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Supprimer mon compte',
        description: 'Supprime définitivement le compte. Nécessite le mot de passe et le code MFA si activé.',
    })
    @ApiResponse({
        status: 200,
        description: 'Compte supprimé avec succès',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Compte supprimé avec succès',
                },
            },
        },
    })
    @ApiUnauthorizedResponse({
        description: 'Token ou session invalide',
    })
    @ApiForbiddenResponse({
        description: 'Mot de passe ou code MFA incorrect',
    })
    deleteMe(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('sessionId') sessionId: string,
        @Body() dto: DeleteAccountDto,
    ): Promise<{ message: string }> {
        return this.userService.deleteAccount(userId, sessionId, dto);
    }
}
