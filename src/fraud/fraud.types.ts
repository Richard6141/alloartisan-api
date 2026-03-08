/**
 * Fraud scoring types — Sprint 12
 *
 * Score 0-100 calculé en temps réel selon des signaux comportementaux.
 * Actions automatiques déclenchées selon le niveau de risque.
 */

export interface FraudSignal {
    /** Taux d'annulation artisan > 50% → +30 pts */
    tauxAnnulation: number;
    /** Avis < 2 étoiles répétés → +20 pts */
    mauvaisAvisRepetes: number;
    /** Compte créé < 7 jours + transaction > 200K FCFA → +25 pts */
    nouveauCompteGrosseMise: boolean;
    /** Flooding demandes (> 10 bookings créés en 1h) → +15 pts */
    floodingDemandes: boolean;
    /** Profil non vérifié avec beaucoup d'activité → +10 pts */
    profilNonVerifieActif: number;
}

export interface FraudScore {
    artisanId: string;
    score: number;
    niveau: FraudNiveau;
    signaux: FraudSignal;
    action: FraudAction;
    calculatedAt: Date;
}

export enum FraudNiveau {
    NORMAL = 'NORMAL', // 0-30
    SURVEILLANCE = 'SURVEILLANCE', // 31-60
    VERIFICATION = 'VERIFICATION', // 61-80
    BLOQUE = 'BLOQUE', // 81-100
}

export enum FraudAction {
    AUCUNE = 'AUCUNE',
    LOG_ENHANCED = 'LOG_ENHANCED',
    NOTIF_ADMIN = 'NOTIF_ADMIN',
    BLOCAGE_TEMP = 'BLOCAGE_TEMP',
}

export function getFraudNiveau(score: number): FraudNiveau {
    if (score <= 30) return FraudNiveau.NORMAL;
    if (score <= 60) return FraudNiveau.SURVEILLANCE;
    if (score <= 80) return FraudNiveau.VERIFICATION;
    return FraudNiveau.BLOQUE;
}

export function getFraudAction(niveau: FraudNiveau): FraudAction {
    switch (niveau) {
        case FraudNiveau.NORMAL:
            return FraudAction.AUCUNE;
        case FraudNiveau.SURVEILLANCE:
            return FraudAction.LOG_ENHANCED;
        case FraudNiveau.VERIFICATION:
            return FraudAction.NOTIF_ADMIN;
        case FraudNiveau.BLOQUE:
            return FraudAction.BLOCAGE_TEMP;
    }
}
