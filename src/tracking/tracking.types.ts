/**
 * Types du module Tracking — suivi temps réel des déplacements artisans.
 */

/** Phase de déplacement de l'artisan vers le lieu d'intervention */
export type TrackingPhase = 'EN_ROUTE' | 'ARRIVE' | 'EN_INTERVENTION' | 'TERMINE';

export const TRACKING_PHASES: TrackingPhase[] = [
    'EN_ROUTE',
    'ARRIVE',
    'EN_INTERVENTION',
    'TERMINE',
];

/** Position live d'un artisan, stockée dans Redis (jamais en BDD — donnée éphémère) */
export interface LivePosition {
    bookingId: string;
    artisanUserId: string;
    latitude: number;
    longitude: number;
    /** Cap en degrés (0-360), optionnel */
    heading?: number;
    /** Vitesse en m/s, optionnel */
    speed?: number;
    /** Précision GPS en mètres, optionnel */
    accuracy?: number;
    /** Distance restante jusqu'au lieu d'intervention (mètres) */
    distanceMetres?: number;
    /** Estimation d'arrivée en minutes */
    etaMinutes?: number;
    /** Timestamp ISO de la mise à jour */
    updatedAt: string;
}

/** État complet du tracking d'un booking (position + phase) */
export interface TrackingState {
    bookingId: string;
    phase: TrackingPhase | null;
    position: LivePosition | null;
    /** Coordonnées du lieu d'intervention (pour afficher la destination côté client) */
    destination: { latitude: number; longitude: number } | null;
}

/** Payload WebSocket : mise à jour de position (artisan → serveur) */
export interface PositionUpdatePayload {
    bookingId: string;
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
}

/** Payload WebSocket : changement de phase (artisan → serveur) */
export interface PhaseUpdatePayload {
    bookingId: string;
    phase: TrackingPhase;
}
