# 🚀 ALLOARTISAN API — PROGRAMME DE DÉVELOPPEMENT
## Roadmap Technique Complète — Expert NestJS & DBA
### Priorités : Performance • Sécurité • Scalabilité

---

> **Durée totale estimée :** 24 semaines (6 mois)
> **Stack :** NestJS 10 • PostgreSQL 16 + PostGIS • Redis 7 • Bull Queue • Prisma • Cloudinary
> **Méthodologie :** Agile Scrum — Sprints de 2 semaines

---

## 📊 TABLEAU DE BORD PROJET

| Phase | Sprints | Durée | Objectif |
|---|---|---|---|
| 🔧 **Phase 0** | Sprint 0 | S1-S2 | Correctifs urgents + Fondations BDD |
| 🏗️ **Phase 1** | Sprints 1-2 | S3-S6 | Booking + Notifications + Géoloc |
| 💳 **Phase 2** | Sprints 3-4 | S7-S10 | Paiements + Avis + Abonnements |
| 💬 **Phase 3** | Sprints 5-6 | S11-S14 | Messagerie + Admin Dashboard |
| ⚡ **Phase 4** | Sprints 7-8 | S15-S18 | Performance + Sécurité avancée |
| 🚀 **Phase 5** | Sprints 9-12 | S19-S24 | Fonctionnalités avancées + ML |

---

# ⚠️ SPRINT 0 — CORRECTIFS URGENTS & FONDATIONS
## Semaines 1-2 | PRIORITÉ CRITIQUE

### 🔴 FAILLES DE SÉCURITÉ À CORRIGER EN PREMIER

---

### TÂCHE 0.1 — Implémentation RolesGuard (CRITIQUE)
**Priorité :** 🔴 BLOQUANTE
**Estimation :** 4h

**Problème identifié :** Les routes admin dans `artisans.controller.ts` n'ont aucune protection RBAC. N'importe quel utilisateur authentifié peut vérifier/rejeter/supprimer un artisan.

```typescript
// Créer : src/common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}

// Créer : src/common/decorators/roles.decorator.ts
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// Appliquer sur toutes les routes admin :
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
@Patch(':id/verify')
verify(...) {}
```

**Fichiers à modifier :**
- [ ] `src/common/guards/roles.guard.ts` — Créer
- [ ] `src/common/decorators/roles.decorator.ts` — Créer
- [ ] `src/common/guards/index.ts` — Exporter RolesGuard
- [ ] `src/artisans/artisans.controller.ts` — Appliquer `@Roles(Role.ADMIN)` sur verify, reject, updateStatut, delete
- [ ] `src/users/user.controller.ts` — Protéger `getAllUsers()` avec `@Roles(Role.ADMIN)`
- [ ] `src/app.module.ts` — Enregistrer RolesGuard globalement

**Test de validation :**
- Appel `PATCH /artisans/:id/verify` avec token CLIENT → doit retourner 403
- Appel `PATCH /artisans/:id/verify` avec token ADMIN → doit réussir

---

### TÂCHE 0.2 — Refonte Schéma Prisma (BDD Complète)
**Priorité :** 🔴 BLOQUANTE
**Estimation :** 8h

**Objectif :** Ajouter toutes les tables manquantes en une seule migration propre.

