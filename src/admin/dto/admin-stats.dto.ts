import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// ─── Pagination commune ────────────────────────────────────────────────────

export class PaginationDto {
    @ApiPropertyOptional({ description: 'Numéro de page (départ 1)', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Éléments par page (max 100)', default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiPropertyOptional({ description: 'Recherche textuelle' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Champ de tri (whitelisté par endpoint)' })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ description: 'Sens du tri', enum: ['asc', 'desc'] })
    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortDir?: 'asc' | 'desc';
}

// ─── Filtre utilisateurs ────────────────────────────────────────────────────

export class AdminUsersFilterDto extends PaginationDto {
    @ApiPropertyOptional({
        description: 'Filtrer par rôle',
        enum: ['CLIENT', 'ARTISAN', 'ADMIN'],
    })
    @IsOptional()
    @IsEnum(['CLIENT', 'ARTISAN', 'ADMIN'])
    role?: 'CLIENT' | 'ARTISAN' | 'ADMIN';
}

// ─── Filtre transactions ────────────────────────────────────────────────────

export class AdminTransactionsFilterDto extends PaginationDto {
    @ApiPropertyOptional({
        description: 'Filtrer par statut',
        enum: ['EN_ATTENTE', 'COMPLETEE', 'ECHOUEE', 'REMBOURSEE'],
    })
    @IsOptional()
    @IsEnum(['EN_ATTENTE', 'COMPLETEE', 'ECHOUEE', 'REMBOURSEE'])
    statut?: 'EN_ATTENTE' | 'COMPLETEE' | 'ECHOUEE' | 'REMBOURSEE';

    @ApiPropertyOptional({ description: 'Date de début (ISO 8601)' })
    @IsOptional()
    @IsString()
    dateDebut?: string;

    @ApiPropertyOptional({ description: 'Date de fin (ISO 8601)' })
    @IsOptional()
    @IsString()
    dateFin?: string;
}

// ─── Filtre logs d'audit ─────────────────────────────────────────────────────

export class AdminLogsFilterDto extends PaginationDto {
    @ApiPropertyOptional({ description: 'Filtrer par userId' })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiPropertyOptional({ description: "Filtrer par type d'action (ex: LOGIN, CREATE_BOOKING)" })
    @IsOptional()
    @IsString()
    action?: string;

    @ApiPropertyOptional({ description: 'Filtrer par entité (ex: booking, artisan)' })
    @IsOptional()
    @IsString()
    entite?: string;

    @ApiPropertyOptional({ description: 'Date de début (ISO 8601)' })
    @IsOptional()
    @IsString()
    dateDebut?: string;

    @ApiPropertyOptional({ description: 'Date de fin (ISO 8601)' })
    @IsOptional()
    @IsString()
    dateFin?: string;
}

// ─── Broadcast notification ─────────────────────────────────────────────────

export class BroadcastNotificationDto {
    @ApiPropertyOptional({ description: 'Titre de la notification' })
    @IsString()
    titre: string;

    @ApiPropertyOptional({ description: 'Corps du message' })
    @IsString()
    corps: string;

    @ApiPropertyOptional({ description: 'Cibler un segment', enum: ['ALL', 'CLIENT', 'ARTISAN'] })
    @IsOptional()
    @IsEnum(['ALL', 'CLIENT', 'ARTISAN'])
    segment?: 'ALL' | 'CLIENT' | 'ARTISAN' = 'ALL';
}
