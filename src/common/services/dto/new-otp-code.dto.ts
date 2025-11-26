import { IsEmail, IsNotEmpty } from 'class-validator';

export class NewOtpCodeDTO {
    @IsEmail()
    @IsNotEmpty()
    email: string;
}