```prisma
// Ajouts au schema.prisma

// ==================== ENUMS MANQUANTS ====================
enum StatutBooking {
  SOUMISE
  ACCEPTEE
  PRIX_PROPOSE
  CONTRE_OFFRE
  CONFIRMEE
  EN_COURS
  TERMINEE
  ANNULEE
  LITIGE
}

enum TypeBooking {
  STANDARD
  URGENCE
  DEVIS
}

enum StatutTransaction {
  EN_ATTENTE
  COMPLETEE
  ECHOUEE
  REMBOURSEE
}

enum TypeNotification {
  BOOKING_NOUVEAU
  BOOKING_ACCEPTE
  BOOKING_REFUSE
  PAIEMENT_RECU
  AVIS_NOUVEAU
  MESSAGE_NOUVEAU
  SYSTEME
}

enum CanalNotification {
  PUSH
  EMAIL
  SMS
  IN_APP
}

// ==================== BOOKINGS ====================
model Booking {
  id                String          @id @default(uuid()) @db.VarChar(36)
  clientId          String          @map("client_id") @db.VarChar(36)
  artisanId         String          @map("artisan_id") @db.VarChar(36)
  metierId          String          @map("metier_id") @db.VarChar(36)
  statut            StatutBooking   @default(SOUMISE)
  type              TypeBooking     @default(STANDARD)
  
  // Détails intervention
  titre             String          @db.VarChar(200)
  description       String          @db.Text
  adresseIntervention String        @db.Text @map("adresse_intervention")
  latitudeIntervention Decimal?     @db.Decimal(10, 8) @map("latitude_intervention")
  longitudeIntervention Decimal?    @db.Decimal(11, 8) @map("longitude_intervention")
  
  // Planning
  datePreferee      DateTime?       @db.Timestamptz @map("date_preferee")
  dateFin           DateTime?       @db.Timestamptz @map("date_fin")
  dureeEstimeeHeures Decimal?       @db.Decimal(5, 2) @map("duree_estimee_heures")
  
  // Tarification
  budgetClient      Decimal?        @db.Decimal(10, 2) @map("budget_client")
  prixPropose       Decimal?        @db.Decimal(10, 2) @map("prix_propose")
  prixFinal         Decimal?        @db.Decimal(10, 2) @map("prix_final")
  
  // Urgence
  estUrgent         Boolean         @default(false) @map("est_urgent")
  
  // Suivi
  raisonAnnulation  String?         @db.Text @map("raison_annulation")
  noteClient        Int?            // 1-5 étoiles
  commentaireClient String?         @db.Text @map("commentaire_client")
  
  // Timestamps
  accepteAt         DateTime?       @db.Timestamptz @map("accepte_at")
  debutAt           DateTime?       @db.Timestamptz @map("debut_at")
  finAt             DateTime?       @db.Timestamptz @map("fin_at")
  createdAt         DateTime        @default(now()) @db.Timestamptz @map("created_at")
  updatedAt         DateTime        @updatedAt @db.Timestamptz @map("updated_at")
  
  // Relations
  client            User            @relation("ClientBookings", fields: [clientId], references: [id])
  artisan           Artisan         @relation("ArtisanBookings", fields: [artisanId], references: [id])
  metier            Metier          @relation(fields: [metierId], references: [id])
  transaction       Transaction?
  avis              Avis?
  
  @@index([clientId, statut], name: "idx_bookings_client")
  @@index([artisanId, statut], name: "idx_bookings_artisan")
  @@index([statut, createdAt], name: "idx_bookings_statut")
  @@index([datePreferee], name: "idx_bookings_date")
  @@map("bookings")
}

// ==================== TRANSACTIONS ====================
model Transaction {
  id                String            @id @default(uuid()) @db.VarChar(36)
  bookingId         String            @unique @map("booking_id") @db.VarChar(36)
  clientId          String            @map("client_id") @db.VarChar(36)
  artisanId         String            @map("artisan_id") @db.VarChar(36)
  montant           Decimal           @db.Decimal(10, 2)
  commission        Decimal           @default(0) @db.Decimal(10, 2)
  montantArtisan    Decimal           @db.Decimal(10, 2) @map("montant_artisan")
  statut            StatutTransaction @default(EN_ATTENTE)
  provider          String            @db.VarChar(50) // fedapay, kkiapay
  providerTransactionId String?       @unique @db.VarChar(200) @map("provider_transaction_id")
  providerResponse  Json?             @map("provider_response")
  webhookReceivedAt DateTime?         @db.Timestamptz @map("webhook_received_at")
  createdAt         DateTime          @default(now()) @db.Timestamptz @map("created_at")
  updatedAt         DateTime          @updatedAt @db.Timestamptz @map("updated_at")
  
  booking           Booking           @relation(fields: [bookingId], references: [id])
  
  @@index([clientId], name: "idx_transactions_client")
  @@index([artisanId], name: "idx_transactions_artisan")
  @@index([statut], name: "idx_transactions_statut")
  @@map("transactions")
}

// ==================== AVIS ====================
model Avis {
  id                String    @id @default(uuid()) @db.VarChar(36)
  bookingId         String    @unique @map("booking_id") @db.VarChar(36)
  clientId          String    @map("client_id") @db.VarChar(36)
  artisanId         String    @map("artisan_id") @db.VarChar(36)
  note              Int       // 1-5
  notePonctualite   Int?      @map("note_ponctualite")
  noteQualite       Int?      @map("note_qualite")
  noteCommunication Int?      @map("note_communication")
  commentaire       String?   @db.Text
  reponseArtisan    String?   @db.Text @map("reponse_artisan")
  photosUrls        Json?     @map("photos_urls")
  signale           Boolean   @default(false)
  raisonSignalement String?   @db.Text @map("raison_signalement")
  visible           Boolean   @default(true)
  createdAt         DateTime  @default(now()) @db.Timestamptz @map("created_at")
  
  booking           Booking   @relation(fields: [bookingId], references: [id])
  client            User      @relation("ClientAvis", fields: [clientId], references: [id])
  artisan           Artisan   @relation("ArtisanAvis", fields: [artisanId], references: [id])
  
  @@index([artisanId, visible], name: "idx_avis_artisan")
  @@index([clientId], name: "idx_avis_client")
  @@map("avis")
}

// ==================== MESSAGES ====================
model Conversation {
  id          String    @id @default(uuid()) @db.VarChar(36)
  clientId    String    @map("client_id") @db.VarChar(36)
  artisanId   String    @map("artisan_id") @db.VarChar(36)
  bookingId   String?   @map("booking_id") @db.VarChar(36)
  lastMessageAt DateTime? @db.Timestamptz @map("last_message_at")
  createdAt   DateTime  @default(now()) @db.Timestamptz @map("created_at")
  
  messages    Message[]
  
  @@unique([clientId, artisanId, bookingId])
  @@index([clientId], name: "idx_conv_client")
  @@index([artisanId], name: "idx_conv_artisan")
  @@map("conversations")
}

model Message {
  id              String    @id @default(uuid()) @db.VarChar(36)
  conversationId  String    @map("conversation_id") @db.VarChar(36)
  senderId        String    @map("sender_id") @db.VarChar(36)
  type            String    @default("text") @db.VarChar(20) // text, image, audio, video, location
  contenu         String?   @db.Text
  mediaUrl        String?   @db.Text @map("media_url")
  mediaDuree      Int?      @map("media_duree")
  latitude        Decimal?  @db.Decimal(10, 8)
  longitude       Decimal?  @db.Decimal(11, 8)
  lu              Boolean   @default(false)
  luAt            DateTime? @db.Timestamptz @map("lu_at")
  createdAt       DateTime  @default(now()) @db.Timestamptz @map("created_at")
  
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  @@index([conversationId, createdAt], name: "idx_messages_conv")
  @@index([senderId], name: "idx_messages_sender")
  @@map("messages")
}

// ==================== NOTIFICATIONS ====================
model Notification {
  id          String              @id @default(uuid()) @db.VarChar(36)
  userId      String              @map("user_id") @db.VarChar(36)
  type        TypeNotification
  canal       CanalNotification   @default(IN_APP)
  titre       String              @db.VarChar(200)
  corps       String              @db.Text
  data        Json?
  lu          Boolean             @default(false)
  luAt        DateTime?           @db.Timestamptz @map("lu_at")
  createdAt   DateTime            @default(now()) @db.Timestamptz @map("created_at")
  expiresAt   DateTime?           @db.Timestamptz @map("expires_at")
  
  @@index([userId, lu, createdAt], name: "idx_notifs_user")
  @@index([createdAt], name: "idx_notifs_created")
  @@map("notifications")
}

model FcmToken {
  id          String    @id @default(uuid()) @db.VarChar(36)
  userId      String    @map("user_id") @db.VarChar(36)
  token       String    @unique @db.Text
  deviceName  String?   @db.VarChar(100) @map("device_name")
  actif       Boolean   @default(true)
  createdAt   DateTime  @default(now()) @db.Timestamptz @map("created_at")
  updatedAt   DateTime  @updatedAt @db.Timestamptz @map("updated_at")
  
  @@index([userId, actif], name: "idx_fcm_user")
  @@map("fcm_tokens")
}

// ==================== FAVORIS ====================
model Favori {
  id          String    @id @default(uuid()) @db.VarChar(36)
  clientId    String    @map("client_id") @db.VarChar(36)
  artisanId   String    @map("artisan_id") @db.VarChar(36)
  createdAt   DateTime  @default(now()) @db.Timestamptz @map("created_at")
  
  @@unique([clientId, artisanId])
  @@index([clientId], name: "idx_favoris_client")
  @@map("favoris")
}

// ==================== LOGS ACTIVITE ====================
model LogActivite {
  id          String    @id @default(uuid()) @db.VarChar(36)
  userId      String?   @map("user_id") @db.VarChar(36)
  action      String    @db.VarChar(100)
  entite      String?   @db.VarChar(50)
  entiteId    String?   @db.VarChar(36) @map("entite_id")
  metadata    Json?
  ipAddress   String?   @db.VarChar(45) @map("ip_address")
  userAgent   String?   @db.Text @map("user_agent")
  createdAt   DateTime  @default(now()) @db.Timestamptz @map("created_at")
  
  @@index([userId, createdAt], name: "idx_logs_user")
  @@index([action, createdAt], name: "idx_logs_action")
  @@map("logs_activites")
}
```

