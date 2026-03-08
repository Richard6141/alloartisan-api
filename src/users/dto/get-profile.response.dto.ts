import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, Statut } from 'src/generated/prisma';

export class GetProfileResponseDto {
    @ApiProperty({
        description: "Identifiant unique de l'utilisateur",
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    })
    id: string;

    @ApiProperty({
        description: 'Adresse email',
        example: 'jean.dupont@example.com',
    })
    email: string;

    @ApiPropertyOptional({
        description: 'Nom de famille',
        example: 'Dupont',
        nullable: true,
    })
    nom: string | null;

    @ApiPropertyOptional({
        description: 'Prénom',
        example: 'Jean',
        nullable: true,
    })
    prenom: string | null;

    @ApiPropertyOptional({
        description: 'Numéro de téléphone',
        example: '+229 97 00 00 00',
        nullable: true,
    })
    telephone: string | null;

    @ApiPropertyOptional({
        description: 'Date de naissance',
        example: '1990-05-15T00:00:00.000Z',
        nullable: true,
    })
    dateNaissance: Date | null;

    @ApiPropertyOptional({
        description: 'Sexe (M, F, O)',
        example: 'M',
        nullable: true,
    })
    sexe: string | null;

    @ApiPropertyOptional({
        description: 'Ville de résidence',
        example: 'Cotonou',
        nullable: true,
    })
    ville: string | null;

    @ApiPropertyOptional({
        description: 'URL de la photo de profil',
        example: 'https://cdn.alloartisan.com/photos/user123.jpg',
        nullable: true,
    })
    photoUrl: string | null;

    @ApiProperty({
        description: "Rôle de l'utilisateur",
        enum: ['CLIENT', 'ARTISAN', 'ADMIN'],
        example: 'CLIENT',
    })
    role: Role;

    @ApiProperty({
        description: 'Statut du compte',
        enum: ['EN_ATTENTE', 'ACTIF', 'SUSPENDU', 'BANNI'],
        example: 'ACTIF',
    })
    statut: Statut;

    @ApiProperty({
        description: 'Email vérifié',
        example: true,
    })
    emailVerified: boolean;

    @ApiProperty({
        description: 'Authentification MFA activée',
        example: false,
    })
    mfaEnabled: boolean;

    @ApiProperty({
        description: 'Date de création du compte',
        example: '2024-01-15T10:30:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Date de dernière modification',
        example: '2024-06-20T14:45:00.000Z',
    })
    updatedAt: Date;
}
