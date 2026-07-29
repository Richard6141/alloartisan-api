# 2FA admin par code email + appareil de confiance

Date : 2026-07-29
Statut : validé (direction)
Portée : cross-repo `alloartisan-api` (moteur auth) + `alloartisan-admin` (front : `x-device-id` + étape code)

## 1. Objectif

Renforcer la connexion des comptes **ADMIN** : à la connexion depuis un **nouvel appareil OU une nouvelle IP**, exiger un **code à 6 chiffres envoyé par email** avant de délivrer les tokens. Une fois validé, l'appareil est **mémorisé 30 jours** (pas de nouveau code sur cet appareil+IP pendant ce délai). Le TOTP existant (authenticator) reste inchangé.

**Décisions validées** : déclencheur = **nouvel appareil OU nouvelle IP** ; confiance = **30 jours** ; périmètre = **admins uniquement** (clients/artisans mobile inchangés).

## 2. Modèle mental & interaction avec le TOTP existant

Aujourd'hui : si `user.mfaEnabled` (TOTP configuré), le login renvoie `mfa_required` → code TOTP. Sinon, tokens directs.

Nouveau, pour les **admins** :
- **Admin avec TOTP** (`mfaEnabled`) → flux **inchangé** (TOTP à chaque login). Déjà un 2e facteur fort.
- **Admin sans TOTP** → sur **nouvel appareil OU nouvelle IP** → **code email** (nouveau). Sur appareil+IP de confiance non expiré → mot de passe seul.

Résultat : **chaque admin dispose d'un 2e facteur** (TOTP s'il l'a configuré, sinon email sur nouvel appareil/IP). Les non-admins ne sont pas affectés.

## 3. Données (Prisma)

