import {
    IsString,
    IsOptional,
    IsInt,
    IsBoolean,
    IsUUID,
    MaxLength,
    Min,
    IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMetierDto {
    @ApiProperty({
        description: 'Nom du métier',
        example: 'Plombier',
        maxLength: 100,
    })
    @IsString()
    @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
    nom: string;

    @ApiProperty({
        description: 'Slug unique pour les URLs',
        example: 'plombier',
        maxLength: 100,
    })
    @IsString()
    @MaxLength(100, { message: 'Le slug ne peut pas dépasser 100 caractères' })
    slug: string;

    @ApiProperty({
        description: 'ID de la catégorie de métier',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID('4', { message: "L'ID de la catégorie doit être un UUID valide" })
    categorieId: string;

    @ApiPropertyOptional({
        description: 'Description du métier',
        example: 'Installation et réparation de systèmes de plomberie',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: "URL de l'icône du métier",
        example: 'https://example.com/icons/plombier.svg',
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
        description: 'Métier populaire/mis en avant',
        example: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    populaire?: boolean;

    @ApiPropertyOptional({
        description: 'Métier actif ou non',
        example: true,
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    actif?: boolean;

    @ApiPropertyOptional({
        description: 'Métier validé (false = suggéré, en attente de validation admin)',
        example: true,
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    valide?: boolean;
}
