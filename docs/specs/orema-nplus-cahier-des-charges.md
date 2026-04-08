# Oréma N+ - Cahier des Charges Technique

## Logiciel de Caisse pour le Marché Gabonais

> **Oréma** signifie "le cœur" • **N+** pour Nadine & Naïla, celles qui font battre le mien

**Version:** 2.0  
**Date:** 26 janvier 2026  
**Auteur:** Déreck Danel NEXON

---

## Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Stack Technique](#2-stack-technique)
3. [Design System](#3-design-system)
4. [Responsive Design](#4-responsive-design)
5. [Architecture du Projet](#5-architecture-du-projet)
6. [Schéma de Base de Données](#6-schéma-de-base-de-données)
7. [Fonctionnalités Détaillées](#7-fonctionnalités-détaillées)
8. [Impression Multi-Imprimantes](#8-impression-multi-imprimantes)
9. [Mode Hors-Ligne](#9-mode-hors-ligne)
10. [Sécurité](#10-sécurité)
11. [Déploiement](#11-déploiement)
12. [Roadmap](#12-roadmap)

---

## 1. Vue d'Ensemble

### 1.1 Objectif

Développer un logiciel de caisse (POS - Point of Sale) moderne, adapté aux besoins spécifiques du marché gabonais et africain, offrant une alternative locale et abordable aux solutions existantes comme RestoBar.

### 1.2 Cibles

- Restaurants, brasseries, maquis
- Fast-foods, snacks, sandwicheries
- Cafés, bars
- Pizzérias (avec gestion des livraisons)
- Épiceries, supérettes
- Tout commerce de détail

### 1.3 Avantages Concurrentiels

| Avantage | Description |
|----------|-------------|
| **Adaptation locale** | FCFA, fiscalité gabonaise, Mobile Money (Airtel, Moov) |
| **Support français** | Assistance locale, documentation en français |
| **Tarification accessible** | Modèle adapté au pouvoir d'achat africain |
| **Mode hors-ligne** | Fonctionne sans internet, synchronisation automatique |
| **Interface intuitive** | Formation minimale requise (< 1 heure) |
| **Multi-appareils** | Fonctionne sur PC, tablette, écran tactile |
| **Thème adaptatif** | Mode clair et sombre selon préférence |

---

## 2. Stack Technique

### 2.1 Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 16.x | Framework React fullstack |
| React | 19.x | Bibliothèque UI |
| TypeScript | 5.x | Typage statique |
| Tailwind CSS | 4.x | Styling utilitaire |
| **Radix UI Themes** | 3.x | Système de composants principal |
| Lucide React | Dernière | Icônes |
| Recharts | Dernière | Graphiques et statistiques |

### 2.2 State Management & Data Fetching

| Technologie | Usage |
|-------------|-------|
| **Zustand** | State management global (panier, UI, session, thème) |
| **TanStack Query** | Cache, fetching, synchronisation serveur |
| **nuqs** | State dans l'URL (filtres, pagination) |

### 2.3 Formulaires & Validation

| Technologie | Usage |
|-------------|-------|
| **React Hook Form** | Gestion formulaires performante |
| **Zod** | Validation schemas type-safe |
| **@hookform/resolvers** | Intégration Zod + React Hook Form |

> **Note** : Les **Server Actions** (Next.js) et **Zod** sont complémentaires. Server Actions = exécution serveur, Zod = validation des données.

### 2.4 Backend

| Technologie | Usage |
|-------------|-------|
| Next.js API Routes | API REST (impression, webhooks) |
| Next.js Server Actions | Mutations serveur (CRUD, ventes) |
| Server Components | Rendu serveur, data fetching |

### 2.5 Base de Données

| Technologie | Usage |
|-------------|-------|
| PostgreSQL | Base de données principale |
| Prisma ORM | Gestion données et migrations |
| Supabase | Hébergement prod + Auth + Realtime |

### 2.6 Authentification

| Technologie | Usage |
|-------------|-------|
| Supabase Auth | Authentification principale |
| @supabase/ssr | Auth côté serveur Next.js |
| Code PIN | Accès rapide caisse (hashé) |

### 2.7 Impression

| Technologie | Usage |
|-------------|-------|
| ESC/POS | Protocole imprimantes thermiques |
| node-thermal-printer | Bibliothèque Node.js |
| Connexions | USB, Réseau, Série, Bluetooth |

### 2.8 Utilitaires

| Technologie | Usage |
|-------------|-------|
| Sonner | Notifications toast |
| date-fns | Manipulation dates |
| idb | IndexedDB (mode hors-ligne) |
| clsx + tailwind-merge | Gestion classes CSS |

---

## 3. Design System

### 3.1 Identité Visuelle

**Couleur principale : Orange**

L'orange a été choisi pour :
- Association naturelle avec la restauration et l'appétit
- Chaleur, convivialité et énergie
- Excellente visibilité sur écrans tactiles
- Contraste optimal en modes clair et sombre
- Différenciation des concurrents (souvent bleus)

### 3.2 Typographie

**Polices Google Fonts :**

| Police | Usage | Lien |
|--------|-------|------|
| **Gabarito** | Interface, titres, navigation, boutons | [fonts.google.com/specimen/Gabarito](https://fonts.google.com/specimen/Gabarito) |
| **Google Sans Code** | Prix, quantités, montants, tickets | [fonts.google.com/specimen/Google+Sans+Code](https://fonts.google.com/specimen/Google+Sans+Code) |

**Échelle typographique :**

| Token | Taille | Poids | Usage |
|-------|--------|-------|-------|
| `xs` | 12px | 400 | Labels secondaires, mentions légales |
| `sm` | 14px | 400 | Corps compact, tableaux, badges |
| `base` | 16px | 400 | Corps texte principal |
| `lg` | 18px | 500 | Sous-titres, noms produits |
| `xl` | 20px | 600 | Titres sections |
| `2xl` | 24px | 700 | Titres pages |
| `3xl` | 30px | 800 | Total panier |
| `4xl` | 36px | 900 | KPIs dashboard, grand total |

### 3.3 Configuration Radix UI Themes

| Paramètre | Valeur |
|-----------|--------|
| `accentColor` | `orange` |
| `grayColor` | `slate` |
| `radius` | `medium` |
| `scaling` | `100%` |

### 3.4 Mode Clair

**Usage recommandé :** Environnements lumineux, journée, extérieur

**Couleurs principales :**

| Rôle | Nom | Hex | Usage |
|------|-----|-----|-------|
| **Primaire** | Orange 500 | `#F97316` | Boutons, liens, accents |
| Primaire hover | Orange 600 | `#EA580C` | États hover |
| Primaire light | Orange 100 | `#FFEDD5` | Backgrounds légers |

**Couleurs de surface :**

| Rôle | Hex | Usage |
|------|-----|-------|
| Background | `#FFFFFF` | Fond principal |
| Surface | `#F8FAFC` | Cards, zones secondaires |
| Border | `#E2E8F0` | Bordures, séparateurs |
| Text | `#0F172A` | Texte principal |
| Text muted | `#64748B` | Texte secondaire |

**Couleurs sémantiques :**

| Rôle | Couleur | Hex | Background |
|------|---------|-----|------------|
| Succès | Green 500 | `#22C55E` | `#F0FDF4` |
| Alerte | Amber 500 | `#F59E0B` | `#FFFBEB` |
| Danger | Red 500 | `#EF4444` | `#FEF2F2` |
| Info | Sky 500 | `#0EA5E9` | `#F0F9FF` |

### 3.5 Mode Sombre

**Usage recommandé :** Environnements sombres, soirée, bars/restaurants le soir

**Couleurs principales :**

| Rôle | Nom | Hex | Usage |
|------|-----|-----|-------|
| **Primaire** | Orange 500 | `#F97316` | Boutons, liens, accents |
| Primaire hover | Orange 400 | `#FB923C` | États hover (plus clair) |
| Primaire muted | Orange 950 | `#431407` | Backgrounds subtils |

**Couleurs de surface :**

| Rôle | Hex | Usage |
|------|-----|-------|
| Background | `#020617` | Fond principal |
| Surface | `#0F172A` | Cards, zones secondaires |
| Surface elevated | `#1E293B` | Éléments surélevés |
| Border | `#334155` | Bordures, séparateurs |
| Text | `#F8FAFC` | Texte principal |
| Text muted | `#94A3B8` | Texte secondaire |

**Couleurs sémantiques (mode sombre) :**

| Rôle | Couleur | Hex | Background |
|------|---------|-----|------------|
| Succès | Green 400 | `#4ADE80` | `#052E16` |
| Alerte | Amber 400 | `#FBBF24` | `#451A03` |
| Danger | Red 400 | `#F87171` | `#450A0A` |
| Info | Sky 400 | `#38BDF8` | `#082F49` |

### 3.6 Gestion des Thèmes

**Comportement :**

| Aspect | Description |
|--------|-------------|
| Détection initiale | Suit les préférences système au premier lancement |
| Persistance | Choix sauvegardé en localStorage |
| Options | Clair / Sombre / Automatique |
| Transition | 200ms sur les changements de couleur |
| Icône | Soleil/Lune dans le header |
| Pas de flash | Script bloquant pour éviter le flash au chargement |

**Recommandations par établissement :**

| Type | Thème recommandé |
|------|------------------|
| Restaurant midi | Clair |
| Restaurant soir | Sombre ou Auto |
| Bar / Nightclub | Sombre |
| Fast-food | Clair |
| Épicerie | Clair |
| Brasserie | Auto (suit l'heure) |

### 3.7 Couleurs Métier

**Statuts des tables :**

| Statut | Mode Clair | Mode Sombre | Signification |
|--------|------------|-------------|---------------|
| Libre | `#22C55E` | `#4ADE80` | Disponible |
| Occupée | `#EAB308` | `#FACC15` | Commande en cours |
| En préparation | `#3B82F6` | `#60A5FA` | Cuisine travaille |
| Addition demandée | `#F97316` | `#FB923C` | Attente paiement |
| À nettoyer | `#EF4444` | `#F87171` | À débarrasser |

**Catégories produits :**

| Catégorie | Couleur | Hex |
|-----------|---------|-----|
| Boissons | Bleu | `#3B82F6` |
| Plats | Orange | `#F97316` |
| Entrées | Vert | `#22C55E` |
| Desserts | Rose | `#EC4899` |
| Petit-déjeuner | Jaune | `#FBBF24` |

### 3.8 Espacements

| Token | Valeur | Usage |
|-------|--------|-------|
| `1` | 4px | Micro-espacements |
| `2` | 8px | Padding interne compact |
| `3` | 12px | Padding boutons |
| `4` | 16px | Espacement standard |
| `6` | 24px | Séparation sections |
| `8` | 32px | Marges conteneurs |
| `12` | 48px | Grandes séparations |

### 3.9 Rayons de Bordure

| Token | Valeur | Usage |
|-------|--------|-------|
| `sm` | 4px | Badges, petits boutons |
| `md` | 8px | Boutons, inputs |
| `lg` | 12px | Cards |
| `xl` | 16px | Modals |
| `full` | 9999px | Avatars, pills |

### 3.10 Ombres

| Token | Mode Clair | Mode Sombre | Usage |
|-------|------------|-------------|-------|
| `sm` | Légère | Subtile | Boutons, badges |
| `md` | Moyenne | Accentuée | Cards |
| `lg` | Prononcée | Forte | Modals, dropdowns |

---

## 4. Responsive Design

### 4.1 Philosophie

L'application est conçue **"Desktop-first"** car l'usage principal est sur écran tactile POS ou tablette paysage. Elle s'adapte ensuite aux écrans plus petits.

### 4.2 Breakpoints

| Nom | Largeur min | Appareils types |
|-----|-------------|-----------------|
| `xs` | 0px | Smartphones portrait |
| `sm` | 480px | Smartphones paysage |
| `md` | 640px | Petites tablettes |
| `lg` | 768px | Tablettes portrait |
| `xl` | 1024px | Tablettes paysage, laptops |
| `2xl` | 1280px | Desktop |
| `3xl` | 1536px | Grands écrans, écrans POS |

### 4.3 Appareils Cibles

#### Écran Tactile POS (Prioritaire)

| Caractéristique | Spécification |
|-----------------|---------------|
| Résolutions | 1024×768, 1280×1024, 1920×1080 |
| Orientation | Paysage fixe |
| Interaction | Tactile (doigts) |
| Taille cibles | Minimum 44×44px |

**Layout :** Sidebar permanente + zone produits + panier latéral

#### Tablette

| Caractéristique | Spécification |
|-----------------|---------------|
| Résolutions | 768×1024, 1024×1366 |
| Orientations | Portrait et paysage |
| Modèles | iPad, Samsung Tab |
| Usage | Serveurs en salle |

**Portrait :** Sidebar en drawer, panier en bas  
**Paysage :** Layout similaire au desktop

#### Laptop/Desktop

| Caractéristique | Spécification |
|-----------------|---------------|
| Résolutions | 1366×768 à 2560×1440 |
| Interaction | Souris + clavier |
| Usage | Back-office, rapports |

**Layout :** Complet avec toutes fonctionnalités

#### Smartphone (Consultation uniquement)

| Caractéristique | Spécification |
|-----------------|---------------|
| Résolutions | 375×667 à 428×926 |
| Orientation | Portrait |
| Usage | Consultation rapports, notifications |

**⚠️ Non recommandé pour la caisse** - Message d'avertissement affiché

### 4.4 Layouts par Module

#### Module Caisse

**≥1024px (Desktop/Tablette paysage) :**

```
┌──────────────────────────────────────────────────────────────┐
│ Header : Logo | Recherche | Mode | Utilisateur | Thème 🌙    │
├──────────────────────────────────────────────────────────────┤
│ Catégories : [Boissons] [Plats] [Entrées] [Desserts]         │
├─────────────────────────────────────────┬────────────────────┤
│                                         │                    │
│    Grille Produits (4-5 colonnes)       │   PANIER           │
│                                         │                    │
│    ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │   Article 1  1 200 │
│    │ IMG │ │ IMG │ │ IMG │ │ IMG │     │   Article 2  3 500 │
│    │ Nom │ │ Nom │ │ Nom │ │ Nom │     │   Article 3    800 │
│    │Prix │ │Prix │ │Prix │ │Prix │     │                    │
│    └─────┘ └─────┘ └─────┘ └─────┘     │   ────────────     │
│                                         │   Total: 5 500 F   │
│              70%                        │                    │
│                                         │   [ ENCAISSER ]    │
│                                         │        30%         │
└─────────────────────────────────────────┴────────────────────┘
```

**768-1023px (Tablette portrait) :**

```
┌────────────────────────────────┐
│ ☰  Logo  🔍  👤  🌙           │
├────────────────────────────────┤
│ [Cat1] [Cat2] [Cat3] →        │
├────────────────────────────────┤
│                                │
│  Grille Produits (3 colonnes)  │
│                                │
│  ┌─────┐ ┌─────┐ ┌─────┐      │
│  │     │ │     │ │     │      │
│  └─────┘ └─────┘ └─────┘      │
│                                │
├────────────────────────────────┤
│ 🛒 3 articles | 5 500 F        │
│ [      ENCAISSER      ]        │
└────────────────────────────────┘
```

**< 768px (Smartphone) :**

```
┌───────────────────────┐
│ ☰  Oréma N+    👤 🌙  │
├───────────────────────┤
│ ⚠️ Écran trop petit   │
│ pour le module caisse │
│                       │
│ Utilisez une tablette │
│ ou un écran plus      │
│ grand.                │
│                       │
│ [Voir les rapports]   │
└───────────────────────┘
```

#### Module Plan de Salle

**≥1024px :**

```
┌──────────────────────────────────────────────────────────────┐
│ Plan de salle | [Salle] [Terrasse] [VIP] | Légende           │
├────────────────────────────────────────────┬─────────────────┤
│                                            │                 │
│   Plan interactif avec tables              │  Détails        │
│                                            │  Table 2        │
│   ┌───┐     ┌───┐     ┌───┐               │                 │
│   │ 1 │     │ 2 │     │ 3 │               │  4 couverts     │
│   │ 🟢│     │ 🟡│     │ 🔵│               │  45 min         │
│   └───┘     └───┘     └───┘               │  12 500 F       │
│                                            │                 │
│        ┌───┐     ┌───┐                    │  [Commander]    │
│        │ 4 │     │ 5 │                    │  [Addition]     │
│        │ 🟠│     │ 🟢│                    │                 │
│        └───┘     └───┘                    │                 │
│                                            │                 │
│                 75%                        │      25%        │
└────────────────────────────────────────────┴─────────────────┘
```

**768-1023px (Tablette) :**

```
┌────────────────────────────────┐
│ [Salle] [Terrasse] [VIP]       │
├────────────────────────────────┤
│                                │
│   Plan (zoom/pan tactile)      │
│                                │
│   ┌───┐   ┌───┐   ┌───┐       │
│   │ 1 │   │ 2 │   │ 3 │       │
│   └───┘   └───┘   └───┘       │
│                                │
├────────────────────────────────┤
│ Table 2 | 🟡 | 12 500 F [Voir] │
└────────────────────────────────┘
```

**< 768px (Smartphone) :**

```
┌───────────────────────┐
│ Tables                │
├───────────────────────┤
│ 🔍 Rechercher...      │
├───────────────────────┤
│ ┌─────────────────┐   │
│ │ 🟢 Table 1      │   │
│ │    Libre        │   │
│ └─────────────────┘   │
│ ┌─────────────────┐   │
│ │ 🟡 Table 2      │   │
│ │    4 couv. │45m │   │
│ │    12 500 F     │   │
│ └─────────────────┘   │
│ ┌─────────────────┐   │
│ │ 🔵 Table 3      │   │
│ │    En prép.     │   │
│ └─────────────────┘   │
└───────────────────────┘
```

#### Module Rapports

**≥1280px :**

```
┌──────────────────────────────────────────────────────────────┐
│ Rapports | [Aujourd'hui ▼] [Semaine] [Mois] | [Exporter]     │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ CA Jour  │ │ Tickets  │ │ Panier   │ │ Marge    │        │
│  │ 485 000  │ │    47    │ │ 10 319   │ │   62%    │        │
│  │  +12%    │ │   +5     │ │  +8%     │ │  +2pts   │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────┬────────────────────────────┤
│                                 │                            │
│   Graphique évolution CA        │   Top 5 Produits           │
│          📈                     │                            │
│                                 │   1. Poulet braisé  45 000 │
│                                 │   2. Bière Flag     38 000 │
│                                 │   3. Poisson        32 000 │
│                                 │   4. Coca-Cola      28 000 │
│                                 │   5. Riz sauce      25 000 │
│                                 │                            │
│            60%                  │           40%              │
└─────────────────────────────────┴────────────────────────────┘
```

**< 1024px :**

```
┌────────────────────────────────┐
│ Rapports | [Aujourd'hui ▼]     │
├────────────────────────────────┤
│ ┌─────────────┐ ┌────────────┐ │
│ │ CA: 485 000 │ │ Tickets:47 │ │
│ └─────────────┘ └────────────┘ │
│ ┌─────────────┐ ┌────────────┐ │
│ │ Panier:10k  │ │ Marge: 62% │ │
│ └─────────────┘ └────────────┘ │
├────────────────────────────────┤
│   Graphique (pleine largeur)   │
│          📈                    │
├────────────────────────────────┤
│ Top Produits                   │
│ 1. Poulet braisé      45 000   │
│ 2. Bière Flag         38 000   │
│ 3. Poisson grillé     32 000   │
└────────────────────────────────┘
```

### 4.5 Navigation Responsive

**Desktop (≥1280px) :**
- Sidebar permanente à gauche (240px)
- Labels texte visibles
- Header avec recherche étendue

**Tablette (768-1279px) :**
- Sidebar en drawer (hamburger menu)
- Header simplifié
- Bottom bar optionnelle en mode caisse

**Mobile (< 768px) :**
- Bottom navigation bar (5 icônes max)
- Header minimal
- Pas de sidebar

### 4.6 Composants Adaptatifs

#### Grille Produits

| Breakpoint | Colonnes | Taille carte |
|------------|----------|--------------|
| xs | 2 | 140px |
| sm | 2 | 160px |
| md | 3 | 150px |
| lg | 3 | 170px |
| xl | 4 | 170px |
| 2xl | 5 | 180px |
| 3xl | 6 | 190px |

#### Tableaux de Données

| Breakpoint | Comportement |
|------------|--------------|
| ≥1024px | Tableau complet |
| 768-1023px | Colonnes prioritaires + expand |
| < 768px | Liste de cards |

#### Modals/Dialogs

| Breakpoint | Comportement |
|------------|--------------|
| ≥768px | Modal centré (max 600px) |
| < 768px | Bottom sheet plein écran |

#### Formulaires

| Breakpoint | Layout |
|------------|--------|
| ≥768px | 2 colonnes |
| < 768px | 1 colonne |

### 4.7 Touch Targets

| Élément | Minimum | Recommandé |
|---------|---------|------------|
| Boutons principaux | 44×44px | 48×48px |
| Items de liste | 44px hauteur | 56px hauteur |
| Icônes cliquables | 44×44px | 44×44px |
| Zone entre cibles | 8px | 12px |

### 4.8 Accessibilité

- Taille de police minimum 14px sur mobile
- Contraste WCAG AA respecté
- Navigation clavier préservée
- Focus visible
- Labels pour lecteurs d'écran

---

## 5. Architecture du Projet

### 5.1 Structure des Dossiers

```
gabon-pos/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── caisse/
│   │   ├── salle/
│   │   ├── produits/
│   │   ├── stocks/
│   │   ├── clients/
│   │   ├── employes/
│   │   ├── rapports/
│   │   └── parametres/
│   ├── api/
│   │   ├── print/
│   │   └── webhooks/
│   └── globals.css
├── actions/
├── components/
│   ├── ui/
│   ├── caisse/
│   ├── salle/
│   ├── produits/
│   ├── rapports/
│   ├── layout/
│   └── shared/
├── lib/
│   ├── prisma.ts
│   ├── supabase/
│   ├── print/
│   └── utils/
├── stores/
├── schemas/
├── types/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── public/
```

---

## 6. Schéma de Base de Données

### 6.1 Modèles Principaux

#### Utilisateur
- id, email, nom, prénom, téléphone
- pin (hashé), rôle, actif
- Relation : établissement

#### Établissement
- id, nom, adresse, ville, quartier
- téléphone, email, NIF, RCCM
- logo, devise (XAF), fuseau horaire
- thème par défaut (CLAIR, SOMBRE, AUTO)
- messages personnalisés

#### Catégorie
- id, nom, description, couleur, icône
- ordre, actif
- Relation : imprimante

#### Produit
- id, code, nom, description
- prixVente, prixAchat, tauxTva
- gererStock, stockActuel, stockMinimum, unité
- image, ordre, actif
- disponibilités par mode de vente
- tempsPreparation

#### Supplément
- id, nom, prix, actif
- Relation : produit

#### Table
- id, numéro, nom, capacité
- position (X, Y), dimensions, rotation, forme
- zone, actif

#### Client
- id, code, nom, prénom
- téléphone, adresse, quartier
- pointsFidélité, soldeCompte
- créditAutorisé, plafondCrédit, soldeCrédit

#### Vente
- id, numéro (YYYYMMDD00001)
- type, statut
- sousTotal, totalTva, remise, fraisLivraison, total
- modePaiement, montantReçu, montantRendu
- Relations : utilisateur, table, client, session

#### LigneVente
- id, quantité, prixUnitaire, tauxTva
- remise, total, notes
- statutPréparation

#### Paiement
- id, mode, montant, référence

#### SessionCaisse
- id, fondCaisse
- totaux par mode de paiement
- nombreVentes, écart

#### Imprimante
- id, nom, type (TICKET, CUISINE, BAR)
- connexion (USB, RESEAU, BLUETOOTH, SERIE)
- configuration technique

#### MouvementStock
- id, type, quantité
- stockAvant, stockAprès
- motif, référence

#### ZoneLivraison
- id, nom, quartiers, fraisLivraison
- délaiEstimé

### 6.2 Énumérations

**Rôles :** SUPER_ADMIN, ADMIN, MANAGER, CAISSIER, SERVEUR

**Types de vente :** DIRECT, TABLE, LIVRAISON, EMPORTER

**Statuts vente :** EN_COURS, COMMANDEE, EN_PREPARATION, PRETE, SERVIE, VALIDEE, PAYEE, ANNULEE

**Modes de paiement :** ESPECES, CARTE_BANCAIRE, AIRTEL_MONEY, MOOV_MONEY, CHEQUE, VIREMENT, COMPTE_CLIENT, MIXTE

**Statuts préparation :** EN_ATTENTE, ENVOYE, EN_PREPARATION, PRET, SERVI, ANNULE

**Types mouvement stock :** ENTREE, SORTIE, VENTE, AJUSTEMENT, PERTE, TRANSFERT, RETOUR

---

## 7. Fonctionnalités Détaillées

### 7.1 Module Caisse

#### Modes de Vente

**Vente Directe :**
- Sélection par catégories (onglets)
- Grille tactile avec images
- Panier modifiable
- Clavier numérique
- Recherche produit
- Remises (montant ou %)
- Notes par ligne
- Encaissement multi-modes

**Service à Table :**
- Plan de salle interactif
- Codes couleur des statuts
- Division d'addition
- Transfert de table
- Nombre de couverts

**Livraison :**
- Sélection/création client
- Adresse + quartier + indications
- Zone et frais automatiques
- Assignation livreur
- Suivi statut

**À Emporter :**
- Comme vente directe
- Numéro de commande

#### Paiements Supportés

| Mode | Particularités |
|------|----------------|
| Espèces | Calcul rendu, suggestions coupures FCFA |
| Carte bancaire | Saisie référence TPE |
| Airtel Money | Numéro + référence |
| Moov Money | Numéro + référence |
| Compte client | Prépaiement ou crédit |
| Mixte | Combinaison libre |

#### Raccourcis Clavier

| Touche | Action |
|--------|--------|
| F1 | Nouvelle vente |
| F2 | Recherche produit |
| F5 | Encaisser |
| F8 | Imprimer |
| F10 | Annuler |
| F12 | Ouvrir tiroir |

### 7.2 Module Produits

- CRUD complet
- Import/export CSV
- Upload images
- Gestion TVA (18%, 10%, 0%)
- Produits composés
- Suppléments
- Codes-barres

### 7.3 Module Stock

- Entrées/sorties
- Décompte automatique
- Alertes stock minimum
- Inventaire
- Historique mouvements

### 7.4 Module Clients

- Fiches complètes
- Historique achats
- Points fidélité
- Compte prépayé
- Crédit autorisé

### 7.5 Module Plan de Salle

- Éditeur drag & drop
- Formes multiples
- Zones configurables
- Vue temps réel

### 7.6 Module Rapports

**Rapport Z :**
- Fond de caisse
- Totaux par mode
- Annulations
- Écart

**Statistiques :**
- CA par période
- Top produits
- Heures de pointe
- Marges

**Exports :** PDF, Excel, CSV

### 7.7 Module Administration

- Gestion utilisateurs (RBAC)
- Configuration établissement
- Paramètres fiscaux
- Imprimantes
- Thème par défaut
- Zones de livraison

---

## 8. Impression Multi-Imprimantes

### 8.1 Architecture

```
APPLICATION
    │
    ├── Imprimante CAISSE (USB) ──► Tickets clients
    ├── Imprimante CUISINE (Réseau) ──► Bons commande
    └── Imprimante BAR (Réseau) ──► Bons boissons
```

### 8.2 Types d'Impressions

| Type | Imprimante | Déclencheur |
|------|------------|-------------|
| Ticket client | Caisse | Paiement validé |
| Bon cuisine | Cuisine | Envoi commande |
| Bon bar | Bar | Envoi commande |
| Rapport Z | Caisse | Clôture session |

### 8.3 Contenu Ticket Client

- En-tête (logo, nom, adresse, NIF)
- Numéro, date, heure, caissier
- Lignes détaillées
- Sous-total, TVA, remise, total
- Mode paiement, rendu
- Message personnalisé

### 8.4 Routing par Catégorie

Chaque catégorie peut être associée à une imprimante spécifique :
- Plats → Cuisine
- Boissons → Bar
- Autres → Caisse

---

## 9. Mode Hors-Ligne

### 9.1 Principe

L'application fonctionne sans internet grâce à :
- Cache IndexedDB
- File d'attente des actions
- Synchronisation automatique

### 9.2 Données Cachées

| Donnée | Durée |
|--------|-------|
| Produits | 24h |
| Catégories | 24h |
| Clients | 24h |
| Tables | 24h |
| Config | 7 jours |

### 9.3 Indicateurs Visuels

| État | Indicateur |
|------|------------|
| En ligne | Badge vert |
| Hors ligne | Bandeau orange |
| Sync en cours | Icône animée |
| Erreur | Badge rouge |

---

## 10. Sécurité

### 10.1 Authentification

- Email + mot de passe
- Code PIN (accès rapide)
- Sessions JWT
- Timeout inactivité

### 10.2 Autorisations (RBAC)

| Rôle | Caisse | Produits | Stock | Rapports | Config |
|------|--------|----------|-------|----------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ✅ | ❌ |
| Caissier | ✅ | 👁️ | 👁️ | 👁️ | ❌ |
| Serveur | Tables | ❌ | ❌ | ❌ | ❌ |

### 10.3 Protection

- HTTPS obligatoire
- Row Level Security
- Logs d'audit
- Sauvegardes automatiques

---

## 11. Déploiement

### 11.1 Environnements

| Environnement | URL |
|---------------|-----|
| Dev | localhost:3000 |
| Staging | staging.orema-nplus.ga |
| Production | app.orema-nplus.ga |

### 11.2 Infrastructure

| Service | Fournisseur |
|---------|-------------|
| Frontend | Vercel |
| Database | Supabase |
| Storage | Supabase |
| DNS | Cloudflare |

### 11.3 CI/CD

- Push main → Production
- Push develop → Staging
- PR → Preview

---

## 12. Roadmap

### Phase 1 : MVP (8-10 semaines)

| Semaine | Livrables |
|---------|-----------|
| 1-2 | Setup, auth, base de données |
| 3-4 | Module produits |
| 5-6 | Module caisse (vente directe) |
| 7-8 | Impression, session caisse |
| 9-10 | Tests, déploiement |

### Phase 2 : Service Table (4-6 semaines)

- Plan de salle
- Gestion tables
- Bons cuisine/bar

### Phase 3 : Avancé (6-8 semaines)

- Mode livraison
- Gestion stocks
- Clients et fidélité
- Rapports complets
- Mode hors-ligne

### Phase 4 : Extensions (Futur)

- Intégration TPE
- API Mobile Money
- Multi-établissements

---

## Annexes

### Glossaire

| Terme | Définition |
|-------|------------|
| FCFA | Franc CFA (monnaie CEMAC) |
| NIF | Numéro d'Identification Fiscale |
| RCCM | Registre du Commerce |
| ESC/POS | Protocole imprimantes thermiques |
| Rapport Z | Clôture de caisse |
| TVA | Taxe 18% au Gabon |

### Références

- [Radix UI Themes](https://www.radix-ui.com/themes)
- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [Supabase](https://supabase.com/docs)
- [Gabarito Font](https://fonts.google.com/specimen/Gabarito)
- [Google Sans Code](https://fonts.google.com/specimen/Google+Sans+Code)

---

*Projet personnel de Déreck Danel NEXON*  
*Libreville, Gabon - Janvier 2026*
