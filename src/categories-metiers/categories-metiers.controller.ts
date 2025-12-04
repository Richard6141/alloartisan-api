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
import { CategoriesMetiersService } from './categories-metiers.service';
import {
    CreateCategorieMetierDto,
    UpdateCategorieMetierDto,
    CategorieMetierResponseDto,
    CategorieMetierWithMetiersResponseDto,
} from './dto';
import { Public } from 'src/common/decorators';

@ApiTags('Catégories de métiers')
@Controller('categories-metiers')
export class CategoriesMetiersController {
    constructor(private readonly categoriesMetiersService: CategoriesMetiersService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Créer une catégorie de métier',
        description: 'Crée une nouvelle catégorie de métier. Réservé aux administrateurs.',
    })
    @ApiResponse({
        status: 201,
        description: 'Catégorie créée avec succès',
        type: CategorieMetierResponseDto,
    })
    @ApiConflictResponse({
        description: 'Une catégorie avec ce nom ou slug existe déjà',
    })
    create(@Body() dto: CreateCategorieMetierDto): Promise<CategorieMetierResponseDto> {
        return this.categoriesMetiersService.create(dto);
    }

    @Get()
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Lister toutes les catégories',
        description:
            'Récupère la liste de toutes les catégories de métiers avec le nombre de métiers.',
    })
    @ApiQuery({
        name: 'includeInactive',
        required: false,
        type: Boolean,
        description: 'Inclure les catégories inactives (admin uniquement)',
    })
    @ApiResponse({
        status: 200,
        description: 'Liste des catégories',
        type: [CategorieMetierWithMetiersResponseDto],
    })
    findAll(
        @Query('includeInactive') includeInactive?: string,
    ): Promise<CategorieMetierWithMetiersResponseDto[]> {
        return this.categoriesMetiersService.findAll(includeInactive === 'true');
    }

    @Get(':id')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Récupérer une catégorie par ID',
        description: "Récupère les détails d'une catégorie de métier.",
    })
    @ApiParam({
        name: 'id',
        description: 'Identifiant UUID de la catégorie',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @ApiResponse({
        status: 200,
        description: 'Détails de la catégorie',
        type: CategorieMetierWithMetiersResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Catégorie non trouvée',
    })
    findOne(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<CategorieMetierWithMetiersResponseDto> {
        return this.categoriesMetiersService.findOne(id);
    }

    @Get('slug/:slug')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Récupérer une catégorie par slug',
        description: "Récupère les détails d'une catégorie de métier via son slug.",
    })
    @ApiParam({
        name: 'slug',
        description: 'Slug de la catégorie',
        example: 'batiment',
    })
    @ApiResponse({
        status: 200,
        description: 'Détails de la catégorie',
        type: CategorieMetierWithMetiersResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Catégorie non trouvée',
    })
    findBySlug(@Param('slug') slug: string): Promise<CategorieMetierWithMetiersResponseDto> {
        return this.categoriesMetiersService.findBySlug(slug);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Modifier une catégorie',
        description: 'Met à jour une catégorie de métier. Réservé aux administrateurs.',
    })
    @ApiParam({
        name: 'id',
        description: 'Identifiant UUID de la catégorie',
    })
    @ApiResponse({
        status: 200,
        description: 'Catégorie mise à jour',
        type: CategorieMetierResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Catégorie non trouvée',
    })
    @ApiConflictResponse({
        description: 'Une catégorie avec ce nom ou slug existe déjà',
    })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateCategorieMetierDto,
    ): Promise<CategorieMetierResponseDto> {
        return this.categoriesMetiersService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Supprimer une catégorie',
        description:
            'Supprime une catégorie de métier. Impossible si elle contient des métiers. Réservé aux administrateurs.',
    })
    @ApiParam({
        name: 'id',
        description: 'Identifiant UUID de la catégorie',
    })
    @ApiResponse({
        status: 200,
        description: 'Catégorie supprimée',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Catégorie supprimée avec succès' },
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Catégorie non trouvée',
    })
    @ApiBadRequestResponse({
        description: 'Impossible de supprimer, la catégorie contient des métiers',
    })
    remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        return this.categoriesMetiersService.remove(id);
    }
}
