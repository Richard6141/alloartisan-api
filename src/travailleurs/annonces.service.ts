import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { CreateAnnonceDto, SearchAnnonceDto, ManifesterInteretDto } from './dto';

@Injectable()
export class AnnoncesService {
    private readonly logger = new Logger(AnnoncesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notifications: NotificationService,
    ) {}

    // ─── Patron : publier / gérer ses annonces ──────────────────────────────

    async creerAnnonce(patronUserId: string, dto: CreateAnnonceDto) {
        const annonce = await this.prisma.annonceChantier.create({
            data: {
                patronUserId,
                type: dto.type as never,
                metierId: dto.metierId,
                nombrePersonnes: dto.nombrePersonnes ?? 1,
                latitude: dto.latitude,
                longitude: dto.longitude,
                ville: dto.ville,
                periode: dto.periode as never,
                tarifJournalier: dto.tarifJournalier,
                description: dto.description,
            },
        });

        // Notifier les travailleurs de la zone (fire-and-forget)
        void this.notifierTravailleursCibles(annonce.id, patronUserId, dto).catch((e) =>
            this.logger.error(`Notif annonce ${annonce.id} échouée: ${e}`),
        );

        return annonce;
    }

    /** Notifie les travailleurs actifs du bon type, dans leur zone, métier compatible */
    private async notifierTravailleursCibles(
        annonceId: string,
        patronUserId: string,
        dto: CreateAnnonceDto,
    ): Promise<void> {
        const cibles = (await this.prisma.$queryRawUnsafe(
            `SELECT p.user_id
             FROM profils_travailleur p
             WHERE p.actif = true
               AND p.type = $1::"TypeTravailleur"
               AND p.user_id <> $4
               AND ST_DistanceSphere(
                     ST_MakePoint(p.longitude, p.latitude),
                     ST_MakePoint($2, $3)
                   ) <= p.zone_intervention_km * 1000
               AND ($5::text IS NULL
                    OR p.polyvalent = true
                    OR EXISTS (
                        SELECT 1 FROM profil_travailleur_metiers m
                        WHERE m.profil_travailleur_id = p.id AND m.metier_id = $5))
             LIMIT 200`,
            dto.type,
            dto.longitude,
            dto.latitude,
            patronUserId,
            dto.metierId ?? null,
        )) as { user_id: string }[];

        const libelle = dto.type === 'OUVRIER' ? 'ouvrier' : 'aide';
        await Promise.all(
            cibles.map((c) =>
                this.notifications
                    .send({
                        userId: c.user_id,
                        type: 'SYSTEME' as never,
                        titre: `🔨 Chantier près de vous à ${dto.ville}`,
                        corps: `Un patron cherche ${dto.nombrePersonnes ?? 1} ${libelle}(s). Voir l'annonce et se manifester.`,
                        data: { screen: 'main-doeuvre', tab: 'annonces', annonceId },
                    })
                    .catch(() => undefined),
            ),
        );
        this.logger.log(`Annonce ${annonceId} : ${cibles.length} travailleur(s) notifié(s)`);
    }

    async mesAnnonces(patronUserId: string) {
        return this.prisma.annonceChantier.findMany({
            where: { patronUserId },
            orderBy: { createdAt: 'desc' },
            include: {
                metier: { select: { id: true, nom: true } },
                _count: { select: { interets: true } },
            },
        });
    }

    async cloturer(patronUserId: string, annonceId: string, statut: 'POURVUE' | 'CLOSE') {
        const annonce = await this.prisma.annonceChantier.findUnique({
            where: { id: annonceId },
            select: { patronUserId: true },
        });
        if (!annonce) throw new NotFoundException('Annonce introuvable');
        if (annonce.patronUserId !== patronUserId) {
            throw new ForbiddenException('Cette annonce ne vous appartient pas');
        }
        return this.prisma.annonceChantier.update({
            where: { id: annonceId },
            data: { statut: statut as never },
        });
    }

