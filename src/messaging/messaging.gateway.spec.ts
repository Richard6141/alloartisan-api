import { Test, TestingModule } from '@nestjs/testing';
import { MessagingGateway } from './messaging.gateway';
import { MessagingService } from './messaging.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockMessagingService = {
    assertConversationAccess: jest.fn(),
    sendMessage: jest.fn(),
    markMessageRead: jest.fn(),
};

const mockJwtService = {
    verifyAsync: jest.fn(),
};

const mockConfig = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
};

function buildSocket(overrides: Record<string, unknown> = {}) {
    return {
        id: 'socket-1',
        data: {},
        handshake: {
            auth: { token: 'valid-token' },
            query: {},
        },
        join: jest.fn().mockResolvedValue(undefined),
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
        disconnect: jest.fn(),
        ...overrides,
    } as any;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MessagingGateway', () => {
    let gateway: MessagingGateway;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessagingGateway,
                { provide: MessagingService, useValue: mockMessagingService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfig },
            ],
        }).compile();

        gateway = module.get<MessagingGateway>(MessagingGateway);
        // Mock the WebSocket server
        (gateway as any).server = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };
        jest.clearAllMocks();
    });

    // ─── handleConnection ─────────────────────────────────────────────────────

    describe('handleConnection', () => {
        it('should authenticate socket with valid JWT token', async () => {
            const client = buildSocket();
            mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', role: 'CLIENT' });

            await gateway.handleConnection(client);

            expect(client.data.userId).toBe('user-1');
            expect(client.join).toHaveBeenCalledWith('user:user-1');
        });

        it('should disconnect socket if token is missing', async () => {
            const client = buildSocket({ handshake: { auth: {}, query: {} } });

            await gateway.handleConnection(client);

            expect(client.disconnect).toHaveBeenCalledWith(true);
            expect(client.emit).toHaveBeenCalledWith(
                'error',
                expect.objectContaining({ message: expect.any(String) }),
            );
        });

        it('should disconnect socket if JWT is invalid', async () => {
            const client = buildSocket();
            mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

            await gateway.handleConnection(client);

            expect(client.disconnect).toHaveBeenCalledWith(true);
        });
    });

    // ─── handleDisconnect ─────────────────────────────────────────────────────

    describe('handleDisconnect', () => {
        it('should remove socket from connectedUsers map', async () => {
            const client = buildSocket();
            mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', role: 'CLIENT' });
            await gateway.handleConnection(client);

            gateway.handleDisconnect(client);

            expect(gateway.isUserOnline('user-1')).toBe(false);
        });
    });

    // ─── handleSendMessage ────────────────────────────────────────────────────

    describe('handleSendMessage', () => {
        it('should send a message and broadcast to conversation room', async () => {
            const client = buildSocket({ data: { userId: 'client-1' } });
            const message = { id: 'msg-1', conversationId: 'conv-1', contenu: 'Bonjour' };
            mockMessagingService.sendMessage.mockResolvedValue(message);

            const result = await gateway.handleSendMessage(client, {
                conversationId: 'conv-1',
                contenu: 'Bonjour',
            });

            expect(result).toEqual({ success: true, messageId: 'msg-1' });
            expect((gateway as any).server.to).toHaveBeenCalledWith('conv:conv-1');
        });

        it('should return failure if sendMessage throws', async () => {
            const client = buildSocket({ data: { userId: 'client-1' } });
            mockMessagingService.sendMessage.mockRejectedValue(new Error('forbidden'));

            const result = await gateway.handleSendMessage(client, {
                conversationId: 'conv-1',
                contenu: 'Hi',
            });

            expect(result).toEqual({ success: false });
        });

        it('should throw WsException if user is not authenticated', async () => {
            const client = buildSocket({ data: {} });

            const result = await gateway.handleSendMessage(client, {
                conversationId: 'conv-1',
                contenu: 'Hi',
            });

            expect(result).toEqual({ success: false });
        });
    });

    // ─── handleTypingStart / handleTypingStop ────────────────────────────────

    describe('handleTypingStart', () => {
        it('should broadcast typing:start to conversation room', () => {
            const client = buildSocket({ data: { userId: 'user-1' } });
            client.to = jest.fn().mockReturnValue({ emit: jest.fn() });

            gateway.handleTypingStart(client, { conversationId: 'conv-1' });

            expect(client.to).toHaveBeenCalledWith('conv:conv-1');
        });

        it('should do nothing if user is not set', () => {
            const client = buildSocket({ data: {} });

            gateway.handleTypingStart(client, { conversationId: 'conv-1' });

            expect(client.to).not.toHaveBeenCalled();
        });
    });

    describe('handleTypingStop', () => {
        it('should broadcast typing:stop to conversation room', () => {
            const client = buildSocket({ data: { userId: 'user-1' } });
            client.to = jest.fn().mockReturnValue({ emit: jest.fn() });

            gateway.handleTypingStop(client, { conversationId: 'conv-1' });

            expect(client.to).toHaveBeenCalledWith('conv:conv-1');
        });
    });

    // ─── emitToUser ───────────────────────────────────────────────────────────

    describe('emitToUser', () => {
        it('should emit an event to the user room', () => {
            const emitMock = jest.fn();
            (gateway as any).server.to = jest.fn().mockReturnValue({ emit: emitMock });

            gateway.emitToUser('user-1', 'notification', { data: 'test' });

            expect((gateway as any).server.to).toHaveBeenCalledWith('user:user-1');
            expect(emitMock).toHaveBeenCalledWith('notification', { data: 'test' });
        });
    });

    // ─── isUserOnline ─────────────────────────────────────────────────────────

    describe('isUserOnline', () => {
        it('should return true if user is connected', async () => {
            const client = buildSocket();
            mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-online', role: 'CLIENT' });
            await gateway.handleConnection(client);

            expect(gateway.isUserOnline('user-online')).toBe(true);
        });

        it('should return false if user is not connected', () => {
            expect(gateway.isUserOnline('unknown-user')).toBe(false);
        });
    });
});
