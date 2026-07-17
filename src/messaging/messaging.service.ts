import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PushService } from 'src/push/push.service';
import { CreateConversationDto, SendMessageDto, GetMessagesDto } from './dto';
import {
    PlanAbonnement,
    PLAN_QUOTAS,
    ESSAIS_GRATUITS,
    SEUIL_CONTACT_AVERTISSEMENT,
    SEUIL_CONTACT_SIGNALEMENT,
} from 'src/config/constants';
import { contientContact } from 'src/common/utils/anti-contact.util';

/** Délais des actions (alignés sur les usages type WhatsApp) */
const EDIT_WINDOW_MS = 15 * 60 * 1000; // modifier : 15 minutes
const DELETE_WINDOW_MS = 60 * 60 * 1000; // supprimer pour tous : 1 heure

/** Sélection artisan nécessaire au calcul du verrou paywall */
const ARTISAN_GATE_SELECT = {
    id: true,
    userId: true,
    abonnementType: true,
    abonnementExpireAt: true,
    compteurDemandesMoisCourant: true,
    essaisGratuitsUtilises: true,
} as const;

type ArtisanGate = {
    id: string;
    userId: string;
    abonnementType: string;
    abonnementExpireAt: Date | null;
    compteurDemandesMoisCourant: number;
    essaisGratuitsUtilises: number;
};

/** État du verrou côté artisan : quelle méthode de déblocage, ce qu'il reste */
export interface GateStatus {
    plan: PlanAbonnement;
    methode: 'essai' | 'abonnement';
    essaisRestants: number;
    demandesRestantes: number | null; // null = illimité (GOLD)
    peutDebloquer: boolean;
}

/** Aperçu du message cité, joint à chaque message */
const MESSAGE_REPLY_INCLUDE = {
    replyTo: {
        select: {
            id: true,
            type: true,
            contenu: true,
            mediaUrl: true,
            senderId: true,
            supprime: true,
        },
    },
} as const;

@Injectable()
export class MessagingService {
    private readonly logger = new Logger(MessagingService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly push: PushService,
    ) {}

    /** Aperçu court d'un message pour la notification push (façon WhatsApp). */
    private apercuMessage(dto: SendMessageDto): string {
        switch (dto.type) {
            case 'image':
                return '📷 Photo';
            case 'audio':
                return '🎤 Message vocal';
            case 'video':
                return '🎥 Vidéo';
            case 'location':
                return '📍 Position partagée';
            default:
                return dto.contenu?.trim() || 'Nouveau message';
        }
    }

    // ─── Conversations ─────────────────────────────────────────────────────────

