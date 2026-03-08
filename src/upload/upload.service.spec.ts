import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

// ─── Mock Cloudinary ─────────────────────────────────────────────────────────
// Note: jest.mock is hoisted — use jest.fn() inline, reference via require after

jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload_stream: jest.fn(),
            destroy: jest.fn(),
        },
        api: {
            delete_resources: jest.fn(),
            ping: jest.fn(),
        },
        url: jest.fn((publicId: string) => `https://res.cloudinary.com/test/${publicId}`),
    },
}));

// Get typed references after mock is set up
import { v2 as cloudinary } from 'cloudinary';

const mockUploadStream = cloudinary.uploader.upload_stream as jest.Mock;
const mockDestroy = cloudinary.uploader.destroy as jest.Mock;
const _mockDeleteResources = cloudinary.api.delete_resources as jest.Mock;
const mockPing = cloudinary.api.ping as jest.Mock;
const mockUrl = cloudinary.url as jest.Mock;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildUploadResult() {
    return {
        public_id: 'alloartisan/test-image',
        secure_url: 'https://res.cloudinary.com/test/alloartisan/test-image.jpg',
        width: 1920,
        height: 1080,
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UploadService', () => {
    let service: UploadService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UploadService,
                {
                    provide: ConfigService,
                    useValue: { get: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<UploadService>(UploadService);
        jest.clearAllMocks();
        // Restore default URL mock after clearAllMocks
        mockUrl.mockImplementation(
            (publicId: string) => `https://res.cloudinary.com/test/${publicId}`,
        );
    });

    // ─── uploadImage ─────────────────────────────────────────────────────────

    describe('uploadImage', () => {
        it('should upload an image buffer and return variants', async () => {
            const uploadResult = buildUploadResult();
            mockUploadStream.mockImplementation(
                (_opts: unknown, cb: (err: null, result: typeof uploadResult) => void) => ({
                    end: () => cb(null, uploadResult),
                }),
            );

            const buffer = Buffer.from('fake-image-data');
            const file = {
                buffer,
                originalname: 'test.jpg',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            const result = await service.uploadImage(file, 'test-folder');

            expect(result.publicId).toBe('alloartisan/test-image');
            expect(result.variants).toHaveProperty('thumbnail');
            expect(result.variants).toHaveProperty('medium');
            expect(result.variants).toHaveProperty('original');
        });

        it('should retry on upload failure and throw after max retries', async () => {
            mockUploadStream.mockImplementation((_opts: unknown, cb: (err: Error) => void) => ({
                end: () => cb(new Error('Network error')),
            }));

            const buffer = Buffer.from('fake-image-data');
            const file = {
                buffer,
                originalname: 'test.jpg',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            await expect(service.uploadImage(file)).rejects.toThrow(BadRequestException);
            // 3 retries expected
            expect(mockUploadStream).toHaveBeenCalledTimes(3);
        }, 15000);
    });

    // ─── deleteImage ─────────────────────────────────────────────────────────

    describe('deleteImage', () => {
        it('should delete an image by public ID', async () => {
            mockDestroy.mockResolvedValue({ result: 'ok' });

            await expect(service.deleteImage('alloartisan/test-image')).resolves.toBeUndefined();
            expect(mockDestroy).toHaveBeenCalledWith('alloartisan/test-image');
        });

        it('should throw BadRequestException after max retry failures', async () => {
            mockDestroy.mockRejectedValue(new Error('Cloudinary error'));

            await expect(service.deleteImage('bad-id')).rejects.toThrow(BadRequestException);
            expect(mockDestroy).toHaveBeenCalledTimes(3);
        }, 15000);
    });

    // ─── extractPublicIdFromUrl ───────────────────────────────────────────────

    describe('extractPublicIdFromUrl', () => {
        it('should extract public ID from a basic Cloudinary URL', () => {
            const url =
                'https://res.cloudinary.com/mycloud/image/upload/v1234567890/alloartisan/folder/image.jpg';
            expect(service.extractPublicIdFromUrl(url)).toBe('alloartisan/folder/image');
        });

        it('should extract public ID from URL with transformations', () => {
            const url =
                'https://res.cloudinary.com/mycloud/image/upload/c_fill,w_200/v123/alloartisan/photo.jpg';
            expect(service.extractPublicIdFromUrl(url)).toBe('alloartisan/photo');
        });

        it('should return null for empty string', () => {
            expect(service.extractPublicIdFromUrl('')).toBeNull();
        });

        it('should return null for invalid URL format', () => {
            expect(
                service.extractPublicIdFromUrl('https://not-cloudinary.com/image.jpg'),
            ).toBeNull();
        });

        it('should strip query parameters', () => {
            const url =
                'https://res.cloudinary.com/mycloud/image/upload/v123/alloartisan/image.jpg?_a=ABC123';
            expect(service.extractPublicIdFromUrl(url)).toBe('alloartisan/image');
        });
    });

    // ─── generateVariantUrls ─────────────────────────────────────────────────

    describe('generateVariantUrls', () => {
        it('should generate all required variant URLs', () => {
            const variants = service.generateVariantUrls('alloartisan/test-photo');

            expect(variants).toHaveProperty('thumbnail');
            expect(variants).toHaveProperty('medium');
            expect(variants).toHaveProperty('original');
            expect(variants).toHaveProperty('placeholder');
            expect(variants).toHaveProperty('baseUrl');
        });

        it('should call cloudinary.url with the given publicId', () => {
            service.generateVariantUrls('alloartisan/my-image');

            expect(mockUrl).toHaveBeenCalledWith('alloartisan/my-image', expect.any(Object));
        });
    });

    // ─── healthCheck ─────────────────────────────────────────────────────────

    describe('healthCheck', () => {
        it('should return true if Cloudinary is reachable', async () => {
            mockPing.mockResolvedValue({ status: 'ok' });

            const result = await service.healthCheck();

            expect(result).toBe(true);
        });

        it('should return false if Cloudinary is not reachable', async () => {
            mockPing.mockRejectedValue(new Error('Timeout'));

            const result = await service.healthCheck();

            expect(result).toBe(false);
        });
    });
});
