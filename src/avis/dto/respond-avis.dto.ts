import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondAvisDto {
    @ApiProperty({
        description: "Réponse de l'artisan à cet avis",
        maxLength: 1000,
        example: "Merci pour votre retour, c'était un plaisir de travailler avec vous !",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    reponse: string;
}
