import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RaisonSignalement {
    CONTENU_INAPPROPRIE = 'CONTENU_INAPPROPRIE',
    FAUX_AVIS = 'FAUX_AVIS',
    HARCÈLEMENT = 'HARCELEMENT',
    AUTRE = 'AUTRE',
}

export class ReportAvisDto {
    @ApiProperty({
        description: 'Raison du signalement',
        enum: RaisonSignalement,
    })
    @IsEnum(RaisonSignalement)
    @IsNotEmpty()
    raison: RaisonSignalement;

    @ApiPropertyOptional({
        description: 'Précision supplémentaire',
        maxLength: 500,
    })
    @IsString()
    @MaxLength(500)
    @IsOptional()
    details?: string;
}
