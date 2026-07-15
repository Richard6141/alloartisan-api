import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsIn,
    IsOptional,
    Matches,
    MinLength,
    MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthDto {
    @ApiProperty({
        description: "Adresse email de l'utilisateur",
        example: 'john.doe@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description:
            'Mot de passe (min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial)',
        example: 'MonMotDePasse123!',
        minLength: 8,
        maxLength: 128,
    })
    @IsString()
    @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
    @MaxLength(128, { message: 'Le mot de passe ne peut pas dépasser 128 caractères' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, {
        message:
            'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
    })
    password: string;
}

export class RegisterDto extends AuthDto {
    @ApiPropertyOptional({
        description: "Type de compte à créer (CLIENT par défaut). ADMIN n'est jamais accepté ici.",
        enum: ['CLIENT', 'ARTISAN'],
        default: 'CLIENT',
    })
    @IsOptional()
    @IsIn(['CLIENT', 'ARTISAN'], { message: 'Le type de compte doit être CLIENT ou ARTISAN' })
    role?: 'CLIENT' | 'ARTISAN';
}
