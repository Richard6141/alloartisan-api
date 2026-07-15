import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    CreateProfilTravailleurDto,
    UpdateProfilTravailleurDto,
    SearchTravailleurDto,
    CreateEngagementDto,
    CreateAvisTravailDto,
} from './dto';

@Injectable()
export class TravailleursService {
    constructor(private readonly prisma: PrismaService) {}

    // ─── Profil travailleur (le mien) ───────────────────────────────────────

    async upsertMonProfil(
        userId: string,
        dto: CreateProfilTravailleurDto | UpdateProfilTravailleurDto,
    ) {
        const metiers = dto.metiers ?? [];
        if (metiers.length > 2) {
            throw new BadRequestException('Maximum 2 metiers/domaines');
        }
        const { metiers: _omit, ...data } = dto as CreateProfilTravailleurDto;

        const profil = await this.prisma.profilTravailleur.upsert({
            where: { userId },
            create: { userId, ...data } as never,
            update: { ...data } as never,
        });

        if (dto.metiers) {
            await this.prisma.$transaction([
                this.prisma.profilTravailleurMetier.deleteMany({
                    where: { profilTravailleurId: profil.id },
                }),
                this.prisma.profilTravailleurMetier.createMany({
                    data: metiers.map((m, i) => ({
                        profilTravailleurId: profil.id,
                        metierId: m.metierId,
                        estPrincipal: m.estPrincipal ?? i === 0,
                    })),
                }),
            ]);
        }
        return profil;
    }

    async getMonProfil(userId: string) {
        const profil = await this.prisma.profilTravailleur.findUnique({
            where: { userId },
            include: { metiers: { include: { metier: true } } },
        });
        if (!profil) throw new NotFoundException('Aucun profil travailleur');
        return profil;
    }

    async setActif(userId: string, actif: boolean) {
        return this.prisma.profilTravailleur.update({ where: { userId }, data: { actif } });
    }

    // ─── Recherche (côté patron) ────────────────────────────────────────────

    async search(dto: SearchTravailleurDto) {
        const rayonM = (dto.rayonKm ?? 10) * 1000;
        // 1) PostGIS (motif ST_DWithin, cf. geolocation.service) : ids + distance.
        const rows = (await this.prisma.$queryRawUnsafe(
            `SELECT p.id,
                ST_DistanceSphere(ST_MakePoint(p.longitude, p.latitude), ST_MakePoint($1, $2)) / 1000 AS distance_km
             FROM profils_travailleur p
             WHERE p.actif = true
               AND ST_DWithin(
                     ST_MakePoint(p.longitude, p.latitude)::geography,
                     ST_MakePoint($1, $2)::geography, $3)
               AND ($4::text IS NULL OR p.type = $4::"TypeTravailleur")
               AND ($5::text IS NULL OR p.disponibilite = $5::"Disponibilite")
               AND ($6::boolean IS NULL OR p.disponible_maintenant = $6)
               AND ($7::text IS NULL OR EXISTS (
                     SELECT 1 FROM profil_travailleur_metiers m
                     WHERE m.profil_travailleur_id = p.id AND m.metier_id = $7))
             ORDER BY distance_km ASC, p.note_moyenne DESC
             LIMIT 50`,
            dto.longitude,
            dto.latitude,
            rayonM,
            dto.type ?? null,
            dto.disponibilite ?? null,
            dto.disponibleMaintenant ?? null,
            dto.metierId ?? null,
        )) as { id: string; distance_km: number }[];

        if (rows.length === 0) return [];
        const distances = new Map(rows.map((r) => [r.id, Number(r.distance_km)]));

        // 2) Prisma pour les données propres (camelCase) + nom/photo + métiers.
        const profils = await this.prisma.profilTravailleur.findMany({
            where: { id: { in: rows.map((r) => r.id) } },
            include: {
                user: { select: { nom: true, prenom: true, photoUrl: true } },
                metiers: { include: { metier: { select: { id: true, nom: true } } } },
            },
        });

        // Réordonner selon la distance (l'ordre PostGIS est perdu par findMany)
        return profils
            .map((p) => ({ ...p, distanceKm: distances.get(p.id) ?? null }))
            .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }

    async getFiche(id: string) {
        const profil = await this.prisma.profilTravailleur.findUnique({
            where: { id },
            include: {
                user: { select: { nom: true, prenom: true, photoUrl: true } },
                metiers: { include: { metier: { select: { id: true, nom: true } } } },
            },
        });
        if (!profil) throw new NotFoundException('Travailleur introuvable');
        return profil;
    }

    // ─── Embauche + avis mutuels ────────────────────────────────────────────

    async embaucher(patronUserId: string, dto: CreateEngagementDto) {
        const profil = await this.prisma.profilTravailleur.findUnique({
            where: { id: dto.profilTravailleurId },
        });
        if (!profil) throw new NotFoundException('Travailleur introuvable');
        if (profil.userId === patronUserId) {
            throw new BadRequestException('Vous ne pouvez pas vous embaucher vous-meme');
        }
        return this.prisma.engagementTravail.create({
            data: {
                patronUserId,
                profilTravailleurId: dto.profilTravailleurId,
                conversationId: dto.conversationId,
            },
        });
    }

    async terminer(userId: string, engagementId: string) {
        const eng = await this.prisma.engagementTravail.findUnique({
            where: { id: engagementId },
            include: { profil: { select: { userId: true } } },
        });
        if (!eng) throw new NotFoundException('Engagement introuvable');
        if (eng.patronUserId !== userId && eng.profil.userId !== userId) {
            throw new ForbiddenException('Engagement non concerne');
        }
        return this.prisma.engagementTravail.update({
            where: { id: engagementId },
            data: { statut: 'TERMINE', termineAt: new Date() },
        });
    }

    async deposerAvis(userId: string, engagementId: string, dto: CreateAvisTravailDto) {
        const eng = await this.prisma.engagementTravail.findUnique({
            where: { id: engagementId },
            include: { profil: { select: { userId: true } } },
        });
        if (!eng) throw new NotFoundException('Engagement introuvable');
        if (eng.statut !== 'TERMINE') {
            throw new BadRequestException('La mission doit etre terminee pour laisser un avis');
        }
        const estPatron = eng.patronUserId === userId;
        const estTravailleur = eng.profil.userId === userId;
        if (!estPatron && !estTravailleur) {
            throw new ForbiddenException('Engagement non concerne');
        }
        const sens = estPatron ? 'PATRON_VERS_TRAVAILLEUR' : 'TRAVAILLEUR_VERS_PATRON';
        const cibleUserId = estPatron ? eng.profil.userId : eng.patronUserId;
        return this.prisma.avisTravail.create({
            data: {
                engagementId,
                auteurUserId: userId,
                cibleUserId,
                sens: sens as never,
                note: dto.note,
                commentaire: dto.commentaire,
            },
        });
    }
}
