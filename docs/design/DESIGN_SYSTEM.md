# Design System - Oréma N+ POS

Documentation complète du design system basé sur Radix UI Themes 3.x

## Philosophie

Le design system d'Oréma N+ est construit sur **Radix UI Themes**, offrant:

- Composants accessibles par défaut (WCAG AA)
- Système de design cohérent et professionnel
- Thème personnalisable (light/dark)
- Performance optimale pour les écrans tactiles POS

## Configuration

### Theme Provider

```tsx
<Theme accentColor="orange" grayColor="slate" radius="medium" scaling="100%">
  {children}
</Theme>
```

### Typographie

**Gabarito** - Font principale (interface, titres, navigation, boutons)

```css
font-family: var(--font-gabarito);
```

**JetBrains Mono** - Font monospace (prix, quantités, tickets)

```css
font-family: var(--font-google-sans-code);
```

## Composants UI de Base

### Layout Components

#### Box

Container de base avec padding, margin

```tsx
import { Box } from "@/components/ui";

<Box p="4" style={{ backgroundColor: "var(--gray-2)" }}>
  Content
</Box>;
```

#### Flex

Layout flexbox

```tsx
import { Flex } from "@/components/ui";

<Flex direction="row" gap="3" align="center">
  <Text>Label</Text>
  <Badge>New</Badge>
</Flex>;
```

#### Grid

Layout CSS Grid avec responsive

```tsx
import { Grid } from "@/components/ui";

<Grid columns={{ initial: "1", md: "2", lg: "4" }} gap="4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
</Grid>;
```

### Typography

#### Text

Texte courant

```tsx
import { Text } from "@/components/ui";

<Text size="2" weight="medium">Prix:</Text>
<Text size="5" weight="bold" className="font-mono">15 000 FCFA</Text>
```

**Sizes**: `1` (12px) à `9` (60px)
**Weights**: `light`, `regular`, `medium`, `bold`

#### Heading

Titres et en-têtes

```tsx
import { Heading } from "@/components/ui";

<Heading as="h1" size="8">Tableau de bord</Heading>
<Heading as="h2" size="6" weight="medium">Statistiques</Heading>
```

### Components

#### Button

```tsx
import { Button } from "@/components/ui";

<Button color="orange" variant="solid">Enregistrer</Button>
<Button color="gray" variant="soft">Annuler</Button>
<Button variant="ghost">Options</Button>
```

**Variants**: `solid`, `soft`, `outline`, `ghost`
**Colors**: `orange`, `blue`, `green`, `red`, `gray`, `amber`, etc.
**Sizes**: `1`, `2`, `3`, `4`

#### Card

```tsx
import { Card } from "@/components/ui";

<Card>
  <Flex direction="column" p="4">
    Content
  </Flex>
</Card>;
```

#### Badge

Tags, labels, statuts

```tsx
import { Badge } from "@/components/ui";

<Badge color="orange" variant="solid">Nouveau</Badge>
<Badge color="green" variant="soft">Actif</Badge>
<Badge color="red" variant="outline">Rupture</Badge>
```

#### Avatar

Photos de profil

```tsx
import { Avatar } from "@/components/ui";

<Avatar src="/avatar.jpg" fallback="JD" size="3" radius="full" />;
```

#### IconButton

Boutons avec icônes uniquement

```tsx
import { IconButton } from "@/components/ui";
import { Trash } from "lucide-react";

<IconButton variant="soft" color="red">
  <Trash size={18} />
</IconButton>;
```

#### Separator

Séparateurs horizontaux/verticaux

```tsx
import { Separator } from "@/components/ui";

<Separator size="4" />;
```

## Composants Composés

### StatCard

Card de statistique pour dashboard

```tsx
import { StatCard } from "@/components/composed";
import { ShoppingCart } from "lucide-react";

<StatCard
  title="Ventes du jour"
  value="15 000 FCFA"
  icon={ShoppingCart}
  color="orange"
  trend={{ value: "+12%", isPositive: true }}
/>;
```

**Props:**

- `title`: Titre de la statistique
- `value`: Valeur (string formatée)
- `icon`: Icône Lucide
- `color`: Couleur (`orange`, `blue`, `green`, `purple`, `red`, `amber`)
- `trend` (optional): Tendance avec valeur et direction

### StatusBadge

Badge prédéfini pour statuts

```tsx
import { StatusBadge } from "@/components/composed";

<StatusBadge status="active" />
<StatusBadge status="pending" />
<StatusBadge status="error" />
```

**Status types:**

- `active`, `inactive`, `pending`
- `success`, `error`, `warning`
- `occupied`, `free`, `in-preparation`, `bill-requested`, `needs-cleaning`

### EmptyState

État vide avec action

```tsx
import { EmptyState } from "@/components/composed";
import { Package } from "lucide-react";

<EmptyState
  icon={Package}
  title="Aucun produit"
  description="Ajoutez vos premiers produits pour commencer."
  action={{
    label: "Ajouter un produit",
    onClick: () => router.push("/produits/nouveau"),
  }}
/>;
```

### DashboardCard

Card avec header et actions