**Fichiers à modifier :**
- [ ] `prisma/schema.prisma` — Ajouter tous les modèles
- [ ] Exécuter `npx prisma migrate dev --name "add_booking_payment_messaging_modules"`
- [ ] Exécuter `npx prisma generate`

---

### TÂCHE 0.3 — Triggers PostgreSQL critiques
**Priorité :** 🟡 HAUTE
**Estimation :** 3h

```sql
-- Migration SQL manuelle : prisma/migrations/manual/triggers.sql

-- 1. Mise à jour automatique note_moyenne artisan
CREATE OR REPLACE FUNCTION update_artisan_note()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE artisans
  SET 
    note_moyenne = (
      SELECT COALESCE(AVG(note), 0)::DECIMAL(3,2)
      FROM avis 
      WHERE artisan_id = NEW.artisan_id AND visible = true
    ),
    nombre_avis = (
      SELECT COUNT(*) FROM avis 
      WHERE artisan_id = NEW.artisan_id AND visible = true
    )
  WHERE id = NEW.artisan_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_artisan_note
AFTER INSERT OR UPDATE OR DELETE ON avis
FOR EACH ROW EXECUTE FUNCTION update_artisan_note();

-- 2. Sync PostGIS location sur insert/update artisan
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

CREATE TRIGGER trigger_sync_artisan_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON artisans
FOR EACH ROW EXECUTE FUNCTION sync_artisan_location();

-- 3. Mise à jour search_vector pour full-text search
CREATE OR REPLACE FUNCTION update_artisan_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('french', COALESCE(NEW.bio, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(NEW.slogan, '')), 'C') ||
    setweight(to_tsvector('french', COALESCE(NEW.ville_principale, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_artisan_search_vector
BEFORE INSERT OR UPDATE OF bio, slogan, ville_principale ON artisans
FOR EACH ROW EXECUTE FUNCTION update_artisan_search_vector();

-- 4. Index GiST pour recherche géospatiale
CREATE INDEX CONCURRENTLY idx_artisans_location_gist 
ON artisans USING GIST (location);

-- 5. Index full-text search
CREATE INDEX CONCURRENTLY idx_artisans_search_vector_gin 
ON artisans USING GIN (search_vector);

-- 6. Partitionnement table logs_activites (par mois)
CREATE TABLE logs_activites_partitioned (
  LIKE logs_activites INCLUDING ALL
) PARTITION BY RANGE (created_at);
```

