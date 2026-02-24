# 📊 PROGRESSION ALLOARTISAN API

> Mis à jour : 23/02/2026  
> Progression globale : **~72%** ██████████████░░░░░░

---

## Sprint 0 — Fondations (critique) ✅ 95%

| # | Tâche | Statut | Fichiers | Durée |
|---|-------|--------|----------|-------|
| 0.1 | RolesGuard + Roles decorator | ✅ Terminé | `common/guards/roles.guard.ts`, `common/decorators/roles.decorator.ts` | 1h |
| 0.2 | Schéma Prisma complet | ✅ Terminé | `prisma/schema.prisma` | 3h |
| 0.3 | Triggers PostgreSQL | ✅ Terminé | `prisma/migrations/manual/triggers.sql` | 2h |
| 0.4a | Helmet + Compression | ✅ Terminé | `src/main.ts` | 30min |
| 0.4b | Variables d'env complètes | ✅ Terminé | `.env.example` | 30min |
| 0.5 | **Migration Prisma** | ⏳ À exécuter | DB doit être up | - |
| 0.6 | JWT RS256 | ⏳ En attente | `src/auth/strategies/` | 2h |

**Action requise :** Lancer la migration Prisma (voir commandes ci-dessous)

---

## Sprint 1 — Module Booking (core) ✅ 80%

| # | Tâche | Statut | Fichiers | Durée |
|---|-------|--------|----------|-------|
| 1.1 | BookingModule structure | ✅ Terminé | `src/booking/booking.module.ts` | 30min |
| 1.2 | BookingService complet | ✅ Terminé | `src/booking/booking.service.ts` | 4h |
| 1.3 | BookingController (tous endpoints) | ✅ Terminé | `src/booking/booking.controller.ts` | 2h |
| 1.4 | DTOs + validation | ✅ Terminé | `src/booking/dto/*.ts` | 1h |
| 1.5 | Scheduler tâches planifiées | ✅ Terminé | `src/scheduler/*.ts` | 1h |
| 1.6 | PrismaService étendu | ✅ Terminé | `src/prisma/prisma.service.ts` | 30min |
| 1.7 | Intégration notifications Booking | ✅ Terminé | `src/booking/booking.service.ts` | 1h |
| 1.8 | Tests unitaires BookingService | ⏳ À faire | `src/booking/booking.service.spec.ts` | 3h |
| 1.9 | Tests E2E endpoints Booking | ⏳ À faire | `test/booking.e2e-spec.ts` | 3h |

### Endpoints Booking implémentés

| Méthode | Route | Accès | Statut |
|---------|-------|-------|--------|
| POST | `/api/v1/bookings` | CLIENT | ✅ |
| GET | `/api/v1/bookings` | CLIENT / ARTISAN / ADMIN | ✅ |
| GET | `/api/v1/bookings/stats` | ARTISAN | ✅ |
| GET | `/api/v1/bookings/:id` | Propriétaire | ✅ |
| PATCH | `/api/v1/bookings/:id/accept` | ARTISAN | ✅ |
| PATCH | `/api/v1/bookings/:id/propose-price` | ARTISAN | ✅ |
| PATCH | `/api/v1/bookings/:id/confirm` | CLIENT | ✅ |
| PATCH | `/api/v1/bookings/:id/start` | ARTISAN | ✅ |
| PATCH | `/api/v1/bookings/:id/complete` | ARTISAN | ✅ |
| PATCH | `/api/v1/bookings/:id/cancel` | CLIENT / ARTISAN | ✅ |

---

## Sprint 2 — Notifications & FCM ✅ 85%

