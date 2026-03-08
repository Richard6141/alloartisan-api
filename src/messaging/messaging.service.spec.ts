import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
    artisan: { findUnique: jest.fn() },
    conversation: {
        findFirst: jest.fn(),
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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildConversation(overrides = {}) {
    return {
        id: 'conv-1',
        clientId: 'client-1',
        artisanId: 'artisan-1',
        bookingId: null,
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
            providers: [MessagingService, { provide: PrismaService, useValue: mockPrisma }],
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
    });

    // ─── getMyConversations ───────────────────────────────────────────────────

    describe('getMyConversations', () => {
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
            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.conversation.findFirst.mockResolvedValue(buildConversation());
            mockPrisma.message.findMany.mockResolvedValue(messages);
            mockPrisma.message.updateMany.mockResolvedValue({ count: 0 });

            const result = await service.getMessages('conv-1', 'client-1', { limit: 30 });

            expect(result.data).toHaveLength(2);
            expect(result.hasMore).toBe(false);
        });

        it('should mark unread received messages as read', async () => {
            const unreadMsg = buildMessage({ id: 'msg-unread', lu: false, senderId: 'other-user' });
            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.conversation.findFirst.mockResolvedValue(buildConversation());
            mockPrisma.message.findMany.mockResolvedValue([unreadMsg]);
            mockPrisma.message.updateMany.mockResolvedValue({ count: 1 });

            await service.getMessages('conv-1', 'client-1', { limit: 30 });

            expect(mockPrisma.message.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: { in: ['msg-unread'] } } }),
            );
        });

        it('should throw ForbiddenException if user has no access', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.conversation.findFirst.mockResolvedValue(null);

            await expect(service.getMessages('conv-1', 'stranger', { limit: 30 })).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    // ─── sendMessage ─────────────────────────────────────────────────────────

    describe('sendMessage', () => {
        it('should send a text message successfully', async () => {
            const msg = buildMessage();
            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.conversation.findFirst.mockResolvedValue(buildConversation());
            mockPrisma.$transaction.mockResolvedValue([msg, {}]);

            const result = await service.sendMessage('conv-1', 'client-1', { contenu: 'Bonjour' });

            expect(result).toEqual(msg);
        });

        it('should throw BadRequestException if no content and no media', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.conversation.findFirst.mockResolvedValue(buildConversation());

            await expect(service.sendMessage('conv-1', 'client-1', {} as any)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw ForbiddenException if user has no access', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(null);
            mockPrisma.conversation.findFirst.mockResolvedValue(null);

            await expect(
                service.sendMessage('conv-1', 'stranger', { contenu: 'Hi' }),
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
