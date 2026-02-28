import { IsOptional, IsString, MinLength, MaxLength, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FullTextSearchDto {
    @ApiPropertyOptional({
        description: 'Terme de recherche (ex: plombier cotonou)',
        example: 'plombier cotonou',
    })
    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'La recherche doit contenir au moins 2 caractères' })
    @MaxLength(100)
    q?: string;

    @ApiPropertyOptional({ description: 'Filtre par ville', example: 'Cotonou' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    ville?: string;

    @ApiPropertyOptional({ description: 'Filtre par slug de métier', example: 'plomberie' })
    @IsOptional()
    @IsString()
    metierSlug?: string;

    @ApiPropertyOptional({ description: 'Page (défaut: 1)', minimum: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Résultats par page (défaut: 20, max: 50)',
        minimum: 1,
        maximum: 50,
        default: 20,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number = 20;
}

export class AutocompleteDto {
    @ApiPropertyOptional({ description: 'Préfixe de recherche', example: 'plom' })
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    q!: string;
}
