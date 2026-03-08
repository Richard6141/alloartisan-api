import { PlanAbonnement } from 'src/subscriptions/dto/upgrade-subscription.dto';

export { PlanAbonnement };

// Durée des abonnements en jours
export const PLAN_DURATIONS: Record<PlanAbonnement, number> = {
    [PlanAbonnement.GRATUIT]: 0, // Pas d'expiration
    [PlanAbonnement.STANDARD]: 30, // 1 mois
    [PlanAbonnement.PREMIUM]: 30, // 1 mois
};

// Quotas par plan (demandes/mois)
export const PLAN_QUOTAS: Record<PlanAbonnement, number | null> = {
    [PlanAbonnement.GRATUIT]: 5,
    [PlanAbonnement.STANDARD]: 30,
    [PlanAbonnement.PREMIUM]: null, // Illimité
};

// Tarifs en XOF (pour information — le paiement réel passe par PaymentModule)
export const PLAN_TARIFFS: Record<PlanAbonnement, number> = {
    [PlanAbonnement.GRATUIT]: 0,
    [PlanAbonnement.STANDARD]: 5000, // 5 000 FCFA/mois
    [PlanAbonnement.PREMIUM]: 15000, // 15 000 FCFA/mois
};

// Taux de commission par défaut (10%)
export const COMMISSION_RATE = 0.1;
