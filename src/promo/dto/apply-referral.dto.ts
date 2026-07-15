import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class ApplyReferralDto {
    @ApiProperty({
        description: "Code de parrainage reçu d'un autre utilisateur",
        example: 'KA-7X2M9Q',
    })
    @IsString()
    @Length(4, 20)
    @Matches(/^[A-Z0-9-]+$/, { message: 'Format de code parrainage invalide' })
    code: string;
}
