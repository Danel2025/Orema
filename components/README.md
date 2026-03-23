# Composants - Oréma N+ POS

Architecture des composants du design system basé sur Radix UI Themes 3.x

## Structure

```
components/
├── ui/                    # Composants UI de base (wrappers Radix UI)
│   ├── box.tsx           # Container de base
│   ├── flex.tsx          # Layout flexbox
│   ├── grid.tsx          # Layout grid
│   ├── text.tsx          # Texte courant
│   ├── heading.tsx       # Titres
│   ├── button.tsx        # Boutons
│   ├── card.tsx          # Cards
│   ├── badge.tsx         # Badges/tags
│   ├── avatar.tsx        # Avatars utilisateur
│   ├── icon-button.tsx   # Boutons icône seule
│   ├── separator.tsx     # Séparateurs
│   └── index.ts          # Exports centralisés
│
├── composed/              # Composants composés spécifiques POS
│   ├── stat-card.tsx     # Card de statistique (dashboard)
│   ├── status-badge.tsx  # Badge de statut prédéfini
│   ├── empty-state.tsx   # État vide avec action
│   ├── dashboard-card.tsx # Card dashboard avec header
│   └── index.ts          # Exports centralisés
│
├── layout/                # Composants de layout
│   ├── sidebar.tsx       # Navigation latérale
│   ├── header.tsx        # En-tête avec recherche et user
│   └── theme-toggle.tsx  # Toggle light/dark mode
│
└── shared/                # Composants partagés
    └── loading.tsx       # Indicateurs de chargement
```

## Hiérarchie des Composants

### Niveau 1: UI Primitives

Wrappers typés autour de Radix UI Themes. Simple re-export avec types.

**Exemple:**

```tsx
import { Button as RadixButton } from "@radix-ui/themes";
export const Button = RadixButton;
export type ButtonProps = React.ComponentProps<typeof RadixButton>;
```

### Niveau 2: Composed Components

Composants construits à partir des primitives UI. Logique métier POS.

**Exemple:**

```tsx
import { Card, Flex, Text, Box } from "@/components/ui";

export function StatCard({ title, value, icon }) {
  return (
    <Card>
      <Flex>
        <Text>{title}</Text>
        <Text>{value}</Text>
      </Flex>
    </Card>
  );
}
```

### Niveau 3: Feature Components

Composants spécifiques aux features (caisse, salle, produits, etc.)

## Principes de Conception

### 1. Accessibilité First

- Touch targets minimum 44x44px
- Contraste WCAG AA minimum
- ARIA labels sur tous les interactifs
- Navigation clavier complète

### 2. Responsive

- Mobile first (mais desktop optimisé pour POS)
- Breakpoints Radix: initial, xs, sm, md, lg, xl
- Grid adaptatif avec props responsive

### 3. Cohérence Visuelle

- Utiliser les tokens Radix (colors, spacing, radius)
- Gabarito pour interface
- JetBrains Mono pour prix/valeurs
- Orange (accent), Slate (gris)

### 4. Performance

- Re-exports simples (pas de duplication)
- Lazy loading pour composants lourds
- Optimisation bundle via tree-shaking

## Import Pattern

### Imports recommandés

```tsx
// ✅ Bon - Import depuis index
import { Box, Flex, Text, Button } from "@/components/ui";
import { StatCard, StatusBadge } from "@/components/composed";

// ❌ Éviter - Import direct
import { Box } from "@/components/ui/box";
```

### Import des icônes

```tsx
// ✅ Import destructuré Lucide
import { ShoppingCart, Package, Users } from "lucide-react";
```

## Exemples d'Utilisation

### Layout avec Grid Responsive

```tsx
<Grid columns={{ initial: "1", md: "2", lg: "4" }} gap="4">
  <StatCard title="Ventes" value="15 000 FCFA" icon={ShoppingCart} />
  <StatCard title="Produits" value="48" icon={Package} />
</Grid>
```

### Card avec Header

```tsx
<DashboardCard
  title="Ventes récentes"
  icon={ShoppingCart}
  action={{
    icon: ExternalLink,
    onClick: () => router.push("/ventes"),
    label: "Voir tout",
  }}
>
  <SalesList sales={sales} />
</DashboardCard>
```

### Empty State

```tsx
{
  items.length === 0 && (
    <EmptyState
      icon={Package}
      title="Aucun produit"
      description="Ajoutez vos premiers produits."
      action={{
        label: "Ajouter un produit",
        onClick: () => router.push("/produits/nouveau"),
      }}
    />
  );
}
```

### Status Badges

```tsx
<StatusBadge status="active" />
<StatusBadge status="pending" />
<StatusBadge status="occupied" />
```

## Création d'un Nouveau Composant

### Composant UI (simple wrapper)

```tsx
// components/ui/nouvelle-primitive.tsx
import { NouvelleComposante as RadixComponent } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef } from "react";

export const NouvelleComposante = RadixComponent;
export type NouvelleComposanteProps = ComponentPropsWithoutRef<typeof RadixComponent>;
```

### Composant Composé

```tsx
// components/composed/nouveau-compose.tsx
import { Card, Flex, Text } from "@/components/ui";
import type { LucideIcon } from "lucide-react";

export interface NouveauComposeProps {
  title: string;
  icon: LucideIcon;
}

export function NouveauCompose({ title, icon: Icon }: NouveauComposeProps) {
  return (
    <Card>
      <Flex align="center" gap="3" p="4">
        <Icon size={20} />
        <Text>{title}</Text>
      </Flex>
    </Card>
  );
}
```

## Tests et Documentation

### Documentation Inline

Chaque composant doit avoir:

- JSDoc avec description
- Props interface exportée
- Exemples d'utilisation en commentaire

### Page de Démonstration

Voir `/design-system` pour tous les composants en action.

## Guidelines de Style

### TypeScript

- Toujours typer les props
- Exporter les types
- Utiliser `ComponentPropsWithoutRef` pour wrappers

### Naming

- PascalCase pour composants
- camelCase pour props
- kebab-case pour fichiers

### Props

- `children` pour contenu
- `className` pour override CSS
- `style` pour styles inline
- `as` pour polymorphic components

## Ressources

- [Radix UI Themes](https://www.radix-ui.com/themes/docs)
- [Lucide Icons](https://lucide.dev)
- [Design System Doc](../DESIGN_SYSTEM.md)
