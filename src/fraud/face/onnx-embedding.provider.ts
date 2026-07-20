import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { EmbeddingProvider } from './embedding.provider';
import { ScrfdFaceDetector } from './scrfd-detector';

/**
 * Fournisseur d'embedding facial ONNX auto-hébergé (ArcFace/InsightFace).
 *
 * - Activé uniquement si `FACE_BIOMETRIE_ENABLED=true` ET `FACE_MODEL_PATH` défini.
 * - `onnxruntime-node` est importé DYNAMIQUEMENT à la première utilisation :
 *   si la dépendance n'est pas installée, le service se désactive proprement
 *   (pas de crash au démarrage de l'API).
 * - Prétraitement : recadrage centré 112×112, normalisation (x-127.5)/127.5.
 *   Un détecteur de visage pourra être branché plus tard pour un recadrage précis.
 * - Sortie : embedding L2-normalisé (comparaison = produit scalaire = cosinus).
 */
@Injectable()
export class OnnxEmbeddingProvider implements EmbeddingProvider {
    private readonly logger = new Logger(OnnxEmbeddingProvider.name);
    private readonly size = 112;
    // Spécifieur non-littéral : évite la résolution statique du module par TS
    // (la dépendance native n'est installée que si la biométrie est activée).
    private readonly runtimePkg = 'onnxruntime-node';
    private session: unknown = null;
    private initTried = false;
    private available = false;

    constructor(private readonly detector: ScrfdFaceDetector) {}

    get enabled(): boolean {
        return process.env.FACE_BIOMETRIE_ENABLED === 'true' && !!process.env.FACE_MODEL_PATH;
    }

    get modelId(): string {
        return process.env.FACE_MODEL_ID ?? 'arcface-r50-v1';
    }

    private get inputBgr(): boolean {
        return process.env.FACE_INPUT_BGR === 'true';
    }

    private async ensureSession(): Promise<boolean> {
        if (this.initTried) return this.available;
        this.initTried = true;
        if (!this.enabled) return false;
        try {
            // Import dynamique : absent des deps → désactivation propre.
            const ort: any = await import(this.runtimePkg);
            this.session = await ort.InferenceSession.create(process.env.FACE_MODEL_PATH as string);
            this.available = true;
            this.logger.log(`Moteur biométrie ONNX chargé (${this.modelId}).`);
        } catch (e) {
            this.available = false;
            this.logger.warn(
                `Biométrie ONNX indisponible (désactivée) : ${e instanceof Error ? e.message : String(e)}`,
            );
        }
        return this.available;
    }

    async embed(imageBuffer: Buffer): Promise<number[] | null> {
        if (!(await this.ensureSession()) || !this.session) return null;
        try {
            const n = this.size * this.size;
            let tensorData: Float32Array | null = null;

            // Voie privilégiée : visage détecté + ALIGNÉ 5-points par SCRFD
            // (similarité même-personne ~0.8 vs ~0.47 sans alignement).
            if (this.detector.enabled) {
                tensorData = await this.detector.alignedFaceTensor(imageBuffer);
            }

            // Repli (pas de détecteur / aucun visage) : recadrage centré de
            // l'image entière, pixels bruts RGB (précision moindre).
            if (!tensorData) {
                const { data, info } = await sharp(imageBuffer)
                    .removeAlpha()
                    .resize(this.size, this.size, { fit: 'cover' })
                    .raw()
                    .toBuffer({ resolveWithObject: true });
                if (info.channels < 3) return null;
                tensorData = new Float32Array(3 * n);
                for (let i = 0; i < n; i++) {
                    const r = data[i * info.channels];
                    const g = data[i * info.channels + 1];
                    const b = data[i * info.channels + 2];
                    tensorData[i] = this.inputBgr ? b : r;
                    tensorData[n + i] = g;
                    tensorData[2 * n + i] = this.inputBgr ? r : b;
                }
            }

            const ort: any = await import(this.runtimePkg);
            const session: any = this.session;
            const tensor = new ort.Tensor('float32', tensorData, [1, 3, this.size, this.size]);
            const feeds: Record<string, unknown> = { [session.inputNames[0]]: tensor };
            const out = await session.run(feeds);
            const vec = Array.from(out[session.outputNames[0]].data as Float32Array).map(Number);

            // L2-normalisation
            const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
            return vec.map((v) => v / norm);
        } catch (e) {
            this.logger.warn(
                `Échec calcul embedding facial : ${e instanceof Error ? e.message : String(e)}`,
            );
            return null;
        }
    }
}
