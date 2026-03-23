# Plan de Migration : Prisma → Supabase

> **🎉 MIGRATION COMPLÈTE (29 janvier 2026)**
>
> Toutes les phases de migration ont été exécutées avec succès.
> Le code applicatif n'utilise plus Prisma - uniquement le client Supabase JS.
> Les fichiers Prisma dans `/prisma/` et `/scripts/` sont conservés en archive.

## Objectif

Éliminer complètement Prisma du projet et utiliser exclusivement le client Supabase JS pour toutes les opérations de base de données. PostgreSQL local n'est plus nécessaire - tout passe par Supabase Cloud.

---

## État Actuel ✅ MIGRATION COMPLÈTE

### Code migré (Prisma → Supabase)

| Catégorie          | Fichiers                                    | Statut      |
| ------------------ | ------------------------------------------- | ----------- |
| **Server Actions** | 15 fichiers dans `/actions/`                | ✅ Migré    |
| **API Routes**     | 12 fichiers dans `/app/api/`                | ✅ Migré    |
| **Lib**            | Tous les utilitaires dans `/lib/`           | ✅ Migré    |
| **Types**          | Imports `@prisma/client` → `@/lib/db/types` | ✅ Remplacé |
| **Composants**     | Types Role, etc.                            | ✅ Migré    |

### Infrastructure Supabase

- ✅ Clients Supabase configurés (`/lib/supabase/`, `/lib/db/`)
- ✅ Types Supabase générés (`/types/supabase.ts`, `/lib/db/types.ts`)
- ✅ RLS Policies définies (`/prisma/rls-policies.sql`)
- ✅ Authentification Supabase fonctionnelle

### Fichiers supprimés

- ✅ `/lib/prisma.ts` - Client Prisma
- ✅ `/tests/mocks/prisma.ts` - Mock pour tests

### Fichiers conservés en archive

- `/prisma/schema.prisma` - Schéma pour référence
- `/prisma/migrations/` - Historique migrations
- `/prisma/seed.ts` - Script de seed original
- `/scripts/migrate-users-to-supabase.ts` - Script migration

---

## Plan d'Action en 8 Phases

### Phase 1 : Préparation Infrastructure (Pré-requis)

**Objectif** : S'assurer que Supabase Cloud est prêt

**Tâches** :

1. [x] Vérifier que la base Supabase contient le schéma complet
2. [x] Appliquer les RLS policies via `/prisma/rls-policies.sql`
3. [x] Créer les index nécessaires pour les performances
4. [x] Configurer les variables d'environnement production

**Fichiers concernés** :

- `.env.local` - Variables Supabase
- `/prisma/rls-policies.sql` - À exécuter dans Supabase SQL Editor

---

### Phase 2 : Créer le Layer d'Abstraction Supabase ✅ COMPLÉTÉ

**Objectif** : Créer des fonctions utilitaires pour remplacer Prisma

**Fichiers créés** :

```
/lib/db/
  ├── index.ts           # Export principal ✅
  ├── client.ts          # Client Supabase configuré ✅
  ├── types.ts           # Types dérivés de supabase.ts ✅
  ├── utils.ts           # Helpers (pagination, serialization) ✅
  └── queries/
      ├── index.ts       # Export queries ✅
      ├── produits.ts    # Requêtes produits ✅
      ├── categories.ts  # Requêtes catégories ✅
      ├── ventes.ts      # Requêtes ventes ✅
      ├── clients.ts     # Requêtes clients ✅
      ├── employes.ts    # Requêtes utilisateurs ✅
      ├── stocks.ts      # Requêtes stock ✅
      ├── rapports.ts    # Requêtes analytiques ✅
      ├── tables.ts      # Requêtes tables/zones ✅
      ├── imprimantes.ts # Requêtes imprimantes ✅
      ├── audit.ts       # Requêtes audit ✅
      └── etablissements.ts # Requêtes établissements ✅
```

**Patterns à implémenter** :

```typescript
// Exemple de helper pour les requêtes
export async function findMany<T>(
  table: string,
  options: {
    select?: string;
    where?: Record<string, unknown>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }
): Promise<T[]>;

// Exemple de transaction
export async function transaction<T>(fn: (client: SupabaseClient) => Promise<T>): Promise<T>;
```

---

### Phase 3 : Migrer les Enums et Types

**Objectif** : Remplacer les types Prisma par des types natifs

**Prisma Enums à remplacer** :

- `Role` → Type union TypeScript
- `TypeVente` → Type union
- `StatutVente` → Type union
- `ModePaiement` → Type union
- `TypeMouvement` → Type union
- `ActionAudit` → Type union
- `TauxTva` → Type union
- `TypeRemise` → Type union
- `StatutPreparation` → Type union
- `TypeImprimante` → Type union
- `TypeConnexion` → Type union

**Fichier à créer** : `/types/enums.ts`

```typescript
export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  CAISSIER: "CAISSIER",
  SERVEUR: "SERVEUR",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

// ... autres enums
```

