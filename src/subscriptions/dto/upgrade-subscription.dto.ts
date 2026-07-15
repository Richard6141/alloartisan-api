import { IsEnum, IsIn, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PlanAbonnement {
    GRATUIT = 'GRATUIT',
    STANDARD = 'STANDARD',
    PREMIUM = 'PREMIUM',
    GOLD = 'GOLD',
}

export class UpgradeSubscriptionDto {
    @ApiProperty({
        description: "Plan d'abonnement souhaité",
        enum: PlanAbonnement,
        example: PlanAbonnement.PREMIUM,
    })
    @IsEnum(PlanAbonnement)
    plan: PlanAbonnement;
}

export class PayerAbonnementDto {
    @ApiProperty({
        description: 'Palier payant à activer',
        enum: [PlanAbonnement.STANDARD, PlanAbonnement.PREMIUM, PlanAbonnement.GOLD],
        example: PlanAbonnement.STANDARD,
    })
    @IsIn([PlanAbonnement.STANDARD, PlanAbonnement.PREMIUM, PlanAbonnement.GOLD])
    plan: PlanAbonnement.STANDARD | PlanAbonnement.PREMIUM | PlanAbonnement.GOLD;
}

export class ConfirmerPaiementDto {
    @ApiProperty({
        description: 'Identifiant de transaction rendu par le widget KkiaPay',
        example: 'aBcD1234',
    })
    @IsString()
    @Matches(/^[\w-]{4,200}$/, { message: 'Identifiant de transaction invalide' })
    transactionId: string;
}
