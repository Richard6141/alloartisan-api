import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCodePromoDto, UpdateCodePromoDto } from './dto';
import { TypeReduction } from 'src/generated/prisma';

export interface DiscountPreview {
    codePromoId: string;
    code: string;
    montantOriginal: number;
    montantReduction: number;
    montantFinal: number;
}

/**
 * PromoService — Codes promo (réductions sur les interventions)
 *
 * - CRUD admin des codes
 * - Validation/calcul de réduction (previewDiscount, sans effet de bord)
 * - Consommation atomique (redeemForBooking) avec garde anti-concurrence
 * - Libération en cas d'échec de paiement (releaseUsageForBooking)
 */
@Injectable()
export class PromoService {
    private readonly logger = new Logger(PromoService.name);

    /** Montant minimal restant à payer après réduction (FCFA) */
    private static readonly MIN_PAYABLE = 100;

    constructor(private readonly prisma: PrismaService) {}

    // ============================================================
    // ADMIN — CRUD
    // ============================================================

    async createCode(dto: CreateCodePromoDto) {
        if (dto.typeReduction === TypeReduction.POURCENTAGE && dto.valeur > 100) {
            throw new BadRequestException('Un pourcentage de réduction ne peut dépasser 100');
        }

        const existing = await this.prisma.codePromo.findUnique({ where: { code: dto.code } });
        if (existing) throw new ConflictException(`Le code "${dto.code}" existe déjà`);

        const code = await this.prisma.codePromo.create({
            data: {
                code: dto.code,
                description: dto.description,
                typeReduction: dto.typeReduction,
                valeur: dto.valeur,
                reductionMax: dto.reductionMax,
                montantMinimum: dto.montantMinimum,
                utilisationsMax: dto.utilisationsMax,
                utilisationsParUtilisateur: dto.utilisationsParUtilisateur ?? 1,
                validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
                validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
                actif: dto.actif ?? true,
            },
        });

        this.logger.log(`Code promo créé: ${code.code} (${code.typeReduction} ${code.valeur})`);
        return code;
    }

    async listCodes(page = 1, limit = 20) {
        const [items, total] = await Promise.all([
            this.prisma.codePromo.findMany({
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { _count: { select: { utilisations: true } } },
            }),
            this.prisma.codePromo.count(),
        ]);
        return { items, total, page, limit };
    }

    async updateCode(id: string, dto: UpdateCodePromoDto) {
        const code = await this.prisma.codePromo.findUnique({ where: { id } });
        if (!code) throw new NotFoundException('Code promo non trouvé');

        return this.prisma.codePromo.update({
            where: { id },
            data: {
                description: dto.description,
                actif: dto.actif,
                validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
                utilisationsMax: dto.utilisationsMax,
            },
        });
    }

    // ============================================================
    // VALIDATION / CALCUL DE RÉDUCTION (sans effet de bord)
    // ============================================================

    /**
     * Vérifie qu'un code est utilisable par cet utilisateur pour ce montant
     * et calcule la réduction. Ne consomme PAS le code.
     */
    async previewDiscount(
        rawCode: string,
        userId: string,
        montant: number,
    ): Promise<DiscountPreview> {
        const code = await this.prisma.codePromo.findUnique({
            where: { code: rawCode.trim().toUpperCase() },
        });

        if (!code || !code.actif) throw new NotFoundException('Code promo invalide');

        const now = new Date();
        if (code.validFrom && code.validFrom > now) {
            throw new BadRequestException("Ce code n'est pas encore actif");
        }
        if (code.validUntil && code.validUntil < now) {
            throw new BadRequestException('Ce code a expiré');
        }
        if (code.reserveUserId && code.reserveUserId !== userId) {
            throw new BadRequestException('Ce code est réservé à un autre utilisateur');
        }
        if (code.utilisationsMax !== null && code.utilisationsTotal >= code.utilisationsMax) {
            throw new BadRequestException("Ce code a atteint son nombre maximal d'utilisations");
        }
        if (code.montantMinimum && montant < Number(code.montantMinimum)) {
            throw new BadRequestException(
                `Ce code nécessite un montant minimum de ${Number(code.montantMinimum)} FCFA`,
            );
        }

        const userUsages = await this.prisma.utilisationCodePromo.count({
            where: { codePromoId: code.id, userId },
        });
        if (userUsages >= code.utilisationsParUtilisateur) {
            throw new BadRequestException('Vous avez déjà utilisé ce code');
        }

        let reduction: number;
        if (code.typeReduction === TypeReduction.POURCENTAGE) {
            reduction = (montant * Number(code.valeur)) / 100;
            if (code.reductionMax) reduction = Math.min(reduction, Number(code.reductionMax));
        } else {
            reduction = Number(code.valeur);
        }

        // Toujours laisser un minimum à payer (les providers refusent les montants nuls)
        reduction = Math.min(reduction, Math.max(0, montant - PromoService.MIN_PAYABLE));
        reduction = Math.round(reduction * 100) / 100;

        return {
            codePromoId: code.id,
            code: code.code,
            montantOriginal: montant,
            montantReduction: reduction,
            montantFinal: Math.round((montant - reduction) * 100) / 100,
        };
    }

