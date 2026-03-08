import { IsString, IsOptional, IsInt, IsBoolean, MaxLength, Min, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategorieMetierDto {
    @ApiProperty({
        description: 'Nom de la catégorie de métier',
        example: 'Bâtiment',
        maxLength: 100,
    })
    @IsString()
    @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
    nom: string;

    @ApiProperty({
        description: 'Slug unique pour les URLs',
        example: 'batiment',
        maxLength: 100,
    })
    @IsString()
    @MaxLength(100, { message: 'Le slug ne peut pas dépasser 100 caractères' })
    slug: string;

    @ApiPropertyOptional({
        description: 'Description de la catégorie',
        example: 'Tous les métiers liés à la construction et rénovation',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: "URL de l'icône de la catégorie",
        example: 'https://example.com/icons/batiment.svg',
    })
    @IsOptional()
    @IsString()
    @IsUrl({}, { message: "L'URL de l'icône n'est pas valide" })
    iconUrl?: string;

    @ApiPropertyOptional({
        description: "Ordre d'affichage (0 = premier)",
        example: 1,
        default: 0,
    })
    @IsOptional()
    @IsInt()
    @Min(0, { message: "L'ordre d'affichage doit être positif" })
    ordreAffichage?: number;

    @ApiPropertyOptional({
        description: 'Catégorie active ou non',
        example: true,
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    actif?: boolean;
}
