import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAvisDto {
    @ApiProperty({
        description: 'ID du booking (doit être TERMINEE)',
        example: 'uuid-du-booking',
    })
    @IsUUID()
    @IsNotEmpty()
    bookingId: string;

    @ApiProperty({
        description: 'Note globale de 1 à 5 étoiles',
        minimum: 1,
        maximum: 5,
        example: 4,
    })
    @IsInt()
    @Min(1)
    @Max(5)
    note: number;

    @ApiPropertyOptional({
        description: 'Note ponctualité de 1 à 5',
        minimum: 1,
        maximum: 5,
    })
    @IsInt()
    @Min(1)
    @Max(5)
    @IsOptional()
    notePonctualite?: number;

    @ApiPropertyOptional({
        description: 'Note qualité du travail de 1 à 5',
        minimum: 1,
        maximum: 5,
    })
    @IsInt()
    @Min(1)
    @Max(5)
    @IsOptional()
    noteQualite?: number;

    @ApiPropertyOptional({
        description: 'Note communication de 1 à 5',
        minimum: 1,
        maximum: 5,
    })
    @IsInt()
    @Min(1)
    @Max(5)
    @IsOptional()
    noteCommunication?: number;

    @ApiPropertyOptional({
        description: 'Commentaire textuel',
        maxLength: 2000,
    })
    @IsString()
    @MaxLength(2000)
    @IsOptional()
    commentaire?: string;
}
