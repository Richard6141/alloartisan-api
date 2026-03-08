import { Controller, Get, Param, Query, ParseUUIDPipe, ParseFloatPipe } from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { GeolocationService } from './geolocation.service';
import { SearchNearbyDto } from './dto/search-nearby.dto';
import { Public } from 'src/common/decorators';

@ApiTags('Géolocalisation')
@ApiBearerAuth('access-token')
@Controller('geolocation')
export class GeolocationController {
    constructor(private readonly geolocationService: GeolocationService) {}

    /**
     * Rechercher les artisans dans un rayon géographique.
     * Endpoint public pour permettre la recherche sans compte.
     */
    @Get('artisans/nearby')
    @Public()
    @ApiOperation({
        summary: 'Rechercher les artisans à proximité (PostGIS)',
        description:
            'Retourne les artisans actifs triés par distance. La priorité est donnée aux abonnés Premium puis Standard.',
    })
    @ApiQuery({ name: 'lat', required: true, description: 'Latitude GPS', example: 6.3703 })
    @ApiQuery({ name: 'lng', required: true, description: 'Longitude GPS', example: 2.3912 })
    @ApiQuery({
        name: 'radius',
        required: false,
        description: 'Rayon en km (défaut: 25)',
        example: 25,
    })
    @ApiQuery({ name: 'metierId', required: false, description: 'Filtrer par métier (UUID)' })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Max résultats (défaut: 20)',
        example: 20,
    })
    @ApiResponse({ status: 200, description: 'Liste des artisans à proximité avec distances' })
    @ApiResponse({ status: 400, description: 'Paramètres géographiques invalides' })
    async findNearby(@Query() dto: SearchNearbyDto) {
        return this.geolocationService.findNearbyArtisans(dto);
    }

    /**
     * Calculer la distance entre un utilisateur et un artisan.
     */
    @Get('artisans/:id/distance')
    @ApiOperation({
        summary: "Distance entre l'utilisateur et un artisan",
        description: 'Calcule la distance en km et le temps de trajet estimé.',
    })
    @ApiParam({ name: 'id', description: "UUID de l'artisan" })
    @ApiQuery({ name: 'lat', required: true, description: 'Latitude du client', example: 6.3703 })
    @ApiQuery({ name: 'lng', required: true, description: 'Longitude du client', example: 2.3912 })
    @ApiResponse({ status: 200, description: 'Distance calculée' })
    @ApiResponse({ status: 404, description: 'Artisan non trouvé' })
    async getDistance(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('lat', ParseFloatPipe) lat: number,
        @Query('lng', ParseFloatPipe) lng: number,
    ) {
        return this.geolocationService.getArtisanDistance(id, lat, lng);
    }
}
