import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// Prisma import removed — not used directly (queryRaw returns typed generics)
import { SearchNearbyDto } from './dto/search-nearby.dto';

@Injectable()
export class GeolocationService {
    private readonly logger = new Logger(GeolocationService.name);

    constructor(private readonly prisma: PrismaService) {}

    // ============================================================
    // RECHERCHE ARTISANS PROCHES — PostGIS ST_DWithin
    // ============================================================

    /**
     * Recherche les artisans actifs dans un rayon donné via PostGIS.
     * Utilise ST_DWithin (index GiST) pour une performance optimale.
     * Tri par distance croissante.
     */
    async findNearbyArtisans(dto: SearchNearbyDto): Promise<any[]> {
        const { lat, lng, radius = 25, metierId, limit = 20 } = dto;

        if (lat === undefined || lng === undefined) {
            throw new BadRequestException(
                'Les paramètres lat et lng sont obligatoires pour la recherche géospatiale',
            );
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new BadRequestException('Coordonnées géographiques invalides');
        }

        const radiusMeters = radius * 1000;

        try {
            // Requête PostGIS optimisée avec ST_DWithin (utilise l'index GiST)
            const artisans = metierId
                ? await this.prisma.$queryRaw<any[]>`
                    SELECT
                        a.id,
                        a.nom_entreprise,
                        a.slogan,
                        a.photo_profil_url,
                        a.note_moyenne,
                        a.nombre_avis,
                        a.tarif_horaire,
                        a.tarif_deplacement,
                        a.abonnement_type,
                        a.ville_principale,
                        a.disponible,
                        a.latitude,
                        a.longitude,
                        u.nom,
                        u.prenom,
                        u.photo_url AS user_photo_url,
                        ROUND(
                            ST_Distance(
                                a.location,
                                ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)::geography
                            )::numeric / 1000,
                            2
                        ) AS distance_km
                    FROM artisans a
                    INNER JOIN users u ON u.id = a.user_id
                    WHERE
                        a.statut = 'ACTIF'
                        AND a.verified = true
                        AND a.disponible = true
                        AND a.deleted_at IS NULL
                        AND a.location IS NOT NULL
                        AND u.statut = 'ACTIF'
                        -- Dans le rayon du client ET dans la zone d'intervention déclarée par l'artisan
                        AND ST_DWithin(
                            a.location,
                            ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)::geography,
                            LEAST(${radiusMeters}::float, a.zone_intervention_km::float * 1000)
                        )
                        AND EXISTS (
                            SELECT 1 FROM artisan_metiers am
                            WHERE am.artisan_id = a.id
                            AND am.metier_id = ${metierId}
                        )
                    ORDER BY
                        -- Priorité abonnement (GOLD > PREMIUM > STANDARD) puis distance
                        CASE a.abonnement_type
                            WHEN 'GOLD' THEN 0
                            WHEN 'PREMIUM' THEN 1
                            WHEN 'STANDARD' THEN 2
                            ELSE 3
                        END,
                        distance_km ASC
                    LIMIT ${limit}::int
                `
                : await this.prisma.$queryRaw<any[]>`
                    SELECT
                        a.id,
                        a.nom_entreprise,
                        a.slogan,
                        a.photo_profil_url,
                        a.note_moyenne,
                        a.nombre_avis,
                        a.tarif_horaire,
                        a.tarif_deplacement,
                        a.abonnement_type,
                        a.ville_principale,
                        a.disponible,
                        a.latitude,
                        a.longitude,
                        u.nom,
                        u.prenom,
                        u.photo_url AS user_photo_url,
                        ROUND(
                            ST_Distance(
                                a.location,
                                ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)::geography
                            )::numeric / 1000,
                            2
                        ) AS distance_km
                    FROM artisans a
                    INNER JOIN users u ON u.id = a.user_id
                    WHERE
                        a.statut = 'ACTIF'
                        AND a.verified = true
                        AND a.disponible = true
                        AND a.deleted_at IS NULL
                        AND a.location IS NOT NULL
                        AND u.statut = 'ACTIF'
                        -- Dans le rayon du client ET dans la zone d'intervention déclarée par l'artisan
                        AND ST_DWithin(
                            a.location,
                            ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)::geography,
                            LEAST(${radiusMeters}::float, a.zone_intervention_km::float * 1000)
                        )
                    ORDER BY
                        CASE a.abonnement_type
                            WHEN 'GOLD' THEN 0
                            WHEN 'PREMIUM' THEN 1
                            WHEN 'STANDARD' THEN 2
                            ELSE 3
                        END,
                        distance_km ASC
                    LIMIT ${limit}::int
                `;

            this.logger.debug(
                `findNearbyArtisans: ${artisans.length} résultats | lat=${lat}, lng=${lng}, radius=${radius}km`,
            );

            return (artisans as Record<string, unknown>[]).map((a) => this.formatArtisanResult(a));
        } catch (error) {
            this.logger.error(
                `Erreur requête PostGIS: ${error instanceof Error ? error.message : String(error)}`,
            );

            // Fallback si PostGIS non disponible (extension non installée)
            if (error instanceof Error && error.message.includes('function st_dwithin')) {
                this.logger.warn(
                    'PostGIS non disponible — basculement sur recherche par ville (dégradé)',
                );
                return this.fallbackSearchByCity(dto);
            }

            throw error;
        }
    }

    // ============================================================
    // DISTANCE ENTRE UN POINT ET UN ARTISAN
    // ============================================================

