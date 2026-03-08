import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Role, StatutBooking, TypeBooking } from 'src/generated/prisma';
import { CreateBookingDto, SearchBookingDto, ProposePriceDto, CancelBookingDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationTemplates } from 'src/notification/notification.types';

export interface BookingClientRelation {
    id: string;
    email?: string;
    nom: string | null;
    prenom: string | null;
    telephone: string | null;
    photoUrl?: string | null;
}

export interface BookingArtisanRelation {
    id: string;
    userId?: string;
    nomEntreprise: string | null;
    photoProfilUrl: string | null;
    noteMoyenne?: Prisma.Decimal;
    user?: { nom: string | null; prenom: string | null; telephone: string | null };
}

export interface BookingMetierRelation {
    id: string;
    nom: string;
    slug?: string;
    iconUrl?: string | null;
    categorie?: { nom: string } | null;
}

export interface BookingWithRelations {
    id: string;
    statut: StatutBooking;
    clientId: string;
    artisanId: string;
    metierId: string;
    type: TypeBooking;
    titre: string;
    description: string;
    adresseIntervention: string;
    latitudeIntervention: Prisma.Decimal | null;
    longitudeIntervention: Prisma.Decimal | null;
    datePreferee: Date | null;
    dateFin: Date | null;
    dureeEstimeeHeures: Prisma.Decimal | null;
    budgetClient: Prisma.Decimal | null;
    prixPropose: Prisma.Decimal | null;
    prixFinal: Prisma.Decimal | null;
    estUrgent: boolean;
    raisonAnnulation: string | null;
    accepteAt: Date | null;
    debutAt: Date | null;
    finAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    client?: BookingClientRelation;
    artisan?: BookingArtisanRelation;
    metier?: BookingMetierRelation;
    transaction?: Record<string, unknown>;
    avis?: Record<string, unknown>;
}

