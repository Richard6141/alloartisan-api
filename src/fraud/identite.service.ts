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

export interface EmpreinteMatch {
    artisanId: string | null;
    userId: string;
    nomApercu: string | null;
    numeroApercu: string | null;
    createdAt: Date;
    motif: 'numero' | 'nom';
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

    /** Enregistre (ou remplace) l'empreinte d'un compte artisan. */
    async register(params: {
        artisanId?: string | null;
        userId: string;
        certificationId?: string | null;
        input: IdentiteInput;
    }): Promise<void> {
        const hNum = this.hashNumero(params.input.numeroPiece);
        const hNom = this.hashNomDdn(params.input.nom, params.input.dateNaissance);
        if (!hNum && !hNom) return; // rien d'exploitable à indexer

        // Une seule empreinte par artisan : on remplace l'existante
        if (params.artisanId) {
            await this.prisma.identiteEmpreinte.deleteMany({
                where: { artisanId: params.artisanId },
            });
        }
        await this.prisma.identiteEmpreinte.create({
            data: {
                artisanId: params.artisanId ?? null,
                userId: params.userId,
                certificationId: params.certificationId ?? null,
                hashNumeroPiece: hNum,
                hashNomDdn: hNom,
                numeroApercu: this.apercuNumero(params.input.numeroPiece),
                nomApercu: this.apercuNom(params.input.nom),
            },
        });
    }
}
