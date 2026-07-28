import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiNotFoundResponse,
    ApiConflictResponse,
    ApiBadRequestResponse,
    ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ArtisansService } from './artisans.service';
import {
    CreateArtisanDto,
    UpdateArtisanDto,
    ArtisanDetailResponseDto,
    ArtisanListResponseDto,
    ArtisanSearchResponseDto,
    SearchArtisanDto,
    UpdateArtisanMetiersDto,
    UpdateArtisanStatutDto,
    RejectArtisanDto,
} from './dto';
import { GetCurrentUserId, Public, Roles } from 'src/common/decorators';
import { RolesGuard } from 'src/common/guards';
import { AdminPermGuard, RequirePerm } from 'src/admin/rbac.guard';
import { Role } from 'src/generated/prisma';

@ApiTags('Artisans')
@Controller('artisans')
export class ArtisansController {
    constructor(private readonly artisansService: ArtisansService) {}

    // ==================== PUBLIC ROUTES ====================

    @Get()
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Rechercher des artisans',
        description: 'Recherche et filtre les artisans selon différents critères.',
    })
    @ApiResponse({
        status: 200,
        description: 'Liste des artisans',
        type: ArtisanListResponseDto,
    })
    search(@Query() dto: SearchArtisanDto): Promise<ArtisanListResponseDto> {
        return this.artisansService.search(dto);
    }

    @Get('search')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Rechercher des artisans (optimisé)',
        description:
            'Version optimisée de la recherche avec réponse allégée (40-50% moins de données). Idéal pour les listes et applications mobiles.',
    })
    @ApiResponse({
        status: 200,
        description: 'Liste des artisans (format léger)',
        type: ArtisanSearchResponseDto,
    })
    searchOptimized(@Query() dto: SearchArtisanDto): Promise<ArtisanSearchResponseDto> {
        return this.artisansService.searchOptimized(dto);
    }

    // ==================== ARTISAN ROUTES (statiques - doivent être AVANT :id) ====================

    @Post()
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Devenir artisan',
        description: "Crée un profil artisan pour l'utilisateur connecté.",
    })
    @ApiResponse({
        status: 201,
        description: 'Profil artisan créé avec succès',
        type: ArtisanDetailResponseDto,
    })
    @ApiConflictResponse({
        description: "L'utilisateur est déjà enregistré comme artisan",
    })
    @ApiBadRequestResponse({
        description: 'Données invalides (métiers inexistants, plusieurs métiers principaux, etc.)',
    })
    @ApiForbiddenResponse({
        description: 'Compte utilisateur suspendu ou banni',
    })
    create(
        @GetCurrentUserId() userId: string,
        @Body() dto: CreateArtisanDto,
    ): Promise<ArtisanDetailResponseDto> {
        return this.artisansService.create(userId, dto);
    }

    @Get('me')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Mon profil artisan',
        description: "Récupère le profil artisan de l'utilisateur connecté.",
    })
    @ApiResponse({
        status: 200,
        description: 'Profil artisan',
        type: ArtisanDetailResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Profil artisan non trouvé',
    })
    getMyProfile(@GetCurrentUserId() userId: string): Promise<ArtisanDetailResponseDto> {
        return this.artisansService.findByUserId(userId);
    }

    @Patch('me')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Modifier mon profil artisan',
        description: 'Met à jour les informations du profil artisan.',
    })
    @ApiResponse({
        status: 200,
        description: 'Profil mis à jour',
        type: ArtisanDetailResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Profil artisan non trouvé',
    })
    async updateMyProfile(
        @GetCurrentUserId() userId: string,
        @Body() dto: UpdateArtisanDto,
    ): Promise<ArtisanDetailResponseDto> {
        const artisan = await this.artisansService.findByUserId(userId);
        return this.artisansService.update(artisan.id, userId, dto);
    }

    @Patch('me/metiers')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Modifier mes métiers',
        description: "Met à jour la liste des métiers exercés par l'artisan.",
    })
    @ApiResponse({
        status: 200,
        description: 'Métiers mis à jour',
        type: ArtisanDetailResponseDto,
    })
    @ApiBadRequestResponse({
        description: 'Données invalides (métiers inexistants, plusieurs métiers principaux, etc.)',
    })
    async updateMyMetiers(
        @GetCurrentUserId() userId: string,
        @Body() dto: UpdateArtisanMetiersDto,
    ): Promise<ArtisanDetailResponseDto> {
        const artisan = await this.artisansService.findByUserId(userId);
        return this.artisansService.updateMetiers(artisan.id, userId, dto);
    }

    @Patch('me/disponibilite')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Basculer ma disponibilité',
        description: "Active ou désactive la disponibilité de l'artisan.",
    })
    @ApiResponse({
        status: 200,
        description: 'Disponibilité mise à jour',
        schema: {
            type: 'object',
            properties: {
                disponible: { type: 'boolean', example: true },
            },
        },
    })
    async toggleMyDisponibilite(
        @GetCurrentUserId() userId: string,
    ): Promise<{ disponible: boolean }> {
        const artisan = await this.artisansService.findByUserId(userId);
        return this.artisansService.toggleDisponibilite(artisan.id, userId);
    }

    // ==================== PUBLIC DYNAMIC ROUTES (après les routes statiques) ====================

    @Get(':id')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Récupérer un artisan',
        description: "Récupère le profil détaillé d'un artisan.",
    })
    @ApiParam({
        name: 'id',
        description: "Identifiant UUID de l'artisan",
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @ApiResponse({
        status: 200,
        description: "Profil de l'artisan",
        type: ArtisanDetailResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Artisan non trouvé',
    })
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ArtisanDetailResponseDto> {
        // Incrémenter les vues de profil
        this.artisansService.incrementVuesProfil(id).catch(() => {});
        return this.artisansService.findOne(id);
    }

    // ==================== ADMIN ROUTES ====================

    @Patch(':id/verify')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard, AdminPermGuard)
    @RequirePerm('artisans.validate')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '[Admin] Vérifier un artisan',
        description: 'Vérifie un artisan et passe son statut à ACTIF. Réservé aux administrateurs.',
    })
    @ApiParam({
        name: 'id',
        description: "Identifiant UUID de l'artisan",
    })
    @ApiResponse({
        status: 200,
        description: 'Artisan vérifié',
        type: ArtisanDetailResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Artisan non trouvé',
    })
    @ApiConflictResponse({
        description: 'Artisan déjà vérifié',
    })
    @ApiForbiddenResponse({ description: 'Accès réservé aux administrateurs' })
    verify(
        @Param('id', ParseUUIDPipe) id: string,
        @GetCurrentUserId() adminId: string,
    ): Promise<ArtisanDetailResponseDto> {
        return this.artisansService.verify(id, adminId);
    }

    @Patch(':id/reject')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard, AdminPermGuard)
    @RequirePerm('artisans.reject')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '[Admin] Rejeter un artisan',
        description: "Rejette la demande d'un artisan en attente. Réservé aux administrateurs.",
    })
    @ApiParam({
        name: 'id',
        description: "Identifiant UUID de l'artisan",
    })
    @ApiResponse({
        status: 200,
        description: 'Artisan rejeté',
        type: ArtisanDetailResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Artisan non trouvé',
    })
    @ApiBadRequestResponse({
        description: "L'artisan n'est pas en attente",
    })
    reject(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: RejectArtisanDto,
    ): Promise<ArtisanDetailResponseDto> {
        return this.artisansService.reject(id, dto.raison);
    }

    @Patch(':id/statut')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard, AdminPermGuard)
    @RequirePerm('artisans.edit')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: "[Admin] Modifier le statut d'un artisan",
        description:
            "Change le statut d'un artisan (ACTIF, SUSPENDU, etc.). Réservé aux administrateurs.",
    })
    @ApiParam({
        name: 'id',
        description: "Identifiant UUID de l'artisan",
    })
    @ApiResponse({
        status: 200,
        description: 'Statut mis à jour',
        type: ArtisanDetailResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Artisan non trouvé',
    })
    @ApiBadRequestResponse({
        description: 'Raison requise pour suspension',
    })
    updateStatut(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateArtisanStatutDto,
    ): Promise<ArtisanDetailResponseDto> {
        return this.artisansService.updateStatut(id, dto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard, AdminPermGuard)
    @RequirePerm('artisans.edit')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '[Admin] Supprimer un artisan',
        description: "Supprime (soft delete) le profil d'un artisan. Réservé aux administrateurs.",
    })
    @ApiParam({
        name: 'id',
        description: "Identifiant UUID de l'artisan",
    })
    @ApiResponse({
        status: 200,
        description: 'Artisan supprimé',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Profil artisan supprimé avec succès' },
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Artisan non trouvé',
    })
    remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        return this.artisansService.softDelete(id);
    }
}
