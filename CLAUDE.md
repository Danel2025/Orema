# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
pnpm dev                  # Start dev server with Turbopack
pnpm dev:clean           # Clean .next cache and start dev server
pnpm build               # Production build
pnpm start               # Start production server

# Code Quality
pnpm lint                # Run ESLint
pnpm lint:fix            # Auto-fix lint errors
pnpm format              # Format with Prettier
pnpm format:check        # Check formatting without changes

# Unit Tests (Vitest)
pnpm test                # Run tests in watch mode
pnpm test:run            # Run tests once
pnpm test:run tests/unit/currency.test.ts   # Run a single test file
pnpm test:ui             # Open Vitest UI
pnpm test:coverage       # Run with coverage report

# E2E Tests (Playwright)
pnpm test:e2e            # Run E2E tests
pnpm test:e2e:ui         # Open Playwright UI
pnpm test:e2e:headed     # Run with visible browser

# Database (Supabase)
pnpm db:types            # Generate TypeScript types from Supabase schema

# Validation
pnpm check               # Run setup validation script
pnpm validate:md         # Validate markdown structure
```

## Environment Variables

Required in `.env` (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon (public) key
SUPABASE_SERVICE_ROLE_KEY     # Admin key - NEVER expose client-side
AUTH_SECRET                   # JWT session secret
```

## High-Level Architecture

**Stack**: Next.js 16 (App Router, Turbopack) / React 19 / TypeScript 5 / Supabase (PostgreSQL) / Radix UI Themes 3 / Tailwind CSS 4 / Zustand 5 / TanStack Query 5

**Path alias**: `@/*` maps to project root (e.g., `@/lib/db`, `@/components/ui`)

### Route Groups (App Router)

- `app/(auth)/` — Public auth routes (login, register, logout)
- `app/(dashboard)/` — Protected routes (POS, products, reports, settings, etc.)
- `app/(public)/` — Marketing pages (docs, blog, legal, FAQ)
- `app/api/` — Route Handlers (REST endpoints)

### Authentication & Route Protection

**No middleware.ts** — Auth is enforced in `app/(dashboard)/layout.tsx`:

1. Calls `getCurrentUser()` from `@/lib/auth` (checks Supabase session + loads user from DB)
2. Redirects to `/login` if no user or no `etablissementId`
3. Loads role-based permissions from DB via `getPermissionsForRole()`
4. Provides `AuthUser` + permissions to all child routes via `DashboardProviders`

PIN-based quick access for cashiers uses a separate `createAuthenticatedClient()` that sets RLS context.

### Data Layer

**Supabase only — NOT Prisma.** The `prisma/schema.prisma` file exists as documentation only.

- `lib/supabase/client.ts` — Browser client (Client Components)
- `lib/supabase/server.ts` — Server client (Server Components, Actions, Route Handlers)
- `lib/supabase/server.ts` — `createServiceClient()` bypasses all RLS (admin only)
- `lib/db/client.ts` — `createAuthenticatedClient(context)` for PIN auth with RLS context
- `types/supabase.ts` — Auto-generated types (`pnpm db:types`)

**Query pattern**: All DB queries are exposed via `db` object from `@/lib/db`. Every query function takes a Supabase client as its first argument:

```ts
import { db, createClient } from "@/lib/db";

// In a Server Action or Server Component
const supabase = await createClient();
const categories = await db.getCategories(supabase, etablissementId);
const produit = await db.getProduitById(supabase, produitId);
```

Query files are organized by domain in `lib/db/queries/` (produits, ventes, tables, clients, stocks, rapports, etc.).

### Server Actions (`actions/`)

All mutations go through Server Actions. Key modules:

- `ventes.ts` — Sales creation, payment processing
- `caisse.ts` — Cash register session open/close
- `produits.ts`, `categories.ts` — Product/category CRUD
- `tables.ts` — Table status updates
- `auth.ts`, `auth-supabase.ts`, `auth-pin.ts` — Authentication flows
- `split-bill.ts` — Bill splitting
- `admin/blog.ts`, `admin/documentation.ts` — CMS content management

### State Management (Zustand)

- `stores/cart-store.ts` — Shopping cart (items, discounts, sale type, customer)
- `stores/session-store.ts` — Cash register session state
- `stores/ui-store.ts` — UI state (sidebar, modals)
- `stores/pin-lock-store.ts` — PIN security lock
- `stores/split-bill-store.ts` — Bill splitting

### UI Components

- `components/ui/` — Base wrappers around Radix UI Themes (Box, Flex, Grid, Button, Card, etc.)
- `components/composed/` — Higher-level components (StatCard, StatusBadge, EmptyState)
- `components/caisse/` — POS-specific components
- `components/salle/` — Floor plan (TableItem, ZoneManager, drag & drop)
- Domain folders: `produits/`, `stocks/`, `clients/`, `employes/`, `rapports/`, `parametres/`

Import from `@/components/ui` for base, `@/components/composed` for composed.

### Key Utilities (`lib/utils.ts`)

Critical business functions — use these instead of writing custom logic:

