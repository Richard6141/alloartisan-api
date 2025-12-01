import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NewOtpCodeDTO {
    @ApiProperty({
        description: 'Adresse email pour recevoir un nouveau code OTP',
        example: 'john.doe@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}
