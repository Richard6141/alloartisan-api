import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Empreintes d'identité — index anti multi-comptes (Phase 0).
 *
 * On ne stocke JAMAIS le document ni l'identité en clair : seulement des
 * hashes SHA-256 non réversibles + un aperçu masqué (4 derniers chiffres,
 * « Prénom N. ») pour l'affichage au validateur. À chaque validation d'une
 * pièce d'identité, on compare la nouvelle identité à l'index : si elle
 * correspond déjà à un AUTRE compte, on alerte (décision humaine, jamais
 * de blocage automatique).
 */

export interface IdentiteInput {
    numeroPiece?: string;
    nom?: string;
    dateNaissance?: string; // ISO (YYYY-MM-DD), optionnel
}

export type MotifMatch =
    | 'numero'
    | 'nom'
    | 'image_exacte'
    | 'image_similaire'
    | 'visage_similaire'
    | 'visage_fort';

export interface EmpreinteMatch {
    artisanId: string | null;
    userId: string;
    nomApercu: string | null;
    numeroApercu: string | null;
    createdAt: Date;
    motif: MotifMatch;
    /** Score de similarité (0-1), présent pour les motifs biométriques. */
    score?: number;
}

@Injectable()
export class IdentiteService {
    constructor(private readonly prisma: PrismaService) {}

    private sha256(s: string): string {
        return createHash('sha256').update(s).digest('hex');
    }

    /** Numéro de pièce normalisé : sans espaces/ponctuation, majuscules. */
    private normNumero(n: string): string {
        return n
            .normalize('NFKD')
            .replace(/[^A-Za-z0-9]/g, '')
            .toUpperCase();
    }