| # | Tâche | Statut | Fichiers | Durée |
|---|-------|--------|----------|-------|
| 2.1 | NotificationModule structure | ✅ Terminé | `src/notification/notification.module.ts` | 30min |
| 2.2 | Firebase FCM Push Notifications | ✅ Terminé | `src/notification/notification.service.ts` | 2h |
| 2.3 | Notification templates (BookingEvents) | ✅ Terminé | `src/notification/notification.types.ts` | 1h |
| 2.4 | Notification in-app (REST) | ✅ Terminé | `src/notification/notification.controller.ts` | 1h |
| 2.5 | Email notifications (Resend) | ✅ Terminé | `src/notification/notification.service.ts` | 1h |
| 2.6 | Badge count + lecture | ✅ Terminé | `/notifications/unread-count`, `/read-all` | 30min |
| 2.7 | Envoi automatique sur events Booking | ✅ Terminé | `src/booking/booking.service.ts` intégré | 1h |
| 2.8 | Scheduler nettoyage notifications expirées | ✅ Terminé | `src/scheduler/notification.scheduler.ts` | 30min |
| 2.9 | **firebase-admin installé** | ✅ Terminé | `pnpm add firebase-admin` | - |

### Endpoints Notifications implémentés

| Méthode | Route | Accès | Statut |
|---------|-------|-------|--------|
| POST | `/api/v1/notifications/fcm-token` | Authentifié | ✅ |
| DELETE | `/api/v1/notifications/fcm-token` | Authentifié | ✅ |
| GET | `/api/v1/notifications` | Authentifié | ✅ |
| GET | `/api/v1/notifications/unread-count` | Authentifié | ✅ |
| PATCH | `/api/v1/notifications/read-all` | Authentifié | ✅ |
| PATCH | `/api/v1/notifications/:id/read` | Authentifié | ✅ |

---

## Sprint 3 — Géolocalisation ✅ 90%

| # | Tâche | Statut | Durée |
|---|-------|--------|-------|
| 3.1 | Recherche artisans par zone (PostGIS) | ✅ Terminé | 3h |
| 3.2 | PostGIS queries optimisées (ST_DWithin) | ✅ Terminé | 1h |
| 3.3 | Calcul distances temps réel | ✅ Terminé | 1h |
| 3.4 | Index GiST efficaces | ✅ Triggers SQL ok | - |
| 3.5 | Fallback Haversine (sans PostGIS) | ✅ Terminé | 30min |
| 3.6 | Tri par abonnement + distance | ✅ Terminé | 30min |

### Endpoints Géolocalisation implémentés

| Méthode | Route | Accès | Statut |
|---------|-------|-------|--------|
| GET | `/api/v1/geolocation/artisans/nearby` | PUBLIC | ✅ |
| GET | `/api/v1/geolocation/artisans/:id/distance` | Authentifié | ✅ |

---

## Sprint 3b — Favoris ✅ 100%

| # | Tâche | Statut | Durée |
|---|-------|--------|-------|
| 3b.1 | FavorisModule | ✅ Terminé | 1h |
| 3b.2 | FavorisService (CRUD + check) | ✅ Terminé | 1h |
| 3b.3 | FavorisController | ✅ Terminé | 30min |

### Endpoints Favoris implémentés

| Méthode | Route | Accès | Statut |
|---------|-------|-------|--------|
| POST | `/api/v1/favoris/:artisanId` | CLIENT | ✅ |
| DELETE | `/api/v1/favoris/:artisanId` | CLIENT | ✅ |
| GET | `/api/v1/favoris` | CLIENT | ✅ |
| GET | `/api/v1/favoris/:artisanId/check` | CLIENT | ✅ |

---

## Sprint 4 — Paiements ✅ 95%

| # | Tâche | Statut | Fichiers | Durée |
|---|-------|--------|----------|-------|
| 4.1 | FedaPayProvider (sandbox + prod) | ✅ Terminé | `src/payment/providers/fedapay.provider.ts` | 2h |
| 4.2 | KkiaPayProvider (Mobile Money) | ✅ Terminé | `src/payment/providers/kkiapay.provider.ts` | 1h |
| 4.3 | Webhook HMAC-SHA256 (timingSafeEqual) | ✅ Terminé | `src/payment/payment.webhook.controller.ts` | 2h |
| 4.4 | Transaction lifecycle complet | ✅ Terminé | `src/payment/payment.service.ts` | 2h |
| 4.5 | Commission 10% + montantArtisan | ✅ Terminé | `src/payment/payment.service.ts` | 30min |
| 4.6 | Idempotence webhook (anti-double) | ✅ Terminé | `src/payment/payment.service.ts` | 30min |
| 4.7 | Remboursement ADMIN | ✅ Terminé | `src/payment/payment.controller.ts` | 30min |
| 4.8 | Historique transactions | ✅ Terminé | `src/payment/payment.controller.ts` | 30min |
| 4.9 | DTOs + ValidationPipe | ✅ Terminé | `src/payment/dto/*.ts` | 30min |
| 4.10 | Tests paiements | ⏳ À faire | `test/payment.e2e-spec.ts` | 4h |

