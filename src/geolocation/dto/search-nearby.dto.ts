import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchNearbyDto {
    @ApiPropertyOptional({
        description: 'Latitude du point de recherche',
        example: 6.3703,
        minimum: -90,
        maximum: 90,
    })
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    @Min(-90)
    @Max(90)
    lat?: number;

    @ApiPropertyOptional({
        description: 'Longitude du point de recherche',
        example: 2.3912,
        minimum: -180,
        maximum: 180,
    })
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    @Min(-180)
    @Max(180)
    lng?: number;

    @ApiPropertyOptional({
        description: 'Rayon de recherche en km (1-100)',
        example: 25,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    @Min(1)
    @Max(100)
    radius?: number = 25;

    @ApiPropertyOptional({
        description: 'ID du métier pour filtrer (UUID)',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    })
    @IsOptional()
    @IsString()
    @IsUUID()
    metierId?: string;

    @ApiPropertyOptional({ description: 'Nombre max de résultats', default: 20, maximum: 50 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber()
    @Min(1)
    @Max(50)
    limit?: number = 20;
}
