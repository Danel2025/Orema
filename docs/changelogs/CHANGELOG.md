# Changelog - Oréma N+ POS

Toutes les modifications notables du projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [0.1.0] - 2026-01-26

### 🎉 Version Initiale

Premier release du projet Oréma N+ POS avec les corrections d'intégration appliquées.

### ✅ Ajouté

#### Architecture & Structure

- **Structure de routing Next.js 16** avec route groups
  - `(auth)` pour les pages publiques (login)
  - `(dashboard)` pour les pages protégées
- **Middleware de protection** des routes dashboard
- **TypedRoutes** activé pour le type-checking des liens

#### Configuration TanStack Query

- **Pattern SSR recommandé** avec `isServer`
- **Fichier `lib/query-client.ts`** pour réutilisation
- **Support du streaming** Next.js avec pending queries
- **Déshydratation optimisée** des queries

#### Schéma Prisma

- **Migration vers UUID natifs** PostgreSQL (`gen_random_uuid()`)
- **Nouveau modèle `AuditLog`** pour la traçabilité
- **Nouveaux enums**:
  - `TauxTva` (STANDARD, REDUIT, EXONERE)
  - `StatutTable` (LIBRE, OCCUPEE, EN_PREPARATION, ADDITION, A_NETTOYER)
  - `ActionAudit` (CREATE, UPDATE, DELETE, etc.)
- **Champ `codeBarre`** sur Produit
- **Relations `onDelete`** configurées (Cascade, Restrict, SetNull)
- **Indexes de performance** ajoutés
- **Extensions PostgreSQL** (pgcrypto, uuid_ossp)

#### Utilitaires

- **Nouvelles fonctions TVA** dans `lib/utils.ts`:
  - `getTvaRate()`, `getTvaLabel()`
  - `calculerTVA()`, `calculerTTC()`, `calculerHT()`
  - `calculerLigneVente()`
- **Constante `TVA_RATES`** pour les taux gabonais

#### Documentation

- **`SETUP.md`** - Guide de configuration complet
- **`QUICKSTART.md`** - Démarrage rapide en 5 étapes
- **`CORRECTIONS_APPLIED.md`** - Résumé détaillé des corrections
- **`CHANGELOG.md`** - Ce fichier
- **`.env.example`** amélioré avec documentation complète

#### Scripts

- **`scripts/check-setup.js`** - Vérification automatique de l'environnement
- **`pnpm check`** - Commande pour exécuter la vérification

#### Composants UI

- **Radix UI Themes 3.2.1** intégré
- **Tailwind CSS 4.x** configuré
- **Theme Provider** avec accent orange et gray slate
- **Sonner** pour les toasts

### 🔧 Modifié

#### Providers

- **`app/providers.tsx`** refactorisé avec pattern SSR
  - Suppression de `useState`
  - Utilisation de `getQueryClient()` depuis `lib/query-client.ts`

#### Configuration

- **`.env.example`** enrichi avec:
  - Exemples pour local et Supabase
  - Documentation de toutes les variables
  - Configuration Prisma 7 compatible

#### Package.json

- Ajout du script `check` pour vérification

### 🗑️ Supprimé

#### Structure de Fichiers

- **`app/dashboard/`** - Dossier dupliqué supprimé
  - Conflit avec `app/(dashboard)/`
  - Routes fusionnées dans `(dashboard)`
- **`app/(auth)/login/` vides** - Sous-dossiers mal placés

#### Dossier Malformé

- **`app/(dashboard)/{caisse,salle,produits`** - Nom invalide supprimé
  - Routes séparées correctement

### 🐛 Corrigé

#### Routing

- ✅ Conflit entre `dashboard/` et `(dashboard)/`
- ✅ TypedRoutes incompatibilité
- ✅ Sidebar avec mauvaises routes
- ✅ Redirection de la page d'accueil

#### TanStack Query

- ✅ Pattern `useState` non optimal pour SSR
- ✅ Pas de support du streaming
- ✅ Pas de déshydratation des pending queries

#### Prisma

- ✅ `datasource db` sans URL
- ✅ Utilisation de `cuid()` au lieu d'UUID
- ✅ Type `Decimal(10, 2)` pour `valeurRemise` (corrigé en `Decimal(10, 0)`)
- ✅ `tauxTva` numérique au lieu d'enum
- ✅ Manque d'indexes de performance
- ✅ Relations `onDelete` non configurées
- ✅ Pas de modèle d'audit

### ⚠️ Avertissements (Non bloquants)

- **Middleware deprecié** - Next.js 16 recommande "proxy"
  - Action future: Migrer vers proxy
- **Metadata viewport/themeColor** - Doivent être dans export `viewport`
  - Action future: Refactoriser exports metadata

### 📊 Statistiques

- **21 problèmes** identifiés
- **19 résolus** (90.5%)
- **2 avertissements** non bloquants

---

## [Non publié]

### 🔮 Prochaines Fonctionnalités Prévues

#### Court terme (v0.2.0)

- [ ] Authentification Supabase complète
- [ ] Row Level Security (RLS)
- [ ] Tests unitaires de base
- [ ] Documentation des composants

#### Moyen terme (v0.3.0)

- [ ] Mode hors ligne avec IndexedDB
- [ ] Module d'impression thermique (ESC/POS)
- [ ] Génération de rapports PDF
- [ ] Optimisation des performances

#### Long terme (v1.0.0)

- [ ] Support multi-langue (FR/EN)
- [ ] Application mobile (React Native)
- [ ] Module de livraison avancé
- [ ] Intégration comptabilité

---

## Types de Changements

- `Ajouté` : nouvelles fonctionnalités
- `Modifié` : changements dans les fonctionnalités existantes
- `Deprecated` : fonctionnalités bientôt supprimées
- `Supprimé` : fonctionnalités supprimées
- `Corrigé` : corrections de bugs
- `Sécurité` : corrections de vulnérabilités

---

**Légende des versions :**

- `[x.y.z]` - Release publiée
- `[Non publié]` - Changements en cours de développement

---

**Dernière mise à jour**: 2026-01-26
