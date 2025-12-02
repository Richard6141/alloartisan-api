import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategorieMetierResponseDto {
    @ApiProperty({
        description: 'Identifiant unique',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'Nom de la catégorie',
        example: 'Bâtiment',
    })
    nom: string;

    @ApiProperty({
        description: 'Slug pour les URLs',
        example: 'batiment',
    })
    slug: string;

    @ApiPropertyOptional({
        description: 'Description de la catégorie',
        example: 'Tous les métiers liés à la construction et rénovation',
    })
    description: string | null;

    @ApiPropertyOptional({
        description: "URL de l'icône",
        example: 'https://example.com/icons/batiment.svg',
    })
    iconUrl: string | null;

    @ApiProperty({
        description: "Ordre d'affichage",
        example: 1,
    })
    ordreAffichage: number;

    @ApiProperty({
        description: 'Catégorie active',
        example: true,
    })
    actif: boolean;

    @ApiProperty({
        description: 'Date de création',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;
}

export class CategorieMetierWithMetiersResponseDto extends CategorieMetierResponseDto {
    @ApiProperty({
        description: 'Nombre de métiers dans cette catégorie',
        example: 5,
    })
    _count?: {
        metiers: number;
    };
}
