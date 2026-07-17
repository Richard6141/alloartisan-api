import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DemandesExpressService } from './demandes-express.service';
import { CreateDemandeExpressDto } from './dto/create-demande-express.dto';
import { GetCurrentUserId, GetCurrentUser } from 'src/common/decorators';
import { Role } from 'src/generated/prisma';

@ApiTags('Demandes Express')
@ApiBearerAuth('access-token')
@Controller('demandes-express')
export class DemandesExpressController {
    constructor(private readonly service: DemandesExpressService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Diffuser une demande express',
        description:
            'Le client diffuse une demande aux artisans proches disponibles du métier. Le premier qui accepte décroche.',
    })
    @ApiResponse({ status: 201, description: 'Demande diffusée' })
    create(@GetCurrentUserId() userId: string, @Body() dto: CreateDemandeExpressDto) {
        return this.service.create(userId, dto);
    }

    @Get('mes-opportunites')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '[Artisan] Mes demandes express en cours',
        description: 'Liste les demandes express actives auxquelles l’artisan a été convié.',
    })
    mesOpportunites(@GetCurrentUserId() userId: string) {
        return this.service.mesOpportunites(userId);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Suivre l’état d’une demande express',
        description: 'Le client poll l’état (en recherche / attribuée + bookingId / expirée).',
    })
    getOne(
        @Param('id', ParseUUIDPipe) id: string,
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('role') role: Role,
    ) {
        return this.service.getOne(id, userId, role === Role.ADMIN);
    }

    @Post(':id/accepter')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '[Artisan] Accepter une demande express',
        description: 'Le premier artisan qui accepte décroche : un Booking est créé.',
    })
    accepter(@Param('id', ParseUUIDPipe) id: string, @GetCurrentUserId() userId: string) {
        return this.service.accepter(id, userId);
    }

    @Post(':id/annuler')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Annuler une demande express (client)' })
    annuler(@Param('id', ParseUUIDPipe) id: string, @GetCurrentUserId() userId: string) {
        return this.service.annuler(id, userId);
    }
}
