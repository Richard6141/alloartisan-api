import {
    Injectable,
    Logger,
    NotFoundException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { CreateDemandeExpressDto } from './dto/create-demande-express.dto';

const DISPATCH_TTL_MINUTES = 15;
const DISPATCH_MAX_CANDIDATS = 15;
const DISPATCH_RAYON_DEFAUT_KM = 10;

interface CandidatRow {
    artisan_id: string;
    artisan_user_id: string;
    distance_km: number;
}

/**
 * Mise en relation instantanée (« Demande Express »).
 *
 * Le client diffuse une demande aux artisans PROCHES + VÉRIFIÉS + DISPONIBLES
 * du métier ; chacun est notifié ; le PREMIER qui accepte décroche (claim
 * atomique) et un Booking classique est créé — on réutilise ainsi tout le cycle
 * existant (confirmation, suivi GPS, paywall). Les autres sont prévenus.
 */
@Injectable()
export class DemandesExpressService {
    private readonly logger = new Logger(DemandesExpressService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
    ) {}

    // ─── Client : créer et diffuser une demande express ───────────────────────
    async create(clientId: string, dto: CreateDemandeExpressDto) {
        const metier = await this.prisma.metier.findUnique({
            where: { id: dto.metierId },
            select: { id: true, nom: true },
        });
        if (!metier) throw new NotFoundException('Métier introuvable');

        const rayonKm = dto.rayonKm ?? DISPATCH_RAYON_DEFAUT_KM;
        const candidats = await this.trouverCandidats(
            clientId,
            dto.latitude,
            dto.longitude,
            dto.metierId,
            rayonKm,
        );

        if (candidats.length === 0) {
            throw new NotFoundException(
                'Aucun artisan disponible pour ce métier près de vous. Élargissez la zone ou choisissez un artisan manuellement.',
            );
        }

        const expireAt = new Date(Date.now() + DISPATCH_TTL_MINUTES * 60 * 1000);

        const demande = await this.prisma.demandeExpress.create({
            data: {
                clientId,
                metierId: dto.metierId,
                titre: dto.titre.trim(),
                description: dto.description.trim(),
                adresseIntervention: dto.adresseIntervention.trim(),
                latitude: dto.latitude,
                longitude: dto.longitude,
                estUrgent: dto.estUrgent ?? false,
                rayonKm,
                expireAt,
                candidats: {
                    create: candidats.map((c) => ({
                        artisanId: c.artisan_id,
                        artisanUserId: c.artisan_user_id,
                        distanceKm: c.distance_km,
                    })),
                },
            },
        });

        this.logger.log(
            `Demande express ${demande.id} diffusée à ${candidats.length} artisan(s) | métier=${metier.nom}`,
        );

        // Notifier chaque artisan candidat (push + in-app). Fire-and-forget.
        const titre = dto.estUrgent ? '🚨 Demande urgente près de vous' : '⚡ Nouvelle demande express';
        const corps = `${metier.nom} · ${dto.titre.trim()}`;
        void Promise.all(
            candidats.map((c) =>
                this.notificationService
                    .send({
                        userId: c.artisan_user_id,
                        type: 'BOOKING_NOUVEAU',
                        titre,
                        corps,
                        data: { demandeExpressId: demande.id, screen: 'express' },
                    })
                    .catch(() => undefined),
            ),
        );

        return {
            id: demande.id,
            statut: demande.statut,
            nbArtisansNotifies: candidats.length,
            expireAt: demande.expireAt,
        };
    }

    // ─── Artisan : accepter (le premier gagne) ────────────────────────────────
    async accepter(demandeId: string, artisanUserId: string) {
        const artisan = await this.prisma.artisan.findFirst({
            where: { userId: artisanUserId },
            select: { id: true },
        });
        if (!artisan) throw new ForbiddenException('Profil artisan requis');

        const demande = await this.prisma.demandeExpress.findUnique({ where: { id: demandeId } });
        if (!demande) throw new NotFoundException('Demande introuvable');

        // Doit faire partie des artisans ciblés
        const candidat = await this.prisma.demandeExpressCandidat.findUnique({
            where: { demandeId_artisanId: { demandeId, artisanId: artisan.id } },
            select: { id: true },
        });
        if (!candidat) {
            throw new ForbiddenException("Cette demande ne vous a pas été adressée");
        }

        // CLAIM ATOMIQUE : seul le premier passe de EN_RECHERCHE à ATTRIBUEE.
        const claim = await this.prisma.demandeExpress.updateMany({
            where: { id: demandeId, statut: 'EN_RECHERCHE', expireAt: { gt: new Date() } },
            data: { statut: 'ATTRIBUEE', artisanId: artisan.id },
        });
        if (claim.count === 0) {
            throw new ConflictException('Cette demande a déjà été attribuée ou a expiré.');
        }

        // Créer le Booking classique (statut ACCEPTEE → le client confirme ensuite)
        const booking = await this.prisma.booking.create({
            data: {
                clientId: demande.clientId,
                artisanId: artisan.id,
                metierId: demande.metierId,
                titre: demande.titre,
                description: demande.description,
                adresseIntervention: demande.adresseIntervention,
                latitudeIntervention: demande.latitude,
                longitudeIntervention: demande.longitude,
                type: demande.estUrgent ? 'URGENCE' : 'STANDARD',
                estUrgent: demande.estUrgent,
                statut: 'ACCEPTEE',
                accepteAt: new Date(),
            },
            select: { id: true },
        });

        await this.prisma.demandeExpress.update({
            where: { id: demandeId },
            data: { bookingId: booking.id },
        });

        // Prévenir le client
        void this.notificationService
            .send({
                userId: demande.clientId,
                type: 'BOOKING_ACCEPTE',
                titre: '✅ Un artisan a accepté !',
                corps: 'Un artisan est prêt à intervenir. Confirmez le rendez-vous.',
                data: { bookingId: booking.id },
            })
            .catch(() => undefined);

        // Prévenir les autres candidats que c'est pris (sauf l'artisan gagnant)
        void this.notifierAutresCandidats(demandeId, artisan.id).catch(() => undefined);

        this.logger.log(`Demande express ${demandeId} attribuée à artisan=${artisan.id} → booking=${booking.id}`);

        return { bookingId: booking.id, demandeId };
    }

    // ─── Client : suivre l'état de sa demande (polling) ───────────────────────
    async getOne(id: string, userId: string, isAdmin = false) {
        const demande = await this.prisma.demandeExpress.findUnique({
            where: { id },
            include: { _count: { select: { candidats: true } } },
        });
        if (!demande) throw new NotFoundException('Demande introuvable');
        if (!isAdmin && demande.clientId !== userId) {
            throw new ForbiddenException('Accès interdit à cette demande');
        }
        return {
            id: demande.id,
            statut: demande.statut,
            bookingId: demande.bookingId,
            nbArtisansNotifies: demande._count.candidats,
            expireAt: demande.expireAt,
            createdAt: demande.createdAt,
        };
    }

    // ─── Artisan : mes opportunités express en cours ──────────────────────────
    async mesOpportunites(artisanUserId: string) {
        const artisan = await this.prisma.artisan.findFirst({
            where: { userId: artisanUserId },
            select: { id: true },
        });
        if (!artisan) return [];

        const candidatures = await this.prisma.demandeExpressCandidat.findMany({
            where: {
                artisanId: artisan.id,
                demande: { statut: 'EN_RECHERCHE', expireAt: { gt: new Date() } },
            },
            include: { demande: true },
            orderBy: { createdAt: 'desc' },
            take: 30,
        });

        // Enrichir avec le nom du métier
        const metierIds = [...new Set(candidatures.map((c) => c.demande.metierId))];
        const metiers = await this.prisma.metier.findMany({
            where: { id: { in: metierIds } },
            select: { id: true, nom: true },
        });
        const metierNom = new Map(metiers.map((m) => [m.id, m.nom]));

        return candidatures.map((c) => ({
            demandeId: c.demande.id,
            titre: c.demande.titre,
            description: c.demande.description,
            metier: metierNom.get(c.demande.metierId) ?? null,
            adresseIntervention: c.demande.adresseIntervention,
            estUrgent: c.demande.estUrgent,
            distanceKm: c.distanceKm ? Number(c.distanceKm) : null,
            expireAt: c.demande.expireAt,
            createdAt: c.demande.createdAt,
        }));
    }

    // ─── Client : annuler ─────────────────────────────────────────────────────
    async annuler(id: string, userId: string) {
        const demande = await this.prisma.demandeExpress.findUnique({
            where: { id },
            select: { clientId: true, statut: true },
        });
        if (!demande) throw new NotFoundException('Demande introuvable');
        if (demande.clientId !== userId) throw new ForbiddenException('Accès interdit');
        if (demande.statut !== 'EN_RECHERCHE') {
            throw new ConflictException('Cette demande ne peut plus être annulée.');
        }
        await this.prisma.demandeExpress.update({
            where: { id },
            data: { statut: 'ANNULEE' },
        });
        return { statut: 'ANNULEE' as const };
    }

    // ─── Scheduler : expirer les demandes sans preneur ────────────────────────
    async expirerDemandes(): Promise<number> {
        const aExpirer = await this.prisma.demandeExpress.findMany({
            where: { statut: 'EN_RECHERCHE', expireAt: { lt: new Date() } },
            select: { id: true, clientId: true },
            take: 200,
        });
        if (aExpirer.length === 0) return 0;

        await this.prisma.demandeExpress.updateMany({
            where: { id: { in: aExpirer.map((d) => d.id) } },
            data: { statut: 'EXPIREE' },
        });

        void Promise.all(
            aExpirer.map((d) =>
                this.notificationService
                    .send({
                        userId: d.clientId,
                        type: 'SYSTEME',
                        titre: 'Aucun artisan disponible pour l’instant',
                        corps: 'Personne n’a pu répondre à votre demande express. Réessayez ou choisissez un artisan manuellement.',
                        data: { demandeExpressId: d.id },
                    })
                    .catch(() => undefined),
            ),
        );
        return aExpirer.length;
    }

    // ─── Privé : requête PostGIS des candidats ────────────────────────────────
    private async trouverCandidats(
        clientId: string,
        lat: number,
        lng: number,
        metierId: string,
        rayonKm: number,
    ): Promise<CandidatRow[]> {
        const radiusMeters = rayonKm * 1000;
        try {
            return await this.prisma.$queryRaw<CandidatRow[]>`
                SELECT
                    a.id AS artisan_id,
                    a.user_id AS artisan_user_id,
                    ROUND(
                        (ST_Distance(
                            a.location,
                            ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)::geography
                        )::numeric) / 1000, 2
                    ) AS distance_km
                FROM artisans a
                INNER JOIN users u ON u.id = a.user_id
                WHERE a.statut = 'ACTIF'
                    AND a.verified = true
                    AND a.disponible = true
                    AND a.deleted_at IS NULL
                    AND a.location IS NOT NULL
                    AND u.statut = 'ACTIF'
                    AND a.user_id <> ${clientId}
                    AND ST_DWithin(
                        a.location,
                        ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)::geography,
                        LEAST(${radiusMeters}::float, a.zone_intervention_km::float * 1000)
                    )
                    AND EXISTS (
                        SELECT 1 FROM artisan_metiers am
                        WHERE am.artisan_id = a.id AND am.metier_id = ${metierId}
                    )
                ORDER BY
                    CASE a.abonnement_type
                        WHEN 'GOLD' THEN 0 WHEN 'PREMIUM' THEN 1 WHEN 'STANDARD' THEN 2 ELSE 3
                    END,
                    distance_km ASC
                LIMIT ${DISPATCH_MAX_CANDIDATS}::int
            `;
        } catch (error) {
            this.logger.error(
                `trouverCandidats: échec PostGIS: ${error instanceof Error ? error.message : String(error)}`,
            );
            return [];
        }
    }

    private async notifierAutresCandidats(demandeId: string, gagnantArtisanId: string): Promise<void> {
        const autres = await this.prisma.demandeExpressCandidat.findMany({
            where: { demandeId, artisanId: { not: gagnantArtisanId } },
            select: { artisanUserId: true },
        });
        await Promise.all(
            autres.map((c) =>
                this.notificationService
                    .send({
                        userId: c.artisanUserId,
                        type: 'SYSTEME',
                        titre: 'Demande déjà attribuée',
                        corps: 'Un autre artisan a été plus rapide sur cette demande express.',
                        data: {},
                    })
                    .catch(() => undefined),
            ),
        );
    }
}
