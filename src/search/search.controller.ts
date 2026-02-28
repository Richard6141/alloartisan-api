import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from 'src/common/decorators';
import { SearchService, SearchResponse, AutocompleteSuggestion } from './search.service';
import { FullTextSearchDto, AutocompleteDto } from './dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    /**
     * GET /api/v1/search/artisans?q=plombier+cotonou&ville=Cotonou&metierSlug=plomberie&page=1&limit=20
     *
     * Recherche full-text des artisans via PostgreSQL tsvector (ts_rank).
     * - Si `q` fourni: tri par pertinence × bonus abonnement
     * - Si `q` absent: liste filtrée triée par note
     * - Cache Redis 5 min
     */
    @Public()
    @Get('artisans')
    @ApiOperation({
        summary: 'Recherche full-text artisans',
        description:
            'Recherche par pertinence PostgreSQL (tsvector/ts_rank). Supporte préfixes partiels. Résultats triés par score × abonnement, puis note.',
    })
    @ApiResponse({ status: 200, description: 'Résultats de recherche paginés' })
    async searchArtisans(@Query() dto: FullTextSearchDto): Promise<SearchResponse> {
        return this.searchService.searchArtisans(dto);
    }

    /**
     * GET /api/v1/search/autocomplete?q=plom
     *
     * Suggestions autocomplete en temps réel.
     * Retourne métiers, entreprises et villes correspondants.
     * Cache Redis 1 heure.
     */
    @Public()
    @Get('autocomplete')
    @ApiOperation({
        summary: 'Suggestions autocomplete',
        description:
            "Retourne jusqu'à 10 suggestions (métiers, entreprises, villes) pour un préfixe donné. Cache 1h.",
    })
    @ApiResponse({ status: 200, description: 'Liste de suggestions' })
    async autocomplete(@Query() dto: AutocompleteDto): Promise<AutocompleteSuggestion[]> {
        return this.searchService.autocomplete(dto.q);
    }
}