    /** Les candidats (travailleurs qui se sont manifestés) — vue patron */
    async candidats(patronUserId: string, annonceId: string) {
        const annonce = await this.prisma.annonceChantier.findUnique({
            where: { id: annonceId },
            select: { patronUserId: true },
        });
        if (!annonce) throw new NotFoundException('Annonce introuvable');
        if (annonce.patronUserId !== patronUserId) {
            throw new ForbiddenException('Cette annonce ne vous appartient pas');
        }
        return this.prisma.manifestationInteret.findMany({
            where: { annonceId },
            orderBy: { createdAt: 'desc' },
            include: {
                profil: {
                    include: {
                        user: { select: { id: true, nom: true, prenom: true, photoUrl: true } },
                        metiers: { include: { metier: { select: { id: true, nom: true } } } },
                    },
                },
            },
        });
    }

    // ─── Travailleur : parcourir / se manifester ────────────────────────────

    async annoncesAutour(dto: SearchAnnonceDto) {
        const rayonM = (dto.rayonKm ?? 25) * 1000;
        const rows = (await this.prisma.$queryRawUnsafe(
            `SELECT a.id,
                ST_DistanceSphere(ST_MakePoint(a.longitude, a.latitude), ST_MakePoint($1, $2)) / 1000 AS distance_km
             FROM annonces_chantier a
             WHERE a.statut = 'OUVERTE'
               AND ST_DWithin(
                     ST_MakePoint(a.longitude, a.latitude)::geography,
                     ST_MakePoint($1, $2)::geography, $3)
               AND ($4::text IS NULL OR a.type = $4::"TypeTravailleur")
             ORDER BY a.created_at DESC
             LIMIT 50`,
            dto.longitude,
            dto.latitude,
            rayonM,
            dto.type ?? null,
        )) as { id: string; distance_km: number }[];

        if (rows.length === 0) return [];
        const distances = new Map(rows.map((r) => [r.id, Number(r.distance_km)]));
        const annonces = await this.prisma.annonceChantier.findMany({
            where: { id: { in: rows.map((r) => r.id) } },
            include: {
                metier: { select: { id: true, nom: true } },
                patron: { select: { nom: true, prenom: true } },
                _count: { select: { interets: true } },
            },
        });
        return annonces
            .map((a) => ({ ...a, distanceKm: distances.get(a.id) ?? null }))
            .sort((x, y) => (x.distanceKm ?? 0) - (y.distanceKm ?? 0));
    }

    async manifesterInteret(travailleurUserId: string, annonceId: string, dto: ManifesterInteretDto) {
        const profil = await this.prisma.profilTravailleur.findUnique({
            where: { userId: travailleurUserId },
            select: { id: true, user: { select: { nom: true, prenom: true } } },
        });
        if (!profil) {
            throw new ForbiddenException(
                'Activez d\'abord votre profil travailleur pour vous manifester',
            );
        }
        const annonce = await this.prisma.annonceChantier.findUnique({
            where: { id: annonceId },
            select: { id: true, patronUserId: true, statut: true, ville: true },
        });
        if (!annonce) throw new NotFoundException('Annonce introuvable');
        if (annonce.patronUserId === travailleurUserId) {
            throw new ForbiddenException('Vous ne pouvez pas répondre à votre propre annonce');
        }

        const interet = await this.prisma.manifestationInteret.upsert({
            where: {
                annonceId_profilTravailleurId: {
                    annonceId,
                    profilTravailleurId: profil.id,
                },
            },
            create: { annonceId, profilTravailleurId: profil.id, message: dto.message },
            update: { message: dto.message },
        });

        // Notifier le patron
        const nom = `${profil.user?.prenom ?? ''} ${profil.user?.nom ?? ''}`.trim() || 'Un travailleur';
        void this.notifications
            .send({
                userId: annonce.patronUserId,
                type: 'SYSTEME' as never,
                titre: '🙋 Une personne intéressée par votre chantier',
                corps: `${nom} s'est manifesté pour votre annonce à ${annonce.ville}.`,
                data: { screen: 'mes-annonces', annonceId },
            })
            .catch(() => undefined);

        return interet;
    }
}
