import { IsNotEmpty, IsString, Length } from 'class-validator';

export class EnableMfaDto {
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    code: string;
}

export class VerifyMfaDto {
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    code: string;
}

export class DisableMfaDto {
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    code: string;
}

export class VerifyMfaLoginDto {
    @IsString()
    @IsNotEmpty()
    mfa_token: string;

    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    code: string;
}