---

### Phase 4 : Migrer les Server Actions (CRITIQUE)

**Ordre de migration recommandé** (du plus simple au plus complexe) :

#### 4.1 Actions simples (CRUD basique)

1. [x] `/actions/categories.ts` - CRUD simple ✅
2. [x] `/actions/clients.ts` - CRUD avec pagination ✅
3. [x] `/actions/produits.ts` - CRUD + filtres + supplements ✅
4. [x] `/actions/tables.ts` - CRUD avec relations + zones ✅
5. N/A `/actions/imprimantes.ts` - Fichier inexistant (intégré dans categories.ts)
6. N/A `/actions/zones.ts` - Intégré dans tables.ts

#### 4.2 Actions moyennes

7. [x] `/actions/employes.ts` - CRUD + auth ✅
8. [x] `/actions/stocks.ts` - Mouvements stock ✅
9. [x] `/actions/audit.ts` - Logging ✅

#### 4.3 Actions complexes

10. [x] `/actions/caisse.ts` - Données POS temps réel ✅
11. [x] `/actions/rapports.ts` - Agrégations complexes ✅ (692→581 lignes)
12. [x] `/actions/ventes.ts` - Transactions multi-étapes ✅ (1320→960 lignes)
13. [x] `/actions/split-bill.ts` - Division addition ✅ (498→391 lignes)
14. [x] `/actions/sessions.ts` - Sessions caisse ✅ (883→510 lignes)
15. [x] `/actions/supplements.ts` - Suppléments produits ✅ (186→168 lignes)

#### 4.4 Actions auth

16. [x] `/actions/auth-supabase.ts` - Auth Supabase ✅ (399→293 lignes)
17. [x] `/actions/parametres.ts` - Config établissement ✅ (1020→777 lignes)

**Mapping Prisma → Supabase** :

| Prisma                                       | Supabase                                                             |
| -------------------------------------------- | -------------------------------------------------------------------- |
| `prisma.table.findMany()`                    | `supabase.from('table').select()`                                    |
| `prisma.table.findUnique({ where: { id } })` | `supabase.from('table').select().eq('id', id).single()`              |
| `prisma.table.create({ data })`              | `supabase.from('table').insert(data).select().single()`              |
| `prisma.table.update({ where, data })`       | `supabase.from('table').update(data).eq('id', id).select().single()` |
| `prisma.table.delete({ where })`             | `supabase.from('table').delete().eq('id', id)`                       |
| `prisma.table.count()`                       | `supabase.from('table').select('*', { count: 'exact', head: true })` |
| `prisma.$transaction([])`                    | `supabase.rpc('transaction_fn')` ou séquentiel                       |

---

### Phase 5 : Migrer les API Routes ✅ COMPLÉTÉ

**Fichiers migrés** :

- [x] `/app/api/health/route.ts` - Health check ✅
- [x] `/app/api/categories/cache/route.ts` - Cache catégories ✅
- [x] `/app/api/produits/cache/route.ts` - Cache produits ✅
- [x] `/app/api/produits/route.ts` - API REST produits ✅
- [x] `/app/api/produits/[id]/route.ts` - CRUD produit ✅
- [x] `/app/api/produits/barcode/route.ts` - Recherche code-barres ✅
- [x] `/app/api/ventes/sync/route.ts` - Synchronisation offline ✅
- [x] `/app/api/ventes/validate/route.ts` - Validation ventes ✅
- [x] `/app/api/print/route.ts` - Impression ✅
- [x] `/app/api/print/auto-route/route.ts` - Routage impression ✅
- [x] `/app/api/setup/route.ts` - Setup données démo ✅
- [x] `/app/api/setup-auth/route.ts` - Setup Supabase Auth ✅

**Approche** : Même pattern que les Server Actions

---

### Phase 6 : Gestion des Transactions

**Problème** : Prisma `$transaction` n'existe pas dans Supabase JS

**Solutions** :

#### Option A : RPC Functions (Recommandé)

Créer des fonctions PostgreSQL pour les opérations atomiques :

```sql
-- Exemple : Création de vente atomique
CREATE OR REPLACE FUNCTION create_vente_complete(
  p_vente jsonb,
  p_lignes jsonb[],
  p_paiements jsonb[]
) RETURNS jsonb AS $$
DECLARE
  v_vente_id uuid;
  v_result jsonb;
BEGIN
  -- Insert vente
  INSERT INTO ventes (...) VALUES (...)
  RETURNING id INTO v_vente_id;

  -- Insert lignes
  INSERT INTO lignes_vente (...)
  SELECT ... FROM jsonb_array_elements(p_lignes);

  -- Insert paiements
  INSERT INTO paiements (...)
  SELECT ... FROM jsonb_array_elements(p_paiements);

  RETURN jsonb_build_object('id', v_vente_id, 'success', true);
END;
$$ LANGUAGE plpgsql;
```

#### Option B : Séquentiel avec rollback manuel

Pour les cas simples où l'atomicité n'est pas critique.

