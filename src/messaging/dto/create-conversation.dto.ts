import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
    @ApiProperty({ description: "ID de l'artisan avec qui démarrer la conversation" })
    @IsUUID()
    artisanId: string;

    @ApiPropertyOptional({ description: 'ID du booking associé (optionnel)' })
    @IsUUID()
    @IsOptional()
    bookingId?: string;
}

export class SendMessageDto {
    @ApiProperty({
        description: 'Type de message',
        enum: ['text', 'image', 'audio', 'video', 'location'],
        default: 'text',
    })
    @IsString()
    type: 'text' | 'image' | 'audio' | 'video' | 'location';

    @ApiPropertyOptional({ description: 'Contenu texte du message' })
    @IsString()
    @IsOptional()
    contenu?: string;

    @ApiPropertyOptional({ description: 'URL du média (image, audio, vidéo)' })
    @IsString()
    @IsOptional()
    mediaUrl?: string;

    @ApiPropertyOptional({ description: 'Durée du média en secondes' })
    @IsOptional()
    mediaDuree?: number;

    @ApiPropertyOptional({ description: 'Latitude (pour localisation)' })
    @IsOptional()
    latitude?: number;

    @ApiPropertyOptional({ description: 'Longitude (pour localisation)' })
    @IsOptional()
    longitude?: number;
}

export class GetMessagesDto {
    @ApiPropertyOptional({ description: 'Curseur de pagination (ID du dernier message vu)' })
    @IsString()
    @IsOptional()
    cursor?: string;

    @ApiPropertyOptional({ description: 'Nombre de messages à retourner', default: 30 })
    @IsOptional()
    limit?: number;
}
