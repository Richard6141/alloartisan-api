import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

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
}
