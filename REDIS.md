# Guide complet - Système OTP avec Redis

## Table des matières
1. [Pourquoi Redis au lieu de PostgreSQL ?](#1-pourquoi-redis-au-lieu-de-postgresql)
2. [Les packages installés](#2-les-packages-installés)
3. [Configuration dans app.module.ts](#3-configuration-dans-appmodulets)
4. [Variables d'environnement](#4-variables-denvironnement)
5. [Types TypeScript](#5-types-typescript)
6. [Service OTP - Méthodes](#6-service-otp---méthodes)
7. [Flow complet - Exemple](#7-flow-complet---exemple)
8. [Résumé](#8-résumé)

---

## 🎯 1. Pourquoi Redis au lieu de PostgreSQL ?

### Le problème initial
Le modèle `Otp` dans Prisma (PostgreSQL) posait ces problèmes :
- ⏱️ **Très courte durée de vie** (5-15 minutes)
- 🔄 **Créés et supprimés fréquemment** (chaque inscription, reset password)
- 📈 **Table qui grossit rapidement** (1000 utilisateurs/jour = 1000+ OTP/jour)
- 🗑️ **Besoin de nettoyage constant** des OTP expirés

### Comparaison PostgreSQL vs Redis

```
PostgreSQL (Base relationnelle)          Redis (Cache en mémoire)
├─ Stockage sur disque (lent)          ├─ Stockage en RAM (ultra rapide)
├─ Bon pour données permanentes         ├─ Parfait pour données temporaires
├─ Nécessite job de nettoyage          ├─ Expiration automatique (TTL)
└─ Table qui grossit infiniment         └─ Données auto-supprimées
```

**Analogie** :
- **PostgreSQL** = Armoire de rangement (pour garder longtemps)
- **Redis** = Post-it (pour info temporaire qui s'efface seule)

---

## 📦 2. Les packages installés

```bash
pnpm add @nestjs/cache-manager cache-manager cache-manager-redis-yet redis
```

### Explication de chaque package

#### `@nestjs/cache-manager`
- **Rôle** : Module NestJS qui fournit une abstraction pour le cache
- **Pourquoi** : Intégration native avec NestJS (injection de dépendances, configuration)
- **Sans lui** : Tu devrais gérer manuellement la connexion Redis

```typescript
// Avec @nestjs/cache-manager (propre)
@Inject(CACHE_MANAGER) private cache: Cache

// Sans (compliqué)
import Redis from 'redis';
const client = Redis.createClient({...});
// Gérer connexion, erreurs, reconnexion...
```

#### `cache-manager`
- **Rôle** : Bibliothèque de gestion de cache (interface commune)
- **Pourquoi** : Permet de changer de backend (Redis, Memcached) sans changer le code
- **Méthodes** : `set()`, `get()`, `del()`

#### `cache-manager-redis-yet`
- **Rôle** : Adaptateur Redis moderne pour cache-manager
- **Pourquoi** :
  - "yet" = version moderne (l'ancienne `cache-manager-redis-store` est obsolète)
  - Support Redis v4+
  - Meilleures performances

#### `redis`
- **Rôle** : Client Redis officiel pour Node.js
- **Pourquoi** : C'est la "bibliothèque de base" qui communique avec le serveur Redis

### Hiérarchie des packages
```
Ton code NestJS
    ↓ utilise
@nestjs/cache-manager (abstraction NestJS)
    ↓ utilise
cache-manager (interface générique)
    ↓ utilise
cache-manager-redis-yet (adaptateur Redis)
    ↓ utilise
redis (client bas niveau)
    ↓ communique avec
Redis Server (dans Docker)
```

---

## ⚙️ 3. Configuration dans `app.module.ts`

### Code complet

```typescript
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
    imports: [
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                store: await redisStore({
                    socket: {
                        host: config.get('REDIS_HOST', 'localhost'),
                        port: config.get('REDIS_PORT', 6379),
                    },
                    password: config.get('REDIS_PASSWORD'),
                }),
            }),
        }),
    ],
})
export class AppModule {}
```

### Décortiquons ligne par ligne

#### `registerAsync()` vs `register()`
```typescript
// register() - Valeurs hardcodées ❌
CacheModule.register({ store: redisStore({ host: 'localhost' }) })

// registerAsync() - Valeurs dynamiques depuis .env ✅
CacheModule.registerAsync({ useFactory: async (config) => {...} })
```
**Nécessité** : On veut `localhost` en dev, mais `redis.prod.com` en production

#### `isGlobal: true`
```typescript
isGlobal: true  // OtpService peut l'utiliser partout
```
**Sans ça** : Tu devrais importer `CacheModule` dans chaque module (AuthModule, UsersModule...)

#### `imports: [ConfigModule]`
- **Rôle** : Injecte `ConfigService` dans la factory
- **Nécessité** : Pour lire les variables `.env`

#### `inject: [ConfigService]`
- **Rôle** : Dit à NestJS "passe-moi ConfigService en paramètre de useFactory"

#### `useFactory: async (config: ConfigService) => ({...})`
- **Rôle** : Fonction qui crée la configuration
- **Paramètre** : `config` injecté par NestJS
- **Retourne** : Configuration du cache

#### `store: await redisStore({...})`
- **Rôle** : Crée la connexion Redis
- **Await** : La connexion est asynchrone (attend que Redis réponde)

#### `socket: { host, port }`
- **Rôle** : Adresse du serveur Redis
- **Valeurs** :
  - Dev : `localhost:6379` (Redis dans Docker sur ta machine)
  - Prod : `redis-prod.example.com:6379`

#### `password: config.get('REDIS_PASSWORD')`
- **Rôle** : Authentification Redis
- **Sécurité** : Dans ton docker-compose, Redis a le password `redis123`

---

## 🔐 4. Variables d'environnement

### Fichier `.env`

```env
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD="redis123"
```

### Pourquoi chaque variable ?

#### `REDIS_HOST`
- **Dev** : `localhost` (Redis dans Docker sur ta machine)
- **Prod** : `redis-prod.server.com` (serveur Redis distant)

#### `REDIS_PORT`
- **Standard** : 6379 (port par défaut Redis)
- **Modifiable** : Si conflit de port (ex: 6380)

#### `REDIS_PASSWORD`
- **Sécurité** : Empêche accès non autorisé à Redis
- **Docker** : Correspond au password dans `docker-compose.yml`
- ⚠️ **Important** : En production, utilise un password fort aléatoire !

---

## 📝 5. Types TypeScript

### Fichier `src/common/types/otp.types.ts`

#### `OtpType` (Enum)
```typescript
export enum OtpType {
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
    PHONE_VERIFICATION = 'PHONE_VERIFICATION',
    PASSWORD_RESET = 'PASSWORD_RESET',
    TWO_FACTOR_AUTH = 'TWO_FACTOR_AUTH',
}
```

**Nécessité** :
- Un utilisateur peut avoir **plusieurs OTP simultanés** (email + phone)
- Redis a besoin de **clés uniques** : `otp:user123:EMAIL` ≠ `otp:user123:PHONE`
- Type-safety : Empêche les typos (`'EMIAL'` au lieu de `'EMAIL'`)

#### `OtpData` (Interface)
```typescript
export interface OtpData {
    code: string;           // Le code OTP (sera hashé avant stockage)
    userId: string;         // ID de l'utilisateur
    type: OtpType;          // Type d'OTP
    attempts?: number;      // Tentatives (optionnel)
    maxAttempts?: number;   // Max tentatives (optionnel)
}
```

#### `StoredOtpData` (Interface)
```typescript
export interface StoredOtpData {
    codeHash: string;       // Code OTP hashé (sécurité)
    userId: string;         // Propriétaire de l'OTP
    type: OtpType;          // EMAIL/PHONE/etc.
    attempts: number;       // Tentatives de vérification
    maxAttempts: number;    // Max autorisé (protection brute-force)
    createdAt: number;      // Timestamp de création
}
```

### Pourquoi chaque champ ?

#### `codeHash` (pas `code`)
```typescript
// ❌ DANGER - Code en clair
{ code: "123456" }  // Si Redis est hacké, tous les codes sont exposés

// ✅ SÉCURISÉ - Code hashé
{ codeHash: "$argon2id$v=19$m=65536..." }
```
**Comme les mots de passe** : On ne stocke JAMAIS en clair

#### `attempts` et `maxAttempts`
**Protection brute-force** :
```
Tentative 1: ❌ Code faux → attempts = 1
Tentative 2: ❌ Code faux → attempts = 2
Tentative 3: ❌ Code faux → attempts = 3 → BLOQUÉ
```
**Sans ça** : Un attaquant peut essayer 10000 codes

#### `createdAt`
- **Audit** : Savoir quand l'OTP a été créé
- **Debug** : "L'utilisateur dit qu'il n'a pas reçu le code envoyé il y a 5 min"

---

## 🛠️ 6. Service OTP - Méthodes

### Fichier `src/common/services/otp.service.ts`

### Méthode 1 : `create(userId, type, ttl)`

```typescript
async create(
    userId: string,
    type: OtpType,
    ttl: number = 600, // 10 minutes par défaut
): Promise<string>
```

**Étapes** :
```
1. Génère code aléatoire (ex: "843726")
2. Hash le code avec Argon2
3. Crée l'objet StoredOtpData
4. Stocke dans Redis avec clé "otp:user123:EMAIL"
5. TTL = 600s → Redis supprime auto après 10 min
6. Retourne le code en clair (pour l'envoyer par email)
```

**Pourquoi TTL 600s (10 min) ?**
- Trop court (1 min) : Utilisateur n'a pas le temps
- Trop long (1h) : Risque de sécurité

**Exemple d'utilisation** :
```typescript
const code = await otpService.create(user.id, OtpType.EMAIL_VERIFICATION);
await emailService.send(user.email, `Votre code: ${code}`);
```

---

### Méthode 2 : `verify(userId, type, code)`

```typescript
async verify(userId: string, type: OtpType, code: string): Promise<boolean>
```

**Étapes** :
```
1. Récupère données depuis Redis
2. ❌ Pas de données → "Code expiré" (TTL dépassé)
3. ✅ Données trouvées → Vérifie attempts < maxAttempts
4. Incrémente attempts (protection brute-force)
5. Compare code avec codeHash (Argon2)
6. Si valide → Supprime l'OTP de Redis (one-time use)
7. Retourne true/false
```

**Pourquoi supprimer après vérification ?**
- **One-Time Password** : Utilisable qu'une seule fois
- Empêche réutilisation du même code

**Exemple d'utilisation** :
```typescript
const isValid = await otpService.verify(user.id, OtpType.EMAIL_VERIFICATION, code);
if (isValid) {
    await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true }
    });
}
```

---

### Méthode 3 : `revoke(userId, type)`

```typescript
async revoke(userId: string, type: OtpType): Promise<void>
```

**Usage** :
```typescript
// Utilisateur demande un nouveau code
await otpService.revoke(userId, OtpType.EMAIL); // Supprime l'ancien
const newCode = await otpService.create(userId, OtpType.EMAIL); // Crée le nouveau
```

---

### Méthode 4 : `exists(userId, type)`

```typescript
async exists(userId: string, type: OtpType): Promise<boolean>
```

**Usage** :
```typescript
// Empêcher spam de codes
if (await otpService.exists(userId, OtpType.EMAIL)) {
    throw new Error('Code déjà envoyé. Attendez 10 min');
}
```

---

### Méthode privée : `generateCode(length)`

```typescript
private generateCode(length: number = 6): string {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
}
```

**Génère un code aléatoire** : `"482931"`

---

### Méthode privée : `getRedisKey(userId, type)`

```typescript
private getRedisKey(userId: string, type: OtpType): string {
    return `otp:${userId}:${type}`;
}
```

**Exemples de clés** :
- `otp:uuid-123:EMAIL_VERIFICATION`
- `otp:uuid-123:PHONE_VERIFICATION`
- `otp:uuid-456:PASSWORD_RESET`

---

## 🔄 7. Flow complet - Exemple concret

### Scénario : Vérification d'email à l'inscription

#### Étape 1 : Utilisateur s'inscrit
```http
POST /auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Côté serveur** :
```typescript
// 1. AuthService crée l'utilisateur
const user = await prisma.user.create({ data: { email, passwordHash } });

// 2. OtpService génère et stocke l'OTP
const code = await otpService.create(user.id, OtpType.EMAIL_VERIFICATION, 600);
// Génère: "482931"
// Hash: "$argon2id$v=19$m=65536,t=3,p=4$..."
// Redis: SET "otp:uuid-123:EMAIL_VERIFICATION" '{"codeHash":"...","attempts":0,...}' EX 600

// 3. EmailService envoie le code
await emailService.send(user.email, `Votre code de vérification: ${code}`);

// 4. Réponse
return { message: "Code de vérification envoyé par email" };
```

---

#### Étape 2 : Utilisateur entre le code (3 minutes plus tard)
```http
POST /auth/verify-email
{
  "code": "482931"
}
```

**Côté serveur** :
```typescript
// 1. OtpService vérifie le code
const isValid = await otpService.verify(user.id, OtpType.EMAIL_VERIFICATION, "482931");

// Détail de verify() :
// ├─ Redis: GET "otp:uuid-123:EMAIL_VERIFICATION"
// ├─ Vérifie attempts < maxAttempts (0 < 3) ✅
// ├─ Incrémente attempts (0 → 1)
// ├─ Argon2.verify(storedHash, "482931") ✅ Match !
// └─ Redis: DEL "otp:uuid-123:EMAIL_VERIFICATION" (supprime l'OTP)

// 2. Met à jour l'utilisateur
if (isValid) {
    await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true }
    });
    return { message: "Email vérifié avec succès" };
}
```

---

#### Étape 3 : Cas d'erreur - Code faux
```http
POST /auth/verify-email
{
  "code": "000000"  // Mauvais code
}
```

**Côté serveur** :
```typescript
const isValid = await otpService.verify(user.id, OtpType.EMAIL_VERIFICATION, "000000");

// Détail :
// ├─ Redis: GET "otp:uuid-123:EMAIL_VERIFICATION" ✅
// ├─ Vérifie attempts < maxAttempts (1 < 3) ✅
// ├─ Incrémente attempts (1 → 2)
// ├─ Argon2.verify(storedHash, "000000") ❌ Pas de match !
// └─ return false

throw new BadRequestException("Code invalide");
```

---

#### Étape 4 : Cas d'erreur - Code expiré (après 10 minutes)
```http
POST /auth/verify-email
{
  "code": "482931"
}
```

**Côté serveur** :
```typescript
const isValid = await otpService.verify(user.id, OtpType.EMAIL_VERIFICATION, "482931");

// Détail :
// ├─ Redis: GET "otp:uuid-123:EMAIL_VERIFICATION" → null (TTL expiré après 600s)
// └─ throw BadRequestException("Code OTP expiré ou invalide")
```

---

#### Étape 5 : Cas d'erreur - Trop de tentatives
```http
POST /auth/verify-email { "code": "111111" }  // Tentative 1 ❌
POST /auth/verify-email { "code": "222222" }  // Tentative 2 ❌
POST /auth/verify-email { "code": "333333" }  // Tentative 3 ❌
POST /auth/verify-email { "code": "482931" }  // Tentative 4 🚫 BLOQUÉ
```

**Côté serveur (tentative 4)** :
```typescript
// ├─ Redis: GET "otp:uuid-123:EMAIL_VERIFICATION"
// ├─ Vérifie attempts >= maxAttempts (3 >= 3) ❌
// ├─ Redis: DEL "otp:uuid-123:EMAIL_VERIFICATION"
// └─ throw BadRequestException("Nombre max de tentatives atteint")
```

---

## ✅ 8. Résumé

### Pourquoi chaque élément

| Élément | Nécessité |
|---------|-----------|
| **Redis au lieu de PostgreSQL** | Expiration automatique, pas de table qui grossit |
| **@nestjs/cache-manager** | Intégration NestJS propre avec injection de dépendances |
| **cache-manager-redis-yet** | Client Redis moderne compatible Redis v4+ |
| **isGlobal: true** | Accessible partout sans importer CacheModule |
| **registerAsync** | Configuration dynamique depuis .env (dev/prod) |
| **OtpType enum** | Plusieurs OTP par user (email + phone + reset) |
| **codeHash** | Sécurité (ne jamais stocker en clair) |
| **attempts/maxAttempts** | Protection contre brute-force (max 3 essais) |
| **TTL 600s** | Balance sécurité/UX (10 min suffisant) |
| **delete après verify** | One-Time Password (usage unique) |

---

### Avantages de cette architecture

✅ **Performance** : Redis en RAM = ultra-rapide
✅ **Scalabilité** : Pas de table qui grossit infiniment
✅ **Sécurité** : Codes hashés + protection brute-force
✅ **Simplicité** : Pas de job de nettoyage nécessaire
✅ **Maintenance** : TTL automatique par Redis

---

### Commandes utiles

#### Voir tous les OTP en Redis
```bash
docker exec -it alloartisan-redis redis-cli -a redis123
> KEYS otp:*
```

#### Voir un OTP spécifique
```bash
> GET otp:uuid-123:EMAIL_VERIFICATION
```

#### Voir le TTL restant
```bash
> TTL otp:uuid-123:EMAIL_VERIFICATION
# Retourne le nombre de secondes restantes
```

#### Supprimer tous les OTP (debug)
```bash
> KEYS otp:*
> DEL otp:uuid-123:EMAIL_VERIFICATION otp:uuid-123:PHONE_VERIFICATION
```

---

### Prochaines étapes

1. **Implémenter l'envoi d'emails** : Service pour envoyer les codes OTP
2. **Implémenter l'envoi de SMS** : Service pour les OTP par téléphone
3. **Ajouter rate limiting** : Limiter le nombre de demandes de code par heure
4. **Monitoring** : Logger les tentatives de vérification échouées
5. **Tests** : Écrire des tests pour le service OTP

---

**Documentation Redis officielle** : https://redis.io/docs/
**Documentation cache-manager** : https://github.com/jaredwray/cacheable
**Documentation NestJS Cache** : https://docs.nestjs.com/techniques/caching
