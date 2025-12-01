import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteAccountDto {
    @ApiProperty({
        description: 'Mot de passe actuel pour confirmer la suppression',
        example: 'MonMotDePasse123!',
    })
    @IsString()
    @IsNotEmpty({ message: 'Le mot de passe est requis' })
    password: string;

    @ApiPropertyOptional({
        description: 'Code MFA à 6 chiffres (requis si MFA activé)',
        example: '123456',
    })
    @IsOptional()
    @IsString()
    mfaCode?: string;
}
