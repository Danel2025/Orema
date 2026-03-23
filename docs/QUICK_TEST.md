# 🧪 Test Rapide - Nettoyage Session Invalide

## Test 1: Script Protection Automatique

### Simulation de boucle de redirection

1. **Ouvrir l'application dans le navigateur**

   ```
   http://localhost:3000
   ```

2. **Ouvrir DevTools Console** (F12)

3. **Exécuter ce code pour simuler des redirections**

   ```javascript
   // Simuler 6 redirections rapides
   sessionStorage.setItem(
     "orema_redirect_count",
     JSON.stringify({
       count: 6,
       timestamp: Date.now(),
     })
   );

   // Recharger la page
   location.reload();
   ```

4. **Résultat Attendu**
   ```
   [Oréma] Boucle de redirection détectée, nettoyage de la session...
   → Cookie supprimé automatiquement
   → Redirection vers /login
   ```

## Test 2: Route API Clear Session

### Test avec curl

```bash
# Test GET
curl http://localhost:3000/api/clear-session

# Test POST
curl -X POST http://localhost:3000/api/clear-session
```

**Résultat Attendu**:

```json
{
  "success": true,
  "message": "Session cleared successfully"
}
```

### Test avec fetch (DevTools Console)

```javascript
// Méthode 1: GET
fetch("/api/clear-session")
  .then((r) => r.json())
  .then(console.log);

// Méthode 2: POST
fetch("/api/clear-session", { method: "POST" })
  .then((r) => r.json())
  .then(console.log);
```

## Test 3: Validation getSession()

### Créer un cookie invalide manuellement

1. **Se connecter normalement** pour obtenir un cookie valide

2. **Noter l'ID de son établissement**

   ```javascript
   // Console DevTools
   document.cookie;
   // Copier le cookie orema_session et le décoder sur jwt.io
   // Noter le etablissementId
   ```

3. **Supprimer cet établissement en base** (ATTENTION: développement uniquement!)

   ```sql
   -- Dans votre outil de DB
   DELETE FROM etablissements WHERE id = 'votre-id-ici';
   ```

4. **Rafraîchir la page**

5. **Résultat Attendu**
   - Logs serveur:
     ```
     [getSession] Session invalide: établissement xxx n'existe plus
     ```
   - Cookie automatiquement supprimé
   - Redirection vers /login (si middleware configuré)

## Test 4: Hook useClearSession

### Créer un composant de test

```tsx
"use client";

import { useClearSession } from "@/components/session-validator";

export function TestClearButton() {
  const { clearSession } = useClearSession();

  return (
    <button onClick={clearSession} className="rounded bg-red-500 px-4 py-2 text-white">
      Test Clear Session
    </button>
  );
}
```

### Ajouter temporairement dans une page

```tsx
// app/(dashboard)/page.tsx
import { TestClearButton } from "@/components/test-clear-button";

export default function DashboardPage() {
  return (
    <div>
      <TestClearButton />
      {/* ... reste du contenu */}
    </div>
  );
}
```

### Tester

1. Cliquer sur le bouton
2. Vérifier la redirection vers /login
3. Vérifier que le cookie est supprimé

## Test 5: Server Action

### Créer un formulaire de test

```tsx
import { clearSessionAction } from "@/app/actions/clear-session";

export function TestLogoutForm() {
  return (
    <form action={clearSessionAction}>
      <button type="submit" className="rounded bg-red-500 px-4 py-2 text-white">
        Test Server Action Logout
      </button>
    </form>
  );
}
```

### Tester

1. Cliquer sur le bouton
2. Vérifier la redirection automatique vers /login
3. Vérifier les logs serveur

## 🔍 Vérifications

### Vérifier que le cookie est supprimé

```javascript
// Console DevTools
document.cookie;
// Ne devrait PAS contenir 'orema_session'
```

### Vérifier les logs serveur

```bash
# Logs Next.js dev
[getSession] Session invalide: établissement ... n'existe plus
[clearSessionAction] Session cleared successfully
```

### Vérifier sessionStorage

```javascript
// Console DevTools
sessionStorage.getItem("orema_redirect_count");
// Devrait être null ou count < 5
```

## 🎯 Checklist Complète

- [ ] Test 1: Script protection (boucle redirection)
- [ ] Test 2: Route API GET
- [ ] Test 3: Route API POST
- [ ] Test 4: Validation getSession() avec DB
- [ ] Test 5: Hook useClearSession
- [ ] Test 6: Server Action clearSessionAction
- [ ] Vérification: Cookie supprimé
- [ ] Vérification: Logs présents
- [ ] Vérification: Redirection vers /login

## 🚨 Tests Destructifs (Dev Only)

### Supprimer tous les établissements

```sql
-- NE PAS FAIRE EN PRODUCTION !
DELETE FROM etablissements;
```

**Résultat**: Toutes les sessions deviennent invalides et sont nettoyées automatiquement.

### Corrompre le cookie manuellement

```javascript
// Console DevTools
document.cookie = "orema_session=invalid.jwt.token; path=/; SameSite=Lax";
location.reload();
```

**Résultat**: Token invalide → verifySession() retourne null → session cleared.

## 📊 Métriques

### Performance

```javascript
// Console DevTools - Mesurer le temps de validation
console.time("getSession");
await fetch("/api/votre-endpoint-protege");
console.timeEnd("getSession");
// Devrait être < 50ms avec la validation établissement
```

### Taille du script

```javascript
// Console DevTools
const scriptContent = document.querySelector("script").innerHTML;
const sizeKB = new Blob([scriptContent]).size / 1024;
console.log(`Script size: ${sizeKB.toFixed(2)} KB`);
// Script de protection ~ 2KB
```

## 🐛 Debugging

### Activer les logs détaillés

```javascript
// Console DevTools
localStorage.setItem("debug", "orema:*");
location.reload();
```

### Forcer un nettoyage manuel

```javascript
// Console DevTools - Force cleanup
document.cookie = "orema_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
await fetch("/api/clear-session", { method: "POST" });
location.href = "/login";
```

## ✅ Succès

Si tous les tests passent:

- ✅ Les cookies invalides sont détectés et nettoyés
- ✅ Les boucles de redirection sont évitées
- ✅ Les utilisateurs sont redirigés proprement vers /login
- ✅ Aucune erreur côté serveur ou client
- ✅ Performance non impactée

**Statut**: 🎉 Prêt pour production
