import { IsNumber, IsString, IsOptional, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ProposePriceDto {
    @ApiProperty({
        description: "Prix proposé par l'artisan en FCFA",
        example: 25000,
        minimum: 1,
    })
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    prixPropose: number;

    @ApiPropertyOptional({
        description: 'Message explicatif sur le prix proposé',
        example: "Le prix inclut la main d'œuvre et les pièces de rechange",
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    messageArtisan?: string;

    @ApiPropertyOptional({
        description: 'Durée estimée en heures',
        example: 3,
    })
    @IsOptional()
    @IsNumber()
    @Min(0.5)
    @Max(240)
    @Type(() => Number)
    dureeEstimeeHeures?: number;
}
