import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PushService } from 'src/push/push.service';
import {
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    HttpException,
} from '@nestjs/common';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
    artisan: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    user: { findMany: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    conversation: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
    },
    message: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
};

/** Fixture artisan complet pour le calcul du verrou paywall */
function buildArtisanGate(overrides = {}) {
    return {
        id: 'artisan-1',
        userId: 'user-artisan',
        abonnementType: 'GRATUIT',
        abonnementExpireAt: null,
        compteurDemandesMoisCourant: 0,
        essaisGratuitsUtilises: 0,
        ...overrides,
    };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildConversation(overrides = {}) {
    return {
        id: 'conv-1',
        clientId: 'client-1',
        artisanId: 'artisan-1',
        bookingId: null,
        debloque: true,
        debloqueAt: new Date(),
        contexte: 'CLIENT',
        lastMessageAt: new Date(),
        createdAt: new Date(),
        messages: [],
        ...overrides,
    };
}

function buildMessage(overrides = {}) {
    return {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'client-1',
        type: 'text',
        contenu: 'Bonjour',
        mediaUrl: null,
        mediaDuree: null,
        latitude: null,
        longitude: null,
        lu: false,
        luAt: null,
        createdAt: new Date(),
        ...overrides,
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MessagingService', () => {
    let service: MessagingService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessagingService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: PushService, useValue: { sendToUser: jest.fn() } },
            ],
        }).compile();

        service = module.get<MessagingService>(MessagingService);
        jest.clearAllMocks();
    });

    // ─── getOrCreateConversation ──────────────────────────────────────────────

    describe('getOrCreateConversation', () => {
        it('should return existing conversation if found', async () => {
            const existingConv = buildConversation();
            mockPrisma.artisan.findUnique.mockResolvedValue({
                id: 'artisan-1',
                userId: 'user-artisan',
            });
            mockPrisma.conversation.findFirst.mockResolvedValue(existingConv);

            const result = await service.getOrCreateConversation('client-1', {
                artisanId: 'artisan-1',
            });

            expect(result).toEqual(existingConv);
            expect(mockPrisma.conversation.create).not.toHaveBeenCalled();
        });

        it('should create a new conversation if none exists', async () => {
            const newConv = buildConversation();
            mockPrisma.artisan.findUnique.mockResolvedValue({
                id: 'artisan-1',
                userId: 'user-artisan',
            });
            mockPrisma.conversation.findFirst.mockResolvedValue(null);
            mockPrisma.conversation.create.mockResolvedValue(newConv);

            const result = await service.getOrCreateConversation('client-1', {
                artisanId: 'artisan-1',
            });

            expect(result).toEqual(newConv);
            expect(mockPrisma.conversation.create).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if artisan does not exist', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(null);

            await expect(
                service.getOrCreateConversation('client-1', { artisanId: 'unknown' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if artisan tries to contact himself', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue({
                id: 'artisan-1',
                userId: 'client-1',
            });

            await expect(
                service.getOrCreateConversation('client-1', { artisanId: 'artisan-1' }),
            ).rejects.toThrow(BadRequestException);
        });

        // MAIN-D'ŒUVRE : chat patron↔travailleur (contexte TRAVAIL)
        it('crée un chat TRAVAIL (artisanId = userId du travailleur)', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: 'w1' });
            mockPrisma.conversation.findFirst.mockResolvedValue(null);
            mockPrisma.conversation.create.mockResolvedValue({ id: 'conv-t', contexte: 'TRAVAIL' });

            const res = await service.getOrCreateConversation('patron1', {
                contexte: 'TRAVAIL',
                travailleurUserId: 'w1',
            } as never);

            expect(res.contexte).toBe('TRAVAIL');
            expect(mockPrisma.conversation.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        clientId: 'patron1',
                        artisanId: 'w1',
                        contexte: 'TRAVAIL',
                    }),
                }),
            );
        });

        it('chat TRAVAIL : refuse de se contacter soi-même', async () => {
            await expect(
                service.getOrCreateConversation('patron1', {
                    contexte: 'TRAVAIL',
                    travailleurUserId: 'patron1',
                } as never),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ─── getMyConversations ───────────────────────────────────────────────────

    describe('getMyConversations', () => {
        beforeEach(() => {
            // Enrichissement des identités client/artisan (deux requêtes groupées)
            mockPrisma.user.findMany.mockResolvedValue([]);
            mockPrisma.artisan.findMany.mockResolvedValue([]);
        });

        it('should return conversations with unreadCount using groupBy', async () => {
            const conv = buildConversation({ id: 'conv-1' });
            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.conversation.findMany.mockResolvedValue([conv]);
            mockPrisma.message.groupBy.mockResolvedValue([
                { conversationId: 'conv-1', _count: { id: 3 } },
            ]);

            const result = await service.getMyConversations('client-1');

            expect(result).toHaveLength(1);
            expect(result[0].unreadCount).toBe(3);
            expect(mockPrisma.message.groupBy).toHaveBeenCalledTimes(1);
        });

        it('should set unreadCount to 0 for conversations with no unread messages', async () => {
            const conv = buildConversation({ id: 'conv-1' });
            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.conversation.findMany.mockResolvedValue([conv]);
            mockPrisma.message.groupBy.mockResolvedValue([]);

            const result = await service.getMyConversations('client-1');

            expect(result[0].unreadCount).toBe(0);
        });

        it('should include artisan conversations if user is artisan', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue({ id: 'artisan-id' });
            mockPrisma.conversation.findMany.mockResolvedValue([]);
            mockPrisma.message.groupBy.mockResolvedValue([]);

            await service.getMyConversations('user-artisan');

            expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            { clientId: 'user-artisan' },
                            { artisanId: 'artisan-id' },
                        ]),
                    }),
                }),
            );
        });
    });

    // ─── getMessages ─────────────────────────────────────────────────────────

    describe('getMessages', () => {
        it('should return paginated messages', async () => {
            const messages = [buildMessage({ id: 'msg-1' }), buildMessage({ id: 'msg-2' })];
            mockPrisma.conversation.findUnique.mockResolvedValue(buildConversation());
            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.message.findMany.mockResolvedValue(messages);
            mockPrisma.message.updateMany.mockResolvedValue({ count: 0 });

            const result = await service.getMessages('conv-1', 'client-1', { limit: 30 });

            expect(result.data).toHaveLength(2);
            expect(result.hasMore).toBe(false);
        });

        it('should mark unread received messages as read', async () => {
            const unreadMsg = buildMessage({ id: 'msg-unread', lu: false, senderId: 'other-user' });
            mockPrisma.conversation.findUnique.mockResolvedValue(buildConversation());
            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.message.findMany.mockResolvedValue([unreadMsg]);
            mockPrisma.message.updateMany.mockResolvedValue({ count: 1 });

            await service.getMessages('conv-1', 'client-1', { limit: 30 });

            expect(mockPrisma.message.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: { in: ['msg-unread'] } } }),
            );
        });

        it('should throw ForbiddenException if user has no access', async () => {
            mockPrisma.conversation.findUnique.mockResolvedValue(buildConversation());
            mockPrisma.artisan.findUnique.mockResolvedValue(null);

            await expect(service.getMessages('conv-1', 'stranger', { limit: 30 })).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should throw NotFoundException if conversation does not exist', async () => {
            mockPrisma.conversation.findUnique.mockResolvedValue(null);

            await expect(service.getMessages('conv-x', 'client-1', { limit: 30 })).rejects.toThrow(
                NotFoundException,
            );
        });

        // PAYWALL : l'artisan non débloqué reçoit un aperçu masqué, pas les messages
        it('should return a locked preview when artisan has not unlocked', async () => {
            mockPrisma.conversation.findUnique.mockResolvedValue(
                buildConversation({ debloque: false, debloqueAt: null }),
            );
            mockPrisma.artisan.findUnique.mockResolvedValue(buildArtisanGate());
            mockPrisma.message.count.mockResolvedValue(4);

            const result = await service.getMessages('conv-1', 'user-artisan', { limit: 30 });

            expect(result.verrouille).toBe(true);
            expect(result.data).toHaveLength(0);
            expect(result.gate?.essaisRestants).toBe(3);
            expect(result.apercu?.nbMessages).toBe(4);
            expect(mockPrisma.message.findMany).not.toHaveBeenCalled();
        });

        // MAIN-D'ŒUVRE : contexte TRAVAIL → jamais verrouillé (artisanId = userId du travailleur)
        it('ne verrouille jamais une conversation de contexte TRAVAIL', async () => {
            mockPrisma.conversation.findUnique.mockResolvedValue(
                buildConversation({
                    debloque: false,
                    debloqueAt: null,
                    contexte: 'TRAVAIL',
                    artisanId: 'user-travailleur',
                }),
            );
            mockPrisma.message.findMany.mockResolvedValue([]);
            mockPrisma.message.updateMany.mockResolvedValue({ count: 0 });

            // Le travailleur (artisanId = son userId) accède sans verrou
            const result = await service.getMessages('conv-1', 'user-travailleur', { limit: 30 });
            expect(result.verrouille).toBe(false);
        });

        // MAIN-D'ŒUVRE : le patron (clientId) accède aussi
        it('contexte TRAVAIL : le patron accède sans verrou', async () => {
            mockPrisma.conversation.findUnique.mockResolvedValue(
                buildConversation({ contexte: 'TRAVAIL', artisanId: 'user-travailleur' }),
            );
            mockPrisma.message.findMany.mockResolvedValue([]);
            mockPrisma.message.updateMany.mockResolvedValue({ count: 0 });

            const result = await service.getMessages('conv-1', 'client-1', { limit: 30 });
            expect(result.verrouille).toBe(false);
        });
    });

    // ─── sendMessage ─────────────────────────────────────────────────────────

    describe('sendMessage', () => {
        it('should send a text message successfully', async () => {
            const msg = buildMessage();
            mockPrisma.conversation.findUnique.mockResolvedValue(buildConversation());
            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.$transaction.mockResolvedValue([msg, {}]);

            const result = await service.sendMessage('conv-1', 'client-1', {
                contenu: 'Bonjour',
            } as any);

            expect(result).toEqual(msg);
        });

        // ANTI-FUITE : un message contenant des coordonnées est BLOQUÉ (pas envoyé)
        it('should BLOCK a message containing contact details', async () => {
            mockPrisma.conversation.findUnique.mockResolvedValue(buildConversation());
            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.user.update.mockResolvedValue({
                tentativesContactBloquees: 1,
                contactSignaleAdmin: false,
            });

            await expect(
                service.sendMessage('conv-1', 'client-1', {
                    contenu: 'Appelle-moi au 97 00 12 34',
                } as any),
            ).rejects.toThrow(HttpException);

            expect(mockPrisma.message.create).not.toHaveBeenCalled();
            expect(mockPrisma.user.update).toHaveBeenCalled(); // tentative enregistrée
        });

        it('should throw BadRequestException if no content and no media', async () => {
            mockPrisma.conversation.findUnique.mockResolvedValue(buildConversation());
            mockPrisma.artisan.findUnique.mockResolvedValue(null);

            await expect(service.sendMessage('conv-1', 'client-1', {} as any)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw ForbiddenException if user has no access', async () => {
            mockPrisma.conversation.findUnique.mockResolvedValue(buildConversation());
            mockPrisma.artisan.findUnique.mockResolvedValue(null);

            await expect(
                service.sendMessage('conv-1', 'stranger', { contenu: 'Hi' } as any),
            ).rejects.toThrow(ForbiddenException);
        });

        // PAYWALL : un artisan non débloqué ne peut pas répondre (402)
        it('should block a locked artisan from replying (402)', async () => {
            mockPrisma.conversation.findUnique.mockResolvedValue(
                buildConversation({ debloque: false, debloqueAt: null }),
            );
            mockPrisma.artisan.findUnique.mockResolvedValue(buildArtisanGate());

            await expect(
                service.sendMessage('conv-1', 'user-artisan', { contenu: 'Salut' } as any),
            ).rejects.toThrow(HttpException);
        });
    });

    // ─── debloquerConversation (paywall) ──────────────────────────────────────

    describe('debloquerConversation', () => {
        it('should unlock via a free trial and consume one', async () => {
            mockPrisma.conversation.findUnique.mockResolvedValue(
                buildConversation({ debloque: false, debloqueAt: null }),
            );
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisanGate({ essaisGratuitsUtilises: 1 }),
            );
            mockPrisma.$transaction.mockResolvedValue([{}, {}]);

            const result = await service.debloquerConversation('conv-1', 'user-artisan');

            expect(result.verrouille).toBe(false);
            expect(result.source).toBe('essai');
            expect(result.gate.essaisRestants).toBe(1); // 3 - (1+1)
            expect(mockPrisma.artisan.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { essaisGratuitsUtilises: { increment: 1 } },
                }),
            );
        });

        it('should unlock via subscription quota once trials are exhausted', async () => {
            mockPrisma.conversation.findUnique.mockResolvedValue(
                buildConversation({ debloque: false, debloqueAt: null }),
            );
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisanGate({
                    essaisGratuitsUtilises: 3,
                    abonnementType: 'STANDARD',
                    abonnementExpireAt: new Date(Date.now() + 86400000),
                    compteurDemandesMoisCourant: 2,
                }),
            );
            mockPrisma.$transaction.mockResolvedValue([{}, {}]);

            const result = await service.debloquerConversation('conv-1', 'user-artisan');

            expect(result.source).toBe('abonnement');
            expect(mockPrisma.artisan.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { compteurDemandesMoisCourant: { increment: 1 } },
                }),
            );
        });

        it('should throw 402 when no trial and no active subscription', async () => {
            mockPrisma.conversation.findUnique.mockResolvedValue(
                buildConversation({ debloque: false, debloqueAt: null }),
            );
            mockPrisma.artisan.findUnique.mockResolvedValue(
                buildArtisanGate({ essaisGratuitsUtilises: 3 }),
            );

            await expect(
                service.debloquerConversation('conv-1', 'user-artisan'),
            ).rejects.toThrow(HttpException);
        });

        it('should be idempotent when already unlocked', async () => {
            mockPrisma.conversation.findUnique.mockResolvedValue(buildConversation());
            mockPrisma.artisan.findUnique.mockResolvedValue(buildArtisanGate());

            const result = await service.debloquerConversation('conv-1', 'user-artisan');

            expect(result.dejaDebloque).toBe(true);
            expect(mockPrisma.$transaction).not.toHaveBeenCalled();
        });

        it('should forbid the client from unlocking', async () => {
            mockPrisma.conversation.findUnique.mockResolvedValue(
                buildConversation({ debloque: false, debloqueAt: null }),
            );
            mockPrisma.artisan.findUnique.mockResolvedValue(buildArtisanGate());

            await expect(
                service.debloquerConversation('conv-1', 'client-1'),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── markMessageRead ─────────────────────────────────────────────────────

    describe('markMessageRead', () => {
        it('should mark a message as read', async () => {
            const msg = buildMessage({ senderId: 'other-user', lu: false });
            const readMsg = { ...msg, lu: true, luAt: new Date() };
            mockPrisma.message.findUnique.mockResolvedValue(msg);
            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.conversation.findFirst.mockResolvedValue(buildConversation());
            mockPrisma.message.update.mockResolvedValue(readMsg);

            const result = await service.markMessageRead('msg-1', 'client-1');

            expect(result.lu).toBe(true);
        });

        it('should throw NotFoundException if message does not exist', async () => {
            mockPrisma.message.findUnique.mockResolvedValue(null);

            await expect(service.markMessageRead('bad-id', 'client-1')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ForbiddenException if sender tries to mark own message', async () => {
            mockPrisma.message.findUnique.mockResolvedValue(buildMessage({ senderId: 'client-1' }));

            await expect(service.markMessageRead('msg-1', 'client-1')).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    // ─── assertConversationAccess ─────────────────────────────────────────────

    describe('assertConversationAccess', () => {
        it('should pass if user is client of the conversation', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.conversation.findFirst.mockResolvedValue(buildConversation());

            await expect(
                service.assertConversationAccess('conv-1', 'client-1'),
            ).resolves.toBeUndefined();
        });

        it('should throw ForbiddenException if user has no access', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.conversation.findFirst.mockResolvedValue(null);

            await expect(service.assertConversationAccess('conv-1', 'stranger')).rejects.toThrow(
                ForbiddenException,
            );
        });
    });
});
