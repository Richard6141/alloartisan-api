import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import { CreateConversationDto, SendMessageDto, EditMessageDto, GetMessagesDto } from './dto';
import { AtGuard } from 'src/common/guards';
import { GetCurrentUser } from 'src/common/decorators';

@ApiTags('Messagerie')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('messages')
export class MessagingController {
    constructor(
        private readonly messagingService: MessagingService,
        private readonly messagingGateway: MessagingGateway,
    ) {}

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

    @ApiOperation({
        summary: 'Débloquer une conversation (artisan)',
        description:
            "Consomme un essai découverte gratuit (à vie) puis, une fois épuisés, le quota de l'abonnement. Renvoie 402 (ABONNEMENT_REQUIS / QUOTA_EPUISE) si aucun crédit disponible.",
    })
    @ApiParam({ name: 'conversationId', description: 'UUID de la conversation' })
    @Post('conversations/:conversationId/debloquer')
    debloquerConversation(
        @GetCurrentUser('sub') userId: string,
        @Param('conversationId', ParseUUIDPipe) conversationId: string,
    ) {
        return this.messagingService.debloquerConversation(conversationId, userId);
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
    async sendMessage(
        @GetCurrentUser('sub') userId: string,
        @Param('conversationId', ParseUUIDPipe) conversationId: string,
        @Body() dto: SendMessageDto,
    ) {
        const message = await this.messagingService.sendMessage(conversationId, userId, dto);
        // Diffusion temps réel identique au chemin WebSocket : le destinataire
        // connecté reçoit le message instantanément
        this.messagingGateway.server?.to(`conv:${conversationId}`).emit('message:new', message);
        // + bannière/badge où qu'il soit dans l'app (room personnelle)
        void this.messagingGateway.notifyRecipient(conversationId, userId, message);
        return message;
    }

    @ApiOperation({
        summary: 'Modifier un message (auteur uniquement, texte, sous 15 minutes)',
    })
    @ApiParam({ name: 'messageId', description: 'UUID du message' })
    @Patch(':messageId')
    async editMessage(
        @GetCurrentUser('sub') userId: string,
        @Param('messageId', ParseUUIDPipe) messageId: string,
        @Body() dto: EditMessageDto,
    ) {
        const message = await this.messagingService.editMessage(messageId, userId, dto.contenu);
        // Les deux parties voient la modification en direct
        this.messagingGateway.server
            ?.to(`conv:${message.conversationId}`)
            .emit('message:updated', message);
        return message;
    }

    @ApiOperation({
        summary: 'Supprimer un message pour tous (auteur uniquement, sous 1 heure)',
    })
    @ApiParam({ name: 'messageId', description: 'UUID du message' })
    @Delete(':messageId')
    async deleteMessage(
        @GetCurrentUser('sub') userId: string,
        @Param('messageId', ParseUUIDPipe) messageId: string,
    ) {
        const message = await this.messagingService.deleteMessage(messageId, userId);
        this.messagingGateway.server
            ?.to(`conv:${message.conversationId}`)
            .emit('message:deleted', message);
        return message;
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
