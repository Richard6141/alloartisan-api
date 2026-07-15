import {
    IsString,
    IsOptional,
    IsUrl,
    MaxLength,
    IsDateString,
    Matches,
    Length,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
    @ApiPropertyOptional({
        description: 'Nom de famille',
        example: 'Dupont',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
    nom?: string;

    @ApiPropertyOptional({
        description: 'Prénom',
        example: 'Jean',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Le prénom ne peut pas dépasser 100 caractères' })
    prenom?: string;

    @ApiPropertyOptional({
        description: 'Numéro de téléphone',
        example: '+229 97 00 00 00',
        minLength: 8,
        maxLength: 20,
    })
    @IsOptional()
    @IsString()
    @Length(8, 20, { message: 'Le numéro de téléphone doit contenir entre 8 et 20 caractères' })
    @Matches(/^[\d\s\-+()]+$/, { message: 'Format de numéro de téléphone invalide' })
    telephone?: string;

    @ApiPropertyOptional({
        description: 'Date de naissance (format ISO 8601)',
        example: '1990-05-15',
        format: 'date',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Format de date invalide' })
    dateNaissance?: string;

    @ApiPropertyOptional({
        description: 'Sexe (M = Masculin, F = Féminin, O = Autre)',
        example: 'M',
        enum: ['M', 'F', 'O'],
    })
    @IsOptional()
    @IsString()
    @Matches(/^[MFO]$/, { message: 'Le sexe doit être M, F ou O' })
    sexe?: string;

    @ApiPropertyOptional({
        description: 'Ville de résidence',
        example: 'Cotonou',
        maxLength: 50,
    })
    @IsOptional()
    @IsString()
    @MaxLength(50, { message: 'La ville ne peut pas dépasser 50 caractères' })
    ville?: string;

    @ApiPropertyOptional({
        description: 'Quartier de résidence',
        example: 'Akpakpa',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Le quartier ne peut pas dépasser 100 caractères' })
    quartier?: string;

    @ApiPropertyOptional({
        description: 'Adresse complète',
        example: '123 Rue de la Paix, Akpakpa',
        maxLength: 255,
    })
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: "L'adresse ne peut pas dépasser 255 caractères" })
    adressePrincipale?: string;

    @ApiPropertyOptional({
        description: 'URL de la photo de profil (obtenue via POST /upload/image)',
        example: 'https://res.cloudinary.com/.../photo.jpg',
    })
    @IsOptional()
    @IsString()
    @IsUrl({}, { message: "L'URL de la photo n'est pas valide" })
    photoUrl?: string;
}
