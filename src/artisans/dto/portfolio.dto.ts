import {
    IsString,
    IsOptional,
    MaxLength,
    IsUrl,
    IsIn,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PortfolioItemDto {
    @ApiProperty({ description: 'URL Cloudinary de la photo/vidéo' })
    @IsString()
    @IsUrl()
    url!: string;

    @ApiProperty({ description: 'Type de media', enum: ['photo', 'video'] })
    @IsIn(['photo', 'video'])
    type!: 'photo' | 'video';

    @ApiPropertyOptional({ description: 'Légende du media', maxLength: 200 })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    caption?: string;

    @ApiPropertyOptional({ description: 'ID du booking associé (avant/après chantier)' })
    @IsOptional()
    @IsString()
    @MaxLength(36)
    bookingId?: string;

    @ApiPropertyOptional({ description: 'URL de la miniature (pour les vidéos)' })
    @IsOptional()
    @IsString()
    @IsUrl()
    thumbnailUrl?: string;

    @ApiPropertyOptional({ description: "Date d'upload ISO8601" })
    @IsOptional()
    @IsString()
    uploadedAt?: string;
}

export class AddPortfolioItemDto {
    @ApiPropertyOptional({ description: 'Légende du media', maxLength: 200 })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    caption?: string;

    @ApiPropertyOptional({ description: 'ID du booking associé (avant/après chantier)' })
    @IsOptional()
    @IsString()
    @MaxLength(36)
    bookingId?: string;
}

export class ReorderPortfolioDto {
    @ApiProperty({ description: "Tableau d'URLs dans le nouvel ordre", type: [String] })
    @IsArray()
    @IsString({ each: true })
    urls!: string[];
}

export class DeletePortfolioItemDto {
    @ApiProperty({ description: "URL Cloudinary de l'item à supprimer" })
    @IsString()
    @IsUrl()
    url!: string;
}

export class PortfolioResponseDto {
    @ApiProperty()
    artisanId!: string;

    @ApiProperty({ type: [PortfolioItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PortfolioItemDto)
    items!: PortfolioItemDto[];

    @ApiProperty()
    total!: number;

    @ApiProperty()
    maxAllowed!: number;
}
