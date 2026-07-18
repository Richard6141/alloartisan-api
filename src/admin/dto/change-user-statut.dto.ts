import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ChangeUserStatutDto {
    @ApiProperty({ enum: ['ACTIF', 'SUSPENDU', 'BANNI'] })
    @IsIn(['ACTIF', 'SUSPENDU', 'BANNI'])
    statut: 'ACTIF' | 'SUSPENDU' | 'BANNI';

    @ApiPropertyOptional({ maxLength: 500, description: 'Motif (journalisé)' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    raison?: string;
}
