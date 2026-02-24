import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateConversationDto, SendMessageDto, GetMessagesDto } from './dto';

@Injectable()
export class MessagingService {
    private readonly logger = new Logger(MessagingService.name);

    constructor(private readonly prisma: PrismaService) {}

    // ─── Conversations ─────────────────────────────────────────────────────────

    /**
     * Récupère ou crée une conversation entre un client et un artisan.
     * Idempotent : appeler 2× ne crée pas 2 conversations.
     */
    async getOrCreateConversation(clientId: string, dto: CreateConversationDto) {
        const { artisanId, bookingId } = dto;

        // Vérifier que l'artisan existe
        const artisan = await this.prisma.artisan.findUnique({
            where: { id: artisanId },
            select: { id: true, userId: true },
        });
        if (!artisan) throw new NotFoundException('Artisan introuvable');

        // Éviter qu'un artisan ouvre une conversation avec lui-même
        if (artisan.userId === clientId) {
            throw new BadRequestException('Un artisan ne peut pas se contacter lui-même');
        }

        // Recherche de conversation existante — findFirst ou create (pattern safe)
        const existing = await this.prisma.conversation.findFirst({
            where: {
                clientId,
                artisanId,
                bookingId: bookingId ?? undefined,
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        if (existing) return existing;

        // Créer la conversation si elle n'existe pas encore
        return this.prisma.conversation.create({
            data: {
                clientId,
                artisanId,
                bookingId: bookingId ?? undefined,
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
    }

    /**
     * Récupère toutes les conversations d'un utilisateur (client ou artisan).
     * Tri par lastMessageAt DESC pour afficher les plus récentes en premier.
     */
    async getMyConversations(userId: string) {
        // Chercher l'artisan lié à cet userId (si artisan)
        const artisan = await this.prisma.artisan.findUnique({
            where: { userId },
            select: { id: true },
        });

        const whereClause = artisan
            ? { OR: [{ clientId: userId }, { artisanId: artisan.id }] }
            : { clientId: userId };

        const conversations = await this.prisma.conversation.findMany({
            where: whereClause,
            orderBy: { lastMessageAt: 'desc' },
            include: {
                // Dernier message pour l'aperçu
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        type: true,
                        contenu: true,
                        senderId: true,
                        lu: true,
                        createdAt: true,
                    },
                },
            },
        });

        // Enrichir avec le nombre de messages non lus
        const enriched = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await this.prisma.message.count({
                    where: {
                        conversationId: conv.id,
                        lu: false,
                        // Ne pas compter ses propres messages comme non lus
                        senderId: { not: userId },
                    },
                });
                return { ...conv, unreadCount };
            }),
        );

        return enriched;
    }

    // ─── Messages ──────────────────────────────────────────────────────────────

    /**
     * Récupère les messages d'une conversation avec pagination curseur.
     * Curseur-based (plus performant qu'offset sur grandes tables).
     */
    async getMessages(conversationId: string, userId: string, dto: GetMessagesDto) {
        // Vérifier que l'utilisateur appartient à cette conversation
        await this.assertConversationAccess(conversationId, userId);

        const limit = Math.min(dto.limit ?? 30, 100); // Max 100 messages par page

        const messages = await this.prisma.message.findMany({
            where: {
                conversationId,
                // Cursor-based pagination : prend les messages AVANT le curseur
                ...(dto.cursor ? { id: { lt: dto.cursor } } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        // Marquer automatiquement les messages reçus comme lus
        const unreadIds = messages.filter((m) => !m.lu && m.senderId !== userId).map((m) => m.id);

        if (unreadIds.length > 0) {
            await this.prisma.message.updateMany({
                where: { id: { in: unreadIds } },
                data: { lu: true, luAt: new Date() },
            });
        }

        // Prochain curseur : ID du message le plus ancien retourné
        const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

        return {
            data: messages.reverse(), // Retourner en ordre chronologique
            nextCursor,
            hasMore: nextCursor !== null,
        };
    }

    /**
     * Envoie un message dans une conversation.
     * Valide que le sender est bien membre de la conversation.
     */
    async sendMessage(conversationId: string, senderId: string, dto: SendMessageDto) {
        await this.assertConversationAccess(conversationId, senderId);

        // Validation : au moins un contenu ou un média
        if (!dto.contenu && !dto.mediaUrl && dto.type !== 'location') {
            throw new BadRequestException('Un message doit contenir du texte ou un média');
        }

        // Transaction atomique : créer message + mettre à jour lastMessageAt
        const [message] = await this.prisma.$transaction([
            this.prisma.message.create({
                data: {
                    conversationId,
                    senderId,
                    type: dto.type ?? 'text',
                    contenu: dto.contenu,
                    mediaUrl: dto.mediaUrl,
                    mediaDuree: dto.mediaDuree,
                    latitude: dto.latitude,
                    longitude: dto.longitude,
                },
            }),
            this.prisma.conversation.update({
                where: { id: conversationId },
                data: { lastMessageAt: new Date() },
            }),
        ]);

        this.logger.log(`Message envoyé [conv:${conversationId}] par [user:${senderId}]`);
        return message;
    }

    /**
     * Marque un message précis comme lu.
     * Seul le destinataire peut marquer comme lu.
     */
    async markMessageRead(messageId: string, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { conversation: true },
        });

        if (!message) throw new NotFoundException('Message introuvable');

        // Seul le destinataire peut marquer comme lu
        if (message.senderId === userId) {
            throw new ForbiddenException(
                'Vous ne pouvez pas marquer vos propres messages comme lus',
            );
        }

        await this.assertConversationAccess(message.conversationId, userId);

        return this.prisma.message.update({
            where: { id: messageId },
            data: { lu: true, luAt: new Date() },
        });
    }

    /**
     * Marque tous les messages non lus d'une conversation comme lus.
     */
    async markAllRead(conversationId: string, userId: string) {
        await this.assertConversationAccess(conversationId, userId);

        const result = await this.prisma.message.updateMany({
            where: {
                conversationId,
                lu: false,
                senderId: { not: userId }, // Ne pas marquer ses propres messages
            },
            data: { lu: true, luAt: new Date() },
        });

        return { updated: result.count };
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Vérifie qu'un utilisateur a accès à une conversation.
     * Un utilisateur y a accès s'il en est le client OU l'artisan.
     */
    async assertConversationAccess(conversationId: string, userId: string): Promise<void> {
        const artisan = await this.prisma.artisan.findUnique({
            where: { userId },
            select: { id: true },
        });

        const conversation = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [{ clientId: userId }, ...(artisan ? [{ artisanId: artisan.id }] : [])],
            },
        });

        if (!conversation) {
            throw new ForbiddenException('Accès à cette conversation refusé');
        }
    }

    /**
     * Calcule le nombre total de messages non lus pour un utilisateur.
     */
    async getUnreadCount(userId: string): Promise<number> {
        const artisan = await this.prisma.artisan.findUnique({
            where: { userId },
            select: { id: true },
        });

        const whereClause = artisan
            ? { OR: [{ clientId: userId }, { artisanId: artisan.id }] }
            : { clientId: userId };

        const conversations = await this.prisma.conversation.findMany({
            where: whereClause,
            select: { id: true },
        });

        return this.prisma.message.count({
            where: {
                conversationId: { in: conversations.map((c) => c.id) },
                lu: false,
                senderId: { not: userId },
            },
        });
    }
}
