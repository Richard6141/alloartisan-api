import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FedaPayWebhookDto {
    @ApiProperty({ description: 'ID de la transaction FedaPay' })
    @IsString()
    @IsNotEmpty()
    id: string;

    @ApiProperty({ description: 'Statut de la transaction FedaPay' })
    @IsString()
    @IsNotEmpty()
    status: string; // approved, declined, cancelled, refunded

    @ApiPropertyOptional({ description: 'Montant en XOF (centimes)' })
    @IsOptional()
    amount?: number;

    @ApiPropertyOptional({ description: 'Référence interne' })
    @IsString()
    @IsOptional()
    reference?: string;

    @ApiPropertyOptional()
    @IsOptional()
    customer?: {
        email?: string;
        full_name?: string;
    };

    @ApiPropertyOptional()
    @IsOptional()
    metadata?: Record<string, unknown>;
}

export class KkiaPayWebhookDto {
    @ApiProperty({ description: 'ID de la transaction KkiaPay' })
    @IsString()
    @IsNotEmpty()
    transactionId: string;

    @ApiProperty({ description: 'Statut KkiaPay' })
    @IsString()
    @IsNotEmpty()
    status: string; // SUCCESS, FAILED, CANCELLED

    @ApiPropertyOptional()
    @IsOptional()
    amount?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    reference?: string;
}
