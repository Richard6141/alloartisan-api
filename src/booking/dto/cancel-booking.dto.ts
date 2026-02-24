import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelBookingDto {
    @ApiPropertyOptional({
        description: "Raison de l'annulation",
        example: 'Je ne suis plus disponible ce jour-là',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    raison?: string;
}
