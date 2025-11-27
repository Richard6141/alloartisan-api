# Documentation Authentification - AlloArtisan API

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Inscription et Connexion](#inscription-et-connexion)
3. [Gestion des Sessions](#gestion-des-sessions)
4. [Réinitialisation du mot de passe](#réinitialisation-du-mot-de-passe)
5. [Authentification Multi-Facteurs (MFA)](#authentification-multi-facteurs-mfa)
6. [Tests Postman](#tests-postman)

---

## Vue d'ensemble

L'API AlloArtisan utilise un système d'authentification basé sur JWT avec :
- **Access Token** : Durée de vie 15 minutes
- **Refresh Token** : Durée de vie 7 jours
- **Sessions Redis** : Gestion multi-appareils avec expiration automatique

### Headers requis
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## Inscription et Connexion

### POST /auth/register
Crée un nouveau compte utilisateur.

**Body :**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Règles du mot de passe :**
- Minimum 8 caractères
- Au moins une majuscule
- Au moins une minuscule
- Au moins un chiffre

**Réponse (201) :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Comportement :**
- Un email de vérification avec code OTP (6 chiffres) est envoyé automatiquement
- Le compte est créé avec le statut `EN_ATTENTE`
- L'utilisateur doit vérifier son email avant de pouvoir se connecter

---

### POST /auth/login
Connecte un utilisateur existant.

**Body :**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Réponse normale (200) :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Réponse si MFA activé (200) :**
```json
{
  "mfa_required": true,
  "mfa_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Protection anti-brute force :**
- 5 tentatives échouées → compte verrouillé 15 minutes
- Message d'erreur générique pour éviter l'énumération d'utilisateurs

---

### POST /auth/login/mfa
Complète la connexion après validation MFA.

**Body :**
```json
{
  "mfa_token": "eyJhbGciOiJIUzI1NiIs...",
  "code": "123456"
}
```

**Réponse (200) :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### POST /auth/verify-otp
Vérifie l'email avec le code OTP reçu.

**Body :**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Réponse (200) :** Vide (succès)

**Comportement :**
- Le statut passe de `EN_ATTENTE` à `ACTIF`
- L'utilisateur peut maintenant se connecter

---

### POST /auth/new-otp-code
Demande un nouveau code OTP de vérification d'email.

**Body :**
```json
{
  "email": "user@example.com"
}
```

**Réponse (200) :**
```json
"Veuillez consulter votre boite mail pour recevoir un nouveau code"
```

**Rate limiting :** 3 demandes / 10 minutes par IP

---

### POST /auth/refresh
Renouvelle les tokens avec le refresh token.

**Headers :**
```
Authorization: Bearer <refresh_token>
```

**Réponse (200) :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Gestion des Sessions

Les sessions sont stockées dans Redis avec expiration automatique (7 jours). Chaque utilisateur peut avoir jusqu'à 5 sessions actives simultanément.

### GET /auth/sessions
Liste toutes les sessions actives de l'utilisateur.

**Headers :** `Authorization: Bearer <access_token>`

**Réponse (200) :**
```json
[
  {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "deviceName": "iPhone",
    "deviceType": "mobile",
    "ipAddress": "192.168.1.1",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "lastUsedAt": "2024-01-15T14:45:00.000Z",
    "isCurrent": true
  },
  {
    "sessionId": "660e8400-e29b-41d4-a716-446655440001",
    "deviceName": "Windows PC",
    "deviceType": "desktop",
    "ipAddress": "192.168.1.2",
    "createdAt": "2024-01-14T08:00:00.000Z",
    "lastUsedAt": "2024-01-15T09:00:00.000Z",
    "isCurrent": false
  }
]
```

**Cas d'utilisation :**
- Afficher "Appareils connectés" dans les paramètres du profil
- Détecter les connexions suspectes

---

### POST /auth/logout
Déconnecte la session courante.

**Headers :** `Authorization: Bearer <access_token>`

**Réponse (200) :** Vide

---

### POST /auth/logout/all
Déconnecte toutes les sessions (tous les appareils).

**Headers :** `Authorization: Bearer <access_token>`

**Réponse (200) :** Vide

**Cas d'utilisation :**
- Compte potentiellement compromis
- Changement de mot de passe

---

### POST /auth/logout/others
Déconnecte toutes les sessions sauf la session courante.

**Headers :** `Authorization: Bearer <access_token>`

**Réponse (200) :** Vide

**Cas d'utilisation :**
- L'utilisateur veut rester connecté sur son appareil actuel mais déconnecter les autres

---

### DELETE /auth/sessions/:sessionId
Révoque une session spécifique.

**Headers :** `Authorization: Bearer <access_token>`

**Réponse (200) :** Vide

**Cas d'utilisation :**
- L'utilisateur identifie un appareil qu'il ne reconnaît pas et veut le déconnecter

---

## Réinitialisation du mot de passe

### POST /auth/forgot-password
Initie la procédure de réinitialisation.

**Body :**
```json
{
  "email": "user@example.com"
}
```

**Réponse (200) :**
```json
"Si cet email existe, un code de réinitialisation a été envoyé."
```

**Comportement :**
- Un code OTP (6 chiffres) est envoyé par email
- Le code expire après 10 minutes
- Message identique que l'email existe ou non (sécurité)

**Rate limiting :** 3 demandes / 10 minutes par IP

---

### POST /auth/reset-password
Réinitialise le mot de passe avec le code reçu.

**Body :**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "NewPassword456"
}
```

**Réponse (200) :**
```json
"Mot de passe réinitialisé avec succès. Veuillez vous reconnecter."
```

**Comportement :**
- Toutes les sessions existantes sont révoquées
- L'utilisateur doit se reconnecter sur tous ses appareils

---

## Authentification Multi-Facteurs (MFA)

Le MFA utilise le protocole TOTP (Time-based One-Time Password), compatible avec :
- Google Authenticator
- Authy
- Microsoft Authenticator
- 1Password
- Bitwarden

### POST /auth/mfa/generate
Génère un secret MFA et un QR code.

**Headers :** `Authorization: Bearer <access_token>`

**Réponse (200) :**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Utilisation :**
1. Afficher le QR code à l'utilisateur
2. L'utilisateur scanne avec son app d'authentification
3. L'utilisateur entre le code généré pour activer le MFA

**Note :** Le secret est stocké mais le MFA n'est pas encore activé.

---

### POST /auth/mfa/enable
Active le MFA après validation du code.

**Headers :** `Authorization: Bearer <access_token>`

**Body :**
```json
{
  "code": "123456"
}
```

**Réponse (200) :**
```json
"MFA activé avec succès"
```

**Comportement :**
- Le MFA est maintenant obligatoire à chaque connexion
- Le code change toutes les 30 secondes

---

### POST /auth/mfa/disable
Désactive le MFA.

**Headers :** `Authorization: Bearer <access_token>`

**Body :**
```json
{
  "code": "123456"
}
```

**Réponse (200) :**
```json
"MFA désactivé avec succès"
```

**Sécurité :** L'utilisateur doit prouver qu'il possède l'app d'authentification avant de désactiver.

---

## Tests Postman

### Configuration de l'environnement

Créez un environnement Postman avec les variables :
```
base_url: http://localhost:3000
access_token: (vide au départ)
refresh_token: (vide au départ)
session_id: (vide au départ)
mfa_token: (vide au départ)
test_email: votre-email@test.com
```

### Collection de tests

#### 1. Inscription
```
POST {{base_url}}/auth/register
Body:
{
  "email": "{{test_email}}",
  "password": "TestPassword123"
}

Tests (onglet Tests):
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set("access_token", jsonData.access_token);
    pm.environment.set("refresh_token", jsonData.refresh_token);
    pm.environment.set("session_id", jsonData.session_id);
}
```

#### 2. Vérification OTP
```
POST {{base_url}}/auth/verify-otp
Body:
{
  "email": "{{test_email}}",
  "code": "VOTRE_CODE_RECU_PAR_EMAIL"
}
```

#### 3. Connexion
```
POST {{base_url}}/auth/login
Body:
{
  "email": "{{test_email}}",
  "password": "TestPassword123"
}

Tests:
var jsonData = pm.response.json();
if (jsonData.mfa_required) {
    pm.environment.set("mfa_token", jsonData.mfa_token);
} else {
    pm.environment.set("access_token", jsonData.access_token);
    pm.environment.set("refresh_token", jsonData.refresh_token);
    pm.environment.set("session_id", jsonData.session_id);
}
```

#### 4. Connexion MFA (si MFA activé)
```
POST {{base_url}}/auth/login/mfa
Body:
{
  "mfa_token": "{{mfa_token}}",
  "code": "CODE_DE_VOTRE_APP"
}

Tests:
var jsonData = pm.response.json();
pm.environment.set("access_token", jsonData.access_token);
pm.environment.set("refresh_token", jsonData.refresh_token);
pm.environment.set("session_id", jsonData.session_id);
```

#### 5. Lister les sessions
```
GET {{base_url}}/auth/sessions
Headers:
Authorization: Bearer {{access_token}}
```

#### 6. Refresh Token
```
POST {{base_url}}/auth/refresh
Headers:
Authorization: Bearer {{refresh_token}}

Tests:
var jsonData = pm.response.json();
pm.environment.set("access_token", jsonData.access_token);
pm.environment.set("refresh_token", jsonData.refresh_token);
```

#### 7. Générer MFA
```
POST {{base_url}}/auth/mfa/generate
Headers:
Authorization: Bearer {{access_token}}
```

#### 8. Activer MFA
```
POST {{base_url}}/auth/mfa/enable
Headers:
Authorization: Bearer {{access_token}}
Body:
{
  "code": "CODE_DE_VOTRE_APP"
}
```

#### 9. Forgot Password
```
POST {{base_url}}/auth/forgot-password
Body:
{
  "email": "{{test_email}}"
}
```

#### 10. Reset Password
```
POST {{base_url}}/auth/reset-password
Body:
{
  "email": "{{test_email}}",
  "code": "CODE_RECU_PAR_EMAIL",
  "newPassword": "NewPassword456"
}
```

#### 11. Logout
```
POST {{base_url}}/auth/logout
Headers:
Authorization: Bearer {{access_token}}
```

---

## Codes d'erreur

| Code | Message | Description |
|------|---------|-------------|
| 403 | Email already exists | Email déjà utilisé |
| 403 | Email or password incorrect | Identifiants invalides |
| 403 | Access Denied | Token invalide ou session révoquée |
| 403 | Invalid OTP | Code OTP incorrect |
| 403 | Invalid MFA code | Code MFA incorrect |
| 403 | Compte temporairement verrouillé | Trop de tentatives échouées |
| 400 | MFA is already enabled | MFA déjà actif |
| 400 | MFA is not enabled | Tentative de désactiver un MFA non actif |

---

## Schéma de flux

### Connexion standard
```
Client                          API                         Redis
  |                              |                            |
  |-- POST /login -------------->|                            |
  |                              |-- Vérifier credentials --> |
  |                              |-- Créer session ---------> |
  |<-- tokens + session_id ------|                            |
```

### Connexion avec MFA
```
Client                          API                         Redis
  |                              |                            |
  |-- POST /login -------------->|                            |
  |<-- mfa_required + token -----|                            |
  |                              |                            |
  |-- POST /login/mfa ---------->|                            |
  |                              |-- Vérifier TOTP           |
  |                              |-- Créer session ---------> |
  |<-- tokens + session_id ------|                            |
```

### Refresh Token
```
Client                          API                         Redis
  |                              |                            |
  |-- POST /refresh ------------>|                            |
  |  (refresh_token)             |-- Valider session -------> |
  |                              |-- Mettre à jour token ---> |
  |<-- nouveaux tokens ----------|                            |
```
