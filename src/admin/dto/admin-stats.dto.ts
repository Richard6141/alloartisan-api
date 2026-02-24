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
