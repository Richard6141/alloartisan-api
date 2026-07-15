import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnnoncesService } from './annonces.service';
import { CreateAnnonceDto, SearchAnnonceDto, ManifesterInteretDto } from './dto';
import { AtGuard } from 'src/common/guards';
import { GetCurrentUser } from 'src/common/decorators';

@ApiTags("Main-d'oeuvre — annonces")
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('annonces')
export class AnnoncesController {
    constructor(private readonly service: AnnoncesService) {}

    @ApiOperation({ summary: 'Publier une annonce de chantier (patron)' })
    @Post()
    creer(@GetCurrentUser('sub') userId: string, @Body() dto: CreateAnnonceDto) {
        return this.service.creerAnnonce(userId, dto);
    }

    @ApiOperation({ summary: 'Mes annonces (patron)' })
    @Get('mes')
    mesAnnonces(@GetCurrentUser('sub') userId: string) {
        return this.service.mesAnnonces(userId);
    }

    @ApiOperation({ summary: 'Annonces de chantier autour de moi (travailleur)' })
    @Get('autour')
    autour(@Query() dto: SearchAnnonceDto) {
        return this.service.annoncesAutour(dto);
    }

    @ApiOperation({ summary: 'Se manifester sur une annonce (travailleur)' })
    @Post(':id/interet')
    manifester(
        @GetCurrentUser('sub') userId: string,
        @Param('id') id: string,
        @Body() dto: ManifesterInteretDto,
    ) {
        return this.service.manifesterInteret(userId, id, dto);
    }

    @ApiOperation({ summary: "Candidats d'une annonce (patron)" })
    @Get(':id/candidats')
    candidats(@GetCurrentUser('sub') userId: string, @Param('id') id: string) {
        return this.service.candidats(userId, id);
    }

    @ApiOperation({ summary: 'Clôturer une annonce (pourvue / fermée)' })
    @Patch(':id/cloturer')
    cloturer(
        @GetCurrentUser('sub') userId: string,
        @Param('id') id: string,
        @Body() body: { statut?: 'POURVUE' | 'CLOSE' },
    ) {
        return this.service.cloturer(userId, id, body?.statut === 'CLOSE' ? 'CLOSE' : 'POURVUE');
    }
}
