# Architecture Realtime - Oréma N+

> Documentation de l'architecture temps réel avec Supabase Realtime.

## Vue d'ensemble

L'application utilise Supabase Realtime pour les fonctionnalités de temps réel :

1. **Presence** - Suivi des utilisateurs connectés
2. **Broadcast** - Diffusion d'événements entre clients
3. **Database Changes** - Synchronisation des modifications de données (optionnel)

## Fonctionnalités implémentées

### 1. Présence en ligne

Permet de voir en temps réel quels utilisateurs sont connectés à l'application.

**Fichiers :**

- `lib/realtime/types.ts` - Types TypeScript
- `lib/realtime/presence.ts` - Classe PresenceManager
- `lib/realtime/hooks.ts` - Hooks React
- `stores/presence-store.ts` - Store Zustand

**Données trackées :**

```typescript
interface UserPresenceState {
  userId: string;
  nom: string;
  prenom: string;
  role: Role;
  etablissementId: string;
  onlineAt: string;
  currentPage?: string; // Page actuelle
  sessionCaisseId?: string; // Session de caisse active
  status?: "actif" | "absent" | "occupé" | "en_pause";
}
```

**Utilisation :**

```tsx
import { usePresence, useOnlineUsers } from "@/lib/realtime";

// Hook complet avec callbacks
function Dashboard() {
  const { onlineUsers, broadcast, updateStatus } = usePresence({
    onUserJoin: (user) => toast.success(`${user.prenom} est connecté`),
    onUserLeave: (user) => toast.info(`${user.prenom} s'est déconnecté`),
    currentPage: "/dashboard",
  });

  return <div>{onlineUsers.length} utilisateurs en ligne</div>;
}

// Hook simplifié (lecture seule)
function StatusBar() {
  const { users, count } = useOnlineUsers();
  return <Badge>{count} en ligne</Badge>;
}
```

### 2. Événements Broadcast

Permet d'envoyer des événements à tous les clients connectés du même établissement.

**Types d'événements :**

| Événement                 | Description                      | Destinataires |
| ------------------------- | -------------------------------- | ------------- |
| `table:status_change`     | Changement de statut d'une table | Salle, Caisse |
| `commande:nouvelle`       | Nouvelle commande passée         | Cuisine, Bar  |
| `commande:status_change`  | Statut de préparation modifié    | Salle, Caisse |
| `alerte:stock_bas`        | Stock en dessous du minimum      | Manager       |
| `alerte:demande_addition` | Client demande l'addition        | Serveurs      |
| `session:ouverture`       | Ouverture de session caisse      | Manager       |
| `session:fermeture`       | Fermeture de session caisse      | Manager       |
| `notification:generale`   | Notification personnalisée       | Configurable  |

**Exemple d'envoi :**

```tsx
const { broadcast } = usePresence();

// Notifier une nouvelle commande
await broadcast({
  type: "commande:nouvelle",
  data: {
    venteId: "xxx",
    numeroTicket: "20250128001",
    typeVente: "TABLE",
    tableNumero: "T5",
    lignes: [
      { produitNom: "Poulet DG", quantite: 2, destination: "cuisine" },
      { produitNom: "Coca-Cola", quantite: 2, destination: "bar" },
    ],
    timestamp: new Date().toISOString(),
  },
});
```

**Réception :**

```tsx
useCuisineEvents({
  onNouvelleCommande: (data) => {
    // Afficher la commande sur l'écran cuisine
    addToQueue(data);
    playNotificationSound();
  },
  onCommandeStatusChange: (data) => {
    updateOrderStatus(data);
  },
});
```

## Canaux Realtime

Chaque établissement a ses propres canaux isolés :

```typescript
const REALTIME_CHANNELS = {
  presence: (etablissementId) => `presence:${etablissementId}`,
  cuisine: (etablissementId) => `cuisine:${etablissementId}`,
  bar: (etablissementId) => `bar:${etablissementId}`,
  salle: (etablissementId) => `salle:${etablissementId}`,
  alertes: (etablissementId) => `alertes:${etablissementId}`,
  notifications: (etablissementId) => `notifications:${etablissementId}`,
};
```

## Composants UI

### OnlineUsers

Composant pour afficher les utilisateurs en ligne.

```tsx
import { OnlineUsers } from '@/components/shared/online-users';

// Version compacte (pour header)
<OnlineUsers compact />

// Version carte (pour dashboard)
<OnlineUsers />
```

## Bonnes pratiques

### Performance

1. **Limiter les mises à jour** - Ne pas tracker trop fréquemment
2. **Débrancher proprement** - Appeler `leave()` au démontage
3. **Utiliser le store** - Éviter les re-renders inutiles

### Sécurité

1. Les canaux sont isolés par établissement
2. L'authentification Supabase est requise pour rejoindre
3. Ne pas transmettre de données sensibles via broadcast

## Configuration Supabase

### Dashboard Supabase

1. Aller dans **Settings > API**
2. S'assurer que Realtime est activé
3. Configurer les policies RLS si nécessaire

### Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

## Limitations

- **Présence** : ~200 utilisateurs simultanés par canal (suffisant pour un établissement)
- **Broadcast** : Pas de persistance (messages perdus si hors ligne)
- **Latence** : ~100-500ms selon la connexion

## Évolutions futures

1. **Database Changes** - Synchronisation automatique des modifications
2. **Cursor Tracking** - Suivi de la position du curseur (collaboration)
3. **Notifications push** - Via Edge Functions + Web Push API
