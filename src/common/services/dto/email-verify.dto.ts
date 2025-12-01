import { IsEmail, IsInt, IsNotEmpty } from 'class-validator';
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
        example: 123456,
    })
    @IsInt()
    @IsNotEmpty()
    code: number;
}
