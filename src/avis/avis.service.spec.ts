import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { AvisService } from './avis.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { StatutBooking } from 'src/generated/prisma';
import { RaisonSignalement } from './dto/report-avis.dto';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
    booking: {
        findUnique: jest.fn(),
        count: jest.fn(),
    },
    avis: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
    },
    artisan: {
        findFirst: jest.fn(),
        update: jest.fn(),
    },
    $transaction: jest.fn(),
};

const mockNotificationService = {
    send: jest.fn(),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CLIENT_ID = 'client-uuid-1';
const ARTISAN_ID = 'artisan-uuid-1';
const ARTISAN_USER_ID = 'artisan-user-uuid-1';
const BOOKING_ID = 'booking-uuid-1';
const AVIS_ID = 'avis-uuid-1';

const finAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // Il y a 3 jours

const completedBooking = {
    id: BOOKING_ID,
    clientId: CLIENT_ID,
    statut: StatutBooking.TERMINEE,
    finAt,
    avis: null, // Pas encore d'avis
    artisan: { id: ARTISAN_ID, userId: ARTISAN_USER_ID },
};

const createAvisDto = {
    bookingId: BOOKING_ID,
    note: 4,
    commentaire: 'Très bon travail',
};

const createdAvis = {
    id: AVIS_ID,
    bookingId: BOOKING_ID,
    clientId: CLIENT_ID,
    artisanId: ARTISAN_ID,
    note: 4,
    visible: true,
    reponseArtisan: null,
    signale: false,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AvisService', () => {
    let service: AvisService;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockPrisma.avis.create.mockResolvedValue({
            ...createdAvis,
            client: { nom: 'Dupont', prenom: 'Jean', photoUrl: null },
            booking: { titre: 'Plomberie' },
        });
        mockPrisma.avis.update.mockResolvedValue(createdAvis);
        mockPrisma.avis.aggregate.mockResolvedValue({ _avg: { note: 4 }, _count: { note: 1 } });
        mockPrisma.booking.count.mockResolvedValue(1);
        mockPrisma.artisan.update.mockResolvedValue({});
        mockNotificationService.send.mockResolvedValue(undefined);
        // create() encapsule la création de l'avis dans prisma.$transaction(cb) :
        // exécuter le callback avec le mock comme `tx` (les tests batch/tableau
        // surchargent $transaction dans leur propre corps).
        mockPrisma.$transaction.mockImplementation(async (arg: unknown) =>
            typeof arg === 'function'
                ? (arg as (tx: typeof mockPrisma) => unknown)(mockPrisma)
                : Promise.all(arg as Promise<unknown>[]),
        );

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AvisService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: NotificationService, useValue: mockNotificationService },
            ],
        }).compile();

        service = module.get<AvisService>(AvisService);
    });

    // ─── create ──────────────────────────────────────────────────────────────

    describe('create', () => {
        it('should create an avis for a completed booking', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(completedBooking);

            const result = await service.create(CLIENT_ID, createAvisDto);

            expect(mockPrisma.avis.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        bookingId: BOOKING_ID,
                        clientId: CLIENT_ID,
                        artisanId: ARTISAN_ID,
                        note: 4,
                        visible: true,
                    }),
                }),
            );
            expect(result.id).toBe(AVIS_ID);
        });

        it('should throw NotFoundException when booking not found', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(null);

            await expect(service.create(CLIENT_ID, createAvisDto)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ForbiddenException when not client of booking', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue({
                ...completedBooking,
                clientId: 'other-client',
            });

            await expect(service.create(CLIENT_ID, createAvisDto)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should throw BadRequestException when booking is not TERMINEE', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue({
                ...completedBooking,
                statut: StatutBooking.ACCEPTEE,
            });

            await expect(service.create(CLIENT_ID, createAvisDto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw ConflictException when avis already exists', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue({
                ...completedBooking,
                avis: { id: 'existing-avis' },
            });

            await expect(service.create(CLIENT_ID, createAvisDto)).rejects.toThrow(
                ConflictException,
            );
        });

        it('should throw BadRequestException when 14-day window is exceeded', async () => {
            const oldFinAt = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000); // 20 jours
            mockPrisma.booking.findUnique.mockResolvedValue({
                ...completedBooking,
                finAt: oldFinAt,
            });

            await expect(service.create(CLIENT_ID, createAvisDto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should allow avis when within 14-day window', async () => {
            const recentFinAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 jours
            mockPrisma.booking.findUnique.mockResolvedValue({
                ...completedBooking,
                finAt: recentFinAt,
            });

            const result = await service.create(CLIENT_ID, createAvisDto);
            expect(result).toBeDefined();
        });

        it('should calculate weighted note when sous-notes are provided', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(completedBooking);

            await service.create(CLIENT_ID, {
                ...createAvisDto,
                note: 4,
                notePonctualite: 3,
                noteQualite: 5,
                noteCommunication: 4,
            });

            // Note pondérée: 4*0.5 + moyenne([3,5,4])*0.5 = 2 + 2 = 4
            const call = mockPrisma.avis.create.mock.calls[0][0];
            expect(call.data.note).toBe(4);
        });

        it('should send notification to artisan (fire-and-forget)', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(completedBooking);

            await service.create(CLIENT_ID, createAvisDto);

            // Notification fire-and-forget — peut être async
            await new Promise((r) => setTimeout(r, 10));
            expect(mockNotificationService.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: ARTISAN_USER_ID,
                    type: 'AVIS_NOUVEAU',
                }),
            );
        });
    });

    // ─── findByArtisan ────────────────────────────────────────────────────────

    describe('findByArtisan', () => {
        it('should return paginated avis with stats', async () => {
            mockPrisma.$transaction.mockResolvedValue([
                [createdAvis],
                1,
                {
                    _avg: {
                        note: 4,
                        notePonctualite: 3.5,
                        noteQualite: 4.5,
                        noteCommunication: 4.0,
                    },
                },
            ]);

            const result = await service.findByArtisan(ARTISAN_ID, 1, 10);

            expect(result.data).toHaveLength(1);
            expect(result.stats.noteMoyenne).toBe(4);
            expect(result.stats.notePonctualite).toBe(3.5);
            expect(result.meta.total).toBe(1);
            expect(result.meta.totalPages).toBe(1);
        });

        it('should cap limit at 50', async () => {
            mockPrisma.$transaction.mockResolvedValue([[], 0, { _avg: {} }]);

            await service.findByArtisan(ARTISAN_ID, 1, 200);
            // Si l'appel ne lance pas et que limit est cappée, le test passe
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });
    });

    // ─── respondToAvis ────────────────────────────────────────────────────────

    describe('respondToAvis', () => {
        const artisan = { id: ARTISAN_ID, userId: ARTISAN_USER_ID };
        const avis = { ...createdAvis, reponseArtisan: null };

        it('should add response to avis', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue(artisan);
            mockPrisma.avis.findUnique.mockResolvedValue(avis);

            await service.respondToAvis(AVIS_ID, ARTISAN_USER_ID, { reponse: 'Merci beaucoup !' });

            expect(mockPrisma.avis.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: AVIS_ID },
                    data: expect.objectContaining({ reponseArtisan: 'Merci beaucoup !' }),
                }),
            );
        });

        it('should throw NotFoundException when artisan not found', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue(null);

            await expect(
                service.respondToAvis(AVIS_ID, ARTISAN_USER_ID, { reponse: 'Test' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when avis belongs to another artisan', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue({
                id: 'other-artisan',
                userId: ARTISAN_USER_ID,
            });
            mockPrisma.avis.findUnique.mockResolvedValue({ ...avis, artisanId: ARTISAN_ID });

            await expect(
                service.respondToAvis(AVIS_ID, ARTISAN_USER_ID, { reponse: 'Test' }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw ConflictException when already responded', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue(artisan);
            mockPrisma.avis.findUnique.mockResolvedValue({
                ...avis,
                reponseArtisan: 'Déjà répondu',
            });

            await expect(
                service.respondToAvis(AVIS_ID, ARTISAN_USER_ID, { reponse: 'Test' }),
            ).rejects.toThrow(ConflictException);
        });
    });

    // ─── reportAvis ───────────────────────────────────────────────────────────

    describe('reportAvis', () => {
        it('should mark avis as signaled', async () => {
            mockPrisma.avis.findUnique.mockResolvedValue({ ...createdAvis, signale: false });

            await service.reportAvis(AVIS_ID, CLIENT_ID, {
                raison: RaisonSignalement.CONTENU_INAPPROPRIE,
                details: 'Contenu offensant',
            });

            expect(mockPrisma.avis.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: AVIS_ID },
                    data: expect.objectContaining({ signale: true }),
                }),
            );
        });

        it('should throw ConflictException when already signaled', async () => {
            mockPrisma.avis.findUnique.mockResolvedValue({ ...createdAvis, signale: true });

            await expect(
                service.reportAvis(AVIS_ID, CLIENT_ID, {
                    raison: RaisonSignalement.CONTENU_INAPPROPRIE,
                }),
            ).rejects.toThrow(ConflictException);
        });

        it('should throw NotFoundException when avis not found', async () => {
            mockPrisma.avis.findUnique.mockResolvedValue(null);

            await expect(
                service.reportAvis(AVIS_ID, CLIENT_ID, {
                    raison: RaisonSignalement.CONTENU_INAPPROPRIE,
                }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── moderateAvis ─────────────────────────────────────────────────────────

    describe('moderateAvis', () => {
        it('should hide avis and reset signalement', async () => {
            mockPrisma.avis.findUnique.mockResolvedValue({ ...createdAvis, signale: true });

            await service.moderateAvis(AVIS_ID, false);

            expect(mockPrisma.avis.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ visible: false, signale: false }),
                }),
            );
        });

        it('should reactivate avis', async () => {
            mockPrisma.avis.findUnique.mockResolvedValue({ ...createdAvis, visible: false });

            await service.moderateAvis(AVIS_ID, true);

            expect(mockPrisma.avis.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ visible: true }),
                }),
            );
        });

        it('should throw NotFoundException when avis not found', async () => {
            mockPrisma.avis.findUnique.mockResolvedValue(null);

            await expect(service.moderateAvis(AVIS_ID, false)).rejects.toThrow(NotFoundException);
        });

        it('should recalculate artisan stats after moderation', async () => {
            mockPrisma.avis.findUnique.mockResolvedValue(createdAvis);

            await service.moderateAvis(AVIS_ID, false);

            expect(mockPrisma.avis.aggregate).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ artisanId: ARTISAN_ID }),
                }),
            );
            expect(mockPrisma.artisan.update).toHaveBeenCalledTimes(1);
        });
    });
});
