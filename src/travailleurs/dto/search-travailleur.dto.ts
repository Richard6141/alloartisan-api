import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TypeTravailleurDto, DisponibiliteDto } from './create-profil-travailleur.dto';

export class SearchTravailleurDto {
    @ApiPropertyOptional({ enum: TypeTravailleurDto })
    @IsOptional()
    @IsEnum(TypeTravailleurDto)
    type?: TypeTravailleurDto;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    metierId?: string;

    @ApiPropertyOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude!: number;

    @ApiPropertyOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude!: number;

    @ApiPropertyOptional({ default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    rayonKm?: number;

    @ApiPropertyOptional({ enum: DisponibiliteDto })
    @IsOptional()
    @IsEnum(DisponibiliteDto)
    disponibilite?: DisponibiliteDto;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    disponibleMaintenant?: boolean;
}
