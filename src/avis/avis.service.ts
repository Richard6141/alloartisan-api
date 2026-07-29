import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { CreateAvisDto, RespondAvisDto, ReportAvisDto } from './dto';
import { StatutBooking } from 'src/generated/prisma';
import { nomLisible } from 'src/common/utils/nom.util';
import { masquerContacts } from 'src/common/utils/anti-contact.util';

// Fenêtre de 14 jours pour laisser un avis après fin d'intervention
const REVIEW_DELAY_DAYS = 14;

@Injectable()
export class AvisService {
    private readonly logger = new Logger(AvisService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
    ) {}

    // ============================================================
    // CRÉER UN AVIS — Client uniquement, booking TERMINEE
    // ============================================================

    async create(clientId: string, dto: CreateAvisDto) {
        // 1. Récupérer le booking avec vérification ownership
        const booking = await this.prisma.booking.findUnique({
            where: { id: dto.bookingId },
            include: {
                artisan: { select: { id: true, userId: true } },
                avis: true,
            },
        });

        if (!booking) throw new NotFoundException('Réservation non trouvée');
        if (booking.clientId !== clientId) {
            throw new ForbiddenException("Ce n'est pas votre réservation");
        }

        // 2. Règle : booking TERMINEE, ou ATTENTE_CONFIRMATION (noter = confirmer).
        if (
            booking.statut !== StatutBooking.TERMINEE &&
            booking.statut !== StatutBooking.ATTENTE_CONFIRMATION
        ) {
            throw new BadRequestException(
                `Vous ne pouvez laisser un avis que sur une réservation terminée (statut actuel: ${booking.statut})`,
            );
        }

        // 3. Règle : un seul avis par booking (contrainte BDD + guard applicatif)
        if (booking.avis) {
            throw new ConflictException('Vous avez déjà laissé un avis pour cette réservation');
        }

        // 4. Règle : délai max de 14 jours après fin
        if (booking.finAt) {
            const daysSince = (Date.now() - booking.finAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince > REVIEW_DELAY_DAYS) {
                throw new BadRequestException(
                    `Le délai de ${REVIEW_DELAY_DAYS} jours pour laisser un avis est dépassé`,
                );
            }
        }

        // 5. Calculer note globale pondérée si plusieurs sous-notes
        let noteFinale = dto.note;
        const sousNotes = [dto.notePonctualite, dto.noteQualite, dto.noteCommunication].filter(
            (n) => n !== undefined && n !== null,
        );
        if (sousNotes.length > 0) {
            // Moyenne pondérée : note principale (50%) + moyenne des sous-notes (50%)
            const moyenneSousNotes = sousNotes.reduce((a, b) => a + b, 0) / sousNotes.length;
            noteFinale = Math.round((dto.note * 0.5 + moyenneSousNotes * 0.5) * 10) / 10;
        }

        // 6. Créer l'avis ET clôturer le booking DE FAÇON ATOMIQUE : noter vaut
        // confirmation. Sans transaction, un échec entre les deux laissait un
        // avis créé alors que le booking restait « à confirmer » → mission
        // bloquée ET impossible de re-noter (contrainte 1 avis/booking).
        const avis = await this.prisma.$transaction(async (tx) => {
            const created = await tx.avis.create({
                data: {
                    bookingId: dto.bookingId,
                    clientId,
                    artisanId: booking.artisan.id,
                    note: noteFinale, // Note pondérée (sous-notes prises en compte)
                    notePonctualite: dto.notePonctualite,
                    noteQualite: dto.noteQualite,
                    noteCommunication: dto.noteCommunication,
                    // Anti-désintermédiation : masquer tout numéro/email/réseau glissé
                    // dans un avis public (contournait le verrou de la messagerie).
                    commentaire: dto.commentaire
                        ? masquerContacts(dto.commentaire).texte
                        : dto.commentaire,
                    visible: true,
                },
                include: {
                    client: { select: { nom: true, prenom: true, photoUrl: true } },
                    booking: { select: { titre: true } },
                },
            });
            if (booking.statut === StatutBooking.ATTENTE_CONFIRMATION) {
                await tx.booking.update({
                    where: { id: booking.id },
                    data: { statut: StatutBooking.TERMINEE, finAt: booking.finAt ?? new Date() },
                });
            }
            return created;
        });

        // 7. Mettre à jour le taux de complétion de l'artisan
        await this.updateArtisanStats(booking.artisan.id);

        this.logger.log(
            `Avis créé: bookingId=${dto.bookingId} | note=${dto.note} | artisanId=${booking.artisan.id}`,
        );

        // 8. Notifier l'artisan du nouvel avis (fire-and-forget)
        const clientData = avis.client;
        const nomClient = nomLisible(clientData, 'Un client');
        void this.notificationService.send({
            userId: booking.artisan.userId,
            type: 'AVIS_NOUVEAU',
            titre: '⭐ Nouvel avis reçu',
            corps: `${nomClient} vous a laissé un avis de ${dto.note}/5 étoiles.`,
            data: { avisId: avis.id, bookingId: dto.bookingId },
        });

        return avis;
    }

