import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutArtisan } from 'src/generated/prisma';

export class VerifyArtisanDto {
    // Pas de champs requis, l'admin qui vérifie est récupéré du token
}

export class UpdateArtisanStatutDto {
    @ApiProperty({
        description: "Nouveau statut de l'artisan",
        enum: StatutArtisan,
        example: 'ACTIF',
    })
    @IsEnum(StatutArtisan, { message: 'Statut invalide' })
    statut: StatutArtisan;

    @ApiPropertyOptional({
        description: 'Raison de la suspension (requis si statut = SUSPENDU)',
        example: 'Non-respect des conditions générales',
    })
    @IsOptional()
    @IsString()
    raisonSuspension?: string;
}

export class RejectArtisanDto {
    @ApiProperty({
        description: 'Raison du rejet',
        example: 'Documents incomplets ou invalides',
    })
    @IsString()
    raison: string;
}