---

### TÂCHE 0.4 — Configuration JWT RS256 + Helmet
**Priorité :** 🟡 HAUTE
**Estimation :** 2h

```typescript
// Amélioration sécurité JWT : passer de HS256 à RS256
// src/main.ts - Ajouter Helmet
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Ajouter compression gzip
import compression from 'compression';
app.use(compression());
```

**Fichiers à modifier :**
- [ ] `src/main.ts` — Ajouter helmet, compression
- [ ] `.env` — Générer clés RSA (RS256)
- [ ] `src/auth/auth.service.ts` — Migrer vers RS256

---

# 🏗️ PHASE 1 — SPRINT 1
## Semaines 3-4 | MODULE BOOKING (Partie 1)

### Objectif du Sprint
Implémenter le cycle de vie complet des réservations — le cœur métier de la plateforme.

---

### TÂCHE 1.1 — BookingModule Foundation
**Estimation :** 6h

**Structure à créer :**
```
src/booking/
├── booking.module.ts
├── booking.controller.ts
├── booking.service.ts
├── dto/
│   ├── create-booking.dto.ts
│   ├── update-booking.dto.ts
│   ├── propose-price.dto.ts
│   ├── search-booking.dto.ts
│   └── index.ts
└── types/
    └── booking.types.ts
```

**Endpoints à implémenter :**
```
POST   /bookings                    → Créer une demande
GET    /bookings                    → Mes réservations (client ou artisan)
GET    /bookings/:id                → Détail réservation
PATCH  /bookings/:id/accept         → Artisan accepte
PATCH  /bookings/:id/propose-price  → Artisan propose un prix
PATCH  /bookings/:id/confirm        → Client confirme le prix
PATCH  /bookings/:id/start          → Démarrer l'intervention
PATCH  /bookings/:id/complete       → Terminer l'intervention
PATCH  /bookings/:id/cancel         → Annuler
GET    /bookings/stats              → Stats artisan (missions/mois)
```

**Fichiers à créer :**
- [ ] `src/booking/booking.module.ts`
- [ ] `src/booking/booking.controller.ts`
- [ ] `src/booking/booking.service.ts`
- [ ] `src/booking/dto/create-booking.dto.ts`
- [ ] `src/booking/dto/propose-price.dto.ts`
- [ ] `src/app.module.ts` — Importer BookingModule

---

### TÂCHE 1.2 — BookingService : Logique Métier
**Estimation :** 8h

```typescript
// Règles métier critiques à implémenter :

// 1. Un client ne peut avoir qu'un booking ACTIF par artisan
// 2. Vérifier que l'artisan est ACTIF, verified=true, disponible=true
// 3. Délai d'acceptation : 24h max (sinon auto-annulé par scheduler)
// 4. Urgence : délai réduit à 2h
// 5. Commission plateforme : 10% du prix final
// 6. Incrémenter compteur_demandes_mois_courant de l'artisan
// 7. Déclencher notification push/email à l'artisan à chaque changement de statut
```

**Fichiers à créer/modifier :**
- [ ] `src/booking/booking.service.ts` — Logique complète
- [ ] `src/booking/booking.service.spec.ts` — Tests unitaires

---

### TÂCHE 1.3 — Scheduler : Tâches Planifiées
**Estimation :** 4h

```typescript
// src/scheduler/scheduler.module.ts
// Tâches automatisées via @nestjs/schedule

@Cron('0 * * * *') // Toutes les heures
async cancelExpiredBookings() {
  // Annuler les bookings en attente > 24h sans réponse artisan
  // Annuler les bookings urgents > 2h
}

@Cron('0 0 1 * *') // 1er du mois
async resetMonthlyCounters() {
  // Réinitialiser compteur_demandes_mois_courant
}

@Cron('0 9 * * 1') // Lundi 9h
async sendWeeklyReports() {
  // Rapport hebdo artisan (missions, revenus, avis)
}
```

**Packages à installer :**
- [ ] `npm install @nestjs/schedule`

**Fichiers à créer :**
- [ ] `src/scheduler/scheduler.module.ts`
- [ ] `src/scheduler/booking.scheduler.ts`
- [ ] `src/scheduler/artisan.scheduler.ts`

---

# 🏗️ PHASE 1 — SPRINT 2
## Semaines 5-6 | NOTIFICATIONS + GÉOLOCALISATION

---

### TÂCHE 2.1 — NotificationModule (Firebase FCM)
**Estimation :** 8h

