/* Génère les icônes + splash AlloArtisan (logo « A Geste ») visibles :
   A BLANC + coup de pinceau ORANGE sur fond navy. Sortie -> app/assets/images */
const sharp = require('sharp');
const path = require('path');

const OUT = path.resolve(__dirname, '../../alloartisan-app/assets/images');

const NAVY = '#1E3A8A';
const WHITE = '#FFFFFF';
const ORANGE = '#D97706';

// Depuis BrandLogo.tsx (viewBox 0 0 100 100)
const A_PATH = 'M50 12 L90 90 L72 90 L64 70 L36 70 L28 90 L10 90 Z M50 44 L60 64 L40 64 Z';
const BRUSH_PATH =
    'M18 68 C 34 62, 54 62, 70 55 C 78 52, 85 47, 90 41 C 86 50, 80 59, 71 64 C 56 72, 36 74, 18 72 Z';

/** SVG carré `canvas`px : logo (100u) centré, mis à l'échelle `scale`. */
function markSvg({ canvas, scale, bg, aColor, brushColor, brush = true }) {
    const logo = canvas * scale;
    const off = (canvas - logo) / 2;
    const bgRect = bg ? `<rect width="${canvas}" height="${canvas}" fill="${bg}"/>` : '';
    const brushEl = brush ? `<path d="${BRUSH_PATH}" fill="${brushColor}"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}">
      ${bgRect}
      <g transform="translate(${off},${off}) scale(${logo / 100})">
        <path d="${A_PATH}" fill="${aColor}" fill-rule="evenodd"/>
        ${brushEl}
      </g>
    </svg>`;
}

async function png(svg, size, file) {
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(OUT, file));
    console.log('  ✓', file);
}

(async () => {
    console.log('Génération des icônes ->', OUT);
    // Icône principale (iOS + fallback) : fond navy plein, iOS arrondit lui-même
    await png(markSvg({ canvas: 1024, scale: 0.62, bg: NAVY, aColor: WHITE, brushColor: ORANGE }), 1024, 'icon.png');
    // Adaptatif Android — premier plan transparent (le fond vient du backgroundColor)
    await png(markSvg({ canvas: 1024, scale: 0.6, bg: null, aColor: WHITE, brushColor: ORANGE }), 1024, 'android-icon-foreground.png');
    // Adaptatif Android — fond navy plein
    await png(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${NAVY}"/></svg>`, 1024, 'android-icon-background.png');
    // Monochrome (thèmes Android) : A blanc seul, sans pinceau
    await png(markSvg({ canvas: 1024, scale: 0.6, bg: null, aColor: WHITE, brushColor: WHITE, brush: false }), 1024, 'android-icon-monochrome.png');
    // Splash : logo sur transparent (le navy vient du splash backgroundColor)
    await png(markSvg({ canvas: 1024, scale: 0.72, bg: null, aColor: WHITE, brushColor: ORANGE }), 1024, 'splash-icon.png');
    // Favicon web
    await png(markSvg({ canvas: 64, scale: 0.72, bg: NAVY, aColor: WHITE, brushColor: ORANGE }), 64, 'favicon.png');
    console.log('Terminé.');
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
