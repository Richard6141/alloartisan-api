import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { multerCertificationConfig } from 'src/upload/multer.config';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiNotFoundResponse,
    ApiBadRequestResponse,
    ApiForbiddenResponse,
    ApiConsumes,
    ApiBody,
    ApiAcceptedResponse,
} from '@nestjs/swagger';
import { CertificationsService } from './certifications.service';
import {
    CreateCertificationDto,
    UpdateCertificationDto,
    CertificationResponseDto,
    CertificationListResponseDto,
    VerifyCertificationDto,
} from './dto';
import { GetCurrentUserId, Public } from 'src/common/decorators';
import { Roles } from 'src/common/decorators';
import { UploadService, ImageValidatorService } from 'src/upload';
import { UploadThrottleGuard } from 'src/upload/guards/upload-throttle.guard';
import { RolesGuard } from 'src/common/guards';
import { Role } from 'src/generated/prisma';
import * as fs from 'fs/promises';

// Types MIME autorisés pour les documents de certification
const ALLOWED_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

@ApiTags('Certifications')
@Controller('certifications')
export class CertificationsController {
    constructor(
        private readonly certificationsService: CertificationsService,
        private readonly uploadService: UploadService,
        private readonly imageValidator: ImageValidatorService,
        @InjectQueue('upload') private readonly uploadQueue: Queue,
    ) {}

    // ==================== ARTISAN ROUTES (routes protégées /me) ====================

