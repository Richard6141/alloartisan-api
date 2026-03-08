-- =============================================================
-- ALLOARTISAN — TRIGGERS & INDEX MANUELS POSTGRESQL
-- À exécuter après les migrations Prisma
-- Ordre : 1. Fonctions → 2. Triggers → 3. Index
-- =============================================================

-- =============================================================
-- 1. TRIGGER : Mise à jour automatique note_moyenne artisan
-- Déclenché AFTER INSERT / UPDATE / DELETE sur la table avis
-- =============================================================

CREATE OR REPLACE FUNCTION update_artisan_note()
RETURNS TRIGGER AS $$
DECLARE
  target_artisan_id VARCHAR(36);
BEGIN
  -- Déterminer l'artisan à mettre à jour
  IF TG_OP = 'DELETE' THEN
    target_artisan_id := OLD.artisan_id;
  ELSE
    target_artisan_id := NEW.artisan_id;
  END IF;

  UPDATE artisans
  SET
    note_moyenne = (
      SELECT COALESCE(
        ROUND(AVG(
          (note +
           COALESCE(note_ponctualite, note) +
           COALESCE(note_qualite, note) +
           COALESCE(note_communication, note)
          )::DECIMAL / 4, 2
        ), 0
      )
      FROM avis
      WHERE artisan_id = target_artisan_id AND visible = true
    ),
    nombre_avis = (
      SELECT COUNT(*)
      FROM avis
      WHERE artisan_id = target_artisan_id AND visible = true
    )
  WHERE id = target_artisan_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_artisan_note ON avis;
CREATE TRIGGER trigger_update_artisan_note
AFTER INSERT OR UPDATE OR DELETE ON avis
FOR EACH ROW EXECUTE FUNCTION update_artisan_note();

-- =============================================================
-- 2. TRIGGER : Synchronisation PostGIS location (artisans)
-- Déclenché BEFORE INSERT / UPDATE latitude/longitude
-- =============================================================

CREATE OR REPLACE FUNCTION sync_artisan_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(
      ST_MakePoint(NEW.longitude::float, NEW.latitude::float),
      4326
    )::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_artisan_location ON artisans;
CREATE TRIGGER trigger_sync_artisan_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON artisans
FOR EACH ROW EXECUTE FUNCTION sync_artisan_location();

-- =============================================================
-- 3. TRIGGER : Synchronisation PostGIS location (users)
-- =============================================================

CREATE OR REPLACE FUNCTION sync_user_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(
      ST_MakePoint(NEW.longitude::float, NEW.latitude::float),
      4326
    )::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_user_location ON users;
CREATE TRIGGER trigger_sync_user_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON users
FOR EACH ROW EXECUTE FUNCTION sync_user_location();

-- =============================================================
-- 4. TRIGGER : Mise à jour search_vector pour full-text search
-- Déclenché BEFORE INSERT / UPDATE sur colonnes texte artisan
-- =============================================================

CREATE OR REPLACE FUNCTION update_artisan_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', COALESCE(NEW.ville_principale, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(NEW.slogan, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(NEW.bio, '')), 'C') ||
    setweight(to_tsvector('french', COALESCE(NEW.nom_entreprise, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_artisan_search_vector ON artisans;
CREATE TRIGGER trigger_artisan_search_vector
BEFORE INSERT OR UPDATE OF bio, slogan, ville_principale, nom_entreprise ON artisans
FOR EACH ROW EXECUTE FUNCTION update_artisan_search_vector();

-- =============================================================
-- 5. TRIGGER : Mise à jour last_message_at sur conversations
-- Déclenché AFTER INSERT sur messages
-- =============================================================

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- =============================================================
-- 6. TRIGGER : Mise à jour taux_completion artisan
-- Après chaque changement de statut booking TERMINEE
-- =============================================================

CREATE OR REPLACE FUNCTION update_artisan_completion_rate()
RETURNS TRIGGER AS $$
BEGIN
  -- Déclencher uniquement sur passage vers TERMINEE ou ANNULEE
  IF NEW.statut IN ('TERMINEE', 'ANNULEE') AND OLD.statut != NEW.statut THEN
    UPDATE artisans
    SET
      nombre_missions_completees = (
        SELECT COUNT(*) FROM bookings
        WHERE artisan_id = NEW.artisan_id AND statut = 'TERMINEE'
      ),
      taux_completion = (
        SELECT COALESCE(
          ROUND(
            COUNT(*) FILTER (WHERE statut = 'TERMINEE') * 100.0
            / NULLIF(COUNT(*) FILTER (WHERE statut IN ('TERMINEE', 'ANNULEE')), 0),
            2
          ), 0
        )
        FROM bookings
        WHERE artisan_id = NEW.artisan_id
        AND statut IN ('TERMINEE', 'ANNULEE')
      )
    WHERE id = NEW.artisan_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_artisan_completion ON bookings;
CREATE TRIGGER trigger_update_artisan_completion
AFTER UPDATE OF statut ON bookings
FOR EACH ROW EXECUTE FUNCTION update_artisan_completion_rate();

-- =============================================================
-- 7. INDEXES DE PERFORMANCE (CONCURRENT - sans lock de table)
-- =============================================================

-- Index GiST pour recherche géospatiale artisans (PostGIS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artisans_location_gist
ON artisans USING GIST (location);

-- Index GiST pour recherche géospatiale users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_location_gist
ON users USING GIST (location);

-- Index GIN pour full-text search artisans
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artisans_search_vector_gin
ON artisans USING GIN (search_vector);

-- Index partiel : artisans actifs et disponibles (requête la plus fréquente)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artisans_actifs_disponibles
ON artisans (note_moyenne DESC, nombre_avis DESC)
WHERE statut = 'ACTIF' AND verified = true AND disponible = true AND deleted_at IS NULL;

-- Index partiel : bookings en attente de réponse artisan
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_en_attente
ON bookings (artisan_id, created_at)
WHERE statut = 'SOUMISE';

-- Index partiel : notifications non lues par user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_non_lues
ON notifications (user_id, created_at DESC)
WHERE lu = false;

-- Index partiel : tokens FCM actifs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fcm_tokens_actifs
ON fcm_tokens (user_id)
WHERE actif = true;

-- =============================================================
-- 8. NETTOYAGE AUTOMATIQUE — Fonction pour maintenance
-- =============================================================

-- Fonction pour expirer les notifications anciennes (à appeler via scheduler)
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Commentaire d'instruction
COMMENT ON FUNCTION cleanup_expired_notifications() IS
'Supprime les notifications expirées. Appeler via scheduler NestJS (cron quotidien).';
