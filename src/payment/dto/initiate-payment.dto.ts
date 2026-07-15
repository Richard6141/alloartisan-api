import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentProvider {
    FEDAPAY = 'fedapay',
    KKIAPAY = 'kkiapay',
    CASH = 'cash',
}

export class InitiatePaymentDto {
    @ApiProperty({
        description: 'Fournisseur de paiement',
        enum: PaymentProvider,
        example: PaymentProvider.FEDAPAY,
    })
    @IsEnum(PaymentProvider)
    @IsNotEmpty()
    provider: PaymentProvider;

    @ApiPropertyOptional({
        description: 'URL de redirection après paiement réussi',
        example: 'https://app.alloartisan.bj/payment/success',
    })
    @IsUrl()
    @IsOptional()
    successUrl?: string;

    @ApiPropertyOptional({
        description: 'URL de redirection après annulation',
        example: 'https://app.alloartisan.bj/payment/cancel',
    })
    @IsUrl()
    @IsOptional()
    cancelUrl?: string;

    @ApiPropertyOptional({
        description: 'Numéro de téléphone Mobile Money (KkiaPay)',
        example: '22997000000',
    })
    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @ApiPropertyOptional({
        description: 'Code promo à appliquer sur le montant (validé côté serveur)',
        example: 'BIENVENUE10',
    })
    @IsString()
    @IsOptional()
    @Length(3, 50)
    @Matches(/^[A-Z0-9-]+$/i, { message: 'Format de code promo invalide' })
    codePromo?: string;
}
