import { nomLisible } from './nom.util';

describe('nomLisible', () => {
    it('compose prénom + nom', () => {
        expect(nomLisible({ prenom: 'Jean', nom: 'Kwame' })).toBe('Jean Kwame');
    });

    it('ignore un profil vide et retombe sur le libellé générique', () => {
        expect(nomLisible({ prenom: null, nom: null }, 'Un client')).toBe('Un client');
        expect(nomLisible(null, 'Un client')).toBe('Un client');
        expect(nomLisible(undefined)).toBe('Un utilisateur');
    });

    it('gère un seul champ renseigné sans espace parasite', () => {
        expect(nomLisible({ prenom: 'Aline', nom: null })).toBe('Aline');
        expect(nomLisible({ prenom: null, nom: 'Dossou' })).toBe('Dossou');
        expect(nomLisible({ prenom: '', nom: 'Dossou' })).toBe('Dossou');
    });

    it('ne produit jamais « null null »', () => {
        expect(nomLisible({ prenom: null, nom: null })).not.toContain('null');
    });
});
