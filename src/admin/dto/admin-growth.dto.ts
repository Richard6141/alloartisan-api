import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * Filtre générique paginé pour les modules « croissance & terrain »
 * (ambassadeurs, main-d'œuvre, demandes express).
 */
export class AdminGrowthFilterDto {
    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;

    @ApiPropertyOptional({ description: 'Filtrer par statut' })
    @IsOptional()
    @IsString()
    statut?: string;

    @ApiPropertyOptional({ description: 'Filtrer par type (OUVRIER/AIDE, urgent…)' })
    @IsOptional()
    @IsString()
    type?: string;

    @ApiPropertyOptional({ description: 'Recherche textuelle' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Champ de tri' })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ description: 'Sens du tri', enum: ['asc', 'desc'] })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortDir?: 'asc' | 'desc';

    @ApiPropertyOptional({ description: 'Date de début (ISO 8601)' })
    @IsOptional()
    @IsString()
    dateDebut?: string;

    @ApiPropertyOptional({ description: 'Date de fin (ISO 8601)' })
    @IsOptional()
    @IsString()
    dateFin?: string;
}