    // ============================================================
    // AVIS D'UN ARTISAN (paginés, visibles uniquement)
    // ============================================================

    async findByArtisan(artisanId: string, page = 1, limit = 10) {
        const skip = (Math.max(1, page) - 1) * Math.min(50, limit);

        const [avis, total, stats] = await this.prisma.$transaction([
            this.prisma.avis.findMany({
                where: { artisanId, visible: true },
                include: {
                    client: { select: { nom: true, prenom: true, photoUrl: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Math.min(50, limit),
            }),
            this.prisma.avis.count({ where: { artisanId, visible: true } }),
            this.prisma.avis.aggregate({
                where: { artisanId, visible: true },
                _avg: {
                    note: true,
                    notePonctualite: true,
                    noteQualite: true,
                    noteCommunication: true,
                },
            }),
        ]);

        return {
            data: avis,
            stats: {
                noteMoyenne: Math.round((stats._avg.note ?? 0) * 10) / 10,
                notePonctualite: Math.round((stats._avg.notePonctualite ?? 0) * 10) / 10,
                noteQualite: Math.round((stats._avg.noteQualite ?? 0) * 10) / 10,
                noteCommunication: Math.round((stats._avg.noteCommunication ?? 0) * 10) / 10,
            },
            meta: {
                total,
                page: Math.max(1, page),
                limit: Math.min(50, limit),
                totalPages: Math.ceil(total / Math.min(50, limit)),
            },
        };
    }

    // ============================================================
    // MES AVIS DONNÉS (client)
    // ============================================================

    async findMine(clientId: string, page = 1, limit = 10) {
        const skip = (Math.max(1, page) - 1) * Math.min(50, limit);

        const [avis, total] = await this.prisma.$transaction([
            this.prisma.avis.findMany({
                where: { clientId },
                include: {
                    artisan: {
                        select: {
                            nomEntreprise: true,
                            photoProfilUrl: true,
                            user: { select: { nom: true, prenom: true } },
                        },
                    },
                    booking: { select: { titre: true, finAt: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Math.min(50, limit),
            }),
            this.prisma.avis.count({ where: { clientId } }),
        ]);

        return {
            data: avis,
            meta: {
                total,
                page: Math.max(1, page),
                limit: Math.min(50, limit),
                totalPages: Math.ceil(total / Math.min(50, limit)),
            },
        };
    }

    // ============================================================
    // RÉPONSE ARTISAN — Une seule réponse possible par avis
    // ============================================================

    async respondToAvis(avisId: string, artisanUserId: string, dto: RespondAvisDto) {
        // Trouver l'artisan par userId
        const artisan = await this.prisma.artisan.findFirst({
            where: { userId: artisanUserId },
        });
        if (!artisan) throw new NotFoundException('Profil artisan non trouvé');

        const avis = await this.prisma.avis.findUnique({ where: { id: avisId } });
        if (!avis) throw new NotFoundException('Avis non trouvé');
        if (avis.artisanId !== artisan.id) {
            throw new ForbiddenException("Ce n'est pas votre avis");
        }

        // Règle : une seule réponse par avis
        if (avis.reponseArtisan) {
            throw new ConflictException('Vous avez déjà répondu à cet avis');
        }

        const updated = await this.prisma.avis.update({
            where: { id: avisId },
            data: {
                reponseArtisan: dto.reponse,
                reponseAt: new Date(),
            },
        });

        this.logger.log(`Réponse artisan ajoutée: avisId=${avisId}`);

        // Notifier le client
        void this.notificationService.send({
            userId: avis.clientId,
            type: 'AVIS_REPONSE',
            titre: "💬 L'artisan a répondu à votre avis",
            corps: dto.reponse.substring(0, 100) + (dto.reponse.length > 100 ? '...' : ''),
            data: { avisId },
        });

        return updated;
    }

    // ============================================================
    // SIGNALER UN AVIS
    // ============================================================

    async reportAvis(avisId: string, userId: string, dto: ReportAvisDto) {
        const avis = await this.prisma.avis.findUnique({ where: { id: avisId } });
        if (!avis) throw new NotFoundException('Avis non trouvé');
        if (avis.signale) {
            throw new ConflictException('Cet avis a déjà été signalé');
        }

        await this.prisma.avis.update({
            where: { id: avisId },
            data: {
                signale: true,
                raisonSignalement: `${dto.raison}${dto.details ? ': ' + dto.details : ''}`,
                signaleBy: userId,
            },
        });

        this.logger.log(`Avis signalé: ${avisId} | raison: ${dto.raison}`);
    }

    // ============================================================
    // MODÉRER UN AVIS (ADMIN)
    // ============================================================

    async moderateAvis(avisId: string, visible: boolean) {
        const avis = await this.prisma.avis.findUnique({ where: { id: avisId } });
        if (!avis) throw new NotFoundException('Avis non trouvé');

        const updated = await this.prisma.avis.update({
            where: { id: avisId },
            data: {
                visible,
                signale: false, // Réinitialiser le signalement après modération
            },
        });

        // Recalculer la note de l'artisan après modération
        await this.updateArtisanStats(avis.artisanId);

        this.logger.log(
            `Avis ${visible ? 'réactivé' : 'masqué'}: ${avisId} | artisanId=${avis.artisanId}`,
        );

        return updated;
    }

    // ============================================================
    // HELPER — Mettre à jour les stats artisan
    // ============================================================

    /**
     * Note : la mise à jour de note_moyenne est normalement gérée par trigger PostgreSQL.
     * Cette méthode est un fallback applicatif pour les cas où le trigger n'est pas actif.
     */
    private async updateArtisanStats(artisanId: string): Promise<void> {
        const stats = await this.prisma.avis.aggregate({
            where: { artisanId, visible: true },
            _avg: { note: true },
            _count: { note: true },
        });

        // Calculer taux de complétion
        const [totalBookings, termineeBookings] = await Promise.all([
            this.prisma.booking.count({ where: { artisanId } }),
            this.prisma.booking.count({ where: { artisanId, statut: StatutBooking.TERMINEE } }),
        ]);

        const tauxCompletion =
            totalBookings > 0
                ? Math.round((termineeBookings / totalBookings) * 100 * 100) / 100
                : 0;

        await this.prisma.artisan.update({
            where: { id: artisanId },
            data: {
                noteMoyenne: Math.round((stats._avg.note ?? 0) * 100) / 100,
                nombreAvis: stats._count.note,
                nombreMissionsCompletees: termineeBookings,
                tauxCompletion,
            },
        });
    }
}
