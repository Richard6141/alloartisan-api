/**
 * Anti-désintermédiation : détection et masquage des coordonnées dans le texte
 * libre (messages, bio, légendes…). Empêche le contournement du paywall par
 * échange de numéro / email / réseau social pour continuer hors plateforme.
 */

const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
// Suite de chiffres façon numéro (séparateurs + espaces . - ( ) tolérés)
const PHONE_CANDIDAT = /[+(]?\d[\d\s().-]{5,}\d/g;
// Applications et réseaux de contact hors plateforme
const RESEAUX =
    /\b(whats?app|wa\.me|telegram|t\.me|signal|imo|viber|snapchat|snap|instagram|insta|facebook|messenger|tiktok|gmail|yahoo|outlook|hotmail)\b/gi;
// Pseudos @handle
const HANDLE = /(?<![\w.])@\w{3,}/g;

const REMPLACEMENT = '•••';

/** Un texte contient-il des coordonnées (numéro, email, réseau) ? */
export function contientContact(texte: string | null | undefined): boolean {
    return masquerContacts(texte).modifie;
}

/**
 * Remplace toute coordonnée par « ••• ». Retourne le texte nettoyé et un
 * indicateur `modifie` (true si quelque chose a été masqué).
 */
export function masquerContacts(texte: string | null | undefined): {
    texte: string;
    modifie: boolean;
} {
    if (!texte) return { texte: texte ?? '', modifie: false };
    let modifie = false;
    let out = texte;

    // 1. Emails
    out = out.replace(EMAIL, () => {
        modifie = true;
        return REMPLACEMENT;
    });

    // 2. Numéros de téléphone : au moins 7 chiffres, sans « : » (évite les heures)
    out = out.replace(PHONE_CANDIDAT, (m) => {
        const chiffres = (m.match(/\d/g) ?? []).length;
        if (chiffres >= 7 && !m.includes(':')) {
            modifie = true;
            return REMPLACEMENT;
        }
        return m;
    });

    // 3. Réseaux / applis de contact
    out = out.replace(RESEAUX, () => {
        modifie = true;
        return REMPLACEMENT;
    });

    // 4. Pseudos @handle
    out = out.replace(HANDLE, () => {
        modifie = true;
        return REMPLACEMENT;
    });

    return { texte: out, modifie };
}
