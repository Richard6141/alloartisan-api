import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Suggestion de métier par un artisan dont le métier n'est pas encore
 * répertorié. Crée un métier en attente de validation (valide=false) :
 * invisible côté client, mais l'artisan peut immédiatement s'y rattacher.
 */
export class SuggestMetierDto {
    @ApiProperty({
        description: 'Nom du métier proposé',
        example: 'Poseur de panneaux solaires',
        minLength: 2,
        maxLength: 100,
    })
    @IsString()
    @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
    @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
    nom: string;

    @ApiProperty({
        description: 'Catégorie la plus proche pour ce métier',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID('4', { message: "L'ID de la catégorie doit être un UUID valide" })
    categorieId: string;
}
