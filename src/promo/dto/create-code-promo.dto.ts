import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEnum,
    IsNumber,
    Min,
    Max,
    IsInt,
    IsBoolean,
    IsISO8601,
    Length,
    Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeReduction } from 'src/generated/prisma';

export class CreateCodePromoDto {
    @ApiProperty({
        description: 'Code promo (majuscules, chiffres, tirets)',
        example: 'BIENVENUE10',
    })
    @IsString()
    @Length(3, 50)
    @Matches(/^[A-Z0-9-]+$/, {
        message: 'Le code doit contenir uniquement des majuscules, chiffres et tirets',
    })
    code: string;

    @ApiPropertyOptional({ description: 'Description interne du code' })
    @IsOptional()
    @IsString()
    @Length(0, 500)
    description?: string;

    @ApiProperty({
        enum: TypeReduction,
        description: 'POURCENTAGE (valeur = %) ou MONTANT_FIXE (valeur = FCFA)',
    })
    @IsEnum(TypeReduction)
    typeReduction: TypeReduction;

    @ApiProperty({ description: 'Pourcentage (1-100) ou montant en FCFA', example: 10 })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(1000000)
    valeur: number;

    @ApiPropertyOptional({ description: 'Plafond de réduction en FCFA (codes en %)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(100)
    reductionMax?: number;

    @ApiPropertyOptional({ description: 'Montant minimum de commande en FCFA' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    montantMinimum?: number;

    @ApiPropertyOptional({ description: "Nombre total d'utilisations autorisées (null = illimité)" })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    utilisationsMax?: number;

    @ApiPropertyOptional({ description: 'Utilisations max par utilisateur', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    utilisationsParUtilisateur?: number;

    @ApiPropertyOptional({ description: 'Date de début de validité (ISO 8601)' })
    @IsOptional()
    @IsISO8601()
    validFrom?: string;

    @ApiPropertyOptional({ description: 'Date de fin de validité (ISO 8601)' })
    @IsOptional()
    @IsISO8601()
    validUntil?: string;

    @ApiPropertyOptional({ description: 'Code actif immédiatement', default: true })
    @IsOptional()
    @IsBoolean()
    actif?: boolean;
}

export class UpdateCodePromoDto {
    @ApiPropertyOptional({ description: 'Description interne du code' })
    @IsOptional()
    @IsString()
    @Length(0, 500)
    description?: string;

    @ApiPropertyOptional({ description: 'Activer/désactiver le code' })
    @IsOptional()
    @IsBoolean()
    actif?: boolean;

    @ApiPropertyOptional({ description: 'Date de fin de validité (ISO 8601)' })
    @IsOptional()
    @IsISO8601()
    validUntil?: string;

    @ApiPropertyOptional({ description: "Nombre total d'utilisations autorisées" })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    utilisationsMax?: number;
}
