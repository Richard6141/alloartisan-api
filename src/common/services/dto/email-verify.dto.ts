import { IsEmail, IsInt, IsNotEmpty } from 'class-validator';

export class EmailVerificationDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsInt()
    @IsNotEmpty()
    code: number;
}