    @Post('me')
    @ApiBearerAuth('access-token')
    @UseGuards(UploadThrottleGuard)
    @UseInterceptors(FileInterceptor('document', multerCertificationConfig))
    @ApiConsumes('multipart/form-data')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Ajouter une certification',
        description: `Ajoute une nouvelle certification au profil de l'artisan connecté.

**Upload asynchrone:** Le document est traité en arrière-plan (~200ms de réponse).
**Documents acceptés:** JPEG, PNG, WebP, PDF (max 10MB)
**Optimisation:** Images compressées automatiquement en WebP`,
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                titre: {
                    type: 'string',
                    description: 'Titre de la certification',
                    example: 'CAP Plomberie',
                },
                organisme: {
                    type: 'string',
                    description: 'Organisme délivrant la certification',
                    example: 'Chambre des Métiers du Bénin',
                },
                dateObtention: {
                    type: 'string',
                    format: 'date',
                    description: "Date d'obtention (ISO 8601)",
                    example: '2020-06-15',
                },
                numeroCertification: {
                    type: 'string',
                    description: 'Numéro de certification',
                    example: 'CERT-2020-12345',
                },
                document: {
                    type: 'string',
                    format: 'binary',
                    description: 'Document justificatif (JPEG, PNG, WebP, PDF - max 10MB)',
                },
            },
            required: ['titre'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Certification créée avec succès (document en cours de traitement)',
        type: CertificationResponseDto,
    })
    @ApiForbiddenResponse({
        description: "L'utilisateur n'est pas un artisan",
    })
    @ApiBadRequestResponse({
        description: 'Données invalides ou fichier non autorisé',
    })
    async create(
        @GetCurrentUserId() userId: string,
        @Body() dto: CreateCertificationDto,
        @UploadedFile() file?: Express.Multer.File,
    ): Promise<CertificationResponseDto> {
        // Créer la certification d'abord (sans document)
        const certification = await this.certificationsService.create(userId, dto);

        // Si un fichier est fourni, traiter en arrière-plan
        if (file) {
            await this.queueDocumentUpload(file, userId, certification.id);
        }

        return certification;
    }

    @Get('me')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Mes certifications',
        description:
            "Récupère toutes les certifications de l'artisan connecté (vérifiées et non vérifiées).",
    })
    @ApiResponse({
        status: 200,
        description: 'Liste des certifications',
        type: CertificationListResponseDto,
    })
    @ApiForbiddenResponse({
        description: "L'utilisateur n'est pas un artisan",
    })
    findMyAll(@GetCurrentUserId() userId: string): Promise<CertificationListResponseDto> {
        return this.certificationsService.findMyAll(userId);
    }

    @Patch('me/:id')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Modifier une certification',
        description:
            "Met à jour les informations d'une certification existante. Si la certification était vérifiée, elle repassera en attente de vérification.",
    })
    @ApiParam({
        name: 'id',
        description: 'Identifiant UUID de la certification',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @ApiResponse({
        status: 200,
        description: 'Certification mise à jour',
        type: CertificationResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Certification non trouvée',
    })
    @ApiForbiddenResponse({
        description: 'Vous ne pouvez modifier que vos propres certifications',
    })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @GetCurrentUserId() userId: string,
        @Body() dto: UpdateCertificationDto,
    ): Promise<CertificationResponseDto> {
        return this.certificationsService.update(id, userId, dto);
    }

    @Post('me/:id/document')
    @ApiBearerAuth('access-token')
    @UseGuards(UploadThrottleGuard)
    @UseInterceptors(FileInterceptor('document', multerCertificationConfig))
    @ApiConsumes('multipart/form-data')
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiOperation({
        summary: 'Upload/remplacer document certification',
        description: `Upload ou remplace le document justificatif d'une certification existante.

**Upload asynchrone:** Réponse instantanée, traitement en arrière-plan.
**Documents acceptés:** JPEG, PNG, WebP, PDF (max 10MB)
**Note:** La certification repassera en attente de vérification.`,
    })
    @ApiParam({
        name: 'id',
        description: 'Identifiant UUID de la certification',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                document: {
                    type: 'string',
                    format: 'binary',
                    description: 'Document justificatif (JPEG, PNG, WebP, PDF - max 10MB)',
                },
            },
            required: ['document'],
        },
    })
    @ApiAcceptedResponse({
        description: 'Document en cours de traitement',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Document en cours de traitement' },
                certificationId: { type: 'string' },
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Certification non trouvée',
    })
    @ApiForbiddenResponse({
        description: 'Vous ne pouvez modifier que vos propres certifications',
    })
    @ApiBadRequestResponse({
        description: 'Fichier manquant ou non autorisé',
    })
    async uploadDocument(
        @Param('id', ParseUUIDPipe) id: string,
        @GetCurrentUserId() userId: string,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<{ message: string; certificationId: string }> {
        if (!file) {
            throw new BadRequestException('Aucun fichier fourni');
        }

        // Vérifier la propriété et obtenir l'artisan ID
        const { documentUrl: oldDocumentUrl } =
            await this.certificationsService.verifyCertificationOwnership(id, userId);

        // Supprimer l'ancien document si existant
        if (oldDocumentUrl) {
            const publicId = this.uploadService.extractPublicIdFromUrl(oldDocumentUrl);
            if (publicId) {
                await this.uploadService.deleteImage(publicId).catch(() => {});
            }
        }

        // Reset la vérification (sera fait par le processor après upload)
        await this.certificationsService.resetVerification(id, userId);

        // Queue l'upload en arrière-plan
        await this.queueDocumentUpload(file, userId, id);

        return {
            message: 'Document en cours de traitement',
            certificationId: id,
        };
    }

    @Delete('me/:id')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Supprimer une certification',
        description: "Supprime définitivement une certification de l'artisan connecté.",
    })
    @ApiParam({
        name: 'id',
        description: 'Identifiant UUID de la certification',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @ApiResponse({
        status: 200,
        description: 'Certification supprimée',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Certification supprimée avec succès' },
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Certification non trouvée',
    })
    @ApiForbiddenResponse({
        description: 'Vous ne pouvez supprimer que vos propres certifications',
    })
    delete(
        @Param('id', ParseUUIDPipe) id: string,
        @GetCurrentUserId() userId: string,
    ): Promise<{ message: string }> {
        return this.certificationsService.delete(id, userId);
    }

    // ==================== PUBLIC ROUTES ====================

    @Get('artisan/:artisanId')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: "Certifications d'un artisan",
        description:
            "Récupère les certifications vérifiées d'un artisan. Seules les certifications validées par un administrateur sont visibles.",
    })
    @ApiParam({
        name: 'artisanId',
        description: "Identifiant UUID de l'artisan",
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @ApiResponse({
        status: 200,
        description: 'Liste des certifications vérifiées',
        type: CertificationListResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Artisan non trouvé',
    })
    findByArtisan(
        @Param('artisanId', ParseUUIDPipe) artisanId: string,
    ): Promise<CertificationListResponseDto> {
        return this.certificationsService.findByArtisanId(artisanId, false);
    }

    @Get(':id')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Détail certification',
        description: "Récupère les détails d'une certification spécifique.",
    })
    @ApiParam({
        name: 'id',
        description: 'Identifiant UUID de la certification',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @ApiResponse({
        status: 200,
        description: 'Détails de la certification',
        type: CertificationResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Certification non trouvée',
    })
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CertificationResponseDto> {
        return this.certificationsService.findOne(id);
    }

    // ==================== ADMIN ROUTES ====================

    @Get('admin/pending')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '[Admin] Certifications en attente',
        description:
            'Récupère toutes les certifications en attente de vérification. Réservé aux administrateurs.',
    })
    @ApiResponse({
        status: 200,
        description: 'Liste des certifications en attente',
        type: CertificationListResponseDto,
    })
    findAllPending(): Promise<CertificationListResponseDto> {
        return this.certificationsService.findAllPending();
    }

    @Patch('admin/:id/verify')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '[Admin] Vérifier une certification',
        description: 'Vérifie ou rejette une certification. Réservé aux administrateurs.',
    })
    @ApiParam({
        name: 'id',
        description: 'Identifiant UUID de la certification',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @ApiResponse({
        status: 200,
        description: 'Certification vérifiée/rejetée',
        type: CertificationResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Certification non trouvée',
    })
    verify(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: VerifyCertificationDto,
    ): Promise<CertificationResponseDto> {
        return this.certificationsService.verify(id, dto.verifie, dto.raison, {
            numeroPiece: dto.numeroPiece,
            dateNaissance: dto.dateNaissance,
        });
    }

    @Get('admin/artisan/:artisanId')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: "[Admin] Tous les documents d'un artisan",
        description:
            "Récupère TOUS les documents d'un artisan (identité comprise, validés ou non) pour le déverrouillage. Réservé aux administrateurs.",
    })
    @ApiParam({
        name: 'artisanId',
        description: "Identifiant UUID de l'artisan",
    })
    @ApiResponse({
        status: 200,
        description: 'Liste complète des documents',
        type: CertificationListResponseDto,
    })
    findAllByArtisanAdmin(
        @Param('artisanId', ParseUUIDPipe) artisanId: string,
    ): Promise<CertificationListResponseDto> {
        return this.certificationsService.findByArtisanId(artisanId, true);
    }

    @Patch('admin/:id/unlock')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '[Admin] Déverrouiller un document validé',
        description:
            "Rend un document validé de nouveau modifiable par l'artisan (sur sa demande). Le document repasse en attente d'examen.",
    })
    @ApiParam({
        name: 'id',
        description: 'Identifiant UUID de la certification',
    })
    @ApiResponse({
        status: 200,
        description: 'Document déverrouillé',
        type: CertificationResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Certification non trouvée',
    })
    unlock(@Param('id', ParseUUIDPipe) id: string): Promise<CertificationResponseDto> {
        return this.certificationsService.unlock(id);
    }

    @Delete('admin/:id')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '[Admin] Supprimer une certification',
        description:
            "Supprime définitivement n'importe quelle certification. Réservé aux administrateurs.",
    })
    @ApiParam({
        name: 'id',
        description: 'Identifiant UUID de la certification',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @ApiResponse({
        status: 200,
        description: 'Certification supprimée',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Certification supprimée avec succès' },
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Certification non trouvée',
    })
    adminDelete(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        return this.certificationsService.adminDelete(id);
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Ajoute un document à la queue pour traitement asynchrone
     */
    private async queueDocumentUpload(
        file: Express.Multer.File,
        userId: string,
        certificationId: string,
    ): Promise<void> {
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
            // Valider le type de fichier
            if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
                throw new BadRequestException(
                    `Type de fichier non autorisé. Types acceptés: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`,
                );
            }

            // Valider la taille
            if (buffer.length > MAX_DOCUMENT_SIZE) {
                throw new BadRequestException(
                    `Le fichier dépasse la taille maximale autorisée de ${MAX_DOCUMENT_SIZE / (1024 * 1024)}MB`,
                );
            }

            const isPdf = file.mimetype === 'application/pdf';

            // Pour les images, validation rapide des magic bytes
            if (!isPdf) {
                const validation = await this.imageValidator.validateImage(
                    buffer,
                    MAX_DOCUMENT_SIZE,
                );
                if (!validation.isValid) {
                    throw new BadRequestException(validation.error);
                }
            }

            // Obtenir l'artisan ID
            const artisanId = await this.certificationsService.getArtisanIdByUserId(userId);

            // Ajouter à la queue Bull
            await this.uploadQueue.add(
                'certification-document',
                {
                    userId,
                    artisanId,
                    certificationId,
                    buffer: Array.from(buffer),
                    originalName: file.originalname,
                    isPdf,
                    type: 'certification',
                },
                {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    removeOnComplete: true,
                },
            );
        } finally {
            // Nettoyer le fichier temporaire
            if (file.path) {
                await fs.unlink(file.path).catch(() => {});
            }
        }
    }
}
