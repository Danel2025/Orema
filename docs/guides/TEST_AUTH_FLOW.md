# Test du flux d'authentification

## Problèmes résolus

### 1. Middleware non actif

**Avant**: Le fichier `proxy.ts` n'était jamais exécuté par Next.js
**Après**: Renommé en `middleware.ts` - Next.js l'exécute maintenant automatiquement

### 2. Boucle de redirection possible

**Avant**: Redirection inconditionnelle de `/login` vers `/` pouvait créer une boucle
**Après**: Vérifie le referer pour éviter les boucles infinies

### 3. Cookies non propagés après login

**Avant**: `router.push()` + `router.refresh()` ne garantissait pas la propagation des cookies
**Après**: Utilise `window.location.href` pour forcer un rechargement complet avec cookies

### 4. Manque de logs de debug

**Avant**: Difficile de tracer les problèmes d'auth
**Après**: Logs détaillés dans le middleware (dev uniquement)

## Test manuel

### Étape 1: Vérifier que le middleware est actif

```bash
# Lancer le serveur de dev
pnpm dev

# Observer les logs - vous devriez voir:
# [Middleware] { path: '/', hasUser: false, ... }
```

### Étape 2: Test de login

1. Ouvrir http://localhost:3000/login
2. Entrer les credentials
3. Observer dans la console:
   - `[Login] Auth successful, session: ...`
   - `[Middleware] { path: '/', hasUser: true, ... }`
4. Vérifier la redirection vers `/`

### Étape 3: Test de redirection après login

1. Essayer d'accéder à `/caisse` sans être connecté
2. Devrait rediriger vers `/login?redirect=/caisse`
3. Après login, devrait rediriger vers `/caisse`

### Étape 4: Test de cookies

Ouvrir DevTools > Application > Cookies > localhost
Vérifier la présence de:

- `sb-<project>-auth-token`
- `sb-<project>-auth-token.0`
- `sb-<project>-auth-token.1` (si le token est grand)

## Logs à surveiller

### Login réussi

```
[Login] Auth successful, session: eyJhbGciOiJIUzI1NiIs...
[Middleware] { path: '/', hasUser: true, userId: 'a1b2c3d4', authError: undefined }
```

### Accès à route protégée sans auth

```
[Middleware] { path: '/caisse', hasUser: false, userId: undefined, authError: undefined }
# Redirection automatique vers /login?redirect=/caisse
```

### Tentative d'accès à /login quand déjà connecté

```
[Middleware] { path: '/login', hasUser: true, userId: 'a1b2c3d4', authError: undefined }
# Redirection automatique vers /
```

## Vérification des corrections

### ✅ Checklist

- [ ] Le middleware `middleware.ts` existe à la racine
- [ ] Les logs `[Middleware]` apparaissent dans la console
- [ ] Login redirige correctement vers `/`
- [ ] Routes protégées redirigent vers `/login` si non connecté
- [ ] Pas de boucle de redirection infinie
- [ ] Les cookies Supabase sont présents après login
- [ ] La session persiste après rafraîchissement de la page

## Problèmes potentiels restants

### Si la session ne persiste pas après refresh

Vérifier que les variables d'environnement sont correctes:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Si boucle de redirection malgré tout

Vérifier dans DevTools Network:

1. Chercher des requêtes multiples vers `/` ou `/login`
2. Vérifier les headers de redirection (301, 302, 307)
3. Vérifier que les cookies sont bien envoyés dans chaque requête

### Si le middleware ne s'exécute pas

```bash
# Vérifier que le fichier est bien reconnu
ls -la middleware.ts

# Rebuild Next.js
rm -rf .next
pnpm dev
```

## Notes techniques

### Pourquoi `window.location.href` au lieu de `router.push()`?

- `router.push()` fait une navigation côté client (SPA)
- Les cookies peuvent ne pas être immédiatement disponibles dans les Server Components
- `window.location.href` force un rechargement complet, garantissant que le middleware traite la requête avec les nouveaux cookies

### Pourquoi le délai de 100ms après login?

- Permet aux cookies d'être écrits par le browser
- Évite une race condition où la redirection se fait avant que les cookies soient stockés
- 100ms est imperceptible pour l'utilisateur mais suffisant pour le browser
