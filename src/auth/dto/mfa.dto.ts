import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnableMfaDto {
    @ApiProperty({
        description: "Code TOTP à 6 chiffres généré par l'application d'authentification",
        example: '123456',
        minLength: 6,
        maxLength: 6,
    })
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    code: string;
}

export class VerifyMfaDto {
    @ApiProperty({
        description: "Code TOTP à 6 chiffres généré par l'application d'authentification",
        example: '123456',
        minLength: 6,
        maxLength: 6,
    })
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    code: string;
}

export class DisableMfaDto {
    @ApiProperty({
        description: 'Code TOTP à 6 chiffres pour confirmer la désactivation',
        example: '123456',
        minLength: 6,
        maxLength: 6,
    })
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    code: string;
}

export class VerifyMfaLoginDto {
    @ApiProperty({
        description: 'Token MFA temporaire reçu lors du login',
        example: 'mfa_temp_token_xyz789',
    })
    @IsString()
    @IsNotEmpty()
    mfa_token: string;

    @ApiProperty({
        description: "Code TOTP à 6 chiffres généré par l'application d'authentification",
        example: '123456',
        minLength: 6,
        maxLength: 6,
    })
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    code: string;
}
