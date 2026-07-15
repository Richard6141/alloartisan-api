import {
    Injectable,
    Logger,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/common/services';
import { NotificationService } from 'src/notification/notification.service';
import { StatutBooking } from 'src/generated/prisma';
import {
    LivePosition,
    PositionUpdatePayload,
    TrackingPhase,
    TrackingState,
    TRACKING_PHASES,
} from './tracking.types';

/**
 * TrackingService — Suivi temps réel des déplacements artisans (type Uber/Glovo).
 *
 * Principe :
 * - Les positions sont ÉPHÉMÈRES : stockées uniquement dans Redis (TTL 30 min),
 *   jamais en BDD — pas de pollution de données, pas d'historique de déplacement conservé.
 * - Le tracking n'est actif que pour un booking CONFIRMEE ou EN_COURS.
 * - L'ETA est calculé côté serveur (haversine + vitesse moyenne) pour que tous
 *   les clients voient la même estimation.
 */
@Injectable()
export class TrackingService {
    private readonly logger = new Logger(TrackingService.name);

    /** TTL Redis d'une position live (ms) — au-delà, l'artisan est considéré hors ligne */
    private static readonly POSITION_TTL = 30 * 60 * 1000;
    /** TTL Redis de la phase (ms) — couvre une intervention d'une journée */
    private static readonly PHASE_TTL = 24 * 60 * 60 * 1000;
    /** Intervalle minimal entre deux mises à jour de position (ms) — anti-flood */
    private static readonly MIN_UPDATE_INTERVAL = 2000;
    /** Vitesse moyenne par défaut si le GPS ne fournit pas de vitesse : 22 km/h (moto urbaine) */
    private static readonly DEFAULT_SPEED_MS = 6.1;

    private static readonly KEY_POSITION = 'tracking:pos:';
    private static readonly KEY_PHASE = 'tracking:phase:';
    private static readonly KEY_LAST_UPDATE = 'tracking:last:';

    /** Statuts booking pour lesquels le tracking est autorisé */
    private static readonly TRACKABLE_STATUSES: StatutBooking[] = [
        StatutBooking.CONFIRMEE,
        StatutBooking.EN_COURS,
    ];

    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: CacheService,
        private readonly notificationService: NotificationService,
    ) {}

    // ============================================================
    // MISE À JOUR DE POSITION (artisan uniquement)
    // ============================================================

    /**
     * Enregistre la position de l'artisan et calcule distance/ETA vers le lieu
     * d'intervention. Retourne null si l'update est ignorée (anti-flood).
     */
    async updatePosition(
        artisanUserId: string,
        payload: PositionUpdatePayload,
    ): Promise<LivePosition | null> {
        this.validateCoordinates(payload.latitude, payload.longitude);

        // Anti-flood : max 1 update / 2 secondes par booking
        const lastKey = `${TrackingService.KEY_LAST_UPDATE}${payload.bookingId}`;
        const last = await this.cache.get<number>(lastKey);
        const now = Date.now();
        if (last && now - last < TrackingService.MIN_UPDATE_INTERVAL) {
            return null;
        }

        const booking = await this.assertArtisanOwnsTrackableBooking(
            payload.bookingId,
            artisanUserId,
        );

        // Calcul distance + ETA si les coordonnées d'intervention sont connues
        let distanceMetres: number | undefined;
        let etaMinutes: number | undefined;
        if (booking.latitudeIntervention && booking.longitudeIntervention) {
            distanceMetres = Math.round(
                this.haversineMetres(
                    payload.latitude,
                    payload.longitude,
                    Number(booking.latitudeIntervention),
                    Number(booking.longitudeIntervention),
                ),
            );
            const speed =
                payload.speed && payload.speed > 1
                    ? payload.speed
                    : TrackingService.DEFAULT_SPEED_MS;
            etaMinutes = Math.max(1, Math.round(distanceMetres / speed / 60));
        }

        const position: LivePosition = {
            bookingId: payload.bookingId,
            artisanUserId,
            latitude: payload.latitude,
            longitude: payload.longitude,
            heading: payload.heading,
            speed: payload.speed,
            accuracy: payload.accuracy,
            distanceMetres,
            etaMinutes,
            updatedAt: new Date().toISOString(),
        };

        await Promise.all([
            this.cache.set(
                `${TrackingService.KEY_POSITION}${payload.bookingId}`,
                position,
                TrackingService.POSITION_TTL,
            ),
            this.cache.set(lastKey, now, TrackingService.MIN_UPDATE_INTERVAL),
        ]);

        return position;
    }

    // ============================================================
    // CHANGEMENT DE PHASE (EN_ROUTE / ARRIVE / ...)
    // ============================================================

    /**
     * L'artisan annonce sa phase de déplacement. Le client est notifié
     * (push + in-app) pour EN_ROUTE et ARRIVE.
     */
    async setPhase(
        artisanUserId: string,
        bookingId: string,
        phase: TrackingPhase,
    ): Promise<TrackingState> {
        if (!TRACKING_PHASES.includes(phase)) {
            throw new BadRequestException(`Phase invalide: ${String(phase)}`);
        }

        const booking = await this.assertArtisanOwnsTrackableBooking(bookingId, artisanUserId);

        await this.cache.set(
            `${TrackingService.KEY_PHASE}${bookingId}`,
            phase,
            TrackingService.PHASE_TTL,
        );

        // Notifier le client des phases clés (fire-and-forget)
        const artisanNom = booking.artisan.nomEntreprise ?? 'Votre artisan';
        if (phase === 'EN_ROUTE') {
            void this.notificationService.send({
                userId: booking.clientId,
                type: 'SYSTEME',
                titre: '🛵 Votre artisan est en route',
                corps: `${artisanNom} est en route vers le lieu d'intervention. Suivez son déplacement en temps réel.`,
                data: { bookingId, event: 'TRACKING_EN_ROUTE' },
            });
        } else if (phase === 'ARRIVE') {
            void this.notificationService.send({
                userId: booking.clientId,
                type: 'SYSTEME',
                titre: '📍 Votre artisan est arrivé',
                corps: `${artisanNom} est arrivé sur le lieu d'intervention.`,
                data: { bookingId, event: 'TRACKING_ARRIVE' },
            });
        }

        this.logger.log(`Tracking phase: booking=${bookingId} → ${phase}`);
        return this.buildState(bookingId, booking);
    }

    // ============================================================
    // LECTURE DE L'ÉTAT (client ou artisan du booking)
    // ============================================================

    /**
     * Retourne l'état complet du tracking (position + phase + destination).
     * Utilisé au chargement de l'écran de suivi (cold start) et en fallback REST.
     */
    async getTrackingState(bookingId: string, userId: string): Promise<TrackingState> {
        const booking = await this.assertTrackingAccess(bookingId, userId);
        return this.buildState(bookingId, booking);
    }

    /**
     * Vérifie que l'utilisateur (client OU artisan) participe au booking.
     * Retourne le booking pour éviter une seconde requête.
     */
    async assertTrackingAccess(bookingId: string, userId: string) {
        const booking = await this.findBooking(bookingId);
        const isClient = booking.clientId === userId;
        const isArtisan = booking.artisan.userId === userId;
        if (!isClient && !isArtisan) {
            throw new ForbiddenException("Vous ne participez pas à cette réservation");
        }
        return booking;
    }

    // ============================================================
    // HELPERS PRIVÉS
    // ============================================================

    private async buildState(
        bookingId: string,
        booking: Awaited<ReturnType<TrackingService['findBooking']>>,
    ): Promise<TrackingState> {
        const [position, phase] = await Promise.all([
            this.cache.get<LivePosition>(`${TrackingService.KEY_POSITION}${bookingId}`),
            this.cache.get<TrackingPhase>(`${TrackingService.KEY_PHASE}${bookingId}`),
        ]);

        return {
            bookingId,
            phase: phase ?? null,
            position: position ?? null,
            destination:
                booking.latitudeIntervention && booking.longitudeIntervention
                    ? {
                          latitude: Number(booking.latitudeIntervention),
                          longitude: Number(booking.longitudeIntervention),
                      }
                    : null,
        };
    }

    private async findBooking(bookingId: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            select: {
                id: true,
                clientId: true,
                statut: true,
                latitudeIntervention: true,
                longitudeIntervention: true,
                artisan: { select: { id: true, userId: true, nomEntreprise: true } },
            },
        });
        if (!booking) throw new NotFoundException('Réservation non trouvée');
        return booking;
    }

    private async assertArtisanOwnsTrackableBooking(bookingId: string, artisanUserId: string) {
        const booking = await this.findBooking(bookingId);

        if (booking.artisan.userId !== artisanUserId) {
            throw new ForbiddenException("Vous n'êtes pas l'artisan de cette réservation");
        }
        if (!TrackingService.TRACKABLE_STATUSES.includes(booking.statut)) {
            throw new BadRequestException(
                `Tracking indisponible pour une réservation en statut ${booking.statut} — ` +
                    `la réservation doit être CONFIRMEE ou EN_COURS`,
            );
        }
        return booking;
    }

    private validateCoordinates(latitude: number, longitude: number): void {
        if (
            typeof latitude !== 'number' ||
            typeof longitude !== 'number' ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            throw new BadRequestException('Coordonnées GPS invalides');
        }
    }

    /** Distance haversine en mètres entre deux points GPS */
    private haversineMetres(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371000;
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
