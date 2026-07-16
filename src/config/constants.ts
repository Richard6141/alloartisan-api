import { PlanAbonnement } from 'src/subscriptions/dto/upgrade-subscription.dto';

export { PlanAbonnement };

// Durée des abonnements en jours
export const PLAN_DURATIONS: Record<PlanAbonnement, number> = {
    [PlanAbonnement.GRATUIT]: 0, // Pas d'expiration
    [PlanAbonnement.STANDARD]: 30, // 1 mois
    [PlanAbonnement.PREMIUM]: 30, // 1 mois
    [PlanAbonnement.GOLD]: 30, // 1 mois
};

// Quotas par plan (mises en relation/mois) — modèle de revenus de la plateforme.
// GRATUIT = 0 : un artisan non abonné n'a QUE ses essais découverte à vie
// (ESSAIS_GRATUITS), après quoi l'abonnement est obligatoire.
export const PLAN_QUOTAS: Record<PlanAbonnement, number | null> = {
    [PlanAbonnement.GRATUIT]: 0,
    [PlanAbonnement.STANDARD]: 8,
    [PlanAbonnement.PREMIUM]: 50,
    [PlanAbonnement.GOLD]: null, // Illimité
};

// Déblocages gratuits « essai découverte » offerts À VIE à chaque artisan
// pour goûter au service avant de devoir s'abonner.
export const ESSAIS_GRATUITS = 3;

// Anti-fuite : sanction graduée sur les tentatives de partage de coordonnées.
// Au-delà de SEUIL_CONTACT_AVERTISSEMENT, l'avertissement se durcit ; à
// SEUIL_CONTACT_SIGNALEMENT, l'utilisateur est signalé à l'admin.
export const SEUIL_CONTACT_AVERTISSEMENT = 3;
export const SEUIL_CONTACT_SIGNALEMENT = 5;

// Tarifs en XOF (le paiement passe par KkiaPay via /subscriptions/pay)
export const PLAN_TARIFFS: Record<PlanAbonnement, number> = {
    [PlanAbonnement.GRATUIT]: 0,
    [PlanAbonnement.STANDARD]: 5000, // 5 000 FCFA/mois
    [PlanAbonnement.PREMIUM]: 15000, // 15 000 FCFA/mois
    [PlanAbonnement.GOLD]: 25000, // 25 000 FCFA/mois
};

// Taux de commission par défaut (10%)
export const COMMISSION_RATE = 0.1;

// ==================== PARRAINAGE ====================

// Récompenses de parrainage (FCFA) — versées sous forme de codes promo personnels
// quand le filleul termine sa première intervention payée
export const REFERRAL_REWARD_PARRAIN = 1000;
export const REFERRAL_REWARD_FILLEUL = 500;

// Validité des codes promo de récompense (jours)
export const REFERRAL_REWARD_VALIDITY_DAYS = 90;

// Délai maximal après inscription pour saisir un code parrain (jours)
export const REFERRAL_APPLY_WINDOW_DAYS = 30;

// ==================== PROGRAMME AMBASSADEUR ====================
// Récompense = temps d'abonnement offert (zéro cash), déclenchée quand le
// filleul (artisan) paie son PREMIER abonnement.

// Jours offerts au parrain, par filleul qui s'abonne
export const AMBASSADEUR_JOURS_PARRAIN = 30;
// Jours offerts au filleul, ajoutés à son 1er abonnement payé
export const AMBASSADEUR_JOURS_FILLEUL = 30;

// Paliers : seuil (nb filleuls abonnés) → niveau + bonus de jours offerts
export const AMBASSADEUR_PALIERS = [
    { seuil: 3, niveau: 'BRONZE' as const, bonusJours: 15 },
    { seuil: 5, niveau: 'ARGENT' as const, bonusJours: 30 },
    { seuil: 10, niveau: 'OR' as const, bonusJours: 60 },
];
