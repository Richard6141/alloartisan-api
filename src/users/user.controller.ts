import {
    Controller,
    Get,
    Patch,
    Post,
    Delete,
    Body,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiConsumes,
    ApiBody,
    ApiTooManyRequestsResponse,
    ApiAcceptedResponse,
} from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { UserService } from './user.service';
import { GetCurrentUser, GetCurrentUserId, Roles } from 'src/common/decorators';
import { UpdateProfileDto, DeleteAccountDto, GetProfileResponseDto } from './dto';
import { UploadService, ImageVariants, ImageValidatorService } from 'src/upload';
import { UploadThrottleGuard, UploadSizeLimitGuard } from 'src/upload/guards/upload-throttle.guard';
import { RolesGuard } from 'src/common/guards';
import { Role } from 'src/generated/prisma';
import * as fs from 'fs/promises';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly uploadService: UploadService,
        private readonly imageValidator: ImageValidatorService,
        @InjectQueue('upload') private readonly uploadQueue: Queue,
    ) {}

    @Get()
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    @ApiOperation({
        summary: '[Admin] Liste tous les utilisateurs',
        description: 'Récupère la liste de tous les utilisateurs. Réservé aux administrateurs.',
    })
    @ApiForbiddenResponse({ description: 'Accès réservé aux administrateurs' })
    getAllUsers() {
        return this.userService.getAllUsers();
    }

    @Get('me')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Mon profil',
        description: "Récupère les informations du profil de l'utilisateur connecté.",
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
        description:
            'Met à jour les informations du profil. Seuls les champs fournis sont modifiés.',
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
        description:
            'Supprime définitivement le compte. Nécessite le mot de passe et le code MFA si activé.',
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

    /**
     * Upload photo de profil (Cloudinary)
     * - Validation magic bytes
     * - Sanitization (suppression EXIF, re-encodage)
     * - Upload vers Cloudinary avec transformations automatiques
     */
    @Post('me/photo')
    @HttpCode(HttpStatus.OK)
    @UseGuards(UploadThrottleGuard, UploadSizeLimitGuard)
    @UseInterceptors(FileInterceptor('photo'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({
        summary: 'Upload photo de profil',
        description: `Téléverse une nouvelle photo de profil.

**Sécurité:**
- Validation des magic bytes (signature réelle du fichier)
- Suppression automatique des métadonnées EXIF (GPS, appareil...)
- Re-encodage complet de l'image (protection contre malware)
- Rate limiting: 5 uploads/heure max

**Optimisations:**
- Compression automatique 70-90%
- Conversion WebP
- 3 variantes générées (thumbnail, medium, original)
- Placeholder flou pour lazy loading`,
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                photo: {
                    type: 'string',
                    format: 'binary',
                    description: 'Photo de profil (JPEG, PNG, WebP - max 5MB)',
                },
            },
            required: ['photo'],
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Photo uploadée avec succès',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Photo de profil mise à jour avec succès' },
                variants: {
                    type: 'object',
                    properties: {
                        thumbnail: { type: 'string', description: '200x200px' },
                        medium: { type: 'string', description: '800x600px' },
                        original: { type: 'string', description: '1920px max' },
                        placeholder: { type: 'string', description: 'Base64 blur placeholder' },
                        publicId: { type: 'string', description: 'ID pour suppression' },
                    },
                },
            },
        },
    })
    @ApiUnauthorizedResponse({ description: 'Token invalide ou expiré' })
    @ApiTooManyRequestsResponse({ description: 'Trop de requêtes. Réessayez plus tard.' })
    async uploadProfilePhoto(
        @GetCurrentUserId() userId: string,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<{ message: string; variants: ImageVariants }> {
        if (!file) {
            throw new BadRequestException('Aucun fichier fourni');
        }

        // Lire le fichier depuis le disque (stockage temporaire)
        let buffer: Buffer;
        if (file.path) {
            buffer = await fs.readFile(file.path);
        } else if (file.buffer) {
            buffer = file.buffer;
        } else {
            throw new BadRequestException('Fichier invalide');
        }

        try {
            // 1. Validation approfondie (magic bytes, dimensions, etc.)
            const validation = await this.imageValidator.validateImage(buffer, 5 * 1024 * 1024);
            if (!validation.isValid) {
                throw new BadRequestException(validation.error);
            }

            // 2. Sanitization (suppression EXIF, re-encodage sécurisé)
            const sanitizedBuffer = await this.imageValidator.sanitizeImage(buffer, {
                maxWidth: 1920,
                maxHeight: 1920,
                quality: 85,
                format: 'webp',
                stripMetadata: true,
            });

            // 3. Upload vers Cloudinary
            const variants = await this.userService.updateProfilePhoto(
                userId,
                sanitizedBuffer,
                this.uploadService,
            );

            return {
                message: 'Photo de profil mise à jour avec succès',
                variants,
            };
        } finally {
            // Nettoyer le fichier temporaire
            if (file.path) {
                await fs.unlink(file.path).catch(() => {});
            }
        }
    }

    /**
     * Upload photo de profil ASYNC (rapide ~200ms)
     * Le traitement se fait en arrière-plan via Bull Queue
     */
    @Post('me/photo/async')
    @HttpCode(HttpStatus.ACCEPTED)
    @UseGuards(UploadThrottleGuard, UploadSizeLimitGuard)
    @UseInterceptors(FileInterceptor('photo'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({
        summary: 'Upload photo de profil (async)',
        description: `Upload asynchrone - retourne immédiatement (~200ms).

Le traitement (compression, upload Cloudinary) se fait en arrière-plan.
La photo sera disponible dans quelques secondes après la réponse.

**Avantage:** Réponse instantanée, meilleure UX
**Inconvénient:** Les URLs des variantes ne sont pas retournées immédiatement`,
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                photo: {
                    type: 'string',
                    format: 'binary',
                    description: 'Photo de profil (JPEG, PNG, WebP - max 5MB)',
                },
            },
            required: ['photo'],
        },
    })
    @ApiAcceptedResponse({
        description: 'Upload accepté, traitement en cours',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Photo en cours de traitement' },
                jobId: { type: 'string', description: 'ID du job pour suivi (optionnel)' },
            },
        },
    })
    @ApiUnauthorizedResponse({ description: 'Token invalide ou expiré' })
    @ApiTooManyRequestsResponse({ description: 'Trop de requêtes. Réessayez plus tard.' })
    async uploadProfilePhotoAsync(
        @GetCurrentUserId() userId: string,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<{ message: string; jobId: string }> {
        if (!file) {
            throw new BadRequestException('Aucun fichier fourni');
        }

        // Lire le fichier
        let buffer: Buffer;
        if (file.path) {
            buffer = await fs.readFile(file.path);
        } else if (file.buffer) {
            buffer = file.buffer;
        } else {
            throw new BadRequestException('Fichier invalide');
        }

        try {
            // Validation rapide (magic bytes uniquement)
            const validation = await this.imageValidator.validateImage(buffer, 5 * 1024 * 1024);
            if (!validation.isValid) {
                throw new BadRequestException(validation.error);
            }

            // Ajouter à la queue Bull (traitement async)
            const job = await this.uploadQueue.add(
                'profile-photo',
                {
                    userId,
                    buffer: Array.from(buffer), // Sérialiser le buffer
                    type: 'profile',
                },
                {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    removeOnComplete: true,
                },
            );

            return {
                message: 'Photo en cours de traitement',
                jobId: job.id.toString(),
            };
        } finally {
            // Nettoyer le fichier temporaire
            if (file.path) {
                await fs.unlink(file.path).catch(() => {});
            }
        }
    }

    @Delete('me/photo')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Supprimer photo de profil',
        description: "Supprime la photo de profil de l'utilisateur connecté.",
    })
    @ApiResponse({
        status: 200,
        description: 'Photo supprimée avec succès',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Photo de profil supprimée avec succès' },
            },
        },
    })
    @ApiUnauthorizedResponse({ description: 'Token invalide ou expiré' })
    async deleteProfilePhoto(@GetCurrentUserId() userId: string): Promise<{ message: string }> {
        await this.userService.deleteProfilePhoto(userId, this.uploadService);
        return { message: 'Photo de profil supprimée avec succès' };
    }
}
