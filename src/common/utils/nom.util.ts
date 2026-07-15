/**
 * Nom lisible d'un utilisateur pour l'affichage (notifications, listes…).
 *
 * Un profil peut être incomplet : `prenom` et/ou `nom` valent alors `null`.
 * Composer naïvement `${prenom} ${nom}` produisait « null null » dans les
 * notifications reçues par l'artisan. Cette fonction ignore les champs vides
 * et retombe sur un libellé générique quand rien n'est exploitable.
 */
export function nomLisible(
    user: { prenom?: string | null; nom?: string | null } | null | undefined,
    fallback = 'Un utilisateur',
): string {
    const complet = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.replace(/\s+/g, ' ').trim();
    return complet || fallback;
}
