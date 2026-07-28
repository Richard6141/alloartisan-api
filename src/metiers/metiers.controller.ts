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
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
    ApiNotFoundResponse,
    ApiConflictResponse,
    ApiBadRequestResponse,
} from '@nestjs/swagger';
import { MetiersService } from './metiers.service';
import {
    CreateMetierDto,
    UpdateMetierDto,
    MetierResponseDto,
    MetierWithCategorieResponseDto,
    SuggestMetierDto,
} from './dto';
import { Public, Roles } from 'src/common/decorators';
import { RolesGuard } from 'src/common/guards';
import { AdminPermGuard, RequirePerm } from 'src/admin/rbac.guard';
import { Role } from 'src/generated/prisma';

@ApiTags('Métiers')
@Controller('metiers')
export class MetiersController {
    constructor(private readonly metiersService: MetiersService) {}

    @Post()
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard, AdminPermGuard)
    @RequirePerm('metiers.manage')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Créer un métier',
        description: 'Crée un nouveau métier. Réservé aux administrateurs.',
    })
    @ApiResponse({
        status: 201,
        description: 'Métier créé avec succès',
        type: MetierResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Catégorie non trouvée',
    })
    @ApiConflictResponse({
        description: 'Un métier avec ce nom ou slug existe déjà',
    })
    create(@Body() dto: CreateMetierDto): Promise<MetierResponseDto> {
        return this.metiersService.create(dto);
    }

    @Post('suggest')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Suggérer un métier',
        description:
            "Permet à un artisan dont le métier n'est pas répertorié de le proposer. " +
            'Le métier est créé en attente de validation (invisible côté client), mais ' +
            "l'artisan peut immédiatement s'y rattacher. Un administrateur le validera.",
    })
    @ApiResponse({
        status: 201,
        description: 'Métier suggéré (en attente de validation) ou métier existant réutilisé',
        type: MetierWithCategorieResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Catégorie non trouvée',
    })
    suggest(@Body() dto: SuggestMetierDto): Promise<MetierWithCategorieResponseDto> {
        return this.metiersService.suggest(dto);
    }

    @Get()
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Lister tous les métiers',
        description: 'Récupère la liste de tous les métiers avec leur catégorie.',
    })
    @ApiQuery({
        name: 'categorieId',
        required: false,
        type: String,
        description: 'Filtrer par ID de catégorie',
    })
    @ApiQuery({
        name: 'populaire',
        required: false,
        type: Boolean,
        description: 'Filtrer les métiers populaires',
    })
    @ApiQuery({
        name: 'includeInactive',
        required: false,
        type: Boolean,
        description: 'Inclure les métiers inactifs (admin uniquement)',
    })
    @ApiResponse({
        status: 200,
        description: 'Liste des métiers',
        type: [MetierWithCategorieResponseDto],
    })
    findAll(
        @Query('categorieId') categorieId?: string,
        @Query('populaire') populaire?: string,
        @Query('includeInactive') _includeInactive?: string,
    ): Promise<MetierWithCategorieResponseDto[]> {
        return this.metiersService.findAll({
            categorieId,
            populaire: populaire !== undefined ? populaire === 'true' : undefined,
            // Route publique: ne jamais exposer les métiers inactifs.
            includeInactive: false,
        });
    }

    @Get('admin/all')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard, AdminPermGuard)
    @RequirePerm('metiers.view')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '[Admin] Lister tous les métiers',
        description: 'Inclut les métiers inactifs si demandé.',
    })
    findAllAdmin(
        @Query('categorieId') categorieId?: string,
        @Query('populaire') populaire?: string,
        @Query('includeInactive') includeInactive?: string,
    ): Promise<MetierWithCategorieResponseDto[]> {
        return this.metiersService.findAll({
            categorieId,
            populaire: populaire !== undefined ? populaire === 'true' : undefined,
            includeInactive: includeInactive === 'true',
        });
    }

    @Get('admin/pending')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard, AdminPermGuard)
    @RequirePerm('metiers.view')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '[Admin] Métiers suggérés en attente',
        description: 'Liste les métiers proposés par des artisans, à valider.',
    })
    @ApiResponse({
        status: 200,
        description: 'Liste des métiers en attente de validation',
        type: [MetierWithCategorieResponseDto],
    })
    findPending(): Promise<MetierWithCategorieResponseDto[]> {
        return this.metiersService.findPending();
    }

    @Patch(':id/valider')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard, AdminPermGuard)
    @RequirePerm('metiers.manage')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '[Admin] Valider un métier suggéré',
        description: 'Rend public un métier proposé par un artisan.',
    })
    @ApiResponse({
        status: 200,
        description: 'Métier validé',
        type: MetierResponseDto,
    })
    @ApiNotFoundResponse({ description: 'Métier non trouvé' })
    valider(@Param('id', ParseUUIDPipe) id: string): Promise<MetierResponseDto> {
        return this.metiersService.validate(id);
    }

    @Get('populaires')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Métiers populaires',
        description: 'Récupère la liste des métiers populaires.',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Nombre maximum de résultats (défaut: 10)',
    })
    @ApiResponse({
        status: 200,
        description: 'Liste des métiers populaires',
        type: [MetierWithCategorieResponseDto],
    })
    findPopulaires(
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    ): Promise<MetierWithCategorieResponseDto[]> {
        return this.metiersService.findPopulaires(limit);
    }

    @Get('categorie/:slug')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Métiers par catégorie',
        description: "Récupère tous les métiers d'une catégorie via son slug.",
    })
    @ApiParam({
        name: 'slug',
        description: 'Slug de la catégorie',
        example: 'batiment',
    })
    @ApiResponse({
        status: 200,
        description: 'Liste des métiers de la catégorie',
        type: [MetierWithCategorieResponseDto],
    })
    @ApiNotFoundResponse({
        description: 'Catégorie non trouvée',
    })
    findByCategorie(@Param('slug') slug: string): Promise<MetierWithCategorieResponseDto[]> {
        return this.metiersService.findByCategorie(slug);
    }

    @Get(':id')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Récupérer un métier par ID',
        description: "Récupère les détails d'un métier.",
    })
    @ApiParam({
        name: 'id',
        description: 'Identifiant UUID du métier',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @ApiResponse({
        status: 200,
        description: 'Détails du métier',
        type: MetierWithCategorieResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Métier non trouvé',
    })
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MetierWithCategorieResponseDto> {
        return this.metiersService.findOne(id);
    }

    @Get('slug/:slug')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Récupérer un métier par slug',
        description: "Récupère les détails d'un métier via son slug.",
    })
    @ApiParam({
        name: 'slug',
        description: 'Slug du métier',
        example: 'plombier',
    })
    @ApiResponse({
        status: 200,
        description: 'Détails du métier',
        type: MetierWithCategorieResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Métier non trouvé',
    })
    findBySlug(@Param('slug') slug: string): Promise<MetierWithCategorieResponseDto> {
        return this.metiersService.findBySlug(slug);
    }

    @Patch(':id')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard, AdminPermGuard)
    @RequirePerm('metiers.manage')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Modifier un métier',
        description: 'Met à jour un métier. Réservé aux administrateurs.',
    })
    @ApiParam({
        name: 'id',
        description: 'Identifiant UUID du métier',
    })
    @ApiResponse({
        status: 200,
        description: 'Métier mis à jour',
        type: MetierResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Métier ou catégorie non trouvé(e)',
    })
    @ApiConflictResponse({
        description: 'Un métier avec ce nom ou slug existe déjà',
    })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateMetierDto,
    ): Promise<MetierResponseDto> {
        return this.metiersService.update(id, dto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard, AdminPermGuard)
    @RequirePerm('metiers.manage')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Supprimer un métier',
        description:
            "Supprime un métier. Impossible si des artisans l'exercent. Réservé aux administrateurs.",
    })
    @ApiParam({
        name: 'id',
        description: 'Identifiant UUID du métier',
    })
    @ApiResponse({
        status: 200,
        description: 'Métier supprimé',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Métier supprimé avec succès' },
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Métier non trouvé',
    })
    @ApiBadRequestResponse({
        description: 'Impossible de supprimer, des artisans exercent ce métier',
    })
    remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        return this.metiersService.remove(id);
    }
}