### Endpoints Paiements implémentés

| Méthode | Route | Accès | Statut |
|---------|-------|-------|--------|
| POST | `/api/v1/payments/initiate/:bookingId` | CLIENT | ✅ |
| GET | `/api/v1/payments/history` | CLIENT / ARTISAN | ✅ |
| GET | `/api/v1/payments/:transactionId` | Propriétaire | ✅ |
| POST | `/api/v1/payments/refund/:transactionId` | ADMIN | ✅ |
| POST | `/api/v1/payments/webhook/fedapay` | PUBLIC (HMAC) | ✅ |
| POST | `/api/v1/payments/webhook/kkiapay` | PUBLIC (HMAC) | ✅ |

### Sécurité Webhooks
- Validation HMAC-SHA256 avec `crypto.timingSafeEqual` (anti-timing-attack)
- Routes webhook séparées du controller principal
- Toujours HTTP 200 en réponse (évite les retry loops FedaPay/KkiaPay)
- Idempotence : vérification du statut avant tout traitement

---

## Sprint 5 — Messagerie ⏳ 0%

| # | Tâche | Statut | Durée |
|---|-------|--------|-------|
| 5.1 | ConversationModule | ⏳ En attente | 2h |
| 5.2 | MessageModule | ⏳ En attente | 2h |
| 5.3 | WebSocket Gateway (Socket.io) | ⏳ En attente | 4h |
| 5.4 | Historique messages paginé | ⏳ En attente | 1h |
| 5.5 | Indicateurs lu/non-lu | ⏳ En attente | 1h |

---

## Sprint 6 — Avis & Notes ✅ 90%

| # | Tâche | Statut | Fichiers | Durée |
|---|-------|--------|----------|-------|
| 6.1 | AvisModule + AvisService + AvisController | ✅ Terminé | `src/avis/avis.{module,service,controller}.ts` | 3h |
| 6.2 | Trigger note_moyenne (PostgreSQL) | ✅ SQL ok | `prisma/migrations/manual/triggers.sql` | - |
| 6.3 | Réponse artisan (1 seule réponse/avis) | ✅ Terminé | `src/avis/avis.service.ts` | 30min |
| 6.4 | Signalement avis | ✅ Terminé | `src/avis/avis.service.ts` | 30min |
| 6.5 | Modération Admin (masquer/réactiver) | ✅ Terminé | `src/avis/avis.controller.ts` | 30min |
| 6.6 | Calcul stats multi-critères pondérés | ✅ Terminé | `src/avis/avis.service.ts` | 30min |
| 6.7 | Mise à jour stats artisan (fallback trigger) | ✅ Terminé | `src/avis/avis.service.ts` | 30min |
| 6.8 | Tests unitaires AvisService | ⏳ À faire | `src/avis/avis.service.spec.ts` | 2h |

### Endpoints Avis implémentés

| Méthode | Route | Accès | Statut |
|---------|-------|-------|--------|
| POST | `/api/v1/avis` | CLIENT | ✅ |
| GET | `/api/v1/avis/artisan/:artisanId` | Authentifié | ✅ |
| GET | `/api/v1/avis/my` | CLIENT | ✅ |
| PATCH | `/api/v1/avis/:id/response` | ARTISAN | ✅ |
| POST | `/api/v1/avis/:id/report` | Authentifié | ✅ |
| PATCH | `/api/v1/avis/:id/moderate` | ADMIN | ✅ |

### Règles métier Avis
- Seulement sur booking `TERMINEE` — délai max 14 jours
- 1 seul avis par booking (contrainte BDD + guard applicatif)
- Note pondérée : 50% note principale + 50% moyenne sous-notes (ponctualité, qualité, communication)
- 1 seule réponse artisan par avis
- Modération admin : masquer/réactiver recalcule `noteMoyenne`

---