- `formatCurrency(15000)` → `"15 000 FCFA"` (XAF, no decimals)
- `calculerTVA(montantHT, tauxTva)` — Calculates VAT amount
- `calculerTTC(montantHT, tauxTva)` — HT to TTC
- `calculerHT(montantTTC, tauxTva)` — TTC to HT
- `calculerLigneVente(prix, quantite, taux)` — Full line calculation
- `formatTicketNumber(date, seq)` → `"YYYYMMDD00001"`
- `formatDate(date, format)` / `formatTime(date)` — Gabon timezone formatting
- `cn(...classes)` — Tailwind class merging (clsx + twMerge)
- `calculerRenduMonnaie(montant)` — Optimal FCFA bill/coin breakdown
- `TVA_RATES` — `{ STANDARD: 18, REDUIT: 10, EXONERE: 0 }`

### Printing System (`lib/print/`)

ESC/POS thermal printer support with multi-printer routing:

- `ticket.ts` / `ticket-client.ts` — Receipt generation
- `bon-cuisine.ts` / `bon-bar.ts` — Kitchen/bar order slips
- `rapport-z.ts` — Daily closing report
- `router.ts` — Routes print jobs to correct printer based on product category

### Validation Schemas (`schemas/`)

Zod schemas for form validation, named `*.schema.ts` (e.g., `produit.schema.ts`, `vente.schema.ts`). Used with React Hook Form via `@hookform/resolvers`.

## Business Rules

- **Currency**: XAF (FCFA), no decimals — use `formatCurrency()` from `lib/utils.ts`
- **Tax**: 18% standard, 10% reduced, 0% exempt — use `calculerTVA()` family
- **Ticket numbering**: `YYYYMMDD00001`, sequential per day per establishment
- **User roles**: SUPER_ADMIN, ADMIN, MANAGER, CAISSIER, SERVEUR
- **Table statuses**: LIBRE, OCCUPEE, ATTENTE_COMMANDE, ATTENTE_ADDITION, A_NETTOYER
- **Locale**: `fr-GA`, timezone `Africa/Libreville` (UTC+1, no DST)

## Base de données

### Supabase uniquement (PAS Prisma)

- **NE JAMAIS** utiliser les commandes Prisma (`prisma migrate`, `prisma generate`, etc.)
- Le fichier `prisma/schema.prisma` existe uniquement comme **référence/documentation** du schéma
- Pour les migrations : créer des fichiers SQL dans `/supabase/migrations/`
- Pour les requêtes : utiliser le client Supabase (`@supabase/supabase-js`)
- Les types sont générés via `pnpm db:types`

### Migrations

**RÈGLE OBLIGATOIRE :** Utiliser le MCP Supabase pour appliquer les migrations.

1. Format du fichier : `YYYYMMDDHHMMSS_description.sql` dans `/supabase/migrations/`
2. **TOUJOURS** appliquer via : `mcp__supabase__apply_migration`
3. **NE JAMAIS** utiliser `supabase db push` en CLI

Autres outils MCP Supabase utiles :

- `mcp__supabase__list_migrations` — Lister les migrations appliquées
- `mcp__supabase__execute_sql` — Exécuter du SQL (lecture)
- `mcp__supabase__list_tables` — Lister les tables
- `mcp__supabase__get_advisors` — Vérifier sécurité/performance

## Organisation de la documentation

**Règle stricte :** Tous les fichiers `.md` dans `/docs`, **sauf** `README.md` et `CLAUDE.md` à la racine.

```
/docs
  ├── /specs          # Spécifications et cahiers des charges
  ├── /design         # Design system et guides
  ├── /guides         # Guides de démarrage et setup
  ├── /changelogs     # Historiques de changements
  └── README.md       # Index de la documentation
```

## Conventions

- **Supabase, pas Prisma** pour toutes les opérations DB
- **Radix UI Themes**, pas shadcn/ui, pour les composants
- TypeScript strict
- Ne créer de documentation que si **explicitement demandé**
- Préférer éditer un fichier existant plutôt qu'en créer un nouveau

## Règle Stricte : Accents Français

**OBLIGATOIRE** : Tout texte français (labels, descriptions, messages d'erreur, toasts, commentaires) DOIT utiliser les accents corrects.

### Vérification
```bash
pnpm check:accents    # Détecte les accents manquants
```

### Mots les plus fréquemment oubliés
| Incorrect | Correct | | Incorrect | Correct |
|-----------|---------|---|-----------|---------|
| Etablissement | Établissement | | Creer | Créer |
| Employes | Employés | | Generer | Générer |
| Parametres | Paramètres | | Gerer | Gérer |
| Systeme | Système | | Reinitialiser | Réinitialiser |
| Categories | Catégories | | Cloturer | Clôturer |
| Prenom | Prénom | | Selectionnez | Sélectionnez |
| Telephone | Téléphone | | Desactiver | Désactiver |
| Numero | Numéro | | doit etre | doit être |
| Derniere(s) | Dernière(s) | | reessayer | réessayer |
| Telechargement | Téléchargement | | superieur | supérieur |
| role (nom) | rôle | | credit (nom) | crédit |
| Acces | Accès | | prepaye | prépayé |

### Ne PAS modifier les identifiants programmatiques
- Clés de permissions : `"vente:creer"`, `"employe:modifier"` → ne pas toucher
- Colonnes DB Supabase : `prenom`, `telephone`, `role` → ne pas toucher
- Noms de variables/fonctions : `creerLivraison`, `categorie` → ne pas toucher
- Slugs et URLs : `"creer-modifier-produits"` → ne pas toucher
