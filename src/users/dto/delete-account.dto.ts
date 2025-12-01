import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class DeleteAccountDto {
    @IsString()
    @IsNotEmpty({ message: 'Le mot de passe est requis' })
    password: string;

    @IsOptional()
    @IsString()
    mfaCode?: string;
}
