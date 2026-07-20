import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface FaceRegion {
    left: number;
    top: number;
    width: number;
    height: number;
    score: number;
}

/**
 * Détecteur de visage SCRFD (InsightFace) — ONNX auto-hébergé.
 *
 * Sert à RECADRER le visage avant l'embedding ArcFace (ArcFace attend un visage
 * isolé, pas la pièce entière → gros gain de précision). Renvoie la boîte du
 * visage principal dans les coordonnées de l'image d'origine.
 *
 * Activé par `FACE_DETECTOR_ENABLED=true` + `FACE_DETECTOR_PATH`. Chargé
 * dynamiquement : sans la dépendance/le modèle, se désactive proprement.
 *
 * Décodage robuste (indépendant des noms de sorties) : les 9 sorties sont
 * regroupées par dernière dimension (1=score, 4=bbox, 10=kps) et par première
 * dimension (12800/3200/800 → stride 8/16/32, num_anchors=2).
 */
@Injectable()
export class ScrfdFaceDetector {
    private readonly logger = new Logger(ScrfdFaceDetector.name);
    private readonly runtimePkg = 'onnxruntime-node';
    private readonly inputSize = 640;
    private readonly strides = [8, 16, 32];
    private readonly numAnchors = 2;
    private readonly scoreThresh = 0.5;
    private readonly nmsThresh = 0.4;
    private session: unknown = null;
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
            this.session = await ort.InferenceSession.create(process.env.FACE_DETECTOR_PATH as string);
            this.available = true;
            this.logger.log('Détecteur de visage SCRFD chargé.');
        } catch (e) {
            this.available = false;
            this.logger.warn(
                `Détecteur SCRFD indisponible : ${e instanceof Error ? e.message : String(e)}`,
            );
        }
        return this.available;
    }

    /** Détecte le visage principal et renvoie une boîte carrée (avec marge) à recadrer. */
    async detectRegion(imageBuffer: Buffer): Promise<FaceRegion | null> {
        if (!(await this.ensureSession()) || !this.session) return null;
        try {
            const meta = await sharp(imageBuffer).metadata();
            const origW = meta.width ?? 0;
            const origH = meta.height ?? 0;
            if (!origW || !origH) return null;

            const S = this.inputSize;
            const scale = Math.min(S / origW, S / origH);
            const newW = Math.round(origW * scale);
            const newH = Math.round(origH * scale);

            // Letterbox : redimensionne en gardant le ratio, complète en noir (bas/droite).
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
                blob[i] = (data[i * info.channels] - 127.5) / 128; // R
                blob[n + i] = (data[i * info.channels + 1] - 127.5) / 128; // G
                blob[2 * n + i] = (data[i * info.channels + 2] - 127.5) / 128; // B
            }

            const ort: any = await import(this.runtimePkg);
            const session: any = this.session;
            const out = await session.run({
                [session.inputNames[0]]: new ort.Tensor('float32', blob, [1, 3, S, S]),
            });

            // Regroupe les sorties par (première dim, dernière dim).
            const byKey = new Map<string, Float32Array>();
            for (const name of session.outputNames as string[]) {
                const t = out[name];
                const rows = t.dims[0];
                const cols = t.dims[1];
                byKey.set(`${rows}:${cols}`, t.data as Float32Array);
            }

            const boxes: number[][] = [];
            const scores: number[] = [];
            for (const stride of this.strides) {
                const grid = S / stride;
                const num = grid * grid * this.numAnchors;
                const sc = byKey.get(`${num}:1`);
                const bb = byKey.get(`${num}:4`);
                if (!sc || !bb) continue;

                for (let i = 0; i < num; i++) {
                    const score = sc[i];
                    if (score < this.scoreThresh) continue;
                    const anchorIdx = Math.floor(i / this.numAnchors);
                    const gx = anchorIdx % grid;
                    const gy = Math.floor(anchorIdx / grid);
                    const cx = gx * stride;
                    const cy = gy * stride;
                    const x1 = cx - bb[i * 4] * stride;
                    const y1 = cy - bb[i * 4 + 1] * stride;
                    const x2 = cx + bb[i * 4 + 2] * stride;
                    const y2 = cy + bb[i * 4 + 3] * stride;
                    boxes.push([x1 / scale, y1 / scale, x2 / scale, y2 / scale]);
                    scores.push(score);
                }
            }
            if (boxes.length === 0) return null;

            const keep = this.nms(boxes, scores);
            if (keep.length === 0) return null;
            // Visage principal : meilleur score parmi les survivants.
            const best = keep.reduce((a, b) => (scores[b] > scores[a] ? b : a), keep[0]);
            const [x1, y1, x2, y2] = boxes[best];

            // Carré + marge 40 %, clampé à l'image.
            const w = x2 - x1;
            const h = y2 - y1;
            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2;
            const size = Math.max(w, h) * 1.4;
            let left = Math.round(cx - size / 2);
            let top = Math.round(cy - size / 2);
            let side = Math.round(size);
            left = Math.max(0, Math.min(left, origW - 1));
            top = Math.max(0, Math.min(top, origH - 1));
            side = Math.max(1, Math.min(side, origW - left, origH - top));

            return { left, top, width: side, height: side, score: scores[best] };
        } catch (e) {
            this.logger.warn(
                `Détection SCRFD échouée : ${e instanceof Error ? e.message : String(e)}`,
            );
            return null;
        }
    }

    private iou(a: number[], b: number[]): number {
        const xx1 = Math.max(a[0], b[0]);
        const yy1 = Math.max(a[1], b[1]);
        const xx2 = Math.min(a[2], b[2]);
        const yy2 = Math.min(a[3], b[3]);
        const w = Math.max(0, xx2 - xx1);
        const h = Math.max(0, yy2 - yy1);
        const inter = w * h;
        const areaA = (a[2] - a[0]) * (a[3] - a[1]);
        const areaB = (b[2] - b[0]) * (b[3] - b[1]);
        return inter / (areaA + areaB - inter || 1);
    }

    private nms(boxes: number[][], scores: number[]): number[] {
        const order = scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
        const keep: number[] = [];
        const removed = new Set<number>();
        for (const i of order) {
            if (removed.has(i)) continue;
            keep.push(i);
            for (const j of order) {
                if (j === i || removed.has(j)) continue;
                if (this.iou(boxes[i], boxes[j]) > this.nmsThresh) removed.add(j);
            }
        }
        return keep;
    }
}
