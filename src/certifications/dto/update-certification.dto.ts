import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCertificationDto {
    @ApiPropertyOptional({
        description: 'Titre de la certification',
        example: 'CAP Plomberie',
        maxLength: 200,
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    titre?: string;

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
