import {
    Controller,
    Post,
    Get,
    Patch,
    Param,
    Body,
    UseGuards,
    ParseUUIDPipe,
    ParseIntPipe,
    Query,
    DefaultValuePipe,
    ParseBoolPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { AvisService } from './avis.service';
import { CreateAvisDto, RespondAvisDto, ReportAvisDto } from './dto';
import { AtGuard, RolesGuard } from 'src/common/guards';
import { AdminPermGuard, RequirePerm } from 'src/admin/rbac.guard';
import { Roles, GetCurrentUser } from 'src/common/decorators';
import { Role } from 'src/generated/prisma';

@ApiTags('Avis & Notations')
@ApiBearerAuth('access-token')
@UseGuards(AtGuard)
@Controller('avis')
export class AvisController {
    constructor(private readonly avisService: AvisService) {}

    // ------------------------------------------------------------------
    // POST /avis — Créer un avis (CLIENT uniquement)
    // ------------------------------------------------------------------

    @ApiOperation({
        summary: 'Laisser un avis sur une intervention terminée',
        description:
            'Disponible uniquement sur un booking TERMINEE, dans les 14 jours suivant la fin. ' +
            'Un seul avis par booking.',
    })
    @ApiResponse({ status: 201, description: 'Avis créé avec succès' })
    @ApiResponse({ status: 400, description: 'Booking non éligible ou délai dépassé' })
    @ApiResponse({ status: 409, description: 'Avis déjà existant pour ce booking' })
    @Roles(Role.CLIENT)
    @UseGuards(RolesGuard)
    @Post()
    async create(@GetCurrentUser('sub') clientId: string, @Body() dto: CreateAvisDto) {
        return this.avisService.create(clientId, dto);
    }

    // ------------------------------------------------------------------
    // GET /avis/artisan/:artisanId — Avis d'un artisan (public/authentifié)
    // ------------------------------------------------------------------

    @ApiOperation({
        summary: "Obtenir les avis d'un artisan",
        description: 'Retourne uniquement les avis visibles, avec les statistiques de notation.',
    })
    @ApiParam({ name: 'artisanId', description: "UUID de l'artisan" })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Liste des avis et statistiques' })
    @Get('artisan/:artisanId')
    async findByArtisan(
        @Param('artisanId', ParseUUIDPipe) artisanId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ) {
        return this.avisService.findByArtisan(artisanId, page, limit);
    }

    // ------------------------------------------------------------------
    // GET /avis/my — Mes avis donnés (CLIENT)
    // ------------------------------------------------------------------

    @ApiOperation({ summary: 'Mes avis donnés' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @Get('my')
    async findMine(
        @GetCurrentUser('sub') clientId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ) {
        return this.avisService.findMine(clientId, page, limit);
    }

    // ------------------------------------------------------------------
    // PATCH /avis/:id/response — Réponse artisan
    // ------------------------------------------------------------------

    @ApiOperation({
        summary: 'Répondre à un avis (ARTISAN)',
        description: "L'artisan peut répondre une seule fois à chaque avis.",
    })
    @ApiParam({ name: 'id', description: "UUID de l'avis" })
    @ApiResponse({ status: 200, description: 'Réponse ajoutée' })
    @ApiResponse({ status: 409, description: 'Déjà répondu' })
    @Roles(Role.ARTISAN)
    @UseGuards(RolesGuard)
    @Patch(':id/response')
    async respondToAvis(
        @Param('id', ParseUUIDPipe) avisId: string,
        @GetCurrentUser('sub') artisanUserId: string,
        @Body() dto: RespondAvisDto,
    ) {
        return this.avisService.respondToAvis(avisId, artisanUserId, dto);
    }

    // ------------------------------------------------------------------
    // POST /avis/:id/report — Signaler un avis
    // ------------------------------------------------------------------

    @ApiOperation({ summary: 'Signaler un avis inapproprié' })
    @ApiParam({ name: 'id', description: "UUID de l'avis à signaler" })
    @ApiResponse({ status: 200, description: 'Avis signalé' })
    @Post(':id/report')
    async reportAvis(
        @Param('id', ParseUUIDPipe) avisId: string,
        @GetCurrentUser('sub') userId: string,
        @Body() dto: ReportAvisDto,
    ) {
        await this.avisService.reportAvis(avisId, userId, dto);
        return { message: 'Avis signalé avec succès. Notre équipe va examiner ce signalement.' };
    }

    // ------------------------------------------------------------------
    // PATCH /avis/:id/moderate — Modérer un avis [ADMIN]
    // ------------------------------------------------------------------

    @ApiOperation({
        summary: '[ADMIN] Modérer un avis (masquer ou réactiver)',
    })
    @ApiParam({ name: 'id', description: "UUID de l'avis" })
    @ApiQuery({
        name: 'visible',
        type: Boolean,
        description: 'true = visible, false = masqué',
    })
    @ApiResponse({ status: 200, description: 'Avis modéré' })
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard, AdminPermGuard)
    @RequirePerm('avis', 'write')
    @Patch(':id/moderate')
    async moderateAvis(
        @Param('id', ParseUUIDPipe) avisId: string,
        @Query('visible', new DefaultValuePipe(true), ParseBoolPipe) visible: boolean,
    ) {
        return this.avisService.moderateAvis(avisId, visible);
    }
}
