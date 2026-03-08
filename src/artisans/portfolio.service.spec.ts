// Mock StorageService BEFORE imports — uuid v13 & sharp are ESM-only,
// incompatible with Jest's CommonJS transform. The factory short-circuits parsing.
jest.mock('src/upload/storage.service', () => ({
    StorageService: class MockStorageService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/upload/storage.service';
import { CacheService } from 'src/common/services/cache.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
    artisan: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    booking: {
        findFirst: jest.fn(),
    },
};

const mockStorageService = {
    uploadPortfolioPhoto: jest.fn(),
    deletePortfolioPhoto: jest.fn(),
    extractPublicIdFromUrl: jest.fn(),
};

const mockCacheService = {
    invalidateArtisanProfile: jest.fn(),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ARTISAN_ID = 'artisan-uuid-1';
const USER_ID = 'user-uuid-1';
const OTHER_USER_ID = 'user-uuid-2';

const existingItem = {
    url: 'https://cdn.example.com/portfolio/artisan-uuid-1/img-1/medium.webp',
    type: 'photo',
    caption: 'Travail de plomberie',
    uploadedAt: '2026-02-01T10:00:00.000Z',
};

const artisanBase = {
    id: ARTISAN_ID,
    userId: USER_ID,
    portfolioUrls: [existingItem],
};

const uploadedVariants = {
    thumbnail: 'https://cdn.example.com/portfolio/artisan-uuid-1/img-2/thumbnail.webp',
    medium: 'https://cdn.example.com/portfolio/artisan-uuid-1/img-2/medium.webp',
    original: 'https://cdn.example.com/portfolio/artisan-uuid-1/img-2/original.webp',
    placeholder: 'data:image/webp;base64,ABC',
    publicId: 'img-2-uuid',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PortfolioService', () => {
    let service: PortfolioService;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockPrisma.artisan.update.mockResolvedValue({});
        mockCacheService.invalidateArtisanProfile.mockResolvedValue(undefined);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PortfolioService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: StorageService, useValue: mockStorageService },
                { provide: CacheService, useValue: mockCacheService },
            ],
        }).compile();

        service = module.get<PortfolioService>(PortfolioService);
    });

    // ─── getPortfolio ─────────────────────────────────────────────────────────

    describe('getPortfolio', () => {
        it('should return portfolio with existing items', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(artisanBase);

            const result = await service.getPortfolio(ARTISAN_ID);

            expect(result.artisanId).toBe(ARTISAN_ID);
            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.maxAllowed).toBe(20);
            expect(result.items[0].url).toBe(existingItem.url);
        });

        it('should return empty portfolio when portfolioUrls is null', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue({
                ...artisanBase,
                portfolioUrls: null,
            });

            const result = await service.getPortfolio(ARTISAN_ID);

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('should throw NotFoundException when artisan not found', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(null);

            await expect(service.getPortfolio('not-found')).rejects.toThrow(NotFoundException);
        });
    });

    // ─── addPhoto ─────────────────────────────────────────────────────────────

    describe('addPhoto', () => {
        const buffer = Buffer.from('fake-image-data');
        const dto = { caption: 'Nouvelle photo' };

        it('should add a photo and return updated portfolio', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(artisanBase);
            mockStorageService.uploadPortfolioPhoto.mockResolvedValue(uploadedVariants);

            const result = await service.addPhoto(ARTISAN_ID, USER_ID, buffer, dto);

            expect(mockStorageService.uploadPortfolioPhoto).toHaveBeenCalledWith(
                buffer,
                ARTISAN_ID,
            );
            expect(result.items).toHaveLength(2);
            expect(result.items[1].url).toBe(uploadedVariants.medium);
            expect(result.items[1].caption).toBe('Nouvelle photo');
            expect(result.items[1].type).toBe('photo');
            expect(mockPrisma.artisan.update).toHaveBeenCalledTimes(1);
            expect(mockCacheService.invalidateArtisanProfile).toHaveBeenCalledWith(ARTISAN_ID);
        });

        it('should throw ForbiddenException when not owner', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(artisanBase);

            await expect(service.addPhoto(ARTISAN_ID, OTHER_USER_ID, buffer, dto)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should throw BadRequestException when portfolio is full (20 items)', async () => {
            const fullPortfolio = Array.from({ length: 20 }, (_, i) => ({
                url: `https://cdn.example.com/item-${i}/medium.webp`,
                type: 'photo',
                uploadedAt: '2026-01-01T00:00:00.000Z',
            }));
            mockPrisma.artisan.findUnique.mockResolvedValue({
                ...artisanBase,
                portfolioUrls: fullPortfolio,
            });

            await expect(service.addPhoto(ARTISAN_ID, USER_ID, buffer, dto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should validate bookingId ownership when provided', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(artisanBase);
            mockPrisma.booking.findFirst.mockResolvedValue(null); // booking not found

            await expect(
                service.addPhoto(ARTISAN_ID, USER_ID, buffer, { bookingId: 'fake-booking-id' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should accept valid bookingId', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(artisanBase);
            mockPrisma.booking.findFirst.mockResolvedValue({ id: 'booking-1' });
            mockStorageService.uploadPortfolioPhoto.mockResolvedValue(uploadedVariants);

            const result = await service.addPhoto(ARTISAN_ID, USER_ID, buffer, {
                bookingId: 'booking-1',
            });

            expect(result.items[1].bookingId).toBe('booking-1');
        });
    });

    // ─── deleteItem ───────────────────────────────────────────────────────────

    describe('deleteItem', () => {
        it('should delete item and return updated portfolio', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(artisanBase);
            mockStorageService.extractPublicIdFromUrl.mockReturnValue('img-1-uuid');
            mockStorageService.deletePortfolioPhoto.mockResolvedValue(undefined);

            const result = await service.deleteItem(ARTISAN_ID, USER_ID, existingItem.url);

            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(mockStorageService.deletePortfolioPhoto).toHaveBeenCalledWith(
                ARTISAN_ID,
                'img-1-uuid',
            );
        });

        it('should throw NotFoundException when url not found in portfolio', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(artisanBase);

            await expect(
                service.deleteItem(ARTISAN_ID, USER_ID, 'https://wrong-url.com/img.webp'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should not throw if Supabase delete fails (best-effort)', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(artisanBase);
            mockStorageService.extractPublicIdFromUrl.mockReturnValue('img-1-uuid');
            mockStorageService.deletePortfolioPhoto.mockRejectedValue(new Error('Supabase down'));

            // Ne doit PAS throw
            const result = await service.deleteItem(ARTISAN_ID, USER_ID, existingItem.url);
            expect(result.total).toBe(0);
        });

        it('should throw ForbiddenException when not owner', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(artisanBase);

            await expect(
                service.deleteItem(ARTISAN_ID, OTHER_USER_ID, existingItem.url),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── reorder ──────────────────────────────────────────────────────────────

    describe('reorder', () => {
        const item2 = {
            url: 'https://cdn.example.com/portfolio/artisan-uuid-1/img-2/medium.webp',
            type: 'photo',
            uploadedAt: '2026-02-02T10:00:00.000Z',
        };

        it('should reorder items correctly', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue({
                ...artisanBase,
                portfolioUrls: [existingItem, item2],
            });

            const result = await service.reorder(ARTISAN_ID, USER_ID, {
                urls: [item2.url, existingItem.url], // Inverser l'ordre
            });

            expect(result.items[0].url).toBe(item2.url);
            expect(result.items[1].url).toBe(existingItem.url);
        });

        it('should throw BadRequestException with wrong number of urls', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue({
                ...artisanBase,
                portfolioUrls: [existingItem, item2],
            });

            await expect(
                service.reorder(ARTISAN_ID, USER_ID, { urls: [existingItem.url] }), // Manque item2
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException with unknown url', async () => {
            mockPrisma.artisan.findUnique.mockResolvedValue(artisanBase);

            await expect(
                service.reorder(ARTISAN_ID, USER_ID, { urls: ['https://unknown.com/img.webp'] }),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
