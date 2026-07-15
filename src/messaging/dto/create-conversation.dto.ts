import {
    IsString,
    IsUUID,
    IsOptional,
    IsArray,
    ArrayMaxSize,
    IsNumber,
    Min,
    Max,
    IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
    @ApiPropertyOptional({ description: "ID de l'artisan (contexte CLIENT)" })
    @IsUUID()
    @IsOptional()
    artisanId?: string;

    @ApiPropertyOptional({ description: 'ID du booking associé (optionnel)' })
    @IsUUID()
    @IsOptional()
    bookingId?: string;

    @ApiPropertyOptional({
        enum: ['CLIENT', 'TRAVAIL'],
        default: 'CLIENT',
        description: "TRAVAIL = chat main-d'œuvre (gratuit, hors paywall)",
    })
    @IsOptional()
    @IsIn(['CLIENT', 'TRAVAIL'])
    contexte?: 'CLIENT' | 'TRAVAIL';

    @ApiPropertyOptional({ description: 'userId du travailleur (contexte TRAVAIL)' })
    @IsUUID()
    @IsOptional()
    travailleurUserId?: string;
}

export class EditMessageDto {
    @ApiProperty({ description: 'Nouveau contenu du message', maxLength: 2000 })
    @IsString()
    contenu: string;
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

    @ApiPropertyOptional({ description: 'ID du message auquel on répond (citation)' })
    @IsUUID()
    @IsOptional()
    replyToId?: string;

    @ApiPropertyOptional({
        description: "Forme d'onde du vocal : niveaux 0..1 (max 64 valeurs)",
        type: [Number],
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(64)
    @IsNumber({}, { each: true })
    @Min(0, { each: true })
    @Max(1, { each: true })
    waveform?: number[];

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
