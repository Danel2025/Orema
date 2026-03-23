# Guide Rapide - Design System Oréma N+

Guide de démarrage rapide pour utiliser le design system.

## Accès Rapide

### Page de Démonstration

```
http://localhost:3000/design-system
```

Voir tous les composants en action avec exemples interactifs.

### Dashboard

```
http://localhost:3000/
```

Nouveau dashboard utilisant le design system complet.

## Import des Composants

### Composants UI de Base

```tsx
import {
  Box,
  Flex,
  Grid,
  Text,
  Heading,
  Button,
  Card,
  Badge,
  Avatar,
  IconButton,
  Separator,
} from "@/components/ui";
```

### Composants Composés

```tsx
import { StatCard, StatusBadge, EmptyState, DashboardCard } from "@/components/composed";
```

### Icônes

```tsx
import { ShoppingCart, Package, Users } from "lucide-react";
```

### Utilitaires

```tsx
import { formatCurrency, formatCurrencyShort } from "@/lib/design-system";
```

## Exemples Courants

### Grid de Stats

```tsx
<Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4">
  <StatCard
    title="Ventes du jour"
    value={formatCurrency(totalSales)}
    icon={ShoppingCart}
    color="orange"
  />
  <StatCard title="Produits" value={productCount.toString()} icon={Package} color="blue" />
</Grid>
```

### Card Dashboard

```tsx
<DashboardCard
  title="Ventes récentes"
  description="Dernières transactions"
  icon={ShoppingCart}
  action={{
    icon: ExternalLink,
    onClick: () => router.push("/ventes"),
    label: "Voir toutes les ventes",
  }}
>
  {sales.length > 0 ? (
    <SalesList sales={sales} />
  ) : (
    <EmptyState
      icon={ShoppingCart}
      title="Aucune vente"
      description="Commencez par enregistrer une vente."
      action={{
        label: "Nouvelle vente",
        onClick: () => router.push("/caisse"),
      }}
    />
  )}
</DashboardCard>
```

### Boutons et Badges

```tsx
<Flex gap="3" align="center">
  <Button color="orange" variant="solid">
    Enregistrer
  </Button>
  <Button color="gray" variant="soft">
    Annuler
  </Button>
  <StatusBadge status="active" />
</Flex>
```

### Prix FCFA

```tsx
<Text size="6" weight="bold" className="font-mono">
  {formatCurrency(amount)}
</Text>
```

## Couleurs Disponibles

### Composants

- `orange` - Accent principal
- `blue` - Informations
- `green` - Succès
- `red` - Erreur/Danger
- `amber` - Attention
- `gray` - Neutre
- `purple`, `pink`, `cyan`, `teal`, `indigo`

### Variants

- `solid` - Fond plein
- `soft` - Fond léger
- `outline` - Bordure seule
- `ghost` - Transparent

## Sizes

### Text & Heading

- `1` (12px) - Extra small
- `2` (14px) - Small
- `3` (16px) - Medium (défaut)
- `4` (18px) - Large
- `5` (20px) - Extra large
- `6-9` - Très grandes tailles

### Buttons

- `1` - Small (32px)
- `2` - Medium (40px) - défaut
- `3` - Large (48px)
- `4` - Extra large (56px)

### Spacing (gap, p, m)

- `1` (4px)
- `2` (8px)
- `3` (12px)
- `4` (16px)
- `5` (20px)
- `6` (24px)
- `7` (28px)
- `8` (32px)
- `9` (36px)

## Responsive Breakpoints

```tsx
<Grid columns={{
  initial: "1",  // Mobile
  xs: "2",       // 520px+
  sm: "2",       // 768px+
  md: "3",       // 1024px+
  lg: "4",       // 1280px+
  xl: "4"        // 1640px+
}} gap="4">
```

## Status Types

### StatusBadge

- `active` - Vert "Actif"
- `inactive` - Gris "Inactif"
- `pending` - Ambre "En attente"
- `success` - Vert "Succès"
- `error` - Rouge "Erreur"
- `warning` - Orange "Attention"
- `occupied` - Ambre "Occupée"
- `free` - Vert "Libre"
- `in-preparation` - Bleu "En préparation"
- `bill-requested` - Orange "Addition demandée"
- `needs-cleaning` - Rouge "À nettoyer"

## Documentation Complète

### Fichiers à Consulter

- `DESIGN_SYSTEM.md` - Documentation complète du design system
- `DESIGN_SYSTEM_CHANGELOG.md` - Historique des changements
- `components/README.md` - Architecture des composants

### Ressources Externes

- [Radix UI Themes](https://www.radix-ui.com/themes/docs)
- [Lucide Icons](https://lucide.dev)
- [Radix Colors](https://www.radix-ui.com/colors)

## Tips & Tricks

### 1. Utiliser les CSS Variables Radix

```tsx
<Box style={{ backgroundColor: 'var(--orange-3)', color: 'var(--orange-11)' }}>
```

### 2. Font Mono pour Prix

```tsx
<Text className="font-mono" size="5" weight="bold">
  {formatCurrency(price)}
</Text>
```

### 3. Touch Targets (POS)

```tsx
<IconButton style={{ minWidth: 44, minHeight: 44 }}>
  <Icon size={20} />
</IconButton>
```

### 4. Grid Responsive Rapide

```tsx
<Grid columns={{ initial: "1", lg: "3" }} gap="4">
  {/* Mobile: 1 colonne, Desktop: 3 colonnes */}
</Grid>
```

### 5. Empty State Pattern

```tsx
{
  data.length === 0 ? (
    <EmptyState
      icon={Icon}
      title="Aucune donnée"
      description="Message d'aide"
      action={{ label: "Action", onClick: handler }}
    />
  ) : (
    <DataList data={data} />
  );
}
```

## Checklist Nouvelle Feature

Quand vous créez une nouvelle page/feature:

- [ ] Utiliser `Grid` pour layouts responsives
- [ ] Importer composants depuis `@/components/ui` et `@/components/composed`
- [ ] Utiliser `formatCurrency()` pour tous les prix
- [ ] Ajouter `EmptyState` quand pas de données
- [ ] Touch targets minimum 44px
- [ ] StatusBadge pour tous les statuts
- [ ] Heading + Text pour typographie (pas de `<h1>` natif)
- [ ] Flex/Box au lieu de `<div>` quand possible

## Démarrage Rapide

```bash
# Démarrer le serveur
pnpm dev

# Voir le design system
# http://localhost:3000/design-system

# Voir le nouveau dashboard
# http://localhost:3000/
```

## Support

Pour toute question sur le design system:

1. Consulter `/design-system` (exemples visuels)
2. Lire `DESIGN_SYSTEM.md` (doc complète)
3. Regarder `app/(dashboard)/page.tsx` (exemple d'utilisation)
