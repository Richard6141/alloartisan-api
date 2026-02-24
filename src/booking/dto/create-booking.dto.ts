import {
    IsString,
    IsEnum,
    IsOptional,
    IsNumber,
    IsBoolean,
    IsDateString,
    Min,
    Max,
    MaxLength,
    MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TypeBooking } from 'src/generated/prisma';

export class CreateBookingDto {
    @ApiProperty({
        description: "Identifiant de l'artisan",
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsString()
    artisanId: string;

    @ApiProperty({
        description: 'Identifiant du métier souhaité',
        example: '550e8400-e29b-41d4-a716-446655440001',
    })
    @IsString()
    metierId: string;

    @ApiProperty({
        description: 'Titre court de la demande',
        example: 'Réparation fuite robinet cuisine',
        maxLength: 200,
    })
    @IsString()
    @MinLength(5)
    @MaxLength(200)
    titre: string;

    @ApiProperty({
        description: 'Description détaillée des travaux à réaliser',
        example: 'Fuite sous le robinet de la cuisine, nécessite remplacement du joint',
    })
    @IsString()
    @MinLength(20)
    @MaxLength(2000)
    description: string;

    @ApiProperty({
        description: "Adresse d'intervention",
        example: '12 Rue du Commerce, Cotonou, Bénin',
    })
    @IsString()
    @MinLength(5)
    adresseIntervention: string;

    @ApiPropertyOptional({
        description: "Latitude de l'adresse d'intervention",
        example: 6.3696,
    })
    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    @Type(() => Number)
    latitudeIntervention?: number;

    @ApiPropertyOptional({
        description: "Longitude de l'adresse d'intervention",
        example: 2.3912,
    })
    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    @Type(() => Number)
    longitudeIntervention?: number;

    @ApiPropertyOptional({
        description: "Date préférée pour l'intervention (ISO 8601)",
        example: '2026-03-01T10:00:00Z',
    })
    @IsOptional()
    @IsDateString()
    datePreferee?: string;

    @ApiPropertyOptional({
        description: 'Budget maximum du client en FCFA',
        example: 15000,
        minimum: 0,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    budgetClient?: number;

    @ApiPropertyOptional({
        description: 'Type de réservation',
        enum: TypeBooking,
        default: TypeBooking.STANDARD,
    })
    @IsOptional()
    @IsEnum(TypeBooking)
    type?: TypeBooking;

    @ApiPropertyOptional({
        description: 'Demande urgente (délai gestion réduit à 2h)',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    estUrgent?: boolean;

    @ApiPropertyOptional({
        description: 'Durée estimée en heures',
        example: 2.5,
    })
    @IsOptional()
    @IsNumber()
    @Min(0.5)
    @Max(240)
    @Type(() => Number)
    dureeEstimeeHeures?: number;
}