    /**
     * Récupère ou crée une conversation entre un client et un artisan.
     * Idempotent : appeler 2× ne crée pas 2 conversations.
     *
     * Bi-directionnel : si l'appelant EST l'artisan visé, il doit fournir un
     * bookingId — le client de la réservation devient l'interlocuteur.
     */
    async getOrCreateConversation(callerId: string, dto: CreateConversationDto) {
        // ── Main-d'œuvre : chat patron↔travailleur (gratuit, hors paywall) ──
        // En contexte TRAVAIL, la colonne `artisanId` porte le USERID du
        // travailleur (il n'y a pas d'artisan réel). Le patron est `clientId`.
        if (dto.contexte === 'TRAVAIL') {
            const travailleurUserId = dto.travailleurUserId;
            if (!travailleurUserId) {
                throw new BadRequestException('travailleurUserId requis pour un chat de travail');
            }
            if (travailleurUserId === callerId) {
                throw new BadRequestException(
                    'Vous ne pouvez pas démarrer une conversation avec vous-même',
                );
            }
            const cible = await this.prisma.user.findUnique({
                where: { id: travailleurUserId },
                select: { id: true },
            });
            if (!cible) throw new NotFoundException('Travailleur introuvable');

            const existant = await this.prisma.conversation.findFirst({
                where: { clientId: callerId, artisanId: travailleurUserId, contexte: 'TRAVAIL' },
                include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
            });
            if (existant) return existant;

            return this.prisma.conversation.create({
                data: { clientId: callerId, artisanId: travailleurUserId, contexte: 'TRAVAIL' },
                include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
            });
        }

        // ── Contexte CLIENT (client ↔ artisan, soumis au paywall) ──
        const { artisanId, bookingId } = dto;
        if (!artisanId) throw new BadRequestException('artisanId requis');
        let clientId = callerId;

        // Vérifier que l'artisan existe
        const artisan = await this.prisma.artisan.findUnique({
            where: { id: artisanId },
            select: { id: true, userId: true },
        });
        if (!artisan) throw new NotFoundException('Artisan introuvable');

        // L'artisan initie la conversation → le client vient de la réservation
        if (artisan.userId === callerId) {
            if (!bookingId) {
                throw new BadRequestException(
                    'Un artisan doit préciser la réservation (bookingId) pour contacter un client',
                );
            }
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId },
                select: { clientId: true, artisanId: true },
            });
            if (!booking) throw new NotFoundException('Réservation introuvable');
            if (booking.artisanId !== artisan.id) {
                throw new ForbiddenException('Cette réservation ne vous concerne pas');
            }
            clientId = booking.clientId;
        }

        // UNE SEULE conversation par paire (client, artisan) en contexte CLIENT.
        // On NE filtre PAS par bookingId : sinon une conversation ouverte depuis
        // la fiche artisan (sans bookingId) et une autre ouverte depuis une
        // réservation (avec bookingId) créaient DEUX fils pour la même personne.
        // Le bookingId reste une simple métadonnée posée à la création.
        const existing = await this.prisma.conversation.findFirst({
            where: {
                clientId,
                artisanId,
                contexte: 'CLIENT',
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
                contexte: 'CLIENT',
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

        const whereClause = {
            OR: [
                { clientId: userId },
                // Main-d'œuvre : le travailleur est stocké dans artisanId (= son userId)
                { artisanId: userId },
                ...(artisan ? [{ artisanId: artisan.id }] : []),
            ],
        };

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
                        supprime: true,
                        createdAt: true,
                    },
                },
            },
        });

        // Identités des deux parties (pas de relation Prisma sur Conversation —
        // deux requêtes groupées suffisent) : l'app affiche l'interlocuteur
        const clientIds = [...new Set(conversations.map((c) => c.clientId))];
        const artisanIds = [...new Set(conversations.map((c) => c.artisanId))];
        const [clients, artisans] = await Promise.all([
            this.prisma.user.findMany({
                where: { id: { in: clientIds } },
                // Anti-fuite : jamais de téléphone dans la messagerie
                select: { id: true, nom: true, prenom: true, photoUrl: true },
            }),
            this.prisma.artisan.findMany({
                where: { id: { in: artisanIds } },
                select: {
                    id: true,
                    nomEntreprise: true,
                    photoProfilUrl: true,
                    user: {
                        select: {
                            id: true,
                            nom: true,
                            prenom: true,
                            photoUrl: true,
                        },
                    },
                },
            }),
        ]);
        const clientMap = new Map(clients.map((c) => [c.id, c]));
        const artisanMap = new Map(artisans.map((a) => [a.id, a]));

        // Main-d'œuvre : pour les convs TRAVAIL, artisanId porte le userId du
        // travailleur → on le résout en user pour afficher son nom/photo.
        const travailleurUserIds = [
            ...new Set(
                conversations.filter((c) => c.contexte === 'TRAVAIL').map((c) => c.artisanId),
            ),
        ];
        const travailleurs = travailleurUserIds.length
            ? await this.prisma.user.findMany({
                  where: { id: { in: travailleurUserIds } },
                  select: { id: true, nom: true, prenom: true, photoUrl: true },
              })
            : [];
        const travailleurMap = new Map(travailleurs.map((u) => [u.id, u]));

        // Enrichir avec le nombre de messages non lus — une seule requête groupBy
        const conversationIds = conversations.map((c) => c.id);
        const unreadGroups = await this.prisma.message.groupBy({
            by: ['conversationId'],
            where: {
                conversationId: { in: conversationIds },
                lu: false,
                senderId: { not: userId },
            },
            _count: { id: true },
        });
        const unreadMap = new Map(unreadGroups.map((g) => [g.conversationId, g._count.id]));
        const enriched = conversations.map((conv) => {
            // PAYWALL : conversation verrouillée quand l'appelant est l'artisan
            // et qu'il n'a pas encore débloqué → on masque l'aperçu du dernier
            // message (le contenu ne doit jamais fuiter avant paiement).
            const verrouille =
                !!artisan &&
                conv.artisanId === artisan.id &&
                conv.contexte !== 'TRAVAIL' &&
                !conv.debloque;
            const messages = verrouille
                ? conv.messages.map((m) => ({ ...m, contenu: null }))
                : conv.messages;
            // Interlocuteur « artisan » : pour TRAVAIL, c'est le travailleur (user)
            const travailleurUser =
                conv.contexte === 'TRAVAIL' ? travailleurMap.get(conv.artisanId) : null;
            const artisanInfo = travailleurUser
                ? {
                      id: travailleurUser.id,
                      nomEntreprise: null,
                      photoProfilUrl: null,
                      user: travailleurUser,
                  }
                : (artisanMap.get(conv.artisanId) ?? null);
            return {
                ...conv,
                messages,
                verrouille,
                contexte: conv.contexte,
                client: clientMap.get(conv.clientId) ?? null,
                artisan: artisanInfo,
                unreadCount: unreadMap.get(conv.id) ?? 0,
            };
        });

        return enriched;
    }

    // ─── Messages ──────────────────────────────────────────────────────────────

    /**
     * Récupère les messages d'une conversation avec pagination curseur.
     * Curseur-based (plus performant qu'offset sur grandes tables).
     */
    async getMessages(conversationId: string, userId: string, dto: GetMessagesDto) {
        // Vérifier l'appartenance + calculer le rôle (paywall)
        const { conversation, artisan, callerIsArtisan } = await this.getConversationContext(
            conversationId,
            userId,
        );

        // PAYWALL : l'artisan ne lit pas tant qu'il n'a pas débloqué. On renvoie
        // un aperçu masqué (jamais le contenu) + l'état du verrou pour la CTA.
        if (
            callerIsArtisan &&
            artisan &&
            conversation.contexte !== 'TRAVAIL' &&
            !conversation.debloque
        ) {
            const nbMessages = await this.prisma.message.count({ where: { conversationId } });
            return {
                verrouille: true,
                gate: this.gateStatus(artisan),
                apercu: { nbMessages, dernierMessageAt: conversation.lastMessageAt },
                data: [],
                nextCursor: null,
                hasMore: false,
            };
        }

        const limit = Math.min(dto.limit ?? 30, 100); // Max 100 messages par page

        const messages = await this.prisma.message.findMany({
            where: {
                conversationId,
                // Cursor-based pagination : prend les messages AVANT le curseur
                ...(dto.cursor ? { id: { lt: dto.cursor } } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: MESSAGE_REPLY_INCLUDE,
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
            verrouille: false,
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
        const { conversation, artisan, callerIsArtisan } = await this.getConversationContext(
            conversationId,
            senderId,
        );

        // PAYWALL : l'artisan ne peut répondre qu'après avoir débloqué. Le
        // client, lui, écrit librement (c'est sa demande de mise en relation).
        if (
            callerIsArtisan &&
            artisan &&
            conversation.contexte !== 'TRAVAIL' &&
            !conversation.debloque
        ) {
            throw this.paiementRequis(
                'ABONNEMENT_REQUIS',
                'Débloquez cette conversation pour répondre à ce client.',
            );
        }

        // Validation : au moins un contenu ou un média
        if (!dto.contenu && !dto.mediaUrl && dto.type !== 'location') {
            throw new BadRequestException('Un message doit contenir du texte ou un média');
        }

        // ANTI-FUITE : BLOQUER l'envoi si le texte contient une coordonnée
        // (numéro, email, réseau) + sanction graduée. NE s'applique PAS au
        // contexte TRAVAIL (main-d'œuvre gratuite : échange de contact autorisé).
        if (conversation.contexte !== 'TRAVAIL' && contientContact(dto.contenu)) {
            throw await this.bloquerContact(senderId);
        }

        // SÉCURITÉ : n'accepter que les médias hébergés sur NOTRE CDN.
        // Sans ce verrou, n'importe quelle URL (pixel espion, contenu
        // malveillant) pourrait être injectée et rendue chez le destinataire.
        if (dto.mediaUrl) {
            let allowed = false;
            try {
                const url = new URL(dto.mediaUrl);
                allowed = url.protocol === 'https:' && url.hostname === 'res.cloudinary.com';
            } catch {
                allowed = false;
            }
            if (!allowed) {
                throw new BadRequestException(
                    'URL de média non autorisée (utilisez POST /upload/*)',
                );
            }
        }

        // Réponse à un message : il doit appartenir à la MÊME conversation
        if (dto.replyToId) {
            const target = await this.prisma.message.findUnique({
                where: { id: dto.replyToId },
                select: { conversationId: true },
            });
            if (!target || target.conversationId !== conversationId) {
                throw new BadRequestException(
                    "Le message cité n'appartient pas à cette conversation",
                );
            }
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
                    replyToId: dto.replyToId,
                    waveform: dto.waveform,
                },
                include: MESSAGE_REPLY_INCLUDE,
            }),
            this.prisma.conversation.update({
                where: { id: conversationId },
                data: { lastMessageAt: new Date() },
            }),
        ]);

        this.logger.log(`Message envoyé [conv:${conversationId}] par [user:${senderId}]`);

        // Push au destinataire — pour faire SONNER le téléphone même app fermée.
        // Fire-and-forget : ne jamais bloquer/échouer l'envoi du message.
        // (La bannière in-app temps réel, elle, part via la gateway WebSocket.)
        void this.getRecipientInfo(conversationId, senderId)
            .then((info) => {
                if (!info) return;
                return this.push.sendToUser(
                    info.recipientUserId,
                    info.senderNom,
                    this.apercuMessage(dto),
                    { conversationId, senderNom: info.senderNom },
                );
            })
            .catch((e) =>
                this.logger.error(
                    `Push message [conv:${conversationId}] échoué: ${e instanceof Error ? e.message : String(e)}`,
                ),
            );

        return message;
    }

    /**
     * Anti-fuite : enregistre une tentative de partage de coordonnées
     * (compteur + signalement admin au seuil) et retourne l'erreur 400 à lever.
     * La sanction reste « humaine » : au seuil, l'utilisateur est signalé —
     * pas de bannissement automatique (le filtre peut avoir des faux positifs).
     */
    private async bloquerContact(userId: string): Promise<HttpException> {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { tentativesContactBloquees: { increment: 1 } },
            select: { tentativesContactBloquees: true, contactSignaleAdmin: true },
        });
        const n = user.tentativesContactBloquees;

        if (n >= SEUIL_CONTACT_SIGNALEMENT && !user.contactSignaleAdmin) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { contactSignaleAdmin: true },
            });
            this.logger.warn(
                `[ANTI-FUITE] Utilisateur ${userId} SIGNALÉ : ${n} tentatives de partage de contact`,
            );
        }

        const message =
            n >= SEUIL_CONTACT_AVERTISSEMENT
                ? 'Tentatives répétées enregistrées. Le partage de numéro, e-mail ou réseau est interdit sur AlloArtisan et peut entraîner une restriction de votre compte.'
                : 'Les numéros, e-mails et réseaux sont interdits dans la messagerie. Retirez-les pour envoyer votre message.';

        return new HttpException(
            { statusCode: HttpStatus.BAD_REQUEST, code: 'CONTACT_INTERDIT', message },
            HttpStatus.BAD_REQUEST,
        );
    }

    /**
     * Retourne le userId du DESTINATAIRE d'une conversation (l'autre partie)
     * ainsi que le nom lisible de l'expéditeur — pour la livraison temps réel
     * type WhatsApp (bannière + badge, même hors de l'écran de discussion).
     */
    async getRecipientInfo(
        conversationId: string,
        senderId: string,
    ): Promise<{ recipientUserId: string; senderNom: string } | null> {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { clientId: true, artisanId: true, contexte: true },
        });
        if (!conversation) return null;

        // Main-d'œuvre : les deux parties sont des users (clientId = patron,
        // artisanId = userId du travailleur). Destinataire = l'autre partie.
        if (conversation.contexte === 'TRAVAIL') {
            const recipientUserId =
                senderId === conversation.clientId ? conversation.artisanId : conversation.clientId;
            const expediteur = await this.prisma.user.findUnique({
                where: { id: senderId },
                select: { prenom: true, nom: true },
            });
            const senderNom =
                `${expediteur?.prenom ?? ''} ${expediteur?.nom ?? ''}`.trim() || 'Nouveau message';
            return { recipientUserId, senderNom };
        }

        const artisan = await this.prisma.artisan.findUnique({
            where: { id: conversation.artisanId },
            select: { userId: true, nomEntreprise: true },
        });
        if (!artisan) return null;

        const senderIsClient = senderId === conversation.clientId;
        const recipientUserId = senderIsClient ? artisan.userId : conversation.clientId;

        let senderNom = 'Nouveau message';
        if (senderIsClient) {
            const client = await this.prisma.user.findUnique({
                where: { id: conversation.clientId },
                select: { prenom: true, nom: true },
            });
            senderNom = `${client?.prenom ?? ''} ${client?.nom ?? ''}`.trim() || 'Client';
        } else {
            senderNom = artisan.nomEntreprise ?? 'Votre artisan';
        }
        return { recipientUserId, senderNom };
    }

    /**
     * Modifie un message : seul l'AUTEUR, texte uniquement, dans les 15 min,
     * et jamais un message supprimé.
     */
    async editMessage(messageId: string, userId: string, contenu: string) {
        const message = await this.prisma.message.findUnique({ where: { id: messageId } });
        if (!message) throw new NotFoundException('Message introuvable');
        if (message.senderId !== userId) {
            throw new ForbiddenException('Vous ne pouvez modifier que vos propres messages');
        }
        if (message.supprime) throw new BadRequestException('Ce message a été supprimé');
        if (message.type !== 'text') {
            throw new BadRequestException('Seuls les messages texte sont modifiables');
        }
        if (Date.now() - message.createdAt.getTime() > EDIT_WINDOW_MS) {
            throw new BadRequestException('Le délai de modification (15 minutes) est dépassé');
        }

        // ANTI-FUITE : bloquer aussi à la modification (même sanction)
        if (contientContact(contenu)) {
            throw await this.bloquerContact(userId);
        }

        return this.prisma.message.update({
            where: { id: messageId },
            data: { contenu, modifieAt: new Date() },
            include: MESSAGE_REPLY_INCLUDE,
        });
    }

    /**
     * Supprime un message POUR TOUS (soft delete) : seul l'auteur, dans l'heure.
     * Le contenu et les médias sont effacés, la bulle devient « Message supprimé ».
     */
    async deleteMessage(messageId: string, userId: string) {
        const message = await this.prisma.message.findUnique({ where: { id: messageId } });
        if (!message) throw new NotFoundException('Message introuvable');
        if (message.senderId !== userId) {
            throw new ForbiddenException('Vous ne pouvez supprimer que vos propres messages');
        }
        if (message.supprime) return message;
        if (Date.now() - message.createdAt.getTime() > DELETE_WINDOW_MS) {
            throw new BadRequestException('Le délai de suppression (1 heure) est dépassé');
        }

        return this.prisma.message.update({
            where: { id: messageId },
            data: {
                supprime: true,
                contenu: null,
                mediaUrl: null,
                mediaDuree: null,
                latitude: null,
                longitude: null,
            },
            include: MESSAGE_REPLY_INCLUDE,
        });
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

    /**
     * Marque UN message comme « remis » (parvenu au destinataire en ligne).
     * Idempotent. Renvoie {id, conversationId} si l'état a changé, sinon null.
     */
    async markDelivered(
        messageId: string,
    ): Promise<{ id: string; conversationId: string } | null> {
        const msg = await this.prisma.message.findUnique({
            where: { id: messageId },
            select: { id: true, conversationId: true, remis: true },
        });
        if (!msg || msg.remis) return null;
        await this.prisma.message.update({
            where: { id: messageId },
            data: { remis: true, remisAt: new Date() },
        });
        return { id: msg.id, conversationId: msg.conversationId };
    }

    /**
     * À la connexion d'un utilisateur : marque « remis » tous les messages qu'il
     * a reçus et qui ne l'étaient pas encore (envoyés pendant qu'il était hors
     * ligne). Renvoie la liste {id, conversationId} pour prévenir les expéditeurs.
     */
    async marquerRecusCommeRemis(
        userId: string,
    ): Promise<{ id: string; conversationId: string }[]> {
        const artisan = await this.prisma.artisan.findUnique({
            where: { userId },
            select: { id: true },
        });
        const convs = await this.prisma.conversation.findMany({
            where: {
                OR: [
                    { clientId: userId },
                    { artisanId: userId },
                    ...(artisan ? [{ artisanId: artisan.id }] : []),
                ],
            },
            select: { id: true },
        });
        if (convs.length === 0) return [];

        const convIds = convs.map((c) => c.id);
        const aRemettre = await this.prisma.message.findMany({
            where: {
                conversationId: { in: convIds },
                senderId: { not: userId },
                remis: false,
                supprime: false,
            },
            select: { id: true, conversationId: true },
            take: 500,
        });
        if (aRemettre.length === 0) return [];

        await this.prisma.message.updateMany({
            where: { id: { in: aRemettre.map((m) => m.id) } },
            data: { remis: true, remisAt: new Date() },
        });
        return aRemettre;
    }

    // ─── Paywall (anti-désintermédiation) ──────────────────────────────────────

    /**
     * Débloque une conversation pour l'artisan — c'est LE moment de valeur.
     * Le client écrit gratuitement ; l'artisan doit débloquer pour lire et
     * répondre. Consomme d'abord un essai découverte (gratuit, à vie), puis,
     * une fois les essais épuisés, le quota de l'abonnement payant en cours.
     * Sans essai ni quota → 402 (abonnement requis).
     */
    async debloquerConversation(conversationId: string, userId: string) {
        const { conversation, artisan, callerIsArtisan } = await this.getConversationContext(
            conversationId,
            userId,
        );
        if (!callerIsArtisan || !artisan) {
            throw new ForbiddenException("Seul l'artisan peut débloquer une conversation");
        }
        if (conversation.debloque) {
            return { verrouille: false, dejaDebloque: true, gate: this.gateStatus(artisan) };
        }

        const now = new Date();
        const plan = artisan.abonnementType as PlanAbonnement;
        const paidActive =
            plan !== PlanAbonnement.GRATUIT &&
            (!artisan.abonnementExpireAt || artisan.abonnementExpireAt > now);

        // 1. Essais découverte gratuits en priorité (offre de bienvenue)
        if (artisan.essaisGratuitsUtilises < ESSAIS_GRATUITS) {
            await this.prisma.$transaction([
                this.prisma.conversation.update({
                    where: { id: conversationId },
                    data: { debloque: true, debloqueAt: now },
                }),
                this.prisma.artisan.update({
                    where: { id: artisan.id },
                    data: { essaisGratuitsUtilises: { increment: 1 } },
                }),
            ]);
            const gate = this.gateStatus({
                ...artisan,
                essaisGratuitsUtilises: artisan.essaisGratuitsUtilises + 1,
            });
            this.logger.log(
                `Conversation débloquée [conv:${conversationId}] via ESSAI ` +
                    `(${gate.essaisRestants} restants) [artisan:${artisan.id}]`,
            );
            return { verrouille: false, source: 'essai' as const, gate };
        }

        // 2. Sinon, quota de l'abonnement payant en cours
        if (paidActive) {
            const quota = PLAN_QUOTAS[plan];
            const illimite = quota === null;
            if (!illimite && artisan.compteurDemandesMoisCourant >= quota) {
                throw this.paiementRequis(
                    'QUOTA_EPUISE',
                    'Vous avez atteint votre quota de mises en relation ce mois-ci. Passez à un palier supérieur pour continuer.',
                );
            }
            await this.prisma.$transaction([
                this.prisma.conversation.update({
                    where: { id: conversationId },
                    data: { debloque: true, debloqueAt: now },
                }),
                this.prisma.artisan.update({
                    where: { id: artisan.id },
                    data: { compteurDemandesMoisCourant: { increment: 1 } },
                }),
            ]);
            const gate = this.gateStatus({
                ...artisan,
                compteurDemandesMoisCourant: artisan.compteurDemandesMoisCourant + 1,
            });
            this.logger.log(
                `Conversation débloquée [conv:${conversationId}] via ABONNEMENT ${plan} ` +
                    `[artisan:${artisan.id}]`,
            );
            return { verrouille: false, source: 'abonnement' as const, gate };
        }

        // 3. Ni essai ni abonnement actif → paiement requis
        throw this.paiementRequis(
            'ABONNEMENT_REQUIS',
            'Vos essais gratuits sont épuisés. Abonnez-vous pour contacter vos clients.',
        );
    }

    /** Erreur HTTP 402 normalisée pour le paywall (code exploité par l'app) */
    private paiementRequis(code: 'ABONNEMENT_REQUIS' | 'QUOTA_EPUISE', message: string) {
        return new HttpException(
            { statusCode: HttpStatus.PAYMENT_REQUIRED, code, message },
            HttpStatus.PAYMENT_REQUIRED,
        );
    }

    /** Calcule ce qu'il reste à l'artisan pour débloquer (essais puis quota) */
    private gateStatus(artisan: ArtisanGate): GateStatus {
        const plan = artisan.abonnementType as PlanAbonnement;
        const now = new Date();
        const paidActive =
            plan !== PlanAbonnement.GRATUIT &&
            (!artisan.abonnementExpireAt || artisan.abonnementExpireAt > now);
        const essaisRestants = Math.max(0, ESSAIS_GRATUITS - artisan.essaisGratuitsUtilises);

        if (essaisRestants > 0) {
            return {
                plan,
                methode: 'essai',
                essaisRestants,
                demandesRestantes: null,
                peutDebloquer: true,
            };
        }
        if (paidActive) {
            const quota = PLAN_QUOTAS[plan];
            const demandesRestantes =
                quota === null ? null : Math.max(0, quota - artisan.compteurDemandesMoisCourant);
            return {
                plan,
                methode: 'abonnement',
                essaisRestants: 0,
                demandesRestantes,
                peutDebloquer: demandesRestantes === null || demandesRestantes > 0,
            };
        }
        return {
            plan,
            methode: 'abonnement',
            essaisRestants: 0,
            demandesRestantes: 0,
            peutDebloquer: false,
        };
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Charge une conversation et le rôle de l'appelant (client ou artisan).
     * Lève 404/403 si introuvable ou non-membre. Base des vérifs paywall.
     */
    private async getConversationContext(conversationId: string, userId: string) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            select: {
                id: true,
                clientId: true,
                artisanId: true,
                bookingId: true,
                debloque: true,
                debloqueAt: true,
                contexte: true,
                lastMessageAt: true,
                createdAt: true,
            },
        });
        if (!conversation) throw new NotFoundException('Conversation introuvable');

        // Main-d'œuvre : pas d'artisan, pas de paywall. Les deux parties sont des
        // users (clientId = patron, artisanId = userId du travailleur).
        if (conversation.contexte === 'TRAVAIL') {
            const membre = conversation.clientId === userId || conversation.artisanId === userId;
            if (!membre) {
                throw new ForbiddenException('Accès à cette conversation refusé');
            }
            return { conversation, artisan: null, callerIsArtisan: false, callerIsClient: true };
        }

        const artisan = (await this.prisma.artisan.findUnique({
            where: { id: conversation.artisanId },
            select: ARTISAN_GATE_SELECT,
        })) as ArtisanGate | null;

        const callerIsArtisan = !!artisan && artisan.userId === userId;
        const callerIsClient = conversation.clientId === userId;
        if (!callerIsArtisan && !callerIsClient) {
            throw new ForbiddenException('Accès à cette conversation refusé');
        }
        return { conversation, artisan, callerIsArtisan, callerIsClient };
    }

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
                OR: [
                    { clientId: userId },
                    // Main-d'œuvre : le travailleur est stocké dans artisanId (= son userId)
                    { artisanId: userId },
                    ...(artisan ? [{ artisanId: artisan.id }] : []),
                ],
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

        const whereClause = {
            OR: [
                { clientId: userId },
                // Main-d'œuvre : le travailleur est stocké dans artisanId (= son userId)
                { artisanId: userId },
                ...(artisan ? [{ artisanId: artisan.id }] : []),
            ],
        };

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
