import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CreateEngagementDto {
    @ApiProperty()
    @IsUUID()
    profilTravailleurId!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    conversationId?: string;
}
