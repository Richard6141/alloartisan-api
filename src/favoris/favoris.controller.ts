import {
    Controller,
    Post,
    Delete,
    Get,
    Param,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FavorisService } from './favoris.service';
import { GetCurrentUser, Roles } from 'src/common/decorators';
import { Role } from 'src/generated/prisma';

@ApiTags('Favoris')
@ApiBearerAuth('access-token')
@Controller('favoris')
@Roles(Role.CLIENT)
export class FavorisController {
    constructor(private readonly favorisService: FavorisService) {}

    @Post(':artisanId')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Ajouter un artisan aux favoris' })
    @ApiParam({ name: 'artisanId', description: "UUID de l'artisan" })
    @ApiResponse({ status: 201, description: 'Artisan ajouté aux favoris' })
    @ApiResponse({ status: 409, description: 'Artisan déjà dans les favoris' })
    async addFavori(
        @GetCurrentUser('sub') clientId: string,
        @Param('artisanId', ParseUUIDPipe) artisanId: string,
    ) {
        return this.favorisService.addFavori(clientId, artisanId);
    }

    @Delete(':artisanId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retirer un artisan des favoris' })
    @ApiParam({ name: 'artisanId', description: "UUID de l'artisan" })
    @ApiResponse({ status: 200, description: 'Artisan retiré des favoris' })
    @ApiResponse({ status: 404, description: 'Artisan pas dans les favoris' })
    async removeFavori(
        @GetCurrentUser('sub') clientId: string,
        @Param('artisanId', ParseUUIDPipe) artisanId: string,
    ) {
        return this.favorisService.removeFavori(clientId, artisanId);
    }

    @Get()
    @ApiOperation({ summary: 'Mes artisans favoris' })
    @ApiResponse({ status: 200, description: 'Liste des artisans favoris avec profils complets' })
    async getMyFavoris(@GetCurrentUser('sub') clientId: string) {
        return this.favorisService.getMyFavoris(clientId);
    }

    @Get(':artisanId/check')
    @ApiOperation({ summary: 'Vérifier si un artisan est en favori' })
    @ApiParam({ name: 'artisanId', description: "UUID de l'artisan" })
    @ApiResponse({ status: 200, description: 'Statut favori' })
    async checkFavori(
        @GetCurrentUser('sub') clientId: string,
        @Param('artisanId', ParseUUIDPipe) artisanId: string,
    ) {
        return this.favorisService.isFavori(clientId, artisanId);
    }
}
