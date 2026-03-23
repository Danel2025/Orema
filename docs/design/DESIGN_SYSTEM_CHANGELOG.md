# Design System Changelog

## 2026-01-26 - Design System v1.0

### Création du Design System Complet

Design system professionnel basé sur Radix UI Themes 3.x pour Oréma N+ POS.

### Composants UI de Base (components/ui/)

#### Layout Components

- **Box** - Container de base avec padding, margin
- **Flex** - Layout flexbox avec props utiles
- **Grid** - Layout CSS Grid responsive

#### Typography

- **Text** - Texte courant avec variants de taille et poids
- **Heading** - Titres et en-têtes (h1-h6)

#### Components

- **Button** - Boutons avec variants (solid, soft, outline, ghost)
- **Card** - Cards pour conteneurs
- **Badge** - Badges/tags pour labels et statuts
- **Avatar** - Avatars pour photos de profil
- **IconButton** - Boutons avec icônes uniquement
- **Separator** - Séparateurs horizontaux/verticaux

**Fichier:** `components/ui/index.ts` - Export centralisé de tous les composants

### Composants Composés (components/composed/)

#### StatCard

Card de statistique pour dashboard avec:

- Titre et valeur
- Icône colorée
- Trend optionnel (+/- pourcentage)
- 6 couleurs prédéfinies (orange, blue, green, purple, red, amber)

**Usage:**

```tsx
<StatCard
  title="Ventes du jour"
  value="15 000 FCFA"
  icon={ShoppingCart}
  color="orange"
  trend={{ value: "+12%", isPositive: true }}
/>
```

#### StatusBadge

Badge prédéfini pour statuts POS:

- Statuts généraux: active, inactive, pending, success, error, warning
- Statuts tables: free, occupied, in-preparation, bill-requested, needs-cleaning
- Couleurs et labels automatiques

**Usage:**

```tsx
<StatusBadge status="active" />
<StatusBadge status="occupied" />
```

#### EmptyState

Pattern pour afficher un état vide avec:

- Icône dans cercle
- Titre et description
- Action optionnelle avec bouton

**Usage:**

```tsx
<EmptyState
  icon={Package}
  title="Aucun produit"
  description="Ajoutez vos premiers produits."
  action={{
    label: "Ajouter un produit",
    onClick: () => router.push("/produits/nouveau"),
  }}
/>
```

#### DashboardCard

Card spéciale pour sections dashboard avec:

- Header avec titre, description, icône
- Action optionnelle (IconButton)
- Contenu children
- Separator automatique

**Usage:**

```tsx
<DashboardCard
  title="Ventes récentes"
  description="Dernières transactions"
  icon={ShoppingCart}
  action={{
    icon: ExternalLink,
    onClick: () => router.push("/ventes"),
    label: "Voir tout",
  }}
>
  <SalesList />
</DashboardCard>
```

### Utilitaires Design System (lib/design-system/)

#### Currency (currency.ts)

Formatage et parsing de la monnaie FCFA:

- `formatCurrency(amount, showSymbol)` - Formate en "15 000 FCFA"
- `formatCurrencyShort(amount)` - Format court "15K", "1.5M"
- `parseCurrency(value)` - Parse string vers number
- `calculateTax(amountHT, taxRate)` - Calcul TVA avec {ht, tva, ttc}

#### Colors (colors.ts)

Mapping des couleurs Radix:

- `statusColors` - Couleurs par type de statut
- `categoryColors` - Palette pour catégories produits
- `chartColors` - Couleurs pour graphiques
- `tableStatusColors` - Couleurs statuts tables
- `getRadixColor(color, scale)` - Obtient var CSS Radix

#### Spacing (spacing.ts)

Système d'espacement:

- `spacing` - Échelle 1-9 (4px à 36px)
- `sizes` - Tailles de composants
- `touchTarget` - Constantes pour cibles tactiles (44px min)

### Layout Components Améliorés

#### Sidebar (components/layout/sidebar.tsx)

Sidebar moderne avec Radix UI:

- Logo Oréma N+ avec badge
- Navigation avec état actif (background orange)
- Icons Lucide 20px
- Touch targets 44px minimum
- Footer avec version et copyright
- Séparateurs visuels

#### Header (components/layout/header.tsx)

Header déjà optimisé avec:

- Recherche globale (TextField Radix)
- Toggle theme
- Notifications avec badge
- User menu avec Avatar

### Typographie

#### Gabarito Font

Remplacement d'Inter par Gabarito (Google Font):

- Police principale pour interface, titres, navigation, boutons
- Weights: 400, 500, 600, 700, 800, 900
- Variable CSS: `--font-gabarito`
- Override Radix UI Themes pour utiliser Gabarito

#### JetBrains Mono

Font monospace pour valeurs numériques:

- Prix FCFA, quantités, tickets
- Variable CSS: `--font-google-sans-code`
- Classe CSS: `.font-mono`

### CSS Améliorations (app/globals.css)

#### Classe Monospace

```css
.price-fcfa,
.font-mono {
  font-family: var(--font-google-sans-code), ui-monospace, monospace;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
```

### Pages Créées

#### Dashboard Refactorisé (app/(dashboard)/page.tsx)

Dashboard moderne avec:

- Header avec Heading et Text Radix
- Grid responsive de StatCards (4 colonnes)
- 2 DashboardCards avec EmptyState
- Guide de démarrage (4 étapes avec StatusBadges)
- Alerte de configuration
- Utilisation complète du design system

