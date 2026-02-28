import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from 'src/notification/notification.service';
import {
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { Role, StatutBooking, TypeBooking } from 'src/generated/prisma';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
    artisan: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
    },
    artisanMetier: {
        findFirst: jest.fn(),
    },
    booking: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
    },
    transaction: {
        aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
};

const mockConfig = {
    get: jest.fn((key: string, def: unknown) => {
        const map: Record<string, unknown> = {
            COMMISSION_RATE: 0.1,
            BOOKING_EXPIRY_HOURS: 24,
            URGENT_BOOKING_EXPIRY_HOURS: 2,
            REVIEW_DELAY_DAYS: 14,
        };
        return map[key] ?? def;
    }),
};

const mockNotificationService = {
    send: jest.fn().mockResolvedValue(undefined),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildArtisan(overrides = {}) {
    return {
        id: 'artisan-id-1',
        userId: 'user-artisan-1',
        statut: 'ACTIF',
        verified: true,
        disponible: true,
        abonnementType: 'STANDARD',
        compteurDemandesMoisCourant: 0,
        accepteUrgences: true,
        noteMoyenne: 4.5,
        nombreAvis: 10,
        tauxCompletion: 90,
        deletedAt: null,
        user: { statut: 'ACTIF' },
        ...overrides,
    };
}

function buildBooking(overrides = {}) {
    return {
        id: 'booking-id-1',
        clientId: 'client-user-1',
        artisanId: 'artisan-id-1',
        metierId: 'metier-id-1',
        statut: StatutBooking.SOUMISE,
        type: TypeBooking.STANDARD,
        titre: 'Réparation fuite',
        description: 'Fuite sous évier',
        adresseIntervention: 'Cotonou',
        latitudeIntervention: null,
        longitudeIntervention: null,
        datePreferee: null,
        dateFin: null,
        dureeEstimeeHeures: null,
        budgetClient: null,
        prixPropose: null,
        prixFinal: null,
        estUrgent: false,
        raisonAnnulation: null,
        accepteAt: null,
        debutAt: null,
        finAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        client: {
            id: 'client-user-1',
            nom: 'Doe',
            prenom: 'John',
            photoUrl: null,
            telephone: null,
        },
        artisan: {
            id: 'artisan-id-1',
            nomEntreprise: 'Plomberie Pro',
            photoProfilUrl: null,
            noteMoyenne: 4.5,
            user: { nom: 'Artisan', prenom: 'Bob', telephone: null },
            userId: 'user-artisan-1',
        },
        metier: {
            id: 'metier-id-1',
            nom: 'Plomberie',
            iconUrl: null,
            categorie: { nom: 'Travaux' },
        },
        transaction: null,
        avis: null,
        ...overrides,
    };
}

const createDto = {
    artisanId: 'artisan-id-1',
    metierId: 'metier-id-1',
    titre: 'Réparation fuite',
    description: 'Fuite sous évier cuisine',
    adresseIntervention: 'Rue X, Cotonou',
    estUrgent: false,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BookingService', () => {
    let service: BookingService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BookingService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: ConfigService, useValue: mockConfig },
                { provide: NotificationService, useValue: mockNotificationService },
            ],
        }).compile();

        service = module.get<BookingService>(BookingService);
    });

    // ─── create ──────────────────────────────────────────────────────────────

    describe('create', () => {
        it('should throw NotFoundException if artisan not found', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue(null);

            await expect(service.create('client-1', createDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if metier not linked to artisan', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue(buildArtisan());
            mockPrisma.artisanMetier.findFirst.mockResolvedValue(null);

            await expect(service.create('client-1', createDto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw ConflictException if active booking exists', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue(buildArtisan());
            mockPrisma.artisanMetier.findFirst.mockResolvedValue({ id: 'am-1' });
            mockPrisma.booking.findFirst.mockResolvedValue(buildBooking());

            await expect(service.create('client-1', createDto)).rejects.toThrow(ConflictException);
        });

        it('should throw BadRequestException when artisan quota exceeded', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue(
                buildArtisan({ abonnementType: 'GRATUIT', compteurDemandesMoisCourant: 5 }),
            );
            mockPrisma.artisanMetier.findFirst.mockResolvedValue({ id: 'am-1' });
            mockPrisma.booking.findFirst.mockResolvedValue(null);

            await expect(service.create('client-1', createDto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw BadRequestException for urgent booking on non-urgent artisan', async () => {
            mockPrisma.artisan.findFirst.mockResolvedValue(
                buildArtisan({ accepteUrgences: false }),
            );
            mockPrisma.artisanMetier.findFirst.mockResolvedValue({ id: 'am-1' });
            mockPrisma.booking.findFirst.mockResolvedValue(null);

            await expect(
                service.create('client-1', { ...createDto, estUrgent: true }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should create booking and send notification on success', async () => {
            const newBooking = buildBooking();
            mockPrisma.artisan.findFirst.mockResolvedValue(buildArtisan());
            mockPrisma.artisanMetier.findFirst.mockResolvedValue({ id: 'am-1' });
            mockPrisma.booking.findFirst.mockResolvedValue(null);
            mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
            mockPrisma.booking.create.mockResolvedValue(newBooking);
            mockPrisma.artisan.update.mockResolvedValue({});
            mockPrisma.artisan.findUnique.mockResolvedValue({ userId: 'user-artisan-1' });

            const result = await service.create('client-1', createDto);

            expect(result).toEqual(newBooking);
            // Notification asynchrone
            expect(mockNotificationService.send).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'BOOKING_NOUVEAU' }),
            );
        });
    });

    // ─── accept ──────────────────────────────────────────────────────────────

    describe('accept', () => {
        it('should throw NotFoundException if booking not found', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(null);

            await expect(service.accept('booking-1', 'user-artisan-1')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ForbiddenException if not the artisan', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(
                buildBooking({ artisan: { userId: 'other-user' } }),
            );

            await expect(service.accept('booking-1', 'user-artisan-1')).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should throw BadRequestException if booking not in SOUMISE state', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(
                buildBooking({ statut: StatutBooking.ACCEPTEE }),
            );

            await expect(service.accept('booking-1', 'user-artisan-1')).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should accept booking and notify client', async () => {
            const soumiseBooking = buildBooking({ statut: StatutBooking.SOUMISE });
            const acceptedBooking = buildBooking({ statut: StatutBooking.ACCEPTEE });

            mockPrisma.booking.findUnique.mockResolvedValue(soumiseBooking);
            mockPrisma.booking.update.mockResolvedValue(acceptedBooking);

            const result = await service.accept('booking-1', 'user-artisan-1');

            expect(result.statut).toBe(StatutBooking.ACCEPTEE);
            expect(mockNotificationService.send).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'BOOKING_ACCEPTE' }),
            );
        });
    });

    // ─── cancelExpiredBookings ───────────────────────────────────────────────

    describe('cancelExpiredBookings', () => {
        it('should cancel expired bookings and return count', async () => {
            mockPrisma.booking.updateMany.mockResolvedValue({ count: 3 });

            const count = await service.cancelExpiredBookings();

            expect(count).toBe(3);
            expect(mockPrisma.booking.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ statut: StatutBooking.ANNULEE }),
                }),
            );
        });

        it('should return 0 if no expired bookings', async () => {
            mockPrisma.booking.updateMany.mockResolvedValue({ count: 0 });

            const count = await service.cancelExpiredBookings();

            expect(count).toBe(0);
        });
    });

    // ─── resetMonthlyCounters ────────────────────────────────────────────────

    describe('resetMonthlyCounters', () => {
        it('should reset compteurDemandesMoisCourant to 0 for all artisans', async () => {
            mockPrisma.artisan.updateMany.mockResolvedValue({ count: 5 });

            await service.resetMonthlyCounters();

            expect(mockPrisma.artisan.updateMany).toHaveBeenCalledWith({
                data: { compteurDemandesMoisCourant: 0 },
            });
        });
    });

    // ─── cancel ──────────────────────────────────────────────────────────────

    describe('cancel', () => {
        it('should throw NotFoundException if booking not found', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(null);

            await expect(
                service.cancel('booking-1', 'client-1', Role.CLIENT, { raison: 'test' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if booking is TERMINEE', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(
                buildBooking({ statut: StatutBooking.TERMINEE, artisan: buildArtisan() }),
            );

            await expect(
                service.cancel('booking-1', 'client-user-1', Role.CLIENT, { raison: 'test' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw ForbiddenException if artisan tries to cancel CONFIRMEE', async () => {
            mockPrisma.booking.findUnique.mockResolvedValue(
                buildBooking({ statut: StatutBooking.CONFIRMEE, artisan: buildArtisan() }),
            );

            await expect(
                service.cancel('booking-1', 'user-artisan-1', Role.ARTISAN, { raison: 'test' }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should cancel SOUMISE booking and decrement artisan counter', async () => {
            const soumiseBooking = buildBooking({
                statut: StatutBooking.SOUMISE,
                artisan: buildArtisan(),
            });
            const cancelledBooking = buildBooking({ statut: StatutBooking.ANNULEE });

            mockPrisma.booking.findUnique.mockResolvedValue(soumiseBooking);
            mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
            mockPrisma.booking.update.mockResolvedValue(cancelledBooking);
            mockPrisma.artisan.update.mockResolvedValue({});
            mockPrisma.artisan.findUnique.mockResolvedValue({ userId: 'user-artisan-1' });

            const result = await service.cancel('booking-1', 'client-user-1', Role.CLIENT, {
                raison: 'changement de plan',
            });

            expect(result.statut).toBe(StatutBooking.ANNULEE);
        });
    });
});
