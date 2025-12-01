import { IsEmail, IsNotEmpty, IsString, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
    @ApiProperty({
        description: 'Adresse email du compte',
        example: 'john.doe@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({
        description: 'Adresse email du compte',
        example: 'john.doe@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'Code de réinitialisation reçu par email',
        example: '784512',
    })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({
        description: 'Nouveau mot de passe (min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial)',
        example: 'NouveauMotDePasse123!',
        minLength: 8,
        maxLength: 128,
    })
    @IsString()
    @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
    @MaxLength(128, { message: 'Le mot de passe ne peut pas dépasser 128 caractères' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/, {
        message:
            'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial',
    })
    newPassword: string;
}