**Architecture :**
```typescript
// Système multicanal : Push (FCM) + Email + SMS (Phase 2) + In-App

// src/notification/
├── notification.module.ts
├── notification.service.ts
├── notification.gateway.ts    // WebSocket pour in-app
├── processors/
│   └── notification.processor.ts  // Bull consumer
└── dto/
    ├── send-notification.dto.ts
    └── register-fcm-token.dto.ts
```

**Endpoints :**
```
POST   /notifications/fcm-token     → Enregistrer token FCM
DELETE /notifications/fcm-token     → Supprimer token FCM
GET    /notifications               → Mes notifications (paginées)
PATCH  /notifications/:id/read      → Marquer comme lue
PATCH  /notifications/read-all      → Tout marquer comme lu
GET    /notifications/unread-count  → Compteur non lus
```

**Packages à installer :**
- [ ] `npm install firebase-admin`

**Fichiers à créer :**
- [ ] `src/notification/notification.module.ts`
- [ ] `src/notification/notification.service.ts`
- [ ] `src/notification/processors/notification.processor.ts`
- [ ] `src/notification/dto/register-fcm-token.dto.ts`

**Règles métier :**
- Max 10 notifications push/heure/utilisateur (anti-spam Redis)
- Expiration automatique après 30 jours
- Fallback Email si FCM échoue pour événements critiques
- File Bull Queue pour fiabilité (retry x3)

---

### TÂCHE 2.2 — GeolocationModule (PostGIS)
**Estimation :** 6h

**Endpoints :**
```
GET /geolocation/artisans/nearby?lat=&lng=&radius=&metier=
GET /geolocation/artisans/:id/distance?lat=&lng=
```

```typescript
// src/geolocation/geolocation.service.ts
async findNearby(lat: number, lng: number, radiusKm: number, metierId?: string) {
  return this.prisma.$queryRaw`
    SELECT 
      a.*,
      ST_Distance(
        a.location, 
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      ) / 1000 AS distance_km
    FROM artisans a
    WHERE 
      a.statut = 'ACTIF'
      AND a.verified = true
      AND a.disponible = true
      AND a.deleted_at IS NULL
      AND ST_DWithin(
        a.location,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusKm * 1000}  -- Convertit km en mètres
      )
      ${metierId ? Prisma.sql`AND EXISTS (
        SELECT 1 FROM artisan_metiers am 
        WHERE am.artisan_id = a.id AND am.metier_id = ${metierId}
      )` : Prisma.empty}
    ORDER BY distance_km ASC
    LIMIT 50
  `;
}
```

**Fichiers à créer :**
- [ ] `src/geolocation/geolocation.module.ts`
- [ ] `src/geolocation/geolocation.service.ts`
- [ ] `src/geolocation/geolocation.controller.ts`

---

### TÂCHE 2.3 — FavorisModule
**Estimation :** 3h

**Endpoints :**
```
POST   /favoris/:artisanId    → Ajouter aux favoris
DELETE /favoris/:artisanId    → Retirer des favoris
GET    /favoris               → Mes artisans favoris
```

**Fichiers à créer :**
- [ ] `src/favoris/favoris.module.ts`
- [ ] `src/favoris/favoris.service.ts`
- [ ] `src/favoris/favoris.controller.ts`

---

# 💳 PHASE 2 — SPRINT 3
## Semaines 7-8 | MODULE PAIEMENTS (FedaPay/KkiaPay)

---

### TÂCHE 3.1 — PaymentModule Foundation
**Estimation :** 10h

```typescript
// Architecture paiement sécurisée :
// Client → Backend → FedaPay → Webhook → Backend → Débloquer booking

// src/payment/
├── payment.module.ts
├── payment.controller.ts
├── payment.service.ts
├── payment.webhook.controller.ts  // Route séparée pour webhooks
├── providers/
│   ├── fedapay.provider.ts
│   └── kkiapay.provider.ts
└── dto/
    ├── initiate-payment.dto.ts
    └── webhook-payload.dto.ts
```

**Endpoints :**
```
POST   /payments/initiate/:bookingId     → Initier un paiement
GET    /payments/:transactionId         → Statut transaction
POST   /payments/webhook/fedapay        → Webhook FedaPay (PUBLIC, secret validé)
POST   /payments/webhook/kkiapay        → Webhook KkiaPay
GET    /payments/history                → Historique (client/artisan)
POST   /payments/refund/:transactionId  → Demande remboursement (ADMIN)
```

**Sécurité webhook :**
```typescript
// Validation HMAC du secret webhook (critique anti-fraude)
validateWebhookSignature(payload: string, signature: string): boolean {
  const expected = createHmac('sha256', process.env.FEDAPAY_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

**Fichiers à créer :**
- [ ] `src/payment/payment.module.ts`
- [ ] `src/payment/payment.service.ts`
- [ ] `src/payment/payment.webhook.controller.ts`
- [ ] `src/payment/providers/fedapay.provider.ts`

---

### TÂCHE 3.2 — Gestion Abonnements Artisans
**Estimation :** 6h

**Logique des plans :**
```typescript
// Plan GRATUIT  : 5 demandes/mois, visible en dernier
// Plan STANDARD : 30 demandes/mois, visible en priorité
// Plan PREMIUM  : illimité, badge Premium, top résultats

