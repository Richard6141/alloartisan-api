import {
    IsBoolean,
    IsInt,
    IsLatitude,
    IsLongitude,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Création d'une demande express (mise en relation instantanée). */
export class CreateDemandeExpressDto {
    @ApiProperty({ description: 'Métier recherché', example: '550e8400-e29b-41d4-a716-446655440000' })
    @IsUUID('4', { message: 'metierId invalide' })
    metierId: string;

    @ApiProperty({ description: 'Titre de la demande', example: 'Fuite sous l’évier' })
    @IsString()
    @MinLength(3, { message: 'Le titre est trop court' })
    @MaxLength(200)
    titre: string;

    @ApiProperty({ description: 'Description du besoin' })
    @IsString()
    @MinLength(5, { message: 'Décrivez un peu plus votre besoin' })
    @MaxLength(2000)
    description: string;

    @ApiProperty({ description: "Adresse de l'intervention", example: 'Cotonou, Akpakpa' })
    @IsString()
    @MinLength(3)
    @MaxLength(300)
    adresseIntervention: string;

    @ApiProperty({ example: 6.3703 })
    @IsLatitude({ message: 'Latitude invalide' })
    latitude: number;

    @ApiProperty({ example: 2.3912 })
    @IsLongitude({ message: 'Longitude invalide' })
    longitude: number;

    @ApiPropertyOptional({ description: 'Intervention urgente', default: false })
    @IsOptional()
    @IsBoolean()
    estUrgent?: boolean;

    @ApiPropertyOptional({ description: 'Rayon de diffusion (km)', default: 10, minimum: 1, maximum: 50 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(50)
    rayonKm?: number;
}
