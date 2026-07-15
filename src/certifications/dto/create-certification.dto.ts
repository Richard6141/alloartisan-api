import { IsString, IsOptional, IsDateString, MaxLength, IsIn, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCertificationDto {
    @ApiPropertyOptional({
        description:
            "Famille de preuve : IDENTITE (pièce d'identité, unique) ou METIER (diplôme/attestation)",
        enum: ['IDENTITE', 'METIER'],
        default: 'METIER',
    })
    @IsOptional()
    @IsIn(['IDENTITE', 'METIER'])
    type?: 'IDENTITE' | 'METIER';

    @ApiPropertyOptional({
        description: 'Métier prouvé par ce document (doit être un métier déclaré par l\'artisan)',
    })
    @IsOptional()
    @IsUUID()
    metierId?: string;

    @ApiProperty({
        description: 'Titre de la certification',
        example: 'CAP Plomberie',
        maxLength: 200,
    })
    @IsString()
    @MaxLength(200)
    titre: string;

    @ApiPropertyOptional({
        description: 'Organisme délivrant la certification',
        example: 'Chambre des Métiers du Bénin',
        maxLength: 200,
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    organisme?: string;

    @ApiPropertyOptional({
        description: "Date d'obtention de la certification (format ISO 8601)",
        example: '2020-06-15',
    })
    @IsOptional()
    @IsDateString()
    dateObtention?: string;

    @ApiPropertyOptional({
        description: 'Numéro de certification',
        example: 'CERT-2020-12345',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    numeroCertification?: string;
}
