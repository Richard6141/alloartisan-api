import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PlanAbonnement {
    GRATUIT = 'GRATUIT',
    STANDARD = 'STANDARD',
    PREMIUM = 'PREMIUM',
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