    async getArtisanDistance(artisanId: string, lat: number, lng: number): Promise<any> {
        // Vérifier que l'artisan existe
        const artisan = await this.prisma.artisan.findFirst({
            where: { id: artisanId, deletedAt: null },
            select: {
                id: true,
                nomEntreprise: true,
                villePrincipale: true,
                latitude: true,
                longitude: true,
            },
        });

        if (!artisan) {
            throw new NotFoundException('Artisan non trouvé');
        }

        if (!artisan.latitude || !artisan.longitude) {
            return {
                artisanId,
                nomEntreprise: artisan.nomEntreprise,
                villePrincipale: artisan.villePrincipale,
                distanceKm: null,
                message: "Position géographique de l'artisan non renseignée",
            };
        }

        // Calcul PostGIS précis
        const result = await this.prisma.$queryRaw<{ distance_km: number }[]>`
            SELECT ROUND(
                ST_Distance(
                    a.location,
                    ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)::geography
                )::numeric / 1000,
                2
            ) AS distance_km
            FROM artisans a
            WHERE a.id = ${artisanId}
            AND a.location IS NOT NULL
        `;

        const distanceKm =
            result.length > 0
                ? Number(result[0].distance_km)
                : this.haversineDistance(
                      lat,
                      lng,
                      Number(artisan.latitude),
                      Number(artisan.longitude),
                  );

        return {
            artisanId,
            nomEntreprise: artisan.nomEntreprise,
            villePrincipale: artisan.villePrincipale,
            distanceKm,
            dureeEstimeeMinutes: Math.round(distanceKm * 2), // ~30 km/h en ville
        };
    }

    // ============================================================
    // FALLBACK — Sans PostGIS (mode dégradé)
    // ============================================================

    private async fallbackSearchByCity(dto: SearchNearbyDto): Promise<any[]> {
        const artisans = await this.prisma.artisan.findMany({
            where: {
                statut: 'ACTIF',
                verified: true,
                disponible: true,
                deletedAt: null,
                ...(dto.metierId && {
                    metiers: { some: { metierId: dto.metierId } },
                }),
            },
            select: {
                id: true,
                nomEntreprise: true,
                slogan: true,
                photoProfilUrl: true,
                noteMoyenne: true,
                nombreAvis: true,
                tarifHoraire: true,
                tarifDeplacement: true,
                abonnementType: true,
                villePrincipale: true,
                disponible: true,
                latitude: true,
                longitude: true,
                user: { select: { nom: true, prenom: true, photoUrl: true } },
            },
            take: dto.limit ?? 20,
            orderBy: [{ abonnementType: 'desc' }, { noteMoyenne: 'desc' }],
        });

        return artisans.map((a) => {
            const distanceKm =
                a.latitude && a.longitude && dto.lat !== undefined && dto.lng !== undefined
                    ? this.haversineDistance(
                          dto.lat,
                          dto.lng,
                          Number(a.latitude),
                          Number(a.longitude),
                      )
                    : null;

            return {
                id: a.id,
                nom_entreprise: a.nomEntreprise,
                slogan: a.slogan,
                photo_profil_url: a.photoProfilUrl,
                note_moyenne: Number(a.noteMoyenne),
                nombre_avis: a.nombreAvis,
                tarif_horaire: Number(a.tarifHoraire),
                tarif_deplacement: Number(a.tarifDeplacement),
                abonnement_type: a.abonnementType,
                ville_principale: a.villePrincipale,
                disponible: a.disponible,
                nom: a.user.nom,
                prenom: a.user.prenom,
                user_photo_url: a.user.photoUrl,
                distance_km: distanceKm,
                mode: 'fallback',
            };
        });
    }

    // ============================================================
    // UTILITAIRES
    // ============================================================

    /**
     * Formater le résultat brut PostGIS en objet structuré
     */
    private formatArtisanResult = (raw: Record<string, unknown>) => {
        return {
            id: raw.id,
            nomEntreprise: raw.nom_entreprise,
            slogan: raw.slogan,
            photoProfilUrl: raw.photo_profil_url,
            noteMoyenne: raw.note_moyenne ? Number(raw.note_moyenne) : 0,
            nombreAvis: raw.nombre_avis ?? 0,
            tarifHoraire: raw.tarif_horaire ? Number(raw.tarif_horaire) : null,
            tarifDeplacement: raw.tarif_deplacement ? Number(raw.tarif_deplacement) : null,
            abonnementType: raw.abonnement_type,
            villePrincipale: raw.ville_principale,
            disponible: raw.disponible,
            user: {
                nom: raw.nom,
                prenom: raw.prenom,
                photoUrl: raw.user_photo_url,
            },
            distanceKm: raw.distance_km ? Number(raw.distance_km) : null,
            // CONFIDENTIALITÉ : position arrondie à ~100 m pour la carte —
            // assez précise pour situer l'artisan, jamais son domicile exact
            latitude: raw.latitude != null ? Math.round(Number(raw.latitude) * 1000) / 1000 : null,
            longitude:
                raw.longitude != null ? Math.round(Number(raw.longitude) * 1000) / 1000 : null,
        };
    };

    /**
     * Formule de Haversine : distance entre deux points GPS (fallback sans PostGIS)
     */
    private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Rayon terrestre en km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
                Math.cos(this.toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 100) / 100;
    }

    private toRad(deg: number): number {
        return (deg * Math.PI) / 180;
    }
}
