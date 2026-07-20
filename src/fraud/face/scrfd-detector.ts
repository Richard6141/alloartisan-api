import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

/** Points canoniques ArcFace pour un gabarit 112×112 (œil G, œil D, nez, bouche G, bouche D). */
const ARCFACE_DST: number[][] = [
    [38.2946, 51.6963],
    [73.5318, 51.5014],
    [56.0252, 71.7366],
    [41.5493, 92.3655],
    [70.7299, 92.2041],
];
const OUT = 112;

/**
 * Détecteur + aligneur de visage SCRFD (InsightFace) — ONNX auto-hébergé.
 *
 * Détecte le visage principal, récupère ses 5 landmarks, puis produit une
 * vignette 112×112 ALIGNÉE (transformation de similarité Umeyama + warp affine
 * bilinéaire manuel) prête pour ArcFace. L'alignement fait passer la similarité
 * même-personne de ~0.47 (recadrage bbox) à ~0.8 (validé sur vraies paires).
 *
 * Activé par `FACE_DETECTOR_ENABLED=true` + `FACE_DETECTOR_PATH`. Chargé
 * dynamiquement : sans la dépendance/le modèle, se désactive proprement.
 * Décodage robuste par dimensions (9 sorties, strides 8/16/32, num_anchors=2).
 */
@Injectable()
export class ScrfdFaceDetector {
    private readonly logger = new Logger(ScrfdFaceDetector.name);
    private readonly runtimePkg = 'onnxruntime-node';
    // Entrée dynamique : 1024 par défaut (meilleure détection des PETITS visages,
    // ex. photo d'identité dans une pièce), surchargeable via FACE_DET_SIZE.
    // Doit être un multiple de 32 (plus grand stride).
    private readonly inputSize = this.readSize();
    private readonly strides = [8, 16, 32];
    private readonly numAnchors = 2;
    private readonly scoreThresh = Number(process.env.FACE_DET_THRESH ?? 0.4);
    private session: unknown = null;

    private readSize(): number {
        const s = Number(process.env.FACE_DET_SIZE ?? 1024);
        return Number.isFinite(s) && s >= 320 ? Math.round(s / 32) * 32 : 1024;
    }
    private initTried = false;
    private available = false;

    get enabled(): boolean {
        return process.env.FACE_DETECTOR_ENABLED === 'true' && !!process.env.FACE_DETECTOR_PATH;
    }

    private async ensureSession(): Promise<boolean> {
        if (this.initTried) return this.available;
        this.initTried = true;
        if (!this.enabled) return false;
        try {
            const ort: any = await import(this.runtimePkg);
            // logSeverityLevel:3 → silence les warnings "VerifyOutputSizes"
            // (normaux quand l'entrée dynamique diffère de la taille nominale).
            this.session = await ort.InferenceSession.create(
                process.env.FACE_DETECTOR_PATH as string,
                { logSeverityLevel: 3 },
            );
            this.available = true;
            this.logger.log(`Détecteur de visage SCRFD chargé (input ${this.inputSize}).`);
        } catch (e) {
            this.available = false;
            this.logger.warn(
                `Détecteur SCRFD indisponible : ${e instanceof Error ? e.message : String(e)}`,
            );
        }
        return this.available;
    }

    /** 5 landmarks du visage principal, en coordonnées de l'image d'origine. */
    private async detectLandmarks(imageBuffer: Buffer): Promise<number[][] | null> {
        const meta = await sharp(imageBuffer).metadata();
        const origW = meta.width ?? 0;
        const origH = meta.height ?? 0;
        if (!origW || !origH) return null;

        const S = this.inputSize;
        const scale = Math.min(S / origW, S / origH);
        const newW = Math.round(origW * scale);
        const newH = Math.round(origH * scale);

        const { data, info } = await sharp(imageBuffer)
            .removeAlpha()
            .resize(newW, newH, { fit: 'fill' })
            .extend({
                top: 0,
                left: 0,
                bottom: S - newH,
                right: S - newW,
                background: { r: 0, g: 0, b: 0 },
            })
            .raw()
            .toBuffer({ resolveWithObject: true });
        if (info.channels < 3) return null;

        const n = S * S;
        const blob = new Float32Array(3 * n);
        for (let i = 0; i < n; i++) {
            blob[i] = (data[i * info.channels] - 127.5) / 128;
            blob[n + i] = (data[i * info.channels + 1] - 127.5) / 128;
            blob[2 * n + i] = (data[i * info.channels + 2] - 127.5) / 128;
        }

        const ort: any = await import(this.runtimePkg);
        const session: any = this.session;
        const out = await session.run({
            [session.inputNames[0]]: new ort.Tensor('float32', blob, [1, 3, S, S]),
        });

        const byKey = new Map<string, Float32Array>();
        for (const name of session.outputNames as string[]) {
            const t = out[name];
            byKey.set(`${t.dims[0]}:${t.dims[1]}`, t.data as Float32Array);
        }

        let best: { score: number; kps: number[][] } | null = null;
        for (const stride of this.strides) {
            const grid = S / stride;
            const num = grid * grid * this.numAnchors;
            const sc = byKey.get(`${num}:1`);
            const kp = byKey.get(`${num}:10`);
            if (!sc || !kp) continue;
            for (let i = 0; i < num; i++) {
                if (sc[i] < this.scoreThresh) continue;
                if (best && sc[i] <= best.score) continue;
                const anchorIdx = Math.floor(i / this.numAnchors);
                const gx = anchorIdx % grid;
                const gy = Math.floor(anchorIdx / grid);
                const cx = gx * stride;
                const cy = gy * stride;
                const kps: number[][] = [];
                for (let k = 0; k < 5; k++) {
                    kps.push([
                        (cx + kp[i * 10 + k * 2] * stride) / scale,
                        (cy + kp[i * 10 + k * 2 + 1] * stride) / scale,
                    ]);
                }
                best = { score: sc[i], kps };
            }
        }
        return best ? best.kps : null;
    }

