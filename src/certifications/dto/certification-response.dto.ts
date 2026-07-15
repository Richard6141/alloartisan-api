import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CertificationResponseDto {
    @ApiProperty({
        description: 'Identifiant unique de la certification',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: "Identifiant de l'artisan",
        example: '550e8400-e29b-41d4-a716-446655440001',
    })
    artisanId: string;

    @ApiProperty({
        description: 'Titre de la certification',
        example: 'CAP Plomberie',
    })
    titre: string;

    @ApiPropertyOptional({
        description: 'Organisme délivrant la certification',
        example: 'Chambre des Métiers du Bénin',
        nullable: true,
    })
    organisme: string | null;

    @ApiPropertyOptional({
        description: "Date d'obtention de la certification",
        example: '2020-06-15',
        nullable: true,
    })
    dateObtention: Date | null;

    @ApiPropertyOptional({
        description: 'Numéro de certification',
        example: 'CERT-2020-12345',
        nullable: true,
    })
    numeroCertification: string | null;

    @ApiPropertyOptional({
        description: 'URL du document justificatif',
        example:
            'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/certifications/doc.pdf',
        nullable: true,
    })
    documentUrl: string | null;

    @ApiProperty({
        description: 'Indique si la certification a été vérifiée par un administrateur',
        example: false,
    })
    verifie: boolean;

    @ApiProperty({
        description: "Famille de preuve : IDENTITE (pièce d'identité) ou METIER",
        enum: ['IDENTITE', 'METIER'],
        example: 'METIER',
    })
    type: 'IDENTITE' | 'METIER';

    @ApiPropertyOptional({
        description: 'Métier prouvé par ce document',
        nullable: true,
    })
    metierId: string | null;

    @ApiProperty({
        description: "Cycle d'examen du document",
        enum: ['EN_ATTENTE', 'VALIDEE', 'REJETEE'],
        example: 'EN_ATTENTE',
    })
    statutVerification: 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE';

    @ApiPropertyOptional({
        description: "Motif du rejet, lisible par l'artisan pour corriger et resoumettre",
        nullable: true,
    })
    raisonRejet: string | null;

    @ApiProperty({
        description: 'Date de création',
        example: '2024-01-15T10:30:00.000Z',
    })
    createdAt: Date;
}

export class CertificationListResponseDto {
    @ApiProperty({
        description: 'Liste des certifications',
        type: [CertificationResponseDto],
    })
    data: CertificationResponseDto[];

    @ApiProperty({
        description: 'Nombre total de certifications',
        example: 5,
    })
    total: number;
}

export class CertificationListItemDto {
    @ApiProperty({
        description: 'Identifiant unique de la certification',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'Titre de la certification',
        example: 'CAP Plomberie',
    })
    titre: string;

    @ApiPropertyOptional({
        description: 'Organisme délivrant la certification',
        example: 'Chambre des Métiers du Bénin',
        nullable: true,
    })
    organisme: string | null;

    @ApiPropertyOptional({
        description: "Date d'obtention de la certification",
        example: '2020-06-15',
        nullable: true,
    })
    dateObtention: Date | null;

    @ApiProperty({
        description: 'Indique si la certification a été vérifiée',
        example: true,
    })
    verifie: boolean;
}

export class VerifyCertificationDto {
    @ApiProperty({
        description: 'Définir le statut de vérification',
        example: true,
    })
    @IsBoolean()
    verifie: boolean;

    @ApiPropertyOptional({
        description: "Motif du rejet (obligatoire pour aider l'artisan à corriger)",
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    raison?: string;
}
