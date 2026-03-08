# Allo Artisan — API REST

Backend de la plateforme **Allo Artisan**, une application de mise en relation entre clients et artisans qualifiés (plombiers, électriciens, menuisiers, peintres, etc.).

Construit avec **NestJS** (TypeScript), l'API expose une interface REST sécurisée, documentée et prête pour la production, couvrant l'authentification, la réservation, les paiements, la messagerie temps réel, les notifications push, la géolocalisation et bien d'autres domaines.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | NestJS 11 (TypeScript) |
| Base de données | PostgreSQL + Prisma ORM 7 |
| Cache distribué | Redis (cache-manager-redis-yet) |
| File de messages | Bull + Redis |
| Authentification | JWT (access + refresh token), Passport.js, Argon2 |
| Temps réel | Socket.IO (WebSocket) |
| Stockage fichiers | Cloudinary + Supabase Storage |
| Notifications push | Firebase Admin SDK |
| Email transactionnel | Resend + Nodemailer |
| Sécurité HTTP | Helmet, CORS, @nestjs/throttler |
| Documentation API | Swagger UI + Scalar |
| Tests | Jest (unit + e2e), Pactum, couverture imposée en CI |
| Conteneurisation | Docker + Docker Compose |
| Qualité de code | ESLint, Prettier, Husky, Commitlint |

---

## Architecture

L'API adopte une architecture **modulaire orientée domaine** (Domain-Driven Design).
Chaque domaine métier est encapsulé dans un module NestJS indépendant avec sa propre logique, ses DTOs et ses interfaces. Les modules communiquent via injection de dépendances ou via des queues asynchrones (Bull/Redis).

### Modules principaux

| Module | Responsabilité |
|---|---|
| `auth` | Authentification JWT, refresh token, MFA (TOTP + QR Code), protection brute-force |
| `users` | Profil utilisateur, gestion des rôles |
| `artisans` | Profil artisan, portfolio avec galerie média |
| `booking` | Réservations avec machine à états (pending → confirmed → completed) |
| `payment` | Initiation de paiement, webhooks, remboursements |
| `messaging` | Messagerie temps réel via WebSocket |
| `notification` | Notifications push (Firebase), email, in-app |
| `search` | Recherche full-text (ts_rank), autocomplétion, cache Redis |
| `geolocation` | Recherche par proximité via PostGIS |
| `subscriptions` | Plans d'abonnement (gratuit / standard / premium) |
| `fraud` | Détection de comportements frauduleux et scoring |
| `admin` | Administration, statistiques, modération |
| `scheduler` | Tâches planifiées : rappels, expiration de réservations |
| `upload` | Gestion des fichiers : validation MIME, optimisation image (Sharp) |
| `health` | Endpoint de santé pour les load balancers |

**Couche transversale :**
- Guard JWT global (`AtGuard`) — toutes les routes sont protégées par défaut
- Rate limiting multi-niveaux : 3 req/s · 20 req/10s · 100 req/min
- Intercepteur d'audit global (`AuditLogInterceptor`)
- Filtre d'exceptions HTTP global avec logging structuré

---

## Prérequis

- Node.js ≥ 20
- pnpm ≥ 9
- Docker + Docker Compose

---

## Installation

```bash
pnpm install
```

Copier le fichier d'environnement et renseigner les variables :

```bash
cp .env.example .env
```

---

## Démarrage avec Docker

```bash
# Démarrer PostgreSQL + Redis
pnpm run docker:up

# Appliquer les migrations Prisma
pnpm run prisma:dev:deploy

# Démarrer l'API en mode développement
pnpm run start:dev
```

L'API sera accessible sur `http://localhost:3001`.

---

## Documentation interactive

| Interface | URL |
|---|---|
| Swagger UI | `http://localhost:3001/docs` |
| Scalar (moderne) | `http://localhost:3001/reference` |

---

## Tests

```bash
# Tests unitaires
pnpm run test

# Tests avec couverture
pnpm run test:cov

# Tests end-to-end
pnpm run test:e2e
```

> La couverture de code est vérifiée automatiquement en CI — le build échoue en dessous du seuil configuré.

---

## Variables d'environnement

Voir [`.env.example`](.env.example) pour la liste complète.
Les variables requises incluent notamment les connexions PostgreSQL, Redis, les clés JWT, les credentials Firebase, Cloudinary, Supabase et la passerelle de paiement.

---

## Structure du projet

```
src/
├── auth/               # Authentification & autorisation
├── users/              # Profils utilisateurs
├── artisans/           # Profils artisans & portfolio
├── booking/            # Réservations
├── payment/            # Paiements
├── messaging/          # Messagerie temps réel (WebSocket)
├── notification/       # Notifications push & email
├── search/             # Recherche full-text
├── geolocation/        # Géolocalisation (PostGIS)
├── subscriptions/      # Abonnements
├── fraud/              # Détection de fraude
├── admin/              # Administration
├── scheduler/          # Tâches planifiées
├── upload/             # Gestion de fichiers
├── health/             # Health checks
├── common/             # Guards, intercepteurs, filtres, décorateurs partagés
├── config/             # Constantes et configuration globale
├── docs/               # Configuration Swagger/Scalar
└── prisma/             # Service Prisma
```

---

## Licence

Projet privé — tous droits réservés.
