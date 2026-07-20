import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

/** Détecte un PDF par sa signature `%PDF`. */
export function looksLikePdf(buf: Buffer): boolean {
    return (
        !!buf &&
        buf.length > 4 &&
        buf[0] === 0x25 &&
        buf[1] === 0x50 &&
        buf[2] === 0x44 &&
        buf[3] === 0x46
    );
}

function run(cmd: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const p = spawn(cmd, args);
        let err = '';
        p.stderr.on('data', (d) => (err += d.toString()));
        p.on('error', reject);
        p.on('close', (code) =>
            code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}: ${err}`)),
        );
    });
}

/**
 * Rasterise la 1ʳᵉ page d'un PDF en PNG (via `pdftoppm`/poppler, 200 DPI).
 * Utile car l'État délivre le CIP en PDF. Lève si poppler est absent.
 */
export async function pdfFirstPageToPng(buf: Buffer): Promise<Buffer> {
    const base = join(tmpdir(), `cip-${randomUUID()}`);
    const pdfPath = `${base}.pdf`;
    const pngPath = `${base}.png`;
    await fs.writeFile(pdfPath, buf);
    try {
        // -singlefile → sortie exactement `base.png` (sans suffixe de page).
        await run('pdftoppm', ['-png', '-f', '1', '-l', '1', '-r', '200', '-singlefile', pdfPath, base]);
        return await fs.readFile(pngPath);
    } finally {
        await fs.rm(pdfPath, { force: true }).catch(() => undefined);
        await fs.rm(pngPath, { force: true }).catch(() => undefined);
    }
}

/** Renvoie un buffer image exploitable par sharp (rasterise si c'est un PDF). */
export async function toImageBuffer(buf: Buffer): Promise<Buffer> {
    return looksLikePdf(buf) ? pdfFirstPageToPng(buf) : buf;
}