#### Page Design System (app/(dashboard)/design-system/page.tsx)

Page de démonstration complète avec:

- Typographie (Headings, Text sizes, weights, monospace)
- Boutons (variants, colors, sizes, IconButtons)
- Badges (variants, StatusBadges, table status)
- StatCards (4 exemples avec différentes couleurs)
- DashboardCards (avec contenu et EmptyState)
- Avatars (sizes, colors)
- Système de couleurs (Orange et Slate scales)

**URL:** `/design-system`

### Documentation

#### DESIGN_SYSTEM.md

Documentation complète (500+ lignes):

- Philosophie et configuration
- Tous les composants avec exemples de code
- Système de couleurs Radix
- Espacement et responsive
- Classes CSS personnalisées
- Accessibilité
- Exemples d'utilisation

#### components/README.md

Documentation technique:

- Architecture des composants
- Hiérarchie (UI → Composed → Feature)
- Principes de conception
- Import patterns
- Guidelines de création
- Guidelines de style

#### DESIGN_SYSTEM_CHANGELOG.md

Ce fichier - Historique des changements

### Structure des Fichiers

```
gabon-pos/
├── app/
│   ├── layout.tsx                 # ✅ Gabarito configuré
│   ├── globals.css                # ✅ .font-mono ajouté
│   └── (dashboard)/
│       ├── page.tsx               # ✅ Refactorisé avec design system
│       └── design-system/
│           └── page.tsx           # ✅ NOUVEAU - Page démo
│
├── components/
│   ├── ui/                        # ✅ NOUVEAU - 10 composants
│   │   ├── box.tsx
│   │   ├── flex.tsx
│   │   ├── grid.tsx
│   │   ├── text.tsx
│   │   ├── heading.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── icon-button.tsx
│   │   ├── separator.tsx
│   │   └── index.ts
│   │
│   ├── composed/                  # ✅ NOUVEAU - 4 composants
│   │   ├── stat-card.tsx
│   │   ├── status-badge.tsx
│   │   ├── empty-state.tsx
│   │   ├── dashboard-card.tsx
│   │   └── index.ts
│   │
│   ├── layout/
│   │   ├── sidebar.tsx           # ✅ Refactorisé avec Radix UI
│   │   ├── sidebar-old.tsx       # Backup
│   │   └── header.tsx            # Déjà optimisé
│   │
│   └── README.md                 # ✅ NOUVEAU - Doc composants
│
├── lib/
│   └── design-system/            # ✅ NOUVEAU - Utilitaires
│       ├── currency.ts
│       ├── colors.ts
│       ├── spacing.ts
│       └── index.ts
│
├── DESIGN_SYSTEM.md              # ✅ NOUVEAU - Doc complète
└── DESIGN_SYSTEM_CHANGELOG.md    # ✅ NOUVEAU - Ce fichier
```

### Fichiers Créés

- 10 composants UI (`components/ui/`)
- 4 composants composés (`components/composed/`)
- 4 utilitaires design system (`lib/design-system/`)
- 3 fichiers de documentation
- 1 page de démonstration
- 1 sidebar refactorisé
- 1 dashboard refactorisé

**Total: 24 nouveaux fichiers**

### Caractéristiques du Design System

#### Accessibilité

- Touch targets minimum 44×44px
- Composants Radix UI (WCAG AA)
- ARIA attributes automatiques
- Navigation clavier complète
- Focus management optimisé

#### Performance

- Re-exports simples (pas de duplication)
- Tree-shaking friendly
- Composants Radix optimisés
- CSS variables Radix (pas de runtime)

#### Cohérence Visuelle

- Accent: Orange (var(--orange-9))
- Gris: Slate (var(--gray-X))
- Radius: medium
- Scaling: 100%
- Gabarito pour interface
- JetBrains Mono pour prix

#### Responsive

- Grid adaptatif avec breakpoints
- Mobile first (mais desktop optimisé)
- Breakpoints: initial, xs, sm, md, lg, xl
- Props responsive sur Grid: `columns={{ initial: "1", lg: "4" }}`

### Prochaines Étapes Suggérées

1. **Forms Components**
   - TextField wrapper
   - Select wrapper
   - Checkbox/Radio wrappers
   - FormField composé

2. **Data Display**
   - Table component
   - DataTable avec sorting/filtering
   - Pagination

3. **Feedback**
   - Toast notifications (Sonner intégré)
   - Alert component
   - Progress indicators

4. **Navigation**
   - Tabs component
   - Breadcrumbs
   - Pagination

5. **Overlays**
   - Dialog/Modal
   - Dropdown Menu
   - Popover
   - Tooltip

6. **Feature Components**
   - ProductCard (caisse)
   - TableCard (plan de salle)
   - CustomerCard
   - OrderCard

### Ressources Utilisées

- [Radix UI Themes 3.x](https://www.radix-ui.com/themes/docs)
- [Radix Colors](https://www.radix-ui.com/colors)
- [Lucide Icons](https://lucide.dev)
- [Gabarito Font](https://fonts.google.com/specimen/Gabarito)
- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

---

**Design System Status:** ✅ Production Ready
**Version:** 1.0.0
**Date:** 2026-01-26
**Composants:** 14 (10 UI + 4 Composed)
**Utilitaires:** 3 (currency, colors, spacing)
**Documentation:** Complète