// Scheduler de vérification d'expiration quotidien
@Cron('0 8 * * *')
async checkSubscriptionExpiry() {
  // Downgrade vers GRATUIT si abonnement expiré
}
```

**Endpoints :**
```
POST   /subscriptions/upgrade      → Souscrire à un plan
GET    /subscriptions/my           → Mon abonnement actuel
GET    /subscriptions/plans        → Liste des plans disponibles
```

**Fichiers à créer :**
- [ ] `src/subscriptions/subscriptions.module.ts`
- [ ] `src/subscriptions/subscriptions.service.ts`
- [ ] `src/subscriptions/subscriptions.controller.ts`
- [ ] `src/scheduler/subscription.scheduler.ts`

---

# 💳 PHASE 2 — SPRINT 4
## Semaines 9-10 | MODULE AVIS & NOTATION

---

### TÂCHE 4.1 — ReviewModule
**Estimation :** 8h

**Règles métier strictes :**
```typescript
// 1. Un avis ne peut être soumis QUE sur un booking TERMINEE
// 2. Un seul avis par booking (contrainte unique en BDD)
// 3. Délai max pour laisser un avis : 14 jours après fin
// 4. L'artisan peut répondre une seule fois à un avis
// 5. La note globale = moyenne pondérée des 3 sous-notes
// 6. Mise à jour note_moyenne automatique via trigger PostgreSQL
```

**Endpoints :**
```
POST   /avis                    → Créer un avis (post-booking)
GET    /avis/artisan/:id        → Avis d'un artisan (paginés)
GET    /avis/my                 → Mes avis donnés
PATCH  /avis/:id/response       → Réponse artisan à un avis
POST   /avis/:id/report         → Signaler un avis
PATCH  /avis/:id/moderate       → Modérer un avis [ADMIN]
```

**Fichiers à créer :**
- [ ] `src/avis/avis.module.ts`
- [ ] `src/avis/avis.service.ts`
- [ ] `src/avis/avis.controller.ts`
- [ ] `src/avis/dto/create-avis.dto.ts`

---

# 💬 PHASE 3 — SPRINT 5
## Semaines 11-12 | MESSAGERIE TEMPS RÉEL (WebSocket)

---

### TÂCHE 5.1 — MessagingGateway (Socket.io)
**Estimation :** 12h

```typescript
// src/messaging/messaging.gateway.ts
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL },
  namespace: '/chat',
  transports: ['websocket', 'polling'], // Fallback polling
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  // Événements émis :
  // 'message:new'      → Nouveau message reçu
  // 'message:delivered' → Message livré
  // 'message:read'     → Accusé de lecture
  // 'typing:start'     → Indicateur de frappe
  // 'typing:stop'      → Arrêt frappe
  
  // Sécurité : Authentification JWT sur connexion WebSocket
  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    // Valider JWT → stocker userId dans client.data
  }
}
```

**Packages à installer :**
- [ ] `npm install @nestjs/websockets @nestjs/platform-socket.io socket.io`

**Endpoints REST :**
```
GET    /messages/conversations         → Mes conversations
GET    /messages/conversations/:id     → Messages d'une conv (paginés)
POST   /messages/conversations/:id     → Envoyer un message (fallback REST)
PATCH  /messages/:id/read             → Marquer comme lu
```

**Fichiers à créer :**
- [ ] `src/messaging/messaging.module.ts`
- [ ] `src/messaging/messaging.gateway.ts`
- [ ] `src/messaging/messaging.service.ts`
- [ ] `src/messaging/messaging.controller.ts`

---

# 💬 PHASE 3 — SPRINT 6
## Semaines 13-14 | ADMIN DASHBOARD

---

### TÂCHE 6.1 — AdminModule
**Estimation :** 10h

```typescript
// Toutes les routes protégées par @Roles(Role.ADMIN)

// src/admin/
├── admin.module.ts
├── admin.controller.ts
├── admin.service.ts
└── dto/
    └── admin-stats.dto.ts
```

**Endpoints Admin :**
```
GET  /admin/stats/overview          → KPIs plateforme
GET  /admin/stats/bookings          → Stats réservations
GET  /admin/stats/revenue           → Stats revenus
GET  /admin/users                   → Liste utilisateurs (filtrés)
GET  /admin/artisans/pending        → Artisans en attente validation
GET  /admin/avis/reported           → Avis signalés
GET  /admin/transactions            → Toutes les transactions
GET  /admin/logs                    → Logs d'audit
POST /admin/notifications/broadcast → Notifier tous les users
```

**Fichiers à créer :**
- [ ] `src/admin/admin.module.ts`
- [ ] `src/admin/admin.service.ts`
- [ ] `src/admin/admin.controller.ts`
- [ ] `src/admin/dto/admin-stats.dto.ts`

---

# ⚡ PHASE 4 — SPRINT 7
## Semaines 15-16 | PERFORMANCE & OPTIMISATION BDD

---

### TÂCHE 7.1 — Optimisation Requêtes Prisma
**Estimation :** 8h

**Problèmes à corriger :**
```typescript
// PROBLÈME : N+1 Queries dans artisans.service.ts
// SOLUTION : Eager loading avec include