    // ============================================================
    // CONSOMMATION / LIBÉRATION
    // ============================================================

    /**
     * Consomme le code pour un booking, de façon atomique.
     * La garde sur utilisationsTotal empêche deux paiements concurrents de
     * dépasser le quota global du code.
     */
    async redeemForBooking(
        codePromoId: string,
        userId: string,
        bookingId: string,
        montantReduction: number,
    ): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const result = await tx.codePromo.updateMany({
                where: {
                    id: codePromoId,
                    actif: true,
                    OR: [
                        { utilisationsMax: null },
                        { utilisationsTotal: { lt: this.prisma.codePromo.fields.utilisationsMax } },
                    ],
                },
                data: { utilisationsTotal: { increment: 1 } },
            });

            if (result.count === 0) {
                throw new BadRequestException(
                    "Ce code promo n'est plus disponible (quota atteint)",
                );
            }

            await tx.utilisationCodePromo.create({
                data: { codePromoId, userId, bookingId, montantReduction },
            });
        });

        this.logger.log(
            `Code promo consommé: codeId=${codePromoId} booking=${bookingId} réduction=${montantReduction} FCFA`,
        );
    }

    /**
     * Libère les utilisations liées à un booking (paiement échoué) :
     * l'utilisateur pourra réutiliser le code sur sa nouvelle tentative.
     */
    async releaseUsageForBooking(bookingId: string): Promise<void> {
        const usages = await this.prisma.utilisationCodePromo.findMany({
            where: { bookingId },
        });
        if (usages.length === 0) return;

        await this.prisma.$transaction(async (tx) => {
            for (const usage of usages) {
                await tx.utilisationCodePromo.delete({ where: { id: usage.id } });
                await tx.codePromo.update({
                    where: { id: usage.codePromoId },
                    data: { utilisationsTotal: { decrement: 1 } },
                });
            }
        });

        this.logger.log(`Code(s) promo libéré(s) pour booking=${bookingId}`);
    }

    /**
     * Crée un code promo personnel (récompense de parrainage).
     * Utilisé par ReferralService.
     */
    async createPersonalReward(
        userId: string,
        montant: number,
        description: string,
        validityDays: number,
    ): Promise<string> {
        // Générer un code unique lisible : RECOMP-XXXXXX
        for (let attempt = 0; attempt < 5; attempt++) {
            const suffix = this.randomCode(6);
            const code = `RECOMP-${suffix}`;
            const exists = await this.prisma.codePromo.findUnique({ where: { code } });
            if (exists) continue;

            await this.prisma.codePromo.create({
                data: {
                    code,
                    description,
                    typeReduction: TypeReduction.MONTANT_FIXE,
                    valeur: montant,
                    utilisationsMax: 1,
                    utilisationsParUtilisateur: 1,
                    reserveUserId: userId,
                    actif: true,
                    validUntil: new Date(Date.now() + validityDays * 24 * 3600 * 1000),
                },
            });
            return code;
        }
        throw new ConflictException('Impossible de générer un code de récompense unique');
    }

    /** Codes personnels actifs de l'utilisateur (ses récompenses) */
    async getMyRewards(userId: string) {
        return this.prisma.codePromo.findMany({
            where: {
                reserveUserId: userId,
                actif: true,
                validUntil: { gte: new Date() },
                utilisations: { none: {} },
            },
            select: {
                code: true,
                valeur: true,
                typeReduction: true,
                description: true,
                validUntil: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    private randomCode(length: number): string {
        // Alphabet sans caractères ambigus (pas de O/0, I/1/L)
        const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        let out = '';
        for (let i = 0; i < length; i++) {
            out += alphabet[randomInt(alphabet.length)];
        }
        return out;
    }
}
