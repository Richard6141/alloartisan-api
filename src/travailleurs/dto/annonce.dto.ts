import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeTravailleurDto } from './create-profil-travailleur.dto';

export enum PeriodeChantierDto {
    UNE_JOURNEE = 'UNE_JOURNEE',
    PLUSIEURS_JOURS = 'PLUSIEURS_JOURS',
    REGULIER = 'REGULIER',
}

export class CreateAnnonceDto {
    @ApiProperty({ enum: TypeTravailleurDto })
    @IsEnum(TypeTravailleurDto)
    type!: TypeTravailleurDto;

    @ApiPropertyOptional({ description: 'Métier/domaine ciblé (optionnel)' })
    @IsOptional()
    @IsUUID()
    metierId?: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(50)
    nombrePersonnes?: number;

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
    ville!: string;

    @ApiProperty({ enum: PeriodeChantierDto })
    @IsEnum(PeriodeChantierDto)
    periode!: PeriodeChantierDto;

    @ApiPropertyOptional({ description: 'Tarif journalier indicatif (FCFA)' })
    @IsOptional()
    @IsInt()
    @Min(0)
    tarifJournalier?: number;

    @ApiProperty({ maxLength: 800 })
    @IsString()
    @MaxLength(800)
    description!: string;
}

export class SearchAnnonceDto {
    @ApiPropertyOptional({ enum: TypeTravailleurDto })
    @IsOptional()
    @IsEnum(TypeTravailleurDto)
    type?: TypeTravailleurDto;

    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude!: number;

    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude!: number;

    @ApiPropertyOptional({ default: 25 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    rayonKm?: number;
}

export class ManifesterInteretDto {
    @ApiPropertyOptional({ maxLength: 300 })
    @IsOptional()
    @IsString()
    @MaxLength(300)
    message?: string;
}