// AVANT (N+1) :
const artisans = await prisma.artisan.findMany();
for (const a of artisans) {
  a.metiers = await prisma.artisanMetier.findMany({ where: {artisanId: a.id} });
}

// APRÈS (1 requête) :
const artisans = await prisma.artisan.findMany({
  include: {
    metiers: { include: { metier: { include: { categorie: true } } } },
    certifications: true,
    user: { select: { nom: true, prenom: true, photoUrl: true } }
  }
});

// Ajout de select stratégique pour réduire le payload 40-50%
// Implémenter DataLoader pour les relations many-to-many
```

**Actions à réaliser :**
- [ ] Audit complet des requêtes Prisma avec `prisma.$on('query', ...)`
- [ ] Identifier et corriger tous les N+1
- [ ] Ajouter `select` stratégiques dans les endpoints de liste
- [ ] Implémenter pagination curseur (plus performant qu'offset)
- [ ] Vues matérialisées pour stats complexes admin

---

### TÂCHE 7.2 — Stratégie de Cache Redis Avancée
**Estimation :** 6h

```typescript
// Cache à multi-niveaux :

// Niveau 1 : Cache en mémoire (< 1ms) pour données statiques
// Catégories métiers : TTL 24h (rarement modifié)
// Liste métiers populaires : TTL 1h

// Niveau 2 : Redis (< 5ms)
// Profil artisan : TTL 10min
// Résultats recherche : TTL 5min
// Stats artisan : TTL 30min

// Cache-aside pattern avec invalidation intelligente :
async updateArtisan(id: string, dto: UpdateArtisanDto) {
  const result = await this.prisma.artisan.update({...});
  // Invalider le cache de cet artisan uniquement
  await this.cacheManager.del(`artisan:${id}`);
  await this.cacheManager.del(`artisan:search:*`); // Pattern matching Redis
  return result;
}
```

**Fichiers à modifier :**
- [ ] `src/artisans/artisans.service.ts` — Ajouter cache
- [ ] `src/categories-metiers/` — Ajouter cache 24h
- [ ] `src/common/services/cache.service.ts` — Helper pour cache patterns

---

### TÂCHE 7.3 — Rate Limiting Avancé
**Estimation :** 4h

```typescript
// src/main.ts — Rate limiting par endpoint

// Global : 100 req/min/IP
// Auth endpoints : 5 req/min/IP (brute force protection)
// Upload : 5 req/heure/user
// Payment initiate : 10 req/heure/user
// Messaging : 60 req/min/user

// Avec @nestjs/throttler + Redis store
ThrottlerModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    throttlers: [{
      ttl: 60000,
      limit: 100,
    }],
    storage: new ThrottlerStorageRedisService(redisClient),
  }),
})
```

---

# ⚡ PHASE 4 — SPRINT 8
## Semaines 17-18 | SÉCURITÉ AVANCÉE & MONITORING

---

### TÂCHE 8.1 — Audit de Sécurité Complet (OWASP Top 10)
**Estimation :** 8h

```typescript
// Checklist sécurité OWASP :

// ✅ A01 - Broken Access Control
// → RolesGuard sur toutes les routes admin (Sprint 0)
// → Vérifier ownership avant toute modification (user ne peut modifier que SES données)

// A02 - Cryptographic Failures  
// → RS256 pour JWT (Sprint 0)
// → Chiffrement AES-256-GCM pour données sensibles (MFA secret déjà fait ✅)

// A03 - Injection
// → Prisma ORM protège contre SQL injection ✅
// → Valider TOUS les inputs avec class-validator

// A04 - Insecure Design
// → Validation HMAC webhooks paiement

// A07 - Identification Failures
// → Brute force protection ✅ (loginAttemptService)
// → Session fixation protection ✅

// A09 - Security Logging
// → Logs structurés pour audit trail
```

**Actions :**
- [ ] Audit ownership : Vérifier dans TOUS les services que userId = ressource propriétaire
- [ ] Scan avec `npm audit` + corriger toutes vulnérabilités CRITICAL/HIGH
- [ ] Implémenter `LogActiviteService` pour audit trail complet
- [ ] Ajouter `@nestjs/terminus` health checks
- [ ] Validation entrées : Tous les DTOs avec `class-validator`

---

### TÂCHE 8.2 — Monitoring & Observabilité
**Estimation :** 6h

```typescript
// Health checks
// GET /health → DB, Redis, Bull Queue, Cloudinary

// src/health/health.controller.ts
@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.db.pingCheck('database'),
    () => this.redis.checkHealth('redis'),
    () => this.disk.checkStorage('storage', { thresholdPercent: 0.9, path: '/' }),
    () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
  ]);
}

