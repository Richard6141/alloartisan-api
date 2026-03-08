import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class RegisterFcmTokenDto {
    @ApiProperty({
        description: 'Token FCM Firebase du device',
        example: 'fJe4X2...:APA91bH...',
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiPropertyOptional({
        description: 'Nom du device (Android, iPhone 15...)',
        example: 'Samsung Galaxy S24',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    deviceName?: string;
}