    /**
     * Vignette de visage ALIGNÉE 112×112 en pixels bruts RGB (NCHW), prête pour
     * ArcFace. Renvoie null si moteur inactif ou aucun visage détecté.
     */
    async alignedFaceTensor(imageBuffer: Buffer): Promise<Float32Array | null> {
        if (!(await this.ensureSession()) || !this.session) return null;
        try {
            const kps = await this.detectLandmarks(imageBuffer);
            if (!kps) return null;

            const { a, b, tx, ty } = this.solveSimilarity(kps, ARCFACE_DST);
            // Inverse de la similarité [[a,-b,tx],[b,a,ty]] (sortie → source).
            const det = a * a + b * b || 1;
            const ia = a / det;
            const ib = b / det;
            const itx = -(ia * tx + ib * ty);
            const ity = -(-ib * tx + ia * ty);

            const { data, info } = await sharp(imageBuffer)
                .removeAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true });
            const w = info.width;
            const h = info.height;
            const ch = info.channels;
            const sample = (sx: number, sy: number, c: number): number => {
                if (sx < 0 || sy < 0 || sx >= w - 1 || sy >= h - 1) return 0;
                const x0 = Math.floor(sx);
                const y0 = Math.floor(sy);
                const fx = sx - x0;
                const fy = sy - y0;
                const p = (x: number, y: number) => data[(y * w + x) * ch + c];
                return (
                    p(x0, y0) * (1 - fx) * (1 - fy) +
                    p(x0 + 1, y0) * fx * (1 - fy) +
                    p(x0, y0 + 1) * (1 - fx) * fy +
                    p(x0 + 1, y0 + 1) * fx * fy
                );
            };

            const nn = OUT * OUT;
            const t = new Float32Array(3 * nn);
            for (let oy = 0; oy < OUT; oy++) {
                for (let ox = 0; ox < OUT; ox++) {
                    const sx = ia * ox + ib * oy + itx;
                    const sy = -ib * ox + ia * oy + ity;
                    const o = oy * OUT + ox;
                    t[o] = sample(sx, sy, 0); // R (pixels bruts)
                    t[nn + o] = sample(sx, sy, 1); // G
                    t[2 * nn + o] = sample(sx, sy, 2); // B
                }
            }
            return t;
        } catch (e) {
            this.logger.warn(
                `Alignement SCRFD échoué : ${e instanceof Error ? e.message : String(e)}`,
            );
            return null;
        }
    }

    /** Moindres carrés : similarité src→dst = [[a,-b,tx],[b,a,ty]]. */
    private solveSimilarity(
        src: number[][],
        dst: number[][],
    ): { a: number; b: number; tx: number; ty: number } {
        const ATA = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ];
        const ATy = [0, 0, 0, 0];
        const acc = (r: number[], y: number) => {
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) ATA[i][j] += r[i] * r[j];
                ATy[i] += r[i] * y;
            }
        };
        for (let i = 0; i < src.length; i++) {
            const [x, y] = src[i];
            const [X, Y] = dst[i];
            acc([x, -y, 1, 0], X);
            acc([y, x, 0, 1], Y);
        }
        // Élimination de Gauss 4×4.
        const M = ATA.map((row, i) => row.concat(ATy[i]));
        for (let c = 0; c < 4; c++) {
            let piv = c;
            for (let r = c + 1; r < 4; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
            [M[c], M[piv]] = [M[piv], M[c]];
            for (let r = 0; r < 4; r++) {
                if (r === c) continue;
                const f = M[r][c] / M[c][c];
                for (let k = c; k <= 4; k++) M[r][k] -= f * M[c][k];
            }
        }
        return {
            a: M[0][4] / M[0][0],
            b: M[1][4] / M[1][1],
            tx: M[2][4] / M[2][2],
            ty: M[3][4] / M[3][3],
        };
    }
}
