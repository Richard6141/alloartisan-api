import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatutBooking, TypeBooking } from 'src/generated/prisma';

export class SearchBookingDto {
    @ApiPropertyOptional({
        description: 'Filtrer par statut',
        enum: StatutBooking,
    })
    @IsOptional()
    @IsEnum(StatutBooking)
    statut?: StatutBooking;

    @ApiPropertyOptional({
        description: 'Filtrer par type',
        enum: TypeBooking,
    })
    @IsOptional()
    @IsEnum(TypeBooking)
    type?: TypeBooking;

    @ApiPropertyOptional({ description: 'Page', default: 1, example: 1 })
    @IsOptional()
    page?: number;

    @ApiPropertyOptional({ description: 'Éléments par page', default: 10, example: 10 })
    @IsOptional()
    limit?: number;
}
