import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    Min,
    Max,
    ArrayMaxSize,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TypeTravailleurDto {
    OUVRIER = 'OUVRIER',
    AIDE = 'AIDE',
}
export enum DisponibiliteDto {
    PONCTUEL = 'PONCTUEL',
    REGULIER = 'REGULIER',
}

export class MetierRefDto {
    @ApiProperty()
    @IsUUID()
    metierId!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    estPrincipal?: boolean;
}

export class CreateProfilTravailleurDto {
    @ApiProperty({ enum: TypeTravailleurDto })
    @IsEnum(TypeTravailleurDto)
    type!: TypeTravailleurDto;

    @ApiPropertyOptional({ description: 'AIDE polyvalent (tous chantiers)' })
    @IsOptional()
    @IsBoolean()
    polyvalent?: boolean;

    @ApiPropertyOptional({ maxLength: 500 })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(60)
    anneesExperience?: number;

    @ApiProperty()
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude!: number;

    @ApiProperty()
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude!: number;

    @ApiProperty({ maxLength: 80 })
    @IsString()
    @MaxLength(80)
    villePrincipale!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    zoneInterventionKm?: number;

    @ApiProperty({ enum: DisponibiliteDto })
    @IsEnum(DisponibiliteDto)
    disponibilite!: DisponibiliteDto;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    disponibleMaintenant?: boolean;

    @ApiPropertyOptional({ description: 'Tarif journalier indicatif (FCFA)' })
    @IsOptional()
    @IsInt()
    @Min(0)
    tarifJournalier?: number;

    @ApiPropertyOptional({ description: 'Max 2 metiers/domaines', type: [MetierRefDto] })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(2)
    @ValidateNested({ each: true })
    @Type(() => MetierRefDto)
    metiers?: MetierRefDto[];

    @ApiPropertyOptional({ description: 'Profil visible des patrons', default: true })
    @IsOptional()
    @IsBoolean()
    actif?: boolean;
}
