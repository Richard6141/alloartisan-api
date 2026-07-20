import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { EmpreinteMatch, MotifMatch } from './identite.service';
import { FACE_EMBEDDING_PROVIDER, type EmbeddingProvider } from './face/embedding.provider';
import { ScrfdFaceDetector } from './face/scrfd-detector';

/**
 * Seuils de similarité cosinus (embeddings L2-normalisés). Calibrés pour
 * arcfaceresnet100-8 + visage ALIGNÉ 5-points (SCRFD) : sur de vraies paires,
 * même personne ≈ 0.8, personnes différentes ≈ 0. Ajustables.
 */
export const FACE_SIM_WEAK = 0.45; // visage ressemblant → alerte
export const FACE_SIM_STRONG = 0.6; // très probablement la même personne

/**
 * Biométrie faciale (Phase 2) — même philosophie que les empreintes Phase 0/1 :
 * on ne stocke JAMAIS l'image, seulement un vecteur d'embedding L2-normalisé.
 * La comparaison (cosinus) sert à ALERTER l'admin — jamais de blocage automatique.
 */
@Injectable()
export class FaceBiometrieService {
    private readonly logger = new Logger(FaceBiometrieService.name);

    constructor(
        private readonly prisma: PrismaService,
        @Inject(FACE_EMBEDDING_PROVIDER) private readonly provider: EmbeddingProvider,
        private readonly detector: ScrfdFaceDetector,
    ) {}

    get enabled(): boolean {
        return this.provider.enabled;
    }

    /**
     * Outil de test : compare deux images et renvoie le score de similarité +
     * si un visage a été détecté sur chacune. Ne stocke rien.
     */
    async compareBuffers(a: Buffer, b: Buffer) {
        if (!this.provider.enabled) return { enabled: false as const };
        const [faceA, faceB, va, vb] = await Promise.all([
            this.detector.alignedFaceTensor(a),
            this.detector.alignedFaceTensor(b),
            this.provider.embed(a),
            this.provider.embed(b),
        ]);
        if (!va || !vb) {
            return {
                enabled: true as const,
                faceDetectedA: !!faceA,
                faceDetectedB: !!faceB,
                embeddedA: !!va,
                embeddedB: !!vb,
            };
        }
        const score = this.cosine(va, vb);
        return {
            enabled: true as const,
            faceDetectedA: !!faceA,
            faceDetectedB: !!faceB,
            embeddedA: true,
            embeddedB: true,
            cosine: Math.round(score * 1000) / 1000,
            possibleMatch: score >= FACE_SIM_WEAK,
            samePersonLikely: score >= FACE_SIM_STRONG,
            seuils: { faible: FACE_SIM_WEAK, fort: FACE_SIM_STRONG },
        };
    }

    /** Calcule et indexe l'empreinte faciale d'un compte (non bloquant). */
    async registerFace(params: {
        artisanId?: string | null;
        userId: string;
        certificationId?: string | null;
        imageBuffer: Buffer;
    }): Promise<void> {
        if (!this.provider.enabled) return;
        const vec = await this.provider.embed(params.imageBuffer);
        if (!vec || vec.length === 0) return;

        const data = { faceEmbedding: vec, faceModel: this.provider.modelId };

        if (params.artisanId) {
            const existing = await this.prisma.identiteEmpreinte.findFirst({
                where: { artisanId: params.artisanId },
                select: { id: true },
            });
            if (existing) {
                await this.prisma.identiteEmpreinte.update({
                    where: { id: existing.id },
                    data: { ...data, certificationId: params.certificationId ?? undefined },
                });
                return;
            }
        }
        await this.prisma.identiteEmpreinte.create({
            data: {
                artisanId: params.artisanId ?? null,
                userId: params.userId,
                certificationId: params.certificationId ?? null,
                ...data,
            },
        });
    }

    private cosine(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;
        let dot = 0;
        for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
        return dot; // vecteurs déjà L2-normalisés
    }

    /**
     * Le visage de CETTE pièce (par certificationId) ressemble-t-il à celui d'un
     * AUTRE compte déjà indexé ? Retourne les correspondances triées par score.
     */
    async faceMatchesForCertification(certificationId: string): Promise<EmpreinteMatch[]> {
        if (!this.provider.enabled) return [];

        const self = await this.prisma.identiteEmpreinte.findFirst({
            where: { certificationId },
            select: { artisanId: true, faceEmbedding: true, faceModel: true },
        });
        if (!self || !self.faceEmbedding || self.faceEmbedding.length === 0) return [];

        const rows = await this.prisma.identiteEmpreinte.findMany({
            where: {
                faceModel: self.faceModel,
                ...(self.artisanId ? { artisanId: { not: self.artisanId } } : {}),
            },
            select: {
                artisanId: true,
                userId: true,
                nomApercu: true,
                numeroApercu: true,
                faceEmbedding: true,
                createdAt: true,
            },
            take: 500, // borne : à grande échelle, prévoir un index vectoriel (pgvector)
        });

        return rows
            .map((r): EmpreinteMatch | null => {
                if (!r.faceEmbedding || r.faceEmbedding.length === 0) return null;
                const score = this.cosine(self.faceEmbedding, r.faceEmbedding);
                if (score < FACE_SIM_WEAK) return null;
                return {
                    artisanId: r.artisanId,
                    userId: r.userId,
                    nomApercu: r.nomApercu,
                    numeroApercu: r.numeroApercu,
                    createdAt: r.createdAt,
                    motif: (score >= FACE_SIM_STRONG
                        ? 'visage_fort'
                        : 'visage_similaire') as MotifMatch,
                    score: Math.round(score * 100) / 100,
                };
            })
            .filter((m): m is EmpreinteMatch => m !== null)
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
            .slice(0, 10);
    }
}
