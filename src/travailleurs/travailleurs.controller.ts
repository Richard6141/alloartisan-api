import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TravailleursService } from './travailleurs.service';
import {
    CreateProfilTravailleurDto,
    UpdateProfilTravailleurDto,
    SearchTravailleurDto,
    CreateEngagementDto,
    CreateAvisTravailDto,
} from './dto';
import { AtGuard } from 'src/common/guards';
import { GetCurrentUser } from 'src/common/decorators';

@ApiTags("Main-d'oeuvre")
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('travailleurs')
export class TravailleursController {
    constructor(private readonly service: TravailleursService) {}

    // ─── Mon profil travailleur ─────────────────────────────────────────────

    @ApiOperation({ summary: 'Activer/creer mon profil travailleur' })
    @Post()
    creer(@GetCurrentUser('sub') userId: string, @Body() dto: CreateProfilTravailleurDto) {
        return this.service.upsertMonProfil(userId, dto);
    }

    @ApiOperation({ summary: 'Mon profil travailleur' })
    @Get('me')
    monProfil(@GetCurrentUser('sub') userId: string) {
        return this.service.getMonProfil(userId);
    }

    @ApiOperation({ summary: 'Modifier mon profil travailleur' })
    @Patch('me')
    modifier(@GetCurrentUser('sub') userId: string, @Body() dto: UpdateProfilTravailleurDto) {
        return this.service.upsertMonProfil(userId, dto);
    }

    // ─── Embauche + avis (routes specifiques AVANT :id) ─────────────────────

    @ApiOperation({ summary: 'Embaucher un travailleur' })
    @Post('engagements')
    embaucher(@GetCurrentUser('sub') userId: string, @Body() dto: CreateEngagementDto) {
        return this.service.embaucher(userId, dto);
    }

    @ApiOperation({ summary: 'Terminer une mission' })
    @Patch('engagements/:id/terminer')
    terminer(@GetCurrentUser('sub') userId: string, @Param('id') id: string) {
        return this.service.terminer(userId, id);
    }

    @ApiOperation({ summary: 'Deposer un avis (mutuel)' })
    @Post('engagements/:id/avis')
    avis(
        @GetCurrentUser('sub') userId: string,
        @Param('id') id: string,
        @Body() dto: CreateAvisTravailDto,
    ) {
        return this.service.deposerAvis(userId, id, dto);
    }

    @ApiOperation({ summary: 'Mes engagements (patron ou ouvrier)' })
    @Get('engagements/mes')
    mesEngagements(@GetCurrentUser('sub') userId: string) {
        return this.service.mesEngagements(userId);
    }

    // ─── Recherche + fiche ──────────────────────────────────────────────────

    @ApiOperation({ summary: 'Rechercher des travailleurs autour de moi' })
    @Get('search')
    rechercher(@Query() dto: SearchTravailleurDto) {
        return this.service.search(dto);
    }

    @ApiOperation({ summary: "Fiche d'un travailleur" })
    @Get(':id')
    fiche(@Param('id') id: string) {
        return this.service.getFiche(id);
    }
}