## Sprint 7 — Abonnements ⏳ 0%

| # | Tâche | Statut | Durée |
|---|-------|--------|-------|
| 7.1 | Quotas par abonnement | ✅ Logique ok (BookingService) | - |
| 7.2 | Downgrade automatique expiré | ✅ Scheduler ok | - |
| 7.3 | Paiement abonnement | ⏳ En attente | 3h |

---

## Sprint 8 — Dashboard Admin ⏳ 0%

| # | Tâche | Statut | Durée |
|---|-------|--------|-------|
| 8.1 | Routes admin existantes | ✅ Protected (RolesGuard) | - |
| 8.2 | Admin stats globales | ⏳ En attente | 3h |
| 8.3 | Modération avis | ⏳ En attente | 2h |
| 8.4 | Gestion litiges | ⏳ En attente | 3h |

---

## 🔧 Commandes à exécuter (ordre strict)

```bash
# 1. Installer firebase-admin (REQUIS pour les notifications push)
pnpm add firebase-admin

# 2. S'assurer que la DB est démarrée
pnpm docker:up

# 3. Créer et appliquer la migration (Sprint 0+1+2 combiné)
npx prisma migrate dev --name "sprint0-1-2-complete"

# 4. Régénérer le client Prisma
npx prisma generate

# 5. Appliquer les triggers PostGIS manuellement
psql $DATABASE_URL -f prisma/migrations/manual/triggers.sql

# 6. Démarrer l'API en mode dev
pnpm start:dev
```

---

## 📦 Packages installés (npm)

| Package | Version | Usage |
|---------|---------|-------|
| `@nestjs/schedule` | ^6.1.1 | Tâches planifiées (cron) |
| `@nestjs/websockets` | ^11.1.14 | WebSocket (Sprint 5) |
| `@nestjs/platform-socket.io` | ^11.1.14 | Socket.io (Sprint 5) |
| `socket.io` | ^4.8.3 | Messaging temps réel |
| `resend` | ^6.5.2 | Emails transactionnels ✅ |
| `firebase-admin` | latest | Push notifications FCM ⚠️ À installer |

---

## 🏗️ Architecture des modules créés

```
src/
├── booking/
│   ├── booking.module.ts      ✅
│   ├── booking.service.ts     ✅ (+ notifications intégrées)
│   ├── booking.controller.ts  ✅
│   └── dto/
│       ├── create-booking.dto.ts   ✅
│       ├── propose-price.dto.ts    ✅
│       ├── search-booking.dto.ts   ✅
│       ├── cancel-booking.dto.ts   ✅
│       └── index.ts               ✅
├── notification/
│   ├── notification.module.ts    ✅
│   ├── notification.service.ts   ✅ (FCM + Resend + in-app)
│   ├── notification.controller.ts ✅
│   ├── notification.types.ts     ✅ (templates)
│   └── dto/
│       ├── register-fcm-token.dto.ts ✅
│       ├── get-notifications.dto.ts  ✅
│       └── index.ts                  ✅
├── geolocation/
│   ├── geolocation.module.ts    ✅
│   ├── geolocation.service.ts   ✅ (PostGIS + Haversine fallback)
│   ├── geolocation.controller.ts ✅
│   └── dto/
│       └── search-nearby.dto.ts  ✅
├── favoris/
│   ├── favoris.module.ts    ✅
│   ├── favoris.service.ts   ✅
│   └── favoris.controller.ts ✅
├── scheduler/
│   ├── scheduler.module.ts       ✅ (étendu)
│   ├── booking.scheduler.ts      ✅
│   └── notification.scheduler.ts ✅ (nouveau)
└── prisma/
    └── prisma.service.ts      ✅
```

---

## ⚠️ Points d'attention (dette technique)

1. **firebase-admin** : À installer manuellement avec `pnpm add firebase-admin`
2. **Migration Prisma** : La migration n'a pas encore été exécutée — la DB est peut-être décalée
3. **JWT RS256** : Prévu mais pas encore implémenté — rester sur HS256 pour l'instant
4. **Tests** : Aucun test unitaire ou E2E — dette croissante
5. **PostGIS** : L'extension doit être activée sur PostgreSQL avant d'utiliser GeolocationService
