# Gestion des Sessions Corrompues

## Problème

Un cookie `orema_session` peut contenir un JWT avec un `etablissementId` qui n'existe plus en base de données, causant des boucles de redirection infinies.

## Solution Multi-Couches

### 1. Validation automatique dans `getSession()`

La fonction `getSession()` vérifie maintenant automatiquement que l'établissement existe toujours :

```typescript
// lib/auth/session.ts
export async function getSession(): Promise<SessionPayload | null> {
  // ... récupération du token ...

  // Validation que l'établissement existe
  const etablissement = await prisma.etablissement.findUnique({
    where: { id: session.etablissementId },
  });

  if (!etablissement) {
    await deleteSessionCookie(); // Nettoyage automatique
    return null;
  }

  return session;
}
```

**Avantages** :

- ✅ Détection automatique côté serveur
- ✅ Nettoyage immédiat du cookie invalide
- ✅ Pas besoin d'intervention manuelle

### 2. Route API `/api/clear-session`

Endpoint pour nettoyer explicitement la session :

```bash
# GET ou POST
curl -X POST http://localhost:3000/api/clear-session
```

**Utilisation depuis le client** :

```typescript
// Nettoyage explicite
await fetch("/api/clear-session", { method: "POST" });
```

### 3. Protection contre les boucles de redirection

Script injecté dans le layout racine qui détecte les boucles :

```javascript
// app/layout.tsx - <head>
// Détecte plus de 5 redirections en 5 secondes
// → Supprime le cookie automatiquement
// → Redirige vers /login
```

**Comment ça marche** :

- Compte les redirections avec `sessionStorage`
- Si > 5 redirections en 5 secondes → nettoyage
- Appelle `/api/clear-session` puis redirige vers `/login`

### 4. Composant React `<SessionValidator>`

Composant client-side pour surveiller les erreurs :

```tsx
// app/layout.tsx ou app/(dashboard)/layout.tsx
import { SessionValidator } from "@/components/session-validator";

export default function Layout({ children }) {
  return (
    <>
      <SessionValidator />
      {children}
    </>
  );
}
```

**Fonctionnalités** :

- Écoute les erreurs de navigation
- Nettoie la session après 3 erreurs consécutives
- Reset automatique après 10 secondes sans erreur

### 5. Hook `useClearSession`

Hook pour nettoyer manuellement la session :

```tsx
"use client";

import { useClearSession } from "@/components/session-validator";

export function LogoutButton() {
  const { clearSession } = useClearSession();

  return <button onClick={clearSession}>Déconnexion</button>;
}
```

### 6. Server Action `clearSessionAction`

Pour nettoyage côté serveur avec redirection :

```tsx
import { clearSessionAction } from "@/app/actions/clear-session";

export function LogoutForm() {
  return (
    <form action={clearSessionAction}>
      <button type="submit">Déconnexion</button>
    </form>
  );
}
```

## Méthodes de Nettoyage (par ordre de priorité)

### 1. Automatique (recommandé)

La fonction `getSession()` détecte et nettoie automatiquement les sessions invalides.

### 2. Script de protection (layout)

Le script dans `<head>` détecte les boucles de redirection et nettoie automatiquement.

### 3. Route API

```bash
curl -X POST http://localhost:3000/api/clear-session
```

### 4. Server Action

```typescript
import { clearSessionAction } from "@/app/actions/clear-session";
await clearSessionAction();
```

### 5. Client-side (fallback)

```javascript
document.cookie = "orema_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
window.location.href = "/login";
```

## Cas d'Usage

### Développement : Établissement supprimé

1. Un développeur supprime un établissement en base
2. Le cookie contient toujours cet `etablissementId`
3. **Solution automatique** : `getSession()` détecte l'incohérence et nettoie

### Production : Boucle de redirection

1. Utilisateur a un cookie corrompu
2. Chaque requête redirige vers login
3. **Solution automatique** : Script dans `<head>` détecte la boucle et nettoie

### Déconnexion manuelle

```tsx
// Option 1 : Server Action (recommandé)
<form action={clearSessionAction}>
  <button>Logout</button>
</form>

// Option 2 : Hook React
const { clearSession } = useClearSession()
<button onClick={clearSession}>Logout</button>

// Option 3 : Fetch API
<button onClick={() => fetch('/api/clear-session', { method: 'POST' })}>
  Logout
</button>
```

## Tests

### Tester la validation automatique

1. Créer une session valide (se connecter)
2. Supprimer l'établissement en base : `DELETE FROM etablissements WHERE id = '...'`
3. Rafraîchir la page
4. ✅ La session devrait être automatiquement nettoyée

### Tester la détection de boucle

1. Modifier manuellement le cookie avec un ID invalide
2. Naviguer entre les pages rapidement
3. Après 5 redirections, le nettoyage automatique devrait se déclencher

## Logs

Tous les nettoyages sont loggés :

```typescript
// Console serveur
[getSession] Session invalide: établissement abc-123 n'existe plus
[clearSessionAction] Session cleared successfully

// Console navigateur
[Oréma] Boucle de redirection détectée, nettoyage de la session...
[SessionValidator] Trop d'erreurs, nettoyage de la session
```

## Sécurité

- ✅ Cookie `httpOnly` : non accessible depuis JavaScript malveillant
- ✅ Cookie `secure` : HTTPS only en production
- ✅ Cookie `sameSite: lax` : protection CSRF
- ✅ Validation côté serveur : `getSession()` vérifie l'établissement
- ✅ Pas de données sensibles exposées dans les logs

## Performance

- **Validation** : +1 requête SQL par appel à `getSession()` (négligeable avec cache DB)
- **Script protection** : ~2KB inliné, exécution < 1ms
- **SessionValidator** : Écoute passive, zéro impact
