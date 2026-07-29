import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsJWT } from 'class-validator';

export class VerifyLoginCodeDto {
    @ApiProperty() @IsJWT() verify_token!: string;
    @ApiProperty({ example: '123456' }) @IsString() @Length(6, 6) code!: string;
}

export class ResendLoginCodeDto {
    @ApiProperty() @IsJWT() verify_token!: string;
}