Nouvelle table **`TrustedDevice`** :
- `id` (uuid), `userId` (FK User, onDelete Cascade, indexé), `deviceId String` (l'identifiant `x-device-id` du navigateur), `ipAddress String?`, `userAgent String?`, `deviceLabel String?` (ex. « Windows PC · Chrome »), `trustedUntil DateTime`, `lastSeenAt DateTime`, `createdAt`.
- Unicité `@@unique([userId, deviceId])`. `@@map("trusted_devices")`.

Un appareil est **de confiance** pour un login si : une ligne `(userId, deviceId)` existe, `trustedUntil > now()`, **et** `ipAddress == IP courante` (règle « nouvelle IP »). Sinon → code email requis.

`OtpType` : ajouter la valeur **`LOGIN_VERIFY`** (codes email de connexion), distincte de PASSWORD_RESET/EMAIL_VERIFY.

## 4. Flux d'authentification (backend `alloartisan-api`)

Le contrôleur extrait déjà `ipAddress`, `userAgent`, `deviceId` (header `x-device-id`). Le front web enverra désormais ce header.

**`POST /auth/login`** (après vérif mot de passe, dans `auth.service.login`) :
1. Si `mfaEnabled` → comportement actuel (`mfa_required` TOTP). **Stop.**
2. Sinon si `user.role === 'ADMIN'` :
   - Résoudre l'appareil de confiance : `td = TrustedDevice.findUnique({ userId, deviceId })` (si `deviceId` fourni).
   - **Confiance** = `td && td.trustedUntil > now && td.ipAddress === ip`.
   - Si **NON de confiance** (nouvel appareil, expiré, IP différente, ou pas de `deviceId`) :
     - Créer un OTP `LOGIN_VERIFY` pour l'utilisateur (`otpService.create`), l'envoyer par email (`emailService.sendLoginCodeEmail(email, code)`).
     - Émettre un `verify_token` = JWT court (**10 min**) signé, payload `{ sub: userId, deviceId, purpose: 'login_verify' }`.
     - Journaliser (`LOGIN_VERIFY_SENT`, raison : new_device | new_ip).
     - Renvoyer `{ verification_required: true, verify_token, email_masked }` (`email_masked` = `j***@domaine.com`). **Ne pas** délivrer de tokens.
   - Si **de confiance** : rafraîchir `lastSeenAt` et délivrer les tokens (flux normal).
3. Sinon (non-admin) → flux actuel inchangé.

**`POST /auth/login/verify`** (nouveau) — body `{ verify_token, code }`, header `x-device-id` :
1. Vérifier `verify_token` (JWT valide, non expiré, `purpose==='login_verify'`) → `userId`, `deviceId` (doit == `x-device-id` reçu).
2. `otpService.verify(userId, LOGIN_VERIFY, code)` — via `MfaAttemptService`/compteur : après **5 échecs**, invalider le `verify_token`/verrouiller la tentative (429/401 clair).
3. Succès → **upsert `TrustedDevice`** `(userId, deviceId)` : `ipAddress=ip`, `userAgent`, `deviceLabel`, `trustedUntil = now + 30j`, `lastSeenAt=now`.
4. Envoyer un **email d'alerte « nouvelle connexion »** (appareil/IP/date) à l'utilisateur (fire-and-forget).
5. Journaliser (`LOGIN_VERIFY_OK`, appareil, ip) puis délivrer les tokens (`createSession`).

**Resend** : `POST /auth/login/verify/resend { verify_token }` → régénère un OTP + renvoie l'email, **rate-limité** (throttle + max N/heure).

## 5. Front (`alloartisan-admin`)

- **Device id persistant** : à l'initialisation, générer un UUID s'il n'existe pas, le stocker en `localStorage` (`aa_admin_device_id`), et l'envoyer sur **toutes** les requêtes via l'intercepteur axios en header `x-device-id` (au minimum sur `/auth/login`, `/auth/login/verify`, `/auth/login/mfa`).
- **`useAuth`** : `login()` gère désormais 3 issues : tokens directs | `mfaRequired` (TOTP, existant) | **`verificationRequired`** (email) → expose `verifyToken` + `emailMasked`. Nouvelle méthode `verifyLoginCode(verifyToken, code)` → `POST /auth/login/verify` → set tokens + `loadMe`. Méthode `resendLoginCode(verifyToken)`.
- **Login page** (`login/page.tsx`) : nouvel état « code email » (réutilise l'étape code stylée par le chantier UI) — message « Un code a été envoyé à `email_masked` », champ 6 chiffres, bouton **Vérifier**, lien **Renvoyer le code** (avec cooldown). Distinct visuellement/textuellement de l'étape TOTP.
- Ne pas exposer si l'email existe (messages neutres), ne pas logger le code côté client.

## 6. Sécurité (mesures)

- **Code** : 6 chiffres, **expiration 10 min**, **haché en base** (via `OtpService` existant), à usage unique, invalidé après succès.
- **Tentatives** : max **5** échecs de code par `verify_token` (via `MfaAttemptService`) → verrouillage temporaire, message clair.
- **Throttle** : login + `verify` + `resend` rate-limités (guards throttler existants) contre le brute-force et le spam d'emails.
- **`verify_token`** : JWT court (10 min), lié à `userId`+`deviceId`+`purpose` → **non rejouable** pour un autre appareil ; le `x-device-id` du `verify` doit correspondre à celui du `verify_token`.
- **Alerte connexion** : email « nouvelle connexion depuis <appareil> · <ip> · <date> » à chaque validation nouvel appareil (traçabilité utilisateur).
- **Audit** : `LOGIN_VERIFY_SENT` / `LOGIN_VERIFY_OK` / `LOGIN_VERIFY_FAILED` dans `LogActivite`.
- **Anti-lockout / break-glass** : Resend fiable (déjà en prod pour reset/vérif). Si email indisponible, secours = insertion manuelle d'une ligne `TrustedDevice` en base pour un super-admin (documenté). La révocation d'un appareil (suppression de ligne) forcera un nouveau code.
- **Confidentialité** : `email_masked` seulement ; jamais l'email complet ni le code dans les réponses/logs.

## 7. Invariants & hors-périmètre

- **Non-admins inchangés** : le flux client/artisan (mobile) n'est pas modifié.
- **TOTP inchangé** : les admins avec `mfaEnabled` gardent le flux TOTP actuel.
- **Pas de régression** : un admin sur appareil+IP de confiance se connecte au mot de passe (aucune friction ajoutée).
- **Migration** : ajout table `TrustedDevice` (+ valeur enum OtpType) — additif, sans donnée à backfiller ; aucun admin existant n'est verrouillé (première connexion post-déploiement depuis un appareil = un code email, normal).
- **Hors-périmètre** : géolocalisation IP fine (on se limite à « IP différente de la dernière connue de cet appareil »), gestion self-service des appareils de confiance par l'admin (liste/révocation UI) — évolution possible ultérieure ; SMS.

## 8. Critères de succès

- Admin sans TOTP, nouvel appareil → reçoit un code email, le saisit, se connecte ; l'appareil devient de confiance 30 j (pas de code au login suivant, même appareil+IP).
- Même admin, IP différente → nouveau code exigé.
- Admin avec TOTP → flux TOTP inchangé.
- Non-admin → aucun changement.
- 5 mauvais codes → verrouillage ; renvoi de code rate-limité ; emails d'alerte reçus ; audit tracé.
- `tsc` + build API verts, migration `deploy` OK, app boote, health 200 ; `tsc`+build admin verts.

## 9. Risques

- **Délivrabilité email** (Resend) : gate de connexion → si l'email n'arrive pas, l'admin ne peut pas entrer. Mitigation : Resend déjà en prod (reset/vérif fonctionnent), bouton renvoyer, break-glass base.
- **IP dynamique** (FAI mobile) : « nouvelle IP » peut redemander un code plus souvent ; accepté (choix « nouvel appareil OU nouvelle IP »). Évolution possible : tolérance par sous-réseau.
- **Ordre de déploiement** : back (endpoints `/auth/login/verify`) avant/avec le front qui envoie `x-device-id` et gère l'étape ; back rétro-compatible (si pas de `x-device-id`, un admin est traité « nouvel appareil » → code email, comportement sûr).