@Injectable()
export class BookingService {
    private readonly logger = new Logger(BookingService.name);
    private readonly commissionRate: number;
    private readonly bookingExpiryHours: number;
    private readonly urgentExpiryHours: number;
    private readonly reviewDelayDays: number;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly notificationService: NotificationService,
    ) {
        this.commissionRate = config.get<number>('COMMISSION_RATE', 0.1);
        this.bookingExpiryHours = config.get<number>('BOOKING_EXPIRY_HOURS', 24);
        this.urgentExpiryHours = config.get<number>('URGENT_BOOKING_EXPIRY_HOURS', 2);
        this.reviewDelayDays = config.get<number>('REVIEW_DELAY_DAYS', 14);
    }

    // ============================================================
    // CRÉATION — Client crée une demande de réservation
    // ============================================================

    async create(clientId: string, dto: CreateBookingDto): Promise<BookingWithRelations> {
        // 1. Vérifier que l'artisan existe, est actif et disponible
        const artisan = await this.prisma.artisan.findFirst({
            where: {
                id: dto.artisanId,
                statut: 'ACTIF',
                verified: true,
                disponible: true,
                deletedAt: null,
            },
            include: {
                user: { select: { statut: true } },
            },
        });

        if (!artisan) {
            throw new NotFoundException('Artisan non trouvé, indisponible ou non vérifié');
        }

        // 2. Vérifier que le métier appartient à l'artisan
        const artisanMetier = await this.prisma.artisanMetier.findFirst({
            where: { artisanId: dto.artisanId, metierId: dto.metierId },
        });

        if (!artisanMetier) {
            throw new BadRequestException("Ce métier n'est pas proposé par cet artisan");
        }

        // 3. Règle métier : un client ne peut avoir qu'un booking ACTIF par artisan
        const activeBooking = await this.prisma.booking.findFirst({
            where: {
                clientId,
                artisanId: dto.artisanId,
                statut: {
                    in: [
                        'SOUMISE',
                        'ACCEPTEE',
                        'PRIX_PROPOSE',
                        'CONTRE_OFFRE',
                        'CONFIRMEE',
                        'EN_COURS',
                    ],
                },
            },
        });

        if (activeBooking) {
            throw new ConflictException(
                "Vous avez déjà une réservation active avec cet artisan. Terminez-la avant d'en créer une nouvelle.",
            );
        }

        // 4. Vérifier quota artisan selon abonnement
        const limites: Record<string, number> = { GRATUIT: 5, STANDARD: 30, PREMIUM: 9999 };
        const limite = limites[artisan.abonnementType] ?? 5;
        if (artisan.compteurDemandesMoisCourant >= limite) {
            throw new BadRequestException(
                'Cet artisan a atteint son quota mensuel de demandes. Réessayez le mois prochain.',
            );
        }

        // 5. Vérifier cohérence urgence / disponibilité
        if (dto.estUrgent && !artisan.accepteUrgences) {
            throw new BadRequestException("Cet artisan n'accepte pas les demandes urgentes");
        }

        // 6. Créer la réservation dans une transaction Prisma
        const booking = await this.prisma.$transaction(async (tx) => {
            const newBooking = await tx.booking.create({
                data: {
                    clientId,
                    artisanId: dto.artisanId,
                    metierId: dto.metierId,
                    titre: dto.titre,
                    description: dto.description,
                    adresseIntervention: dto.adresseIntervention,
                    latitudeIntervention: dto.latitudeIntervention,
                    longitudeIntervention: dto.longitudeIntervention,
                    datePreferee: dto.datePreferee ? new Date(dto.datePreferee) : null,
                    budgetClient: dto.budgetClient,
                    type: dto.type ?? TypeBooking.STANDARD,
                    estUrgent: dto.estUrgent ?? false,
                    dureeEstimeeHeures: dto.dureeEstimeeHeures,
                    statut: StatutBooking.SOUMISE,
                },
                include: this.bookingInclude(),
            });

            // Incrémenter le compteur mensuel de l'artisan
            await tx.artisan.update({
                where: { id: dto.artisanId },
                data: { compteurDemandesMoisCourant: { increment: 1 } },
            });

            return newBooking;
        });

        this.logger.log(
            `Booking créé: ${booking.id} | Client: ${clientId} | Artisan: ${dto.artisanId}`,
        );

        // Notifier l'artisan de la nouvelle demande (fire-and-forget)
        const client = booking.client;
        const clientNom = client ? `${client.prenom} ${client.nom}` : 'Un client';
        const template = NotificationTemplates.bookingNouveauArtisan(clientNom, dto.titre);

        // Récupérer l'userId de l'artisan
        const artisanData = await this.prisma.artisan.findUnique({
            where: { id: dto.artisanId },
            select: { userId: true },
        });

        if (artisanData) {
            void this.notificationService.send({
                userId: artisanData.userId,
                type: 'BOOKING_NOUVEAU',
                titre: template.titre,
                corps: template.corps,
                data: { bookingId: booking.id, clientId },
            });
        }

        return booking as BookingWithRelations;
    }

    // ============================================================
    // LISTE — Mes réservations (client ou artisan, selon rôle)
    // ============================================================

    async findMine(userId: string, userRole: Role, dto: SearchBookingDto) {
        const page = Math.max(1, dto?.page ?? 1);
        const limit = Math.min(50, Math.max(1, dto?.limit ?? 10));
        const skip = (page - 1) * limit;

        const where: any = {};

        if (userRole === Role.CLIENT) {
            where.clientId = userId;
        } else if (userRole === Role.ARTISAN) {
            const artisan = await this.prisma.artisan.findFirst({ where: { userId } });
            if (!artisan) throw new NotFoundException('Profil artisan non trouvé');
            where.artisanId = artisan.id;
        } else if (userRole === Role.ADMIN) {
            // Admin voit tout — pas de filtre userId
        }

        if (dto?.statut) where.statut = dto.statut;
        if (dto?.type) where.type = dto.type;

        const [bookings, total] = await this.prisma.$transaction([
            this.prisma.booking.findMany({
                where,
                include: this.bookingInclude(),
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.booking.count({ where }),
        ]);

        return {
            data: bookings,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    // DÉTAIL — Un booking spécifique (avec vérification ownership)
    // ============================================================

    async findOne(id: string, userId: string, userRole: Role): Promise<BookingWithRelations> {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: this.bookingInclude(),
        });

        if (!booking) throw new NotFoundException('Réservation non trouvée');

        // Vérification ownership
        await this.checkOwnership(booking, userId, userRole);

        return booking as BookingWithRelations;
    }

    // ============================================================
    // ACCEPTER — Artisan accepte la demande
    // ============================================================

    async accept(bookingId: string, artisanUserId: string): Promise<BookingWithRelations> {
        const booking = await this.findBookingForArtisan(bookingId, artisanUserId);

        if (booking.statut !== StatutBooking.SOUMISE) {
            throw new BadRequestException(
                `Impossible d'accepter : statut actuel "${booking.statut}"`,
            );
        }

        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                statut: StatutBooking.ACCEPTEE,
                accepteAt: new Date(),
            },
            include: this.bookingInclude(),
        });

        this.logger.log(`Booking accepté: ${bookingId}`);

        // Notifier le client
        const artisanUser = (updated as any).artisan?.user;
        const artisanNom = artisanUser ? `${artisanUser.prenom} ${artisanUser.nom}` : "L'artisan";
        const tpl = NotificationTemplates.bookingAccepteClient(artisanNom);
        void this.notificationService.send({
            userId: (updated as any).clientId,
            type: 'BOOKING_ACCEPTE',
            titre: tpl.titre,
            corps: tpl.corps,
            data: { bookingId },
        });

        return updated as BookingWithRelations;
    }

    // ============================================================
    // PROPOSER UN PRIX — Artisan propose un prix après visite
    // ============================================================

    async proposePrice(
        bookingId: string,
        artisanUserId: string,
        dto: ProposePriceDto,
    ): Promise<BookingWithRelations> {
        const booking = await this.findBookingForArtisan(bookingId, artisanUserId);

        if (!['SOUMISE', 'ACCEPTEE', 'CONTRE_OFFRE'].includes(booking.statut)) {
            throw new BadRequestException(
                `Impossible de proposer un prix : statut actuel "${booking.statut}"`,
            );
        }

        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                statut: StatutBooking.PRIX_PROPOSE,
                prixPropose: dto.prixPropose,
                dureeEstimeeHeures: dto.dureeEstimeeHeures,
            },
            include: this.bookingInclude(),
        });

        this.logger.log(`Prix proposé: ${bookingId} | Montant: ${dto.prixPropose} FCFA`);

        // Notifier le client du devis
        const artU = (updated as any).artisan?.user;
        const artNom = artU ? `${artU.prenom} ${artU.nom}` : "L'artisan";
        const tplPrix = NotificationTemplates.prixProposeClient(artNom, Number(dto.prixPropose));
        void this.notificationService.send({
            userId: (updated as any).clientId,
            type: 'BOOKING_ACCEPTE',
            titre: tplPrix.titre,
            corps: tplPrix.corps,
            data: { bookingId, prixPropose: String(dto.prixPropose) },
        });

        return updated as BookingWithRelations;
    }

    // ============================================================
    // CONFIRMER LE PRIX — Client accepte le devis artisan
    // ============================================================

    async confirmPrice(bookingId: string, clientId: string): Promise<BookingWithRelations> {
        const booking = await this.findBookingForClient(bookingId, clientId);

        if (booking.statut !== StatutBooking.PRIX_PROPOSE) {
            throw new BadRequestException(
                `Impossible de confirmer : statut actuel "${booking.statut}"`,
            );
        }

        if (!booking.prixPropose) {
            throw new BadRequestException('Aucun prix proposé à confirmer');
        }

        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                statut: StatutBooking.CONFIRMEE,
                prixFinal: booking.prixPropose,
            },
            include: this.bookingInclude(),
        });

        this.logger.log(`Prix confirmé: ${bookingId} | Montant final: ${booking.prixPropose} FCFA`);

        // Notifier l'artisan
        const artisanForNotif = await this.prisma.artisan.findUnique({
            where: { id: (updated as any).artisanId },
            select: { userId: true },
        });
        const clientU = (updated as any).client;
        const clientNomConfirm = clientU ? `${clientU.prenom} ${clientU.nom}` : 'Le client';
        const tplConfirm = NotificationTemplates.prixConfirmeArtisan(
            clientNomConfirm,
            Number(booking.prixPropose),
        );
        if (artisanForNotif) {
            void this.notificationService.send({
                userId: artisanForNotif.userId,
                type: 'BOOKING_ACCEPTE',
                titre: tplConfirm.titre,
                corps: tplConfirm.corps,
                data: { bookingId, prixFinal: String(booking.prixPropose) },
            });
        }

        return updated as BookingWithRelations;
    }

    // ============================================================
    // DÉMARRER — Artisan démarre l'intervention
    // ============================================================

    async start(bookingId: string, artisanUserId: string): Promise<BookingWithRelations> {
        const booking = await this.findBookingForArtisan(bookingId, artisanUserId);

        if (booking.statut !== StatutBooking.CONFIRMEE) {
            throw new BadRequestException(
                `Impossible de démarrer : statut actuel "${booking.statut}". Le client doit confirmer le prix.`,
            );
        }

        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                statut: StatutBooking.EN_COURS,
                debutAt: new Date(),
            },
            include: this.bookingInclude(),
        });

        this.logger.log(`Intervention démarrée: ${bookingId}`);

        // Notifier le client
        const artU2 = (updated as any).artisan?.user;
        const artNom2 = artU2 ? `${artU2.prenom} ${artU2.nom}` : "L'artisan";
        const tplStart = NotificationTemplates.interventionDemarree(artNom2);
        void this.notificationService.send({
            userId: (updated as any).clientId,
            type: 'BOOKING_ACCEPTE',
            titre: tplStart.titre,
            corps: tplStart.corps,
            data: { bookingId },
        });

        return updated as BookingWithRelations;
    }

    // ============================================================
    // TERMINER — Artisan marque l'intervention comme terminée
    // ============================================================

    async complete(bookingId: string, artisanUserId: string): Promise<BookingWithRelations> {
        const booking = await this.findBookingForArtisan(bookingId, artisanUserId);

        if (booking.statut !== StatutBooking.EN_COURS) {
            throw new BadRequestException(
                `Impossible de terminer : statut actuel "${booking.statut}"`,
            );
        }

        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                statut: StatutBooking.TERMINEE,
                finAt: new Date(),
            },
            include: this.bookingInclude(),
        });

        this.logger.log(`Intervention terminée: ${bookingId}`);

        // Notifier le client (invitation à laisser un avis)
        const artU3 = (updated as any).artisan?.user;
        const artNom3 = artU3 ? `${artU3.prenom} ${artU3.nom}` : "L'artisan";
        const tplComplete = NotificationTemplates.interventionTerminee(artNom3);
        void this.notificationService.send({
            userId: (updated as any).clientId,
            type: 'AVIS_NOUVEAU',
            titre: tplComplete.titre,
            corps: tplComplete.corps,
            data: { bookingId },
        });

        return updated as BookingWithRelations;
    }

    // ============================================================
    // ANNULER — Client ou Artisan annule (avec règles métier)
    // ============================================================

    async cancel(
        bookingId: string,
        userId: string,
        userRole: Role,
        dto: CancelBookingDto,
    ): Promise<BookingWithRelations> {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { artisan: true },
        });

        if (!booking) throw new NotFoundException('Réservation non trouvée');

        // Vérification ownership
        await this.checkOwnership(booking, userId, userRole);

        // Statuts annulables
        const annulableStatuts: StatutBooking[] = [
            StatutBooking.SOUMISE,
            StatutBooking.ACCEPTEE,
            StatutBooking.PRIX_PROPOSE,
            StatutBooking.CONTRE_OFFRE,
            StatutBooking.CONFIRMEE,
        ];

        if (!annulableStatuts.includes(booking.statut)) {
            throw new BadRequestException(
                `Impossible d'annuler une réservation avec le statut "${booking.statut}"`,
            );
        }

        // Artisan ne peut pas annuler si statut CONFIRMEE (pénalité potentielle)
        if (userRole === Role.ARTISAN && booking.statut === StatutBooking.CONFIRMEE) {
            throw new ForbiddenException(
                'Vous ne pouvez pas annuler une réservation confirmée. Contactez le support.',
            );
        }

        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    statut: StatutBooking.ANNULEE,
                    raisonAnnulation: dto.raison,
                },
                include: this.bookingInclude(),
            });

            // Décrémenter le compteur artisan si annulé rapidement (booking SOUMISE)
            if (booking.statut === StatutBooking.SOUMISE) {
                await tx.artisan.update({
                    where: { id: booking.artisanId },
                    data: { compteurDemandesMoisCourant: { decrement: 1 } },
                });
            }

            return result;
        });

        this.logger.log(`Booking annulé: ${bookingId} | Raison: ${dto.raison ?? 'Non précisée'}`);

        // Notifier l'autre partie
        const parQui = userRole === Role.CLIENT ? 'le client' : "l'artisan";
        const tplCancel = NotificationTemplates.bookingAnnule(parQui, dto.raison);

        // Notifier l'artisan si annulé par le client (et vice-versa)
        const artisanForCancel = await this.prisma.artisan.findUnique({
            where: { id: updated.artisanId },
            select: { userId: true },
        });

        if (userRole === Role.CLIENT && artisanForCancel) {
            void this.notificationService.send({
                userId: artisanForCancel.userId,
                type: 'BOOKING_REFUSE',
                titre: tplCancel.titre,
                corps: tplCancel.corps,
                data: { bookingId },
            });
        } else if (userRole === Role.ARTISAN) {
            void this.notificationService.send({
                userId: updated.clientId,
                type: 'BOOKING_REFUSE',
                titre: tplCancel.titre,
                corps: tplCancel.corps,
                data: { bookingId },
            });
        }

        return updated as BookingWithRelations;
    }

    // ============================================================
    // STATISTIQUES ARTISAN
    // ============================================================

    async getArtisanStats(artisanUserId: string) {
        const artisan = await this.prisma.artisan.findFirst({
            where: { userId: artisanUserId },
        });

        if (!artisan) throw new NotFoundException('Profil artisan non trouvé');

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [statsByStatut, monthlyCount, lastMonthCount] = await this.prisma.$transaction([
            this.prisma.booking.groupBy({
                by: ['statut'],
                where: { artisanId: artisan.id },
                _count: { statut: true },
            }),
            this.prisma.booking.count({
                where: { artisanId: artisan.id, createdAt: { gte: startOfMonth } },
            }),
            this.prisma.booking.count({
                where: {
                    artisanId: artisan.id,
                    createdAt: { gte: startOfLastMonth, lt: startOfMonth },
                },
            }),
        ]);

        const statsMap = statsByStatut.reduce(
            (acc, curr) => ({ ...acc, [curr.statut]: curr._count.statut }),
            {} as Record<string, number>,
        );

        const totalRevenu = await this.prisma.transaction.aggregate({
            where: { artisanId: artisan.id, statut: 'COMPLETEE' },
            _sum: { montantArtisan: true },
        });

        return {
            artisanId: artisan.id,
            parStatut: statsMap,
            moisCourant: monthlyCount,
            moisPrecedent: lastMonthCount,
            evolution: lastMonthCount
                ? Math.round(((monthlyCount - lastMonthCount) / lastMonthCount) * 100)
                : null,
            noteMoyenne: Number(artisan.noteMoyenne),
            nombreAvis: artisan.nombreAvis,
            tauxCompletion: Number(artisan.tauxCompletion),
            revenuTotal: Number(totalRevenu._sum.montantArtisan ?? 0),
            quotaRestant: this.getQuotaRestant(artisan),
        };
    }

    // ============================================================
    // SCHEDULER : Annuler les bookings expirés automatiquement
    // ============================================================

    async cancelExpiredBookings(): Promise<number> {
        const now = new Date();

        // Bookings SOUMIS depuis plus de 24h (ou 2h si urgent)
        const expiredStandard = new Date(now.getTime() - this.bookingExpiryHours * 60 * 60 * 1000);
        const expiredUrgent = new Date(now.getTime() - this.urgentExpiryHours * 60 * 60 * 1000);

        const result = await this.prisma.booking.updateMany({
            where: {
                statut: StatutBooking.SOUMISE,
                OR: [
                    { estUrgent: false, createdAt: { lt: expiredStandard } },
                    { estUrgent: true, createdAt: { lt: expiredUrgent } },
                ],
            },
            data: {
                statut: StatutBooking.ANNULEE,
                raisonAnnulation: 'Annulation automatique : délai de réponse artisan dépassé',
            },
        });

        if (result.count > 0) {
            this.logger.log(
                `Scheduler: ${result.count} booking(s) expirés annulés automatiquement`,
            );
        }

        return result.count;
    }

    // ============================================================
    // SCHEDULER : Réinitialiser compteurs mensuels (1er du mois)
    // ============================================================

    async resetMonthlyCounters(): Promise<void> {
        await this.prisma.artisan.updateMany({
            data: { compteurDemandesMoisCourant: 0 },
        });
        this.logger.log('Scheduler: Compteurs mensuels réinitialisés');
    }

    // ============================================================
    // HELPERS PRIVÉS
    // ============================================================

    private async findBookingForArtisan(bookingId: string, artisanUserId: string): Promise<any> {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { artisan: { select: { userId: true } } },
        });

        if (!booking) throw new NotFoundException('Réservation non trouvée');

        if ((booking as any).artisan?.userId !== artisanUserId) {
            throw new ForbiddenException("Vous n'êtes pas l'artisan de cette réservation");
        }

        return booking;
    }

    private async findBookingForClient(bookingId: string, clientId: string): Promise<any> {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
        });

        if (!booking) throw new NotFoundException('Réservation non trouvée');

        if (booking.clientId !== clientId) {
            throw new ForbiddenException("Vous n'êtes pas le client de cette réservation");
        }

        return booking;
    }

    private async checkOwnership(booking: any, userId: string, userRole: Role): Promise<void> {
        if (userRole === Role.ADMIN) return; // Admin voit tout

        let isOwner = false;

        if (userRole === Role.CLIENT) {
            isOwner = booking.clientId === userId;
        } else if (userRole === Role.ARTISAN) {
            const artisan = await this.prisma.artisan.findFirst({ where: { userId } });
            isOwner = artisan ? booking.artisanId === artisan.id : false;
        }

        if (!isOwner) {
            throw new ForbiddenException('Accès interdit à cette réservation');
        }
    }

    private getQuotaRestant(artisan: any): number {
        const limites: Record<string, number> = { GRATUIT: 5, STANDARD: 30, PREMIUM: 9999 };
        const limite = limites[artisan.abonnementType] ?? 5;
        return Math.max(0, limite - artisan.compteurDemandesMoisCourant);
    }

    private bookingInclude() {
        return {
            client: {
                select: {
                    id: true,
                    nom: true,
                    prenom: true,
                    photoUrl: true,
                    telephone: true,
                },
            },
            artisan: {
                select: {
                    id: true,
                    nomEntreprise: true,
                    photoProfilUrl: true,
                    noteMoyenne: true,
                    user: {
                        select: { nom: true, prenom: true, telephone: true },
                    },
                },
            },
            metier: {
                select: {
                    id: true,
                    nom: true,
                    iconUrl: true,
                    categorie: { select: { nom: true } },
                },
            },
            transaction: {
                select: { id: true, statut: true, montant: true, provider: true },
            },
            avis: {
                select: { id: true, note: true, commentaire: true, createdAt: true },
            },
        };
    }
}
