import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbonnementType, StatutArtisan } from 'src/generated/prisma';

class UserMinimalDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'Jean' })
    prenom: string | null;

    @ApiProperty({ example: 'Dupont' })
    nom: string | null;

    @ApiProperty({ example: 'jean.dupont@email.com' })
    email: string;

    @ApiPropertyOptional({ example: '+229 97 00 00 00' })
    telephone: string | null;
}

class MetierMinimalDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'Plombier' })
    nom: string;

    @ApiProperty({ example: 'plombier' })
    slug: string;
}

class ArtisanMetierResponseDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: true })
    estPrincipal: boolean;

    @ApiPropertyOptional({ example: 5 })
    anneesExperience: number | null;

    @ApiProperty({ example: false })
    certifie: boolean;

    @ApiPropertyOptional({ example: 5000 })
    tarifHoraire: number | null;

    @ApiPropertyOptional({ example: 'Spécialisé en plomberie sanitaire' })
    description: string | null;

    @ApiProperty({ type: MetierMinimalDto })
    metier: MetierMinimalDto;
}

export class ArtisanResponseDto {
    @ApiProperty({
        description: 'Identifiant unique',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: "ID de l'utilisateur associé",
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    userId: string;

    @ApiPropertyOptional({
        description: "Nom de l'entreprise",
        example: 'Plomberie Express',
    })
    nomEntreprise: string | null;

    @ApiPropertyOptional({
        description: 'Numéro IFU',
        example: '3201234567890',
    })
    numeroIfu: string | null;

    @ApiProperty({
        description: "Années d'expérience",
        example: 10,
    })
    anneesExperience: number;

    @ApiPropertyOptional({
        description: 'Biographie',
        example: 'Plombier passionné...',
    })
    bio: string | null;

    @ApiPropertyOptional({
        description: 'Slogan',
        example: 'Votre satisfaction, notre priorité',
    })
    slogan: string | null;

    @ApiPropertyOptional({
        description: 'URL photo de profil',
    })
    photoProfilUrl: string | null;

    @ApiPropertyOptional({
        description: 'URL photo de couverture',
    })
    photoCouvertureUrl: string | null;

    @ApiPropertyOptional({
        description: 'URLs du portfolio',
        example: ['https://example.com/portfolio/1.jpg'],
    })
    portfolioUrls: string[] | null;

    @ApiPropertyOptional({
        description: "Adresse de l'atelier",
    })
    adresseAtelier: string | null;

    @ApiProperty({
        description: 'Latitude GPS',
        example: 6.3654,
    })
    latitude: number;

    @ApiProperty({
        description: 'Longitude GPS',
        example: 2.4183,
    })
    longitude: number;

    @ApiProperty({
        description: 'Ville principale',
        example: 'Cotonou',
    })
    villePrincipale: string;

    @ApiProperty({
        description: "Zone d'intervention en km",
        example: 10,
    })
    zoneInterventionKm: number;

    @ApiPropertyOptional({
        description: "Villes d'intervention",
        example: ['Cotonou', 'Abomey-Calavi'],
    })
    villesIntervention: string[] | null;

    @ApiProperty({
        description: 'Note moyenne',
        example: 4.5,
    })
    noteMoyenne: number;

    @ApiProperty({
        description: "Nombre d'avis",
        example: 25,
    })
    nombreAvis: number;

    @ApiProperty({
        description: 'Compteur de demandes du mois courant',
        example: 10,
    })
    compteurDemandesMoisCourant: number;

    @ApiProperty({
        description: 'Nombre de missions complétées',
        example: 50,
    })
    nombreMissionsCompletees: number;

    @ApiProperty({
        description: 'Taux de complétion',
        example: 95.5,
    })
    tauxCompletion: number;

    @ApiPropertyOptional({
        description: 'Taux de réponse moyen (en minutes)',
        example: 30,
    })
    tauxReponseMoyen: number | null;

    @ApiProperty({
        description: 'Disponible',
        example: true,
    })
    disponible: boolean;

    @ApiProperty({
        description: 'Accepte les urgences',
        example: true,
    })
    accepteUrgences: boolean;

    @ApiProperty({
        description: 'Travaille le weekend',
        example: false,
    })
    accepteWeekend: boolean;

    @ApiPropertyOptional({
        description: 'Horaires de travail',
    })
    horairesTravail: any;

    @ApiProperty({
        description: 'Artisan vérifié',
        example: true,
    })
    verified: boolean;

    @ApiPropertyOptional({
        description: 'Date de vérification',
    })
    verifiedAt: Date | null;

    @ApiPropertyOptional({
        description: 'Badges',
    })
    badges: any;

    @ApiProperty({
        description: "Type d'abonnement",
        enum: AbonnementType,
        example: 'GRATUIT',
    })
    abonnementType: AbonnementType;

    @ApiPropertyOptional({
        description: "Date d'expiration de l'abonnement",
    })
    abonnementExpireAt: Date | null;

    @ApiProperty({
        description: 'Total des vues du profil',
        example: 150,
    })
    totalVuesProfil: number;

    @ApiProperty({
        description: 'Total des contacts reçus',
        example: 45,
    })
    totalContacts: number;

    @ApiProperty({
        description: "Statut de l'artisan",
        enum: StatutArtisan,
        example: 'ACTIF',
    })
    statut: StatutArtisan;

    @ApiPropertyOptional({
        description: 'Raison de la suspension (si suspendu)',
    })
    raisonSuspension: string | null;

    @ApiProperty({
        description: 'Date de création',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Date de mise à jour',
    })
    updatedAt: Date;
}

export class ArtisanDetailResponseDto extends ArtisanResponseDto {
    @ApiProperty({
        description: 'Informations utilisateur',
        type: UserMinimalDto,
    })
    user: UserMinimalDto;

    @ApiProperty({
        description: 'Métiers exercés',
        type: [ArtisanMetierResponseDto],
    })
    metiers: ArtisanMetierResponseDto[];
}

export class ArtisanListResponseDto {
    @ApiProperty({
        description: 'Liste des artisans',
        type: [ArtisanDetailResponseDto],
    })
    data: ArtisanDetailResponseDto[];

    @ApiProperty({
        description: "Nombre total d'artisans",
        example: 100,
    })
    total: number;

    @ApiProperty({
        description: 'Page actuelle',
        example: 1,
    })
    page: number;

    @ApiProperty({
        description: "Nombre d'éléments par page",
        example: 20,
    })
    limit: number;

    @ApiProperty({
        description: 'Nombre total de pages',
        example: 5,
    })
    totalPages: number;
}

/**
 * DTO léger pour les listes de recherche (40-50% plus petit que ArtisanDetailResponseDto)
 * Utilisé pour optimiser les réponses de recherche avec moins de données
 */
export class ArtisanListItemDto {
    @ApiProperty({
        description: 'Identifiant unique',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiPropertyOptional({
        description: "Nom de l'entreprise",
        example: 'Plomberie Express',
    })
    nomEntreprise: string | null;

    @ApiPropertyOptional({
        description: 'URL photo de profil',
    })
    photoProfilUrl: string | null;

    @ApiProperty({
        description: 'Note moyenne',
        example: 4.5,
    })
    noteMoyenne: number;

    @ApiProperty({
        description: "Nombre d'avis",
        example: 25,
    })
    nombreAvis: number;

    @ApiProperty({
        description: 'Ville principale',
        example: 'Cotonou',
    })
    villePrincipale: string;

    @ApiProperty({
        description: 'Artisan vérifié',
        example: true,
    })
    verified: boolean;

    @ApiProperty({
        description: 'Disponible',
        example: true,
    })
    disponible: boolean;

    @ApiProperty({
        description: "Type d'abonnement",
        enum: AbonnementType,
        example: 'GRATUIT',
    })
    abonnementType: AbonnementType;

    @ApiProperty({
        description: "Années d'expérience",
        example: 10,
    })
    anneesExperience: number;

    @ApiProperty({
        description: 'Accepte les urgences',
        example: true,
    })
    accepteUrgences: boolean;

    @ApiProperty({
        description: 'Travaille le weekend',
        example: false,
    })
    accepteWeekend: boolean;

    @ApiPropertyOptional({
        description: 'Métier principal',
    })
    metierPrincipal: MetierMinimalDto | null;

    @ApiProperty({
        description: 'Informations utilisateur',
        type: UserMinimalDto,
    })
    user: UserMinimalDto;
}

/**
 * DTO de réponse optimisé pour les recherches
 */
export class ArtisanSearchResponseDto {
    @ApiProperty({
        description: 'Liste des artisans (format léger)',
        type: [ArtisanListItemDto],
    })
    data: ArtisanListItemDto[];

    @ApiProperty({
        description: "Nombre total d'artisans",
        example: 100,
    })
    total: number;

    @ApiProperty({
        description: 'Page actuelle',
        example: 1,
    })
    page: number;

    @ApiProperty({
        description: "Nombre d'éléments par page",
        example: 20,
    })
    limit: number;

    @ApiProperty({
        description: 'Nombre total de pages',
        example: 5,
    })
    totalPages: number;
}
