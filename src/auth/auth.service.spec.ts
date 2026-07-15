import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

describe('AuthService.register', () => {
    const dto: AuthDto = {
        email: 'existing@example.com',
        password: 'Password123!',
    };

    const buildService = (createImpl: () => Promise<unknown>) => {
        const prisma = {
            user: {
                create: jest.fn().mockImplementation(createImpl),
            },
        };

        const service = new AuthService(
            prisma as any,
            {} as any,
            { get: jest.fn() } as any, // ConfigService (ex. AUTO_ACTIVATE_USERS)
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
        );

        return { service, prisma };
    };

    it('should throw ConflictException when email already exists (P2002)', async () => {
        const { service } = buildService(async () => {
            const error = new Error('Unique constraint failed');
            (error as any).code = 'P2002';
            throw error;
        });

        await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictException);
    });
});
