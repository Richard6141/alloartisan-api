import { masquerContacts, contientContact } from './anti-contact.util';

describe('anti-contact util', () => {
    describe('masquerContacts', () => {
        it('masque un numéro béninois espacé', () => {
            const { texte, modifie } = masquerContacts('Appelle-moi au 97 00 12 34');
            expect(modifie).toBe(true);
            expect(texte).not.toContain('97 00 12 34');
            expect(texte).toContain('•••');
        });

        it('masque un numéro international collé', () => {
            expect(masquerContacts('+22901970000').modifie).toBe(true);
        });

        it('masque une adresse email', () => {
            const { texte } = masquerContacts('mon mail: jean.dupont@gmail.com');
            expect(texte).not.toContain('jean.dupont@gmail.com');
        });

        it('masque les réseaux (whatsapp, telegram, wa.me)', () => {
            expect(masquerContacts('ajoute-moi sur whatsapp').modifie).toBe(true);
            expect(masquerContacts('mon telegram').modifie).toBe(true);
            expect(masquerContacts('wa.me/22990000000').modifie).toBe(true);
        });

        it('masque un pseudo @handle', () => {
            expect(masquerContacts('suis-moi @jean_artisan').modifie).toBe(true);
        });

        it('NE masque PAS un prix ou petit nombre', () => {
            expect(masquerContacts('Le devis est de 15000 FCFA').modifie).toBe(false);
            expect(masquerContacts("J'ai 5 ans d'expérience").modifie).toBe(false);
        });

        it('NE masque PAS une heure', () => {
            expect(masquerContacts('rendez-vous à 14:30').modifie).toBe(false);
        });

        it('gère null / undefined sans planter', () => {
            expect(masquerContacts(null).texte).toBe('');
            expect(masquerContacts(undefined).modifie).toBe(false);
        });
    });

    describe('contientContact', () => {
        it('détecte la présence de coordonnées', () => {
            expect(contientContact('appelle le 97001234')).toBe(true);
            expect(contientContact('Bonjour, je suis disponible demain')).toBe(false);
        });
    });
});