    /** Nom normalisé : sans accents, minuscules, tokens triés (ordre indifférent). */
    private normNom(nom: string): string {
        return nom
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '') // diacritiques combinants
            .replace(/[^a-zA-Z ]/g, ' ')
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean)
            .sort()
            .join(' ');
    }

    private hashNumero(n?: string): string | null {
        if (!n) return null;
        const c = this.normNumero(n);
        if (c.length < 4) return null; // trop court pour être discriminant
        return this.sha256(`num:${c}`);
    }

    /** Nom SEUL est trop faible (homonymes) : on exige la date de naissance. */
    private hashNomDdn(nom?: string, ddn?: string): string | null {
        if (!nom || !ddn) return null;
        const nn = this.normNom(nom);
        if (!nn) return null;
        return this.sha256(`nomddn:${nn}|${ddn.slice(0, 10)}`);
    }

    private apercuNumero(n?: string): string | null {
        if (!n) return null;
        const c = this.normNumero(n);
        return c.length <= 4 ? c : `••••${c.slice(-4)}`;
    }

    private apercuNom(nom?: string): string | null {
        if (!nom) return null;
        const parts = nom.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return null;
        const initiale = parts.length > 1 ? `${parts[parts.length - 1][0]}.` : '';
        return `${parts[0]} ${initiale}`.trim();
    }

    /** Cherche les identités déjà enregistrées qui correspondent à l'entrée. */
    async check(input: IdentiteInput, excludeArtisanId?: string): Promise<EmpreinteMatch[]> {
        const hNum = this.hashNumero(input.numeroPiece);
        const hNom = this.hashNomDdn(input.nom, input.dateNaissance);

        const ors: { hashNumeroPiece?: string; hashNomDdn?: string }[] = [];
        if (hNum) ors.push({ hashNumeroPiece: hNum });
        if (hNom) ors.push({ hashNomDdn: hNom });
        if (ors.length === 0) return [];

        const rows = await this.prisma.identiteEmpreinte.findMany({
            where: {
                OR: ors,
                ...(excludeArtisanId ? { artisanId: { not: excludeArtisanId } } : {}),
            },
            orderBy: { createdAt: 'asc' },
            take: 10,
        });

        return rows.map((r) => ({
            artisanId: r.artisanId,
            userId: r.userId,
            nomApercu: r.nomApercu,
            numeroApercu: r.numeroApercu,
            createdAt: r.createdAt,
            motif: hNum && r.hashNumeroPiece === hNum ? 'numero' : 'nom',
        }));
    }

    /**
     * Upsert-MERGE : une seule empreinte par artisan. Les champs `undefined` ne
     * sont PAS écrits (Prisma les ignore) → le n° saisi à la validation et
     * l'image indexée à l'upload se CUMULENT sans s'écraser.
     */
    private async mergeEmpreinte(
        artisanId: string | null | undefined,
        userId: string,
        certificationId: string | null | undefined,
        data: {
            hashNumeroPiece?: string | null;
            hashNomDdn?: string | null;
            numeroApercu?: string | null;
            nomApercu?: string | null;
            docSha256?: string | null;
            docPhash?: string | null;
        },
    ): Promise<void> {
        if (!Object.values(data).some((v) => v !== undefined)) return;

        if (artisanId) {
            const existing = await this.prisma.identiteEmpreinte.findFirst({
                where: { artisanId },
                select: { id: true },
            });
            if (existing) {
                await this.prisma.identiteEmpreinte.update({
                    where: { id: existing.id },
                    data: { ...data, certificationId: certificationId ?? undefined },
                });
                return;
            }
        }
        await this.prisma.identiteEmpreinte.create({
            data: {
                artisanId: artisanId ?? null,
                userId,
                certificationId: certificationId ?? null,
                ...data,
            },
        });
    }

    /** Indexe l'identité (numéro / nom+DDN) validée d'un compte artisan. */
    async register(params: {
        artisanId?: string | null;
        userId: string;
        certificationId?: string | null;
        input: IdentiteInput;
    }): Promise<void> {
        const hNum = this.hashNumero(params.input.numeroPiece);
        const hNom = this.hashNomDdn(params.input.nom, params.input.dateNaissance);
        if (!hNum && !hNom) return;
        await this.mergeEmpreinte(params.artisanId, params.userId, params.certificationId, {
            hashNumeroPiece: hNum,
            hashNomDdn: hNom,
            numeroApercu: this.apercuNumero(params.input.numeroPiece),
            nomApercu: this.apercuNom(params.input.nom),
        });
    }

    /** Indexe l'empreinte de l'IMAGE du document (calculée à l'upload). */
    async registerDocImage(params: {
        artisanId?: string | null;
        userId: string;
        certificationId?: string | null;
        docSha256?: string | null;
        docPhash?: string | null;
    }): Promise<void> {
        if (!params.docSha256 && !params.docPhash) return;
        await this.mergeEmpreinte(params.artisanId, params.userId, params.certificationId, {
            docSha256: params.docSha256 ?? null,
            docPhash: params.docPhash ?? null,
        });
    }

    /** Distance de Hamming entre deux hashes hexadécimaux (dHash 64 bits). */
    private hamming(a: string, b: string): number {
        if (a.length !== b.length) return 64;
        let d = 0;
        for (let i = 0; i < a.length; i++) {
            let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
            while (x) {
                d += x & 1;
                x >>= 1;
            }
        }
        return d;
    }

    /**
     * L'image de CETTE pièce (par son certificationId) correspond-elle à un
     * document déjà soumis par un AUTRE compte ? (fichier identique = sha256,
     * ou même image ré-encodée = distance de Hamming faible sur le pHash).
     */
    async docMatchesForCertification(certificationId: string): Promise<EmpreinteMatch[]> {
        const self = await this.prisma.identiteEmpreinte.findFirst({
            where: { certificationId },
            select: { artisanId: true, docSha256: true, docPhash: true },
        });
        if (!self || (!self.docSha256 && !self.docPhash)) return [];

        const rows = await this.prisma.identiteEmpreinte.findMany({
            where: {
                ...(self.artisanId ? { artisanId: { not: self.artisanId } } : {}),
                OR: [
                    ...(self.docSha256 ? [{ docSha256: self.docSha256 }] : []),
                    ...(self.docPhash ? [{ docPhash: { not: null } }] : []),
                ],
            },
            select: {
                artisanId: true,
                userId: true,
                nomApercu: true,
                numeroApercu: true,
                docSha256: true,
                docPhash: true,
                createdAt: true,
            },
            take: 300, // borne : à grande échelle, prévoir un index pHash dédié
        });

        return rows
            .map((r) => {
                const exacte = !!self.docSha256 && r.docSha256 === self.docSha256;
                const similaire =
                    !!self.docPhash && !!r.docPhash && this.hamming(self.docPhash, r.docPhash) <= 6;
                if (!exacte && !similaire) return null;
                return {
                    artisanId: r.artisanId,
                    userId: r.userId,
                    nomApercu: r.nomApercu,
                    numeroApercu: r.numeroApercu,
                    createdAt: r.createdAt,
                    motif: (exacte ? 'image_exacte' : 'image_similaire') as MotifMatch,
                };
            })
            .filter((m): m is EmpreinteMatch => m !== null)
            .slice(0, 10);
    }
}
