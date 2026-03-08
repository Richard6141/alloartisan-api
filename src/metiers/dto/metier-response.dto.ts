import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MetierResponseDto {
    @ApiProperty({
        description: 'Identifiant unique',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'Nom du métier',
        example: 'Plombier',
    })
    nom: string;

    @ApiProperty({
        description: 'Slug pour les URLs',
        example: 'plombier',
    })
    slug: string;

    @ApiPropertyOptional({
        description: 'Description du métier',
        example: 'Installation et réparation de systèmes de plomberie',
    })
    description: string | null;

    @ApiPropertyOptional({
        description: "URL de l'icône",
        example: 'https://example.com/icons/plombier.svg',
    })
    iconUrl: string | null;

    @ApiProperty({
        description: 'ID de la catégorie',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    categorieId: string;

    @ApiProperty({
        description: "Ordre d'affichage",
        example: 1,
    })
    ordreAffichage: number;

    @ApiProperty({
        description: 'Métier populaire',
        example: true,
    })
    populaire: boolean;

    @ApiProperty({
        description: 'Métier actif',
        example: true,
    })
    actif: boolean;

    @ApiProperty({
        description: 'Date de création',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;
}

class CategorieMinimalDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'Bâtiment' })
    nom: string;

    @ApiProperty({ example: 'batiment' })
    slug: string;
}

export class MetierWithCategorieResponseDto extends MetierResponseDto {
    @ApiProperty({
        description: 'Catégorie du métier',
        type: CategorieMinimalDto,
    })
    categorie: CategorieMinimalDto;

    @ApiPropertyOptional({
        description: "Nombre d'artisans exerçant ce métier",
        example: 25,
    })
    _count?: {
        artisanMetiers: number;
    };
}
