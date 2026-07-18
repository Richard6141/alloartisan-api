import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class AdminTrendsDto {
    @ApiPropertyOptional({ enum: ['7d', '30d', '90d'], default: '30d' })
    @IsOptional()
    @IsIn(['7d', '30d', '90d'])
    range?: '7d' | '30d' | '90d' = '30d';
}