```tsx
import { DashboardCard } from "@/components/composed";
import { Package, ExternalLink } from "lucide-react";

<DashboardCard
  title="Produits populaires"
  description="Articles les plus vendus"
  icon={Package}
  action={{
    icon: ExternalLink,
    onClick: () => router.push("/produits"),
    label: "Voir tous les produits",
  }}
>
  {/* Contenu */}
</DashboardCard>;
```

## Utilitaires

### Currency Formatting

```tsx
import { formatCurrency, formatCurrencyShort, parseCurrency } from "@/lib/design-system";

formatCurrency(15000); // "15 000 FCFA"
formatCurrency(1500000, false); // "1 500 000"
formatCurrencyShort(15000); // "15K"
formatCurrencyShort(1500000); // "1.5M"
parseCurrency("15 000 FCFA"); // 15000
```

### Tax Calculation

```tsx
import { calculateTax } from "@/lib/design-system";

const result = calculateTax(10000, 0.18);
// { ht: 10000, tva: 1800, ttc: 11800 }
```

### Colors

```tsx
import { statusColors, categoryColors, getRadixColor } from "@/lib/design-system";

const color = statusColors.success; // "green"
const cssVar = getRadixColor("orange", 9); // "var(--orange-9)"
```

## Système de Couleurs

### Accent Principal

**Orange** (--orange-X)

- Usage: Boutons primaires, accents, CTA
- Scale: 1-12

### Gris

**Slate** (--slate-X)

- Usage: Textes, bordures, backgrounds
- Scale: 1-12

### Couleurs Sémantiques

- **Success**: Green (--green-9)
- **Error**: Red (--red-9)
- **Warning**: Orange/Amber (--amber-9)
- **Info**: Blue (--blue-9)

### Variables CSS Radix

```css
/* Background colors */
var(--color-background)
var(--color-panel)
var(--color-panel-translucent)

/* Text colors */
var(--gray-12) /* Texte principal */
var(--gray-11) /* Texte secondaire */
var(--gray-9)  /* Texte tertiaire */

/* Borders */
var(--gray-6)  /* Bordures */
var(--gray-7)  /* Bordures hover */

/* Accents */
var(--orange-9)  /* Accent principal */
var(--orange-3)  /* Background accent */
```

## Espacement

### Scale Radix

```tsx
gap = "1"; // 4px
gap = "2"; // 8px
gap = "3"; // 12px
gap = "4"; // 16px
gap = "5"; // 20px
gap = "6"; // 24px
gap = "7"; // 28px
gap = "8"; // 32px
gap = "9"; // 36px
```

### Touch Targets

Minimum **44x44px** pour tous les boutons et éléments interactifs sur écrans tactiles.

```tsx
<IconButton style={{ minWidth: 44, minHeight: 44 }}>
  <Icon />
</IconButton>
```

## Responsive Design

### Breakpoints Radix

```tsx
<Grid columns={{ initial: "1", sm: "2", md: "3", lg: "4" }}>
```

**Breakpoints:**

- `initial`: 0px (mobile)
- `xs`: 520px
- `sm`: 768px
- `md`: 1024px
- `lg`: 1280px
- `xl`: 1640px

## Classes CSS Personnalisées

### Font Mono

```tsx
<Text className="font-mono">15 000 FCFA</Text>
```

### Animations

```tsx
<div className="animate-fade-in">...</div>
<div className="animate-slide-up">...</div>
```

### Touch Target

```tsx
<button className="touch-target">...</button>
```

## Dark Mode

Le thème s'adapte automatiquement au mode système via Radix UI Themes.

```tsx
// Variables CSS automatiques
var(--color-background)  // Blanc en light, noir en dark
var(--gray-12)           // Noir en light, blanc en dark
```

## Accessibilité

Tous les composants Radix UI respectent:

- **WCAG 2.1 AA** pour les contrastes
- **ARIA** attributes automatiques
- **Keyboard navigation** complète
- **Focus management** optimisé
- **Screen reader** compatible

## Exemples d'Utilisation

### Dashboard Stats Grid

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

### Empty State with Action

```tsx
<DashboardCard title="Ventes récentes" icon={ShoppingCart}>
  {sales.length === 0 ? (
    <EmptyState
      icon={ShoppingCart}
      title="Aucune vente"
      description="Commencez par ouvrir une session de caisse."
      action={{
        label: "Ouvrir la caisse",
        onClick: () => router.push("/caisse"),
      }}
    />
  ) : (
    <SalesList sales={sales} />
  )}
</DashboardCard>
```

### Status Indicators

```tsx
<Flex gap="2">
  <StatusBadge status="active">Actif</StatusBadge>
  <StatusBadge status="pending">En attente</StatusBadge>
  <StatusBadge status="error">Erreur</StatusBadge>
</Flex>
```

## Ressources

- [Radix UI Themes Documentation](https://www.radix-ui.com/themes/docs)
- [Radix Colors](https://www.radix-ui.com/colors)
- [Lucide Icons](https://lucide.dev)
- [Gabarito Font](https://fonts.google.com/specimen/Gabarito)
