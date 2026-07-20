import { CanalNotification, TypeNotification } from 'src/generated/prisma';

/**
 * Payload interne pour créer et envoyer une notification.
 * Utilisé par le BookingService ou tout autre service métier.
 */
export interface SendNotificationPayload {
    /** ID de l'utilisateur destinataire */
    userId: string;

    /** Type de notification (cf. enum Prisma) */
    type: TypeNotification;

    /** Canal d'envoi (IN_APP par défaut, PUSH si token FCM dispo) */
    canal?: CanalNotification;

    /** Titre de la notification (max 200 chars) */
    titre: string;

    /** Corps du message */
    corps: string;

    /**
     * Données JSON supplémentaires transmises au client (deeplink, bookingId, etc.)
     */
    data?: Record<string, unknown>;

    /**
     * Date d'expiration automatique (par défaut : 30 jours après création)
     */
    expiresAt?: Date;
}

/**
 * Templates prédéfinis pour maintenir la cohérence des messages
 */
export const NotificationTemplates = {
    bookingNouveauArtisan: (clientNom: string, titre: string) => ({
        titre: '📋 Nouvelle demande de réservation',
        corps: `${clientNom} a soumis une demande pour : "${titre}"`,
    }),
    bookingAccepteClient: (artisanNom: string) => ({
        titre: '✅ Réservation acceptée',
        corps: `${artisanNom} a accepté votre demande. Il vous contactera prochainement.`,
    }),
    bookingRefuseClient: (artisanNom: string) => ({
        titre: '❌ Réservation refusée',
        corps: `${artisanNom} n'a pas pu accepter votre demande. Cherchez un autre artisan.`,
    }),
    prixProposeClient: (artisanNom: string, prix: number) => ({
        titre: '💰 Devis reçu',
        corps: `${artisanNom} vous propose un prix de ${prix.toLocaleString('fr-FR')} FCFA. Confirmez ou négociez.`,
    }),
    prixConfirmeArtisan: (clientNom: string, prix: number) => ({
        titre: '🤝 Devis accepté',
        corps: `${clientNom} a accepté votre devis de ${prix.toLocaleString('fr-FR')} FCFA. Vous pouvez démarrer l'intervention.`,
    }),
    interventionDemarree: (artisanNom: string) => ({
        titre: '🔧 Intervention démarrée',
        corps: `${artisanNom} a démarré votre intervention.`,
    }),
    interventionTerminee: (artisanNom: string) => ({
        titre: '🎉 Intervention terminée',
        corps: `${artisanNom} a marqué l'intervention comme terminée. Laissez un avis !`,
    }),
    // Clôture à deux temps : l'artisan a marqué terminé, le client doit confirmer.
    interventionAConfirmer: (artisanNom: string) => ({
        titre: '✅ Intervention à confirmer',
        corps: `${artisanNom} a marqué l'intervention comme terminée. Confirmez la fin et notez votre artisan.`,
    }),
    interventionConfirmee: (clientNom: string) => ({
        titre: '🎉 Intervention confirmée',
        corps: `${clientNom} a confirmé la fin de l'intervention. Mission clôturée !`,
    }),
    bookingAnnule: (parQui: string, raison?: string) => ({
        titre: '🚫 Réservation annulée',
        corps: raison
            ? `La réservation a été annulée par ${parQui}. Raison : ${raison}`
            : `La réservation a été annulée par ${parQui}.`,
    }),
};
