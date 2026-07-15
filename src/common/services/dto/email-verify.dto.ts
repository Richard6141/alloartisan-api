import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EmailVerificationDto {
    @ApiProperty({
        description: 'Adresse email à vérifier',
        example: 'john.doe@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'Code OTP à 6 chiffres reçu par email',
        example: '012345',
    })
    // CHAÎNE et non entier : un code commençant par 0 ("012345") perdrait
    // son zéro en passant par Number et serait toujours rejeté.
    @Transform(({ value }) => String(value))
    @IsString()
    @Matches(/^\d{4,8}$/, { message: 'Le code doit contenir uniquement des chiffres' })
    code: string;
}
