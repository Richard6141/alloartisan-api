import {
    IsString,
    IsOptional,
    IsInt,
    IsBoolean,
    IsNumber,
    IsArray,
    IsUUID,
    MaxLength,
    Min,
    Max,
    IsUrl,
    ValidateNested,
    ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SansContact } from 'src/common/validators/sans-contact.validator';

export class HoraireTravailDto {
    @ApiProperty({ example: 'lundi' })
    @IsString()
    jour: string;

    @ApiProperty({ example: '08:00' })
    @IsString()
    ouverture: string;

    @ApiProperty({ example: '18:00' })
    @IsString()
    fermeture: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    ouvert: boolean;
}

export class ArtisanMetierInputDto {
    @ApiProperty({
        description: 'ID du métier',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID('4', { message: "L'ID du métier doit être un UUID valide" })
    metierId: string;

    @ApiPropertyOptional({
        description: 'Métier principal',
        example: true,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    estPrincipal?: boolean;

    @ApiPropertyOptional({
        description: "Années d'expérience pour ce métier",
        example: 5,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    anneesExperience?: number;

    @ApiPropertyOptional({
        description: 'Artisan certifié pour ce métier',
        example: false,
    })
    @IsOptional()
    @IsBoolean()
    certifie?: boolean;

    @ApiPropertyOptional({
        description: 'Tarif horaire en FCFA',
        example: 5000,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    tarifHoraire?: number;

    @ApiPropertyOptional({
        description: 'Description spécifique au métier',
        example: 'Spécialisé en plomberie sanitaire',
    })
    @IsOptional()
    @IsString()
    @SansContact()
    description?: string;
}

export class CreateArtisanDto {
    @ApiPropertyOptional({
        description: "Nom de l'entreprise ou commerce",
        example: 'Plomberie Express',
        maxLength: 200,
    })
    @IsOptional()
    @IsString()
    @MaxLength(200, { message: "Le nom d'entreprise ne peut pas dépasser 200 caractères" })
    @SansContact()
    nomEntreprise?: string;

    @ApiPropertyOptional({
        description: 'Numéro IFU (Identifiant Fiscal Unique)',
        example: '3201234567890',
        maxLength: 50,
    })
    @IsOptional()
    @IsString()
    @MaxLength(50, { message: 'Le numéro IFU ne peut pas dépasser 50 caractères' })
    numeroIfu?: string;

    @ApiPropertyOptional({
        description: "Années d'expérience globales",
        example: 10,
        default: 0,
    })
    @IsOptional()
    @IsInt()
    @Min(0, { message: "Les années d'expérience doivent être positives" })
    anneesExperience?: number;

    @ApiPropertyOptional({
        description: "Biographie de l'artisan",
        example: "Plombier passionné avec 10 ans d'expérience...",
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: 'La biographie ne peut pas dépasser 1000 caractères' })
    @SansContact()
    bio?: string;

    @ApiPropertyOptional({
        description: "Slogan ou phrase d'accroche",
        example: 'Votre satisfaction, notre priorité',
        maxLength: 200,
    })
    @IsOptional()
    @IsString()
    @MaxLength(200, { message: 'Le slogan ne peut pas dépasser 200 caractères' })
    @SansContact()
    slogan?: string;

    @ApiPropertyOptional({
        description: 'URL de la photo de profil',
        example: 'https://example.com/photos/profil.jpg',
    })
    @IsOptional()
    @IsString()
    @IsUrl({}, { message: "L'URL de la photo de profil n'est pas valide" })
    photoProfilUrl?: string;

    @ApiPropertyOptional({
        description: 'URL de la photo de couverture',
        example: 'https://example.com/photos/couverture.jpg',
    })
    @IsOptional()
    @IsString()
    @IsUrl({}, { message: "L'URL de la photo de couverture n'est pas valide" })
    photoCouvertureUrl?: string;

    @ApiPropertyOptional({
        description: 'URLs du portfolio (photos de réalisations)',
        example: ['https://example.com/portfolio/1.jpg', 'https://example.com/portfolio/2.jpg'],
    })
    @IsOptional()
    @IsArray()
    @IsUrl({}, { each: true, message: 'Chaque URL du portfolio doit être valide' })
    portfolioUrls?: string[];

    @ApiPropertyOptional({
        description: "Adresse de l'atelier",
        example: '123 Rue des Artisans, Cotonou',
    })
    @IsOptional()
    @IsString()
    adresseAtelier?: string;

    @ApiProperty({
        description: 'Latitude GPS',
        example: 6.3654,
    })
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude: number;

    @ApiProperty({
        description: 'Longitude GPS',
        example: 2.4183,
    })
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude: number;

    @ApiProperty({
        description: "Ville principale d'activité",
        example: 'Cotonou',
        maxLength: 50,
    })
    @IsString()
    @MaxLength(50, { message: 'La ville ne peut pas dépasser 50 caractères' })
    villePrincipale: string;

    @ApiPropertyOptional({
        description: "Zone d'intervention en km",
        example: 10,
        default: 5,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    zoneInterventionKm?: number;

    @ApiPropertyOptional({
        description: "Liste des villes d'intervention",
        example: ['Cotonou', 'Abomey-Calavi', 'Porto-Novo'],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    villesIntervention?: string[];

    @ApiPropertyOptional({
        description: 'Disponible pour de nouvelles missions',
        example: true,
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    disponible?: boolean;

    @ApiPropertyOptional({
        description: 'Accepte les missions urgentes',
        example: true,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    accepteUrgences?: boolean;

    @ApiPropertyOptional({
        description: 'Travaille le weekend',
        example: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    accepteWeekend?: boolean;

    @ApiPropertyOptional({
        description: 'Horaires de travail',
        type: [HoraireTravailDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => HoraireTravailDto)
    horairesTravail?: HoraireTravailDto[];

    @ApiProperty({
        description: "Métiers exercés par l'artisan",
        type: [ArtisanMetierInputDto],
    })
    @IsArray()
    @ArrayMinSize(1, { message: "L'artisan doit exercer au moins un métier" })
    @ValidateNested({ each: true })
    @Type(() => ArtisanMetierInputDto)
    metiers: ArtisanMetierInputDto[];
}
