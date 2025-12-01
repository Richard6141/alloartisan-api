import { IsString, IsOptional, MaxLength, IsDateString, Matches, Length } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
    nom?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Le prénom ne peut pas dépasser 100 caractères' })
    prenom?: string;

    @IsOptional()
    @IsString()
    @Length(8, 20, { message: 'Le numéro de téléphone doit contenir entre 8 et 20 caractères' })
    @Matches(/^[\d\s\-+()]+$/, { message: 'Format de numéro de téléphone invalide' })
    telephone?: string;

    @IsOptional()
    @IsDateString({}, { message: 'Format de date invalide' })
    dateNaissance?: string;

    @IsOptional()
    @IsString()
    @Matches(/^[MFO]$/, { message: 'Le sexe doit être M, F ou O' })
    sexe?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50, { message: 'La ville ne peut pas dépasser 50 caractères' })
    ville?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Le quartier ne peut pas dépasser 100 caractères' })
    quartier?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: "L'adresse ne peut pas dépasser 255 caractères" })
    adressePrincipale?: string;
}
