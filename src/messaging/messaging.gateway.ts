import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { buildWsOriginValidator } from 'src/common/utils/cors.util';
import { SendMessageDto } from './dto';

/**
 * Gateway WebSocket pour la messagerie temps réel.
 *
 * Namespace : /chat
 * Transport : websocket avec fallback polling
 *
 * Authentification : JWT dans handshake.auth.token (automatique à la connexion)
 *
 * Événements CLIENT → SERVEUR :
 *   join_conversation   { conversationId }
 *   send_message        { conversationId, ...SendMessageDto }
 *   typing_start        { conversationId }
 *   typing_stop         { conversationId }
 *   mark_read           { messageId }
 *
 * Événements SERVEUR → CLIENT :
 *   message:new         message complet
 *   message:read        { messageId, readAt }
 *   typing:start        { userId, conversationId }
 *   typing:stop         { userId, conversationId }
 *   error               { message: string }
 */
@WebSocketGateway({
    namespace: '/chat',
    cors: {
        // Comparaison stricte d'origine (pas de startsWith — bypass par sous-domaine)
        origin: buildWsOriginValidator(),
        credentials: true,
    },
    transports: ['websocket', 'polling'],
})
@Injectable()
export class MessagingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(MessagingGateway.name);

    /** Map userId → Set<socketId> pour gérer les connexions multi-device */
    private readonly connectedUsers = new Map<string, Set<string>>();

    constructor(
        private readonly messagingService: MessagingService,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) {}

    afterInit() {
        this.logger.log('MessagingGateway initialisé — namespace /chat');
    }

    // ─── Connexion / Déconnexion ──────────────────────────────────────────────

    async handleConnection(client: Socket) {
        try {
            const user = await this.authenticateSocket(client);
            client.data.userId = user.sub;
            client.data.role = user.role;

            // Enregistrer dans la map userId → socketIds (multi-device)
            if (!this.connectedUsers.has(user.sub)) {
                this.connectedUsers.set(user.sub, new Set());
            }
            this.connectedUsers.get(user.sub)!.add(client.id);

            // Rejoindre automatiquement la room personnelle (pour les notifs directes)
            await client.join(`user:${user.sub}`);

            this.logger.log(`Client connecté: [user:${user.sub}] [socket:${client.id}]`);
        } catch {
            this.logger.warn(`Connexion refusée : token invalide [socket:${client.id}]`);
            client.emit('error', { message: 'Authentification échouée. Connexion fermée.' });
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
        const userId = (client.data as { userId?: string }).userId;
        if (userId) {
            const sockets = this.connectedUsers.get(userId);
            if (sockets) {
                sockets.delete(client.id);
                if (sockets.size === 0) {
                    this.connectedUsers.delete(userId);
                }
            }
        }
        this.logger.log(`Client déconnecté: [socket:${client.id}]`);
    }

    // ─── Événements entrants ──────────────────────────────────────────────────

    /**
     * Rejoindre une room de conversation.
     * Le client doit rejoindre la room pour recevoir les messages en temps réel.
     */
    @SubscribeMessage('join_conversation')
    async handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { conversationId: string },
    ) {
        try {
            const userId = this.requireUserId(client);
            await this.messagingService.assertConversationAccess(payload.conversationId, userId);

            await client.join(`conv:${payload.conversationId}`);
            this.logger.debug(`[user:${userId}] rejoint [conv:${payload.conversationId}]`);

            client.emit('joined_conversation', { conversationId: payload.conversationId });
        } catch (err) {
            this.emitError(client, err);
        }
    }

    /**
     * Envoyer un message via WebSocket.
     * Le message est persisté en BDD puis broadcasté à toute la room.
     */
    @SubscribeMessage('send_message')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { conversationId: string } & SendMessageDto,
    ) {
        try {
            const userId = this.requireUserId(client);
            const { conversationId, ...dto } = payload;

            const message = await this.messagingService.sendMessage(
                conversationId,
                userId,
                dto as SendMessageDto,
            );

            // Broadcaster à TOUS les membres de la conversation (y compris l'envoyeur)
            this.server.to(`conv:${conversationId}`).emit('message:new', message);

            // Livraison type WhatsApp : prévenir le destinataire OÙ QU'IL SOIT
            // dans l'app (bannière + badge), pas seulement dans la discussion
            void this.notifyRecipient(conversationId, userId, message);

            return { success: true, messageId: message.id };
        } catch (err) {
            this.emitError(client, err);
            return { success: false };
        }
    }

    /**
     * Prévient le destinataire d'un nouveau message dans sa room personnelle
     * (user:{id}) — il le reçoit sur N'IMPORTE QUEL écran de l'app.
     */
    async notifyRecipient(
        conversationId: string,
        senderId: string,
        message: unknown,
    ): Promise<void> {
        try {
            const info = await this.messagingService.getRecipientInfo(conversationId, senderId);
            if (!info) return;
            this.server.to(`user:${info.recipientUserId}`).emit('chat:incoming', {
                conversationId,
                senderNom: info.senderNom,
                message,
            });
        } catch (err) {
            this.logger.warn(
                `notifyRecipient échoué [conv:${conversationId}]: ${err instanceof Error ? err.message : String(err)}`,
            );
        }
    }

    /**
     * Indicateur de saisie — diffuse aux autres membres de la conversation.
     * `mode` distingue la frappe ('text') de l'enregistrement vocal ('audio').
     */
    @SubscribeMessage('typing_start')
    handleTypingStart(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { conversationId: string; mode?: 'text' | 'audio' },
    ) {
        const userId = (client.data as { userId?: string }).userId;
        if (!userId) return;

        // Broadcaster à tous les membres SAUF l'envoyeur
        client.to(`conv:${payload.conversationId}`).emit('typing:start', {
            userId,
            conversationId: payload.conversationId,
            mode: payload.mode ?? 'text',
        });
    }

    /**
     * Arrêt indicateur de saisie.
     */
    @SubscribeMessage('typing_stop')
    handleTypingStop(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { conversationId: string },
    ) {
        const userId = (client.data as { userId?: string }).userId;
        if (!userId) return;

        client.to(`conv:${payload.conversationId}`).emit('typing:stop', {
            userId,
            conversationId: payload.conversationId,
        });
    }

    /**
     * Accusé de lecture d'un message.
     */
    @SubscribeMessage('mark_read')
    async handleMarkRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { messageId: string },
    ) {
        try {
            const userId = this.requireUserId(client);
            const message = await this.messagingService.markMessageRead(payload.messageId, userId);

            // Notifier l'expéditeur que son message a été lu
            this.server.to(`conv:${message.conversationId}`).emit('message:read', {
                messageId: message.id,
                readAt: message.luAt,
                readBy: userId,
            });
        } catch (err) {
            this.emitError(client, err);
        }
    }

    // ─── Méthodes publiques (appelées par d'autres services) ─────────────────

    /**
     * Notifie un utilisateur de manière directe (hors conversation).
     * Utile pour les notifications booking, paiement, etc.
     */
    emitToUser(userId: string, event: string, data: unknown) {
        this.server.to(`user:${userId}`).emit(event, data);
    }

    /**
     * Vérifie si un utilisateur est connecté au WebSocket.
     */
    isUserOnline(userId: string): boolean {
        return this.connectedUsers.has(userId);
    }

    // ─── Helpers privés ──────────────────────────────────────────────────────

    private async authenticateSocket(client: Socket): Promise<{ sub: string; role: string }> {
        // Token dans handshake.auth.token (recommandé) ou query.token (fallback)
        const rawToken =
            (client.handshake.auth as Record<string, unknown>)?.token ??
            client.handshake.query?.token;
        const token = typeof rawToken === 'string' ? rawToken : undefined;

        if (!token) throw new WsException('Token manquant');

        try {
            const payload = await this.jwtService.verifyAsync<{ sub: string; role: string }>(
                token,
                { secret: this.config.getOrThrow('JWT_ACCESS_SECRET') },
            );
            return payload;
        } catch {
            throw new WsException('Token invalide ou expiré');
        }
    }

    private requireUserId(client: Socket): string {
        const userId = (client.data as { userId?: string }).userId;
        if (!userId) throw new WsException('Non authentifié');
        return userId;
    }

    private emitError(client: Socket, err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur interne';
        // Remonter le code métier (ex. paywall ABONNEMENT_REQUIS) si présent
        const response = (err as { getResponse?: () => unknown })?.getResponse?.();
        const code =
            response && typeof response === 'object' && 'code' in response
                ? (response as { code?: string }).code
                : undefined;
        this.logger.error(`WebSocket error: ${message}`);
        client.emit('error', code ? { message, code } : { message });
    }
}
