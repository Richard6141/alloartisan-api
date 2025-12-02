import {
    IsString,
    IsOptional,
    IsInt,
    IsBoolean,
    IsNumber,
    IsUUID,
    Min,
    Max,
    IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SortBy {
    DISTANCE = 'distance',
    NOTE = 'note',
    AVIS = 'avis',
    EXPERIENCE = 'experience',
    RECENT = 'recent',
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export class SearchArtisanDto {
    @ApiPropertyOptional({
        description: 'Recherche textuelle (nom, entreprise, bio)',
        example: 'plombier',
    })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional({
        description: 'ID du métier',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID('4')
    metierId?: string;

    @ApiPropertyOptional({
        description: 'Slug du métier',
        example: 'plombier',
    })
    @IsOptional()
    @IsString()
    metierSlug?: string;

    @ApiPropertyOptional({
        description: 'ID de la catégorie',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID('4')
    categorieId?: string;

    @ApiPropertyOptional({
        description: 'Slug de la catégorie',
        example: 'batiment',
    })
    @IsOptional()
    @IsString()
    categorieSlug?: string;

    @ApiPropertyOptional({
        description: 'Ville',
        example: 'Cotonou',
    })
    @IsOptional()
    @IsString()
    ville?: string;

    @ApiPropertyOptional({
        description: 'Latitude pour recherche géographique',
        example: 6.3654,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude?: number;

    @ApiPropertyOptional({
        description: 'Longitude pour recherche géographique',
        example: 2.4183,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude?: number;

    @ApiPropertyOptional({
        description: 'Rayon de recherche en km',
        example: 10,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    rayon?: number;

    @ApiPropertyOptional({
        description: 'Note minimale',
        example: 4,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(5)
    noteMin?: number;

    @ApiPropertyOptional({
        description: 'Artisans vérifiés uniquement',
        example: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    verifiedOnly?: boolean;

    @ApiPropertyOptional({
        description: 'Artisans disponibles uniquement',
        example: true,
        default: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    disponibleOnly?: boolean;

    @ApiPropertyOptional({
        description: 'Accepte les urgences',
        example: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    accepteUrgences?: boolean;

    @ApiPropertyOptional({
        description: 'Travaille le weekend',
        example: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    accepteWeekend?: boolean;

    @ApiPropertyOptional({
        description: 'Filtrer uniquement les artisans avec statut ACTIF',
        example: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    activeOnly?: boolean;

    @ApiPropertyOptional({
        description: 'Tri par',
        enum: SortBy,
        default: SortBy.NOTE,
    })
    @IsOptional()
    @IsEnum(SortBy)
    sortBy?: SortBy;

    @ApiPropertyOptional({
        description: 'Ordre de tri',
        enum: SortOrder,
        default: SortOrder.DESC,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder;

    @ApiPropertyOptional({
        description: 'Numéro de page',
        example: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({
        description: 'Nombre d\'éléments par page',
        example: 20,
        default: 20,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}
