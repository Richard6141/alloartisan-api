/**
 * Fournisseur d'embedding facial — interface pluggable (Phase 2 biométrie).
 *
 * L'implémentation par défaut (ONNX auto-hébergé) charge le moteur dynamiquement
 * et reste DÉSACTIVÉE tant que `FACE_BIOMETRIE_ENABLED=true` et qu'un modèle
 * (`FACE_MODEL_PATH`) ne sont pas fournis → aucun risque au démarrage.
 */
export const FACE_EMBEDDING_PROVIDER = 'FACE_EMBEDDING_PROVIDER';

export interface EmbeddingProvider {
    /** Le moteur est-il actif (env + dépendance + modèle disponibles) ? */
    readonly enabled: boolean;
    /** Identifiant de version du modèle (pour ne comparer que des vecteurs comparables). */
    readonly modelId: string;
    /**
     * Calcule l'embedding facial L2-normalisé d'une image (Buffer).
     * Retourne `null` si désactivé, si le moteur est indisponible, ou en cas d'échec.
     */
    embed(imageBuffer: Buffer): Promise<number[] | null>;
}
