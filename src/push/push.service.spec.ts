// Mock firebase-admin AVANT import (ESM/natif incompatible Jest CommonJS)
jest.mock('firebase-admin', () => ({
    apps: [],
    initializeApp: jest.fn(),
    credential: { cert: jest.fn() },
    messaging: jest.fn(() => ({ sendEachForMulticast: jest.fn() })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PushService } from './push.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
    fcmToken: { findMany: jest.fn(), updateMany: jest.fn() },
};

function buildConfig(firebaseConfigured: boolean) {
    const values: Record<string, unknown> = firebaseConfigured
        ? {
              FIREBASE_PROJECT_ID: 'alloartisan-812f4',
              FIREBASE_CLIENT_EMAIL: 'svc@alloartisan-812f4.iam.gserviceaccount.com',
              FIREBASE_PRIVATE_KEY:
                  '-----BEGIN PRIVATE KEY-----\\nAAA\\n-----END PRIVATE KEY-----\\n',
          }
        : { FIREBASE_PROJECT_ID: 'your-firebase-project-id' };
    return { get: jest.fn((k: string, d?: unknown) => values[k] ?? d) };
}

async function makeService(firebaseConfigured: boolean): Promise<PushService> {
    const module: TestingModule = await Test.createTestingModule({
        providers: [
            PushService,
            { provide: PrismaService, useValue: mockPrisma },
            { provide: ConfigService, useValue: buildConfig(firebaseConfigured) },
        ],
    }).compile();
    const service = module.get<PushService>(PushService);
    service.onModuleInit();
    return service;
}

describe('PushService', () => {
    beforeEach(() => jest.clearAllMocks());

    it('reste désactivé quand Firebase n’est pas configuré', async () => {
        const service = await makeService(false);
        expect(service.isConfigured).toBe(false);
    });

    it('sendToUser est un no-op (aucune lecture de token) si Firebase off', async () => {
        const service = await makeService(false);
        await service.sendToUser('u1', 'Titre', 'Corps');
        expect(mockPrisma.fcmToken.findMany).not.toHaveBeenCalled();
    });

    it('sendToUser ne lève jamais', async () => {
        const service = await makeService(false);
        await expect(service.sendToUser('u1', 'T', 'C')).resolves.not.toThrow();
    });
});