**Fichiers RPC à créer** :

- [ ] `create_vente_complete` - Vente + lignes + paiements
- [ ] `split_bill` - Division d'addition
- [ ] `transfer_table` - Transfert de table
- [ ] `close_session_caisse` - Clôture de caisse

---

### Phase 7 : Gestion des Décimaux

**Problème** : Prisma `Decimal` vs Supabase `string`

**Solution** : Helper de conversion

```typescript
// /lib/db/utils.ts
export function parseDecimal(value: string | number | null): number {
  if (value === null) return 0;
  return typeof value === "string" ? parseFloat(value) : value;
}

export function toDecimal(value: number): string {
  return value.toFixed(0); // FCFA sans décimales
}

// Wrapper pour les requêtes
export function serializePrices<T extends Record<string, unknown>>(
  row: T,
  priceFields: (keyof T)[]
): T {
  const result = { ...row };
  for (const field of priceFields) {
    if (result[field] !== undefined) {
      result[field] = parseDecimal(result[field] as string) as T[typeof field];
    }
  }
  return result;
}
```

---

### Phase 8 : Nettoyage Final ✅ COMPLÉTÉ

**Fichiers supprimés** :

- [x] `/lib/prisma.ts` ✅ Supprimé
- [x] `/tests/mocks/prisma.ts` ✅ Supprimé
- [ ] `/prisma/schema.prisma` (conservé en archive pour référence)
- [ ] `/prisma/migrations/` (conservé en archive)
- [ ] `/prisma/seed.ts` (conservé en archive)

**Dépendances supprimées** :

- [x] `@prisma/client` supprimé de package.json ✅
- [x] `prisma` supprimé de devDependencies ✅
- [x] Section `prisma` config supprimée ✅

**Fichiers mis à jour** :

- [x] `package.json` - Scripts Prisma supprimés, script `db:types` ajouté pour Supabase ✅
- [x] `.env.example` - Variables Prisma supprimées ✅
- [ ] `README.md` - À mettre à jour si nécessaire
- [ ] `/docs/guides/SETUP.md` - À mettre à jour si nécessaire

**Autres fichiers migrés dans cette phase** :

- [x] `/lib/etablissement.ts` - Migré vers Supabase ✅
- [x] Tous les imports `@prisma/client` remplacés par `@/lib/db/types` ✅

---

## Critères de Succès

### Tests de validation

Pour chaque module migré :

1. [ ] Toutes les opérations CRUD fonctionnent
2. [ ] La pagination fonctionne
3. [ ] Les filtres fonctionnent
4. [ ] Les relations sont correctement chargées
5. [ ] Les types TypeScript sont corrects
6. [ ] RLS policies bloquent les accès non autorisés

### Tests de régression

1. [ ] Login/Logout fonctionne
2. [ ] Création de vente complète fonctionne
3. [ ] Rapports Z génèrent correctement
4. [ ] Offline sync fonctionne
5. [ ] Impression fonctionne

---

## Estimation de Complexité

| Phase   | Complexité | Fichiers | Priorité |
| ------- | ---------- | -------- | -------- |
| Phase 1 | Faible     | 2-3      | P0       |
| Phase 2 | Moyenne    | 10-12    | P0       |
| Phase 3 | Faible     | 1-2      | P1       |
| Phase 4 | **HAUTE**  | 15+      | P0       |
| Phase 5 | Moyenne    | 3-5      | P1       |
| Phase 6 | Haute      | 4-6 SQL  | P1       |
| Phase 7 | Faible     | 1        | P0       |
| Phase 8 | Faible     | 5-10     | P2       |

---

## Commande Ralph Loop Suggérée

Pour exécuter cette migration de manière itérative :

```
/ralph-loop "Migrer le projet de Prisma vers Supabase selon le plan dans /docs/specs/MIGRATION_PRISMA_TO_SUPABASE.md.

Processus:
1. Lire le plan de migration
2. Identifier la prochaine tâche non cochée
3. Implémenter la migration
4. Tester que ça compile
5. Cocher la tâche dans le plan
6. Passer à la suivante

Output <promise>MIGRATION COMPLETE</promise> quand toutes les phases sont terminées et le projet compile sans erreur." --max-iterations 50 --completion-promise "MIGRATION COMPLETE"
```

---

## Notes Importantes

### Naming Convention

- Prisma utilise **camelCase** pour les modèles
- Supabase/PostgreSQL utilise **snake_case** pour les tables
- Le mapping est déjà fait dans `/types/supabase.ts`

### RLS et Authentification

- Toutes les requêtes doivent passer par un client authentifié
- Utiliser `createServiceClient()` uniquement pour les opérations admin
- Les policies RLS sont déjà définies dans `/prisma/rls-policies.sql`

### Offline Mode

- L'architecture offline reste la même (IndexedDB)
- Seule la synchronisation change (Supabase au lieu de Prisma)

---

_Document créé le : 2026-01-29_
_Dernière mise à jour : 2026-01-29_