// Métriques Prometheus (optionnel Phase 5)
// Logger structuré Pino avec corrélation ID par requête
```

**Packages à installer :**
- [ ] `npm install @nestjs/terminus`
- [ ] `npm install pino pino-http`

---

# 🚀 PHASE 5 — SPRINTS 9-12
## Semaines 19-24 | FONCTIONNALITÉS AVANCÉES

---

### SPRINT 9-10 | RECHERCHE AVANCÉE + PORTFOLIO
**Semaines 19-22**

**TÂCHE 9.1 — Recherche full-text PostgreSQL native**
- [ ] Exploiter `search_vector` tsvector déjà prévu
- [ ] Endpoint `GET /artisans/search?q=plombier+cotonou`
- [ ] Tri par pertinence (`ts_rank`) + distance géo
- [ ] Suggestions automatiques (autocomplete)
- [ ] Sauvegarde recherches récentes (Redis, TTL 30 jours)

**TÂCHE 9.2 — Portfolio artisan enrichi**
- [ ] Upload photos portfolio (max 20, via Cloudinary)
- [ ] Upload vidéos courtes (max 30s, compression Bull Queue)
- [ ] Association photo/vidéo à un booking (avant/après chantier)

**TÂCHE 9.3 — Système de parrainage**
- [ ] Code parrainage unique par artisan
- [ ] Bonus abonnement pour parrain + filleul

---

### SPRINT 11-12 | DÉTECTION FRAUDE ML + CI/CD
**Semaines 23-24**

**TÂCHE 11.1 — Système scoring fraude (règles métier)**
```typescript
// Score 0-100 calculé en temps réel
// Signaux artisan suspects :
// - Taux annulation > 50% → +30 pts
// - Avis < 2 étoiles répétés → +20 pts
// - Compte créé < 7 jours + transaction > 200K FCFA → +25 pts
// - Flooding demandes → +15 pts

// Action automatique selon score :
// 0-30  : Normal
// 31-60 : Surveillance renforcée (log)
// 61-80 : Vérification manuelle requise (notif admin)
// 81-100 : Blocage temporaire automatique
```

**TÂCHE 11.2 — Pipeline CI/CD**
- [ ] GitHub Actions : lint → test → build → deploy staging
- [ ] Tests e2e avec Supertest sur tous les modules
- [ ] Coverage minimum 70% requis (bloque le merge)
- [ ] Scan sécurité automatique (Snyk ou équivalent)

---

# 📋 ANNEXES TECHNIQUES

## A1 — Standards de Code

```typescript
// Conventions obligatoires sur tous les nouveaux modules :

// 1. DTO : class-validator sur TOUS les champs
// 2. Service : Logger NestJS sur actions importantes
// 3. Controller : Swagger @ApiOperation sur TOUS les endpoints
// 4. Erreurs : Messages génériques côté client, détails dans les logs
// 5. Pagination : Curseur-based (pas offset) pour les listes > 100 items
// 6. Transactions Prisma : Pour toutes les opérations multi-tables
// 7. Try-catch : Dans les services uniquement (pas dans les controllers)
```

## A2 — Variables d'Environnement Manquantes

```env
# À ajouter dans .env

# Firebase FCM
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# FedaPay
FEDAPAY_SECRET_KEY=
FEDAPAY_WEBHOOK_SECRET=
FEDAPAY_ENVIRONMENT=sandbox

# Twilio SMS (Phase 2)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Scheduling
BOOKING_EXPIRY_HOURS=24
URGENT_BOOKING_EXPIRY_HOURS=2
COMMISSION_RATE=0.10

# Sécurité
ALLOWED_ORIGINS=http://localhost:3000,https://app.alloartisan.bj
WEBHOOK_SECRET=

# Monitoring
HEALTH_CHECK_DATABASE_TIMEOUT=3000
```

## A3 — Packages à Installer

```bash
# Sprint 0
npm install @nestjs/schedule

# Sprint 2
npm install firebase-admin

# Sprint 3
npm install axios @types/axios cronstrue

# Sprint 5
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io @types/socket.io

# Sprint 7
npm install @nestjs/terminus @nestjs/axios pino pino-http pino-pretty

# Sprint 8
npm install @nestjs/throttler

# Dev
npm install -D @types/compression @types/morgan
```

## A4 — Checklist Avant Mise en Production

```
PERFORMANCE
☐ Toutes les requêtes < 200ms (P95)
☐ Cache Redis opérationnel (hit rate > 80%)
☐ Index PostgreSQL vérifiés via EXPLAIN ANALYZE
☐ Compression gzip activée
☐ Connection pooling Prisma configuré (pool_size=10)

SÉCURITÉ
☐ Pas de données sensibles dans les logs
☐ HTTPS uniquement (HSTS activé)
☐ WAF (pare-feu applicatif) activé
☐ Tous les webhooks validés (HMAC)
☐ Variables d'env en production != développement
☐ npm audit : 0 vulnérabilité CRITICAL ou HIGH

FIABILITÉ
☐ Health checks /health opérationnel
☐ Bull Queue : retry configuré sur tous les processors
☐ Alertes email si taux d'erreur > 1%
☐ Backup BDD quotidien vérifié
☐ Logs centralisés accessibles

TESTS
☐ Coverage > 70% sur modules critiques (Auth, Booking, Payment)
☐ Tests e2e : parcours client complet
☐ Tests e2e : parcours artisan complet
☐ Tests charge : 500 utilisateurs simultanés OK
```

---

*Document généré le 20/02/2026 — Version 1.0*
*Expert NestJS & DBA PostgreSQL — Projet AlloArtisan*
