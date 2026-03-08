import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { CreateConversationDto, SendMessageDto, GetMessagesDto } from './dto';
import { AtGuard } from 'src/common/guards';
import { GetCurrentUser } from 'src/common/decorators';

@ApiTags('Messagerie')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('messages')
export class MessagingController {
    constructor(private readonly messagingService: MessagingService) {}

    // ─── Conversations ──────────────────────────────────────────────────────

    @ApiOperation({
        summary: 'Creer ou recuperer une conversation',
        description:
            "Idempotent : cree une conversation ou retourne la conversation existante entre le client et l'artisan.",
    })
    @Post('conversations')
    getOrCreateConversation(
        @GetCurrentUser('sub') userId: string,
        @Body() dto: CreateConversationDto,
    ) {
        return this.messagingService.getOrCreateConversation(userId, dto);
    }

    @ApiOperation({
        summary: 'Mes conversations',
        description:
            "Retourne toutes les conversations de l'utilisateur connecte, triees par activite recente.",
    })
    @Get('conversations')
    getMyConversations(@GetCurrentUser('sub') userId: string) {
        return this.messagingService.getMyConversations(userId);
    }

    // ─── Messages ───────────────────────────────────────────────────────────

    @ApiOperation({
        summary: "Messages d'une conversation (pagines)",
        description:
            'Recupere les messages avec pagination curseur. Marque automatiquement les messages recus comme lus.',
    })
    @ApiParam({ name: 'conversationId', description: 'UUID de la conversation' })
    @ApiQuery({
        name: 'cursor',
        required: false,
        description: 'ID du dernier message chargé (pour page suivante)',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Nombre de messages (max 100, defaut 30)',
    })
    @Get('conversations/:conversationId')
    getMessages(
        @GetCurrentUser('sub') userId: string,
        @Param('conversationId', ParseUUIDPipe) conversationId: string,
        @Query() dto: GetMessagesDto,
    ) {
        return this.messagingService.getMessages(conversationId, userId, dto);
    }

    @ApiOperation({
        summary: 'Envoyer un message (fallback REST)',
        description:
            "Permet d'envoyer un message via REST si le WebSocket n'est pas disponible. Le message est persiste et diffuse aux connectes.",
    })
    @ApiParam({ name: 'conversationId', description: 'UUID de la conversation' })
    @Post('conversations/:conversationId')
    sendMessage(
        @GetCurrentUser('sub') userId: string,
        @Param('conversationId', ParseUUIDPipe) conversationId: string,
        @Body() dto: SendMessageDto,
    ) {
        return this.messagingService.sendMessage(conversationId, userId, dto);
    }

    // ─── Lu / Non-lu ────────────────────────────────────────────────────────

    @ApiOperation({
        summary: 'Marquer un message comme lu',
        description: 'Seul le destinataire peut marquer un message comme lu.',
    })
    @ApiParam({ name: 'messageId', description: 'UUID du message' })
    @Patch(':messageId/read')
    markMessageRead(
        @GetCurrentUser('sub') userId: string,
        @Param('messageId', ParseUUIDPipe) messageId: string,
    ) {
        return this.messagingService.markMessageRead(messageId, userId);
    }

    @ApiOperation({
        summary: 'Tout marquer comme lu dans une conversation',
    })
    @ApiParam({ name: 'conversationId', description: 'UUID de la conversation' })
    @Patch('conversations/:conversationId/read-all')
    markAllRead(
        @GetCurrentUser('sub') userId: string,
        @Param('conversationId', ParseUUIDPipe) conversationId: string,
    ) {
        return this.messagingService.markAllRead(conversationId, userId);
    }

    @ApiOperation({
        summary: 'Nombre total de messages non lus',
        description:
            "Compteur global toutes conversations confondues — utile pour le badge de l'icone messagerie.",
    })
    @Get('unread-count')
    getUnreadCount(@GetCurrentUser('sub') userId: string) {
        return this.messagingService.getUnreadCount(userId);
    }
}
