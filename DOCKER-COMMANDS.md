# Commandes Docker - AlloArtisan API

## Démarrage des services

### Démarrage rapide (développement quotidien)

```bash
docker-compose up -d
```

**Quand l'utiliser :** Au début de chaque session de développement. Démarre PostgreSQL (dev + test) et Redis.

### Démarrage avec outils admin

```bash
docker-compose --profile dev up -d
```

**Quand l'utiliser :** Quand vous avez besoin d'inspecter la base de données via pgAdmin ou de visualiser le cache Redis.

### Démarrer un service spécifique

```bash
docker-compose up -d dev-db
docker-compose up -d redis
docker-compose --profile dev up -d pgadmin
```

**Quand l'utiliser :** Pour redémarrer un service qui a planté sans toucher aux autres.

---

## Arrêt des services

### Arrêt standard

```bash
docker-compose down
```

**Quand l'utiliser :** En fin de journée ou pour libérer des ressources. Les données sont conservées.

### Arrêt avec suppression des données

```bash
docker-compose down -v
```

**Quand l'utiliser :** Pour reset complet de la base de données (après changement majeur de schema, corruption, etc.).

---

## Vérification et diagnostic

### Voir le statut des conteneurs

```bash
docker-compose ps
```

**Quand l'utiliser :** Pour vérifier que tous les services sont bien démarrés et healthy.

### Voir les logs

```bash
# Logs de tous les services
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f dev-db
docker-compose logs -f pgadmin
docker-compose logs -f redis
```

**Quand l'utiliser :** Pour débugger des problèmes de connexion ou voir les requêtes SQL.

### Redémarrer un service

```bash
docker-compose restart dev-db
```

**Quand l'utiliser :** Si un service ne répond plus ou après modification de configuration.

---

## Accès aux interfaces web

| Service | URL | Email/User | Password |
|---------|-----|------------|----------|
| pgAdmin | http://localhost:5050 | `admin@example.com` | `admin123` |
| Redis Commander | http://localhost:8081 | `admin` | `admin123` |

### Configuration pgAdmin pour la DB dev

- **Host :** `dev-db`
- **Port :** `5432`
- **Username :** `postgres`
- **Password :** `postgres123`
- **Database :** `alloartisan_dev`

---

## Connexion directe aux bases de données

### PostgreSQL Dev

```bash
docker exec -it alloartisan-dev-db psql -U postgres -d alloartisan_dev
```

**Quand l'utiliser :** Pour exécuter des requêtes SQL manuellement ou inspecter les données rapidement.

### PostgreSQL Test

```bash
docker exec -it alloartisan-test-db psql -U postgres -d alloartisan_test
```

**Quand l'utiliser :** Pour vérifier l'état de la base de test après des tests échoués.

### Redis

```bash
docker exec -it alloartisan-redis redis-cli -a redis123
```

**Quand l'utiliser :** Pour inspecter le cache, vider des clés ou débugger des problèmes de session.

---

## Ports exposés

| Service | Port local | Description |
|---------|------------|-------------|
| PostgreSQL Dev | `5438` | Base de données développement |
| PostgreSQL Test | `5436` | Base de données tests |
| Redis | `6379` | Cache et sessions |
| pgAdmin | `5050` | Interface admin PostgreSQL |
| Redis Commander | `8081` | Interface admin Redis |

---

## Commandes Prisma (après démarrage Docker)

### Générer le client Prisma

```bash
npx prisma generate
```

**Quand l'utiliser :** Après modification du fichier `schema.prisma`.

### Appliquer les migrations

```bash
npx prisma migrate dev
```

**Quand l'utiliser :** Après ajout/modification de models dans le schema.

### Créer une migration sans l'appliquer

```bash
npx prisma migrate dev --create-only
```

**Quand l'utiliser :** Pour réviser le SQL généré avant de l'appliquer.

### Reset complet de la base

```bash
npx prisma migrate reset
```

**Quand l'utiliser :** Pour repartir de zéro avec un schema propre (supprime toutes les données).

### Ouvrir Prisma Studio

```bash
npx prisma studio
```

**Quand l'utiliser :** Pour visualiser et éditer les données via une interface graphique.

### Synchroniser le schema avec la DB (sans migration)

```bash
npx prisma db push
```

**Quand l'utiliser :** En développement rapide, pour tester des changements de schema sans créer de migration.

---

## Problèmes courants

### Erreur de réseau Docker

```bash
docker rm -f alloartisan-pgadmin alloartisan-redis-commander
docker network prune -f
docker-compose --profile dev up -d
```

**Quand l'utiliser :** Si vous avez des erreurs "network not found".

### Nettoyer les ressources Docker inutilisées

```bash
docker system prune -f
```

**Quand l'utiliser :** Pour libérer de l'espace disque.

### Reconstruire complètement

```bash
docker-compose down -v
docker-compose --profile dev up -d
npx prisma migrate dev
```

**Quand l'utiliser :** En dernier recours si rien ne fonctionne.

---

## Variables de connexion pour .env

```env
# Base de données développement
DATABASE_URL="postgresql://postgres:postgres123@localhost:5438/alloartisan_dev?schema=public"

# Base de données test
DATABASE_URL_TEST="postgresql://postgres:postgres123@localhost:5436/alloartisan_test?schema=public"

# Redis
REDIS_URL="redis://:redis123@localhost:6379"

Gestion Docker :
  - pnpm docker:up - Démarrer PostgreSQL (dev + test) et Redis
  - pnpm docker:up:admin - Démarrer avec pgAdmin et Redis Commander
  - pnpm docker:down - Arrêter tous les services
  - pnpm docker:down:volumes - Arrêter et supprimer les données
  - pnpm docker:logs - Voir les logs en temps réel

  Base de données développement :
  - pnpm db:dev:rm - Supprimer le conteneur dev-db
  - pnpm db:dev:up - Démarrer dev-db
  - pnpm db:dev:restart - Reset complet dev-db + migrations

  Base de données test :
  - pnpm db:test:rm - Supprimer le conteneur test-db
  - pnpm db:test:up - Démarrer test-db
  - pnpm db:test:restart - Reset complet test-db + migrations
  - pnpm db:restart - Reset dev + test ensemble

  Prisma :
  - pnpm prisma:dev:deploy - Appliquer les migrations en dev
  - pnpm prisma:test:deploy - Appliquer les migrations en test
```
