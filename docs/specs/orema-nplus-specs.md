# Oréma N+ - Cahier des Charges Technique

## Logiciel de Caisse pour le Marché Gabonais

> **Oréma** signifie "le cœur" • **N+** pour Nadine & Naïla, celles qui font battre le mien

**Version:** 1.0  
**Date:** 26 janvier 2026  
**Auteur:** Déreck Danel NEXON

---

## 1. Vue d'Ensemble du Projet

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
- **Adaptation locale** : FCFA, fiscalité gabonaise, modes de paiement locaux
- **Support en français** avec assistance locale
- **Tarification accessible** au marché africain
- **Fonctionnement hors-ligne** (gestion des coupures internet/électricité)
- **Interface intuitive** avec formation minimale requise

---

## 2. Stack Technique

### 2.1 Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 16.x (dernière) | Framework React fullstack |
| React | 19.x | Bibliothèque UI |
| TypeScript | 5.x | Typage statique |
| Tailwind CSS | 4.x | Styling utilitaire |
| Shadcn/ui | Dernière | Composants UI |
| Lucide React | Dernière | Icônes |
| Recharts | Dernière | Graphiques/statistiques |

### 2.2 Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js API Routes | 16.x | API REST |
| Server Actions | - | Mutations serveur |
| Server Components | - | Rendu côté serveur |

### 2.3 Base de Données
| Technologie | Usage |
|-------------|-------|
| PostgreSQL | Base de données principale |
| Prisma ORM | Gestion des données et migrations |
| Supabase | Hébergement production + Auth + Realtime |

### 2.4 Impression
| Technologie | Usage |
|-------------|-------|
| ESC/POS | Protocole d'impression thermique |
| node-escpos | Bibliothèque Node.js |
| USB/Série/Réseau | Connexions imprimantes |

### 2.5 Outils de Développement
| Outil | Usage |
|-------|-------|
| pnpm | Gestionnaire de paquets |
| ESLint | Linting |
| Prettier | Formatage |
| Husky | Git hooks |
| Vitest | Tests unitaires |
| Playwright | Tests E2E |

---

## 3. Architecture du Projet

### 3.1 Structure des Dossiers

```
gabon-pos/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Routes authentification
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Routes protégées
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── caisse/               # Module caisse
│   │   │   ├── page.tsx          # Interface de vente
│   │   │   └── [mode]/           # Modes: direct, table, livraison
│   │   ├── salle/                # Plan de salle
│   │   ├── produits/             # Gestion produits
│   │   │   ├── page.tsx
│   │   │   ├── categories/
│   │   │   └── [id]/
│   │   ├── stocks/               # Gestion des stocks
│   │   ├── clients/              # Gestion clients
│   │   ├── employes/             # Gestion employés
│   │   ├── rapports/             # Rapports et analyses
│   │   │   ├── ventes/
│   │   │   ├── caisse/
│   │   │   └── statistiques/
│   │   └── parametres/           # Configuration
│   │       ├── general/
│   │       ├── imprimantes/
│   │       ├── paiements/
│   │       └── fiscalite/
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── produits/
│   │   ├── ventes/
│   │   ├── tickets/
│   │   ├── rapports/
│   │   └── print/
│   ├── layout.tsx
│   └── globals.css
├── components/                   # Composants React
│   ├── ui/                       # Composants Shadcn/ui
│   ├── caisse/                   # Composants caisse
│   │   ├── ProductGrid.tsx
│   │   ├── Cart.tsx
│   │   ├── PaymentModal.tsx
│   │   ├── TicketPreview.tsx
│   │   └── NumericKeypad.tsx
│   ├── salle/                    # Composants plan de salle
│   │   ├── FloorPlan.tsx
│   │   ├── TableCard.tsx
│   │   └── TableEditor.tsx
│   ├── produits/
│   ├── rapports/
│   └── shared/                   # Composants partagés
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       ├── SearchBar.tsx
│       └── LoadingSpinner.tsx
├── lib/                          # Utilitaires
│   ├── prisma.ts                 # Client Prisma
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── print/                    # Module impression
│   │   ├── escpos.ts
│   │   ├── templates/
│   │   └── drivers/
│   ├── utils/
│   │   ├── currency.ts           # Formatage FCFA
│   │   ├── date.ts
│   │   └── validation.ts
│   └── hooks/                    # Custom hooks
│       ├── useCart.ts
│       ├── usePrint.ts
│       └── useOffline.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── icons/
│   └── sounds/                   # Sons de notification
├── types/                        # Types TypeScript
│   ├── index.ts
│   ├── produit.ts
│   ├── vente.ts
│   └── utilisateur.ts
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 3.2 Schéma de Base de Données (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTHENTIFICATION & UTILISATEURS
// ============================================

model Utilisateur {
  id            String    @id @default(cuid())
  email         String    @unique
  nom           String
  prenom        String
  telephone     String?
  pin           String?   // Code PIN pour accès rapide caisse
  role          Role      @default(CAISSIER)
  actif         Boolean   @default(true)
  
  etablissement   Etablissement @relation(fields: [etablissementId], references: [id])
  etablissementId String
  
  ventes        Vente[]
  sessions      SessionCaisse[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@map("utilisateurs")
}

enum Role {
  SUPER_ADMIN
  ADMIN
  MANAGER
  CAISSIER
  SERVEUR
}

// ============================================
// ÉTABLISSEMENT
// ============================================

model Etablissement {
  id              String    @id @default(cuid())
  nom             String
  adresse         String?
  ville           String    @default("Libreville")
  telephone       String?
  email           String?
  nif             String?   // Numéro d'Identification Fiscale
  rccm            String?   // Registre du Commerce
  logo            String?
  
  // Configuration
  devise          String    @default("XAF")
  fuseauHoraire   String    @default("Africa/Libreville")
  formatTicket    String    @default("80mm")
  
  utilisateurs    Utilisateur[]
  categories      Categorie[]
  produits        Produit[]
  tables          Table[]
  ventes          Vente[]
  clients         Client[]
  sessionsCaisse  SessionCaisse[]
  imprimantes     Imprimante[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("etablissements")
}

// ============================================
// PRODUITS & CATÉGORIES
// ============================================

model Categorie {
  id              String    @id @default(cuid())
  nom             String
  description     String?
  couleur         String    @default("#3B82F6")
  icone           String?
  ordre           Int       @default(0)
  actif           Boolean   @default(true)
  
  etablissement   Etablissement @relation(fields: [etablissementId], references: [id])
  etablissementId String
  
  produits        Produit[]
  
  // Impression: vers quelle imprimante envoyer les commandes
  imprimante      Imprimante? @relation(fields: [imprimanteId], references: [id])
  imprimanteId    String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("categories")
}

model Produit {
  id              String    @id @default(cuid())
  code            String?   // Code-barres ou référence
  nom             String
  description     String?
  
  prixVente       Decimal   @db.Decimal(10, 0) // Prix en FCFA (pas de centimes)
  prixAchat       Decimal?  @db.Decimal(10, 0)
  
  // TVA Gabon: 18% standard, 10% réduit, 0% exonéré
  tauxTva         Decimal   @default(18) @db.Decimal(5, 2)
  
  // Stock
  gererStock      Boolean   @default(false)
  stockActuel     Decimal   @default(0) @db.Decimal(10, 2)
  stockMinimum    Decimal   @default(0) @db.Decimal(10, 2)
  unite           String    @default("unité") // unité, kg, litre, etc.
  
  image           String?
  couleur         String?
  ordre           Int       @default(0)
  actif           Boolean   @default(true)
  
  // Options de vente
  disponibleVenteDirect Boolean @default(true)
  disponibleTable       Boolean @default(true)
  disponibleLivraison   Boolean @default(true)
  
  categorie       Categorie @relation(fields: [categorieId], references: [id])
  categorieId     String
  
  etablissement   Etablissement @relation(fields: [etablissementId], references: [id])
  etablissementId String
  
  lignesVente     LigneVente[]
  supplements     Supplement[]
  mouvementsStock MouvementStock[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([code, etablissementId])
  @@map("produits")
}

model Supplement {
  id              String    @id @default(cuid())
  nom             String
  prix            Decimal   @db.Decimal(10, 0)
  
  produit         Produit   @relation(fields: [produitId], references: [id])
  produitId       String
  
  @@map("supplements")
}

// ============================================
// GESTION DES STOCKS
// ============================================

model MouvementStock {
  id              String    @id @default(cuid())
  type            TypeMouvement
  quantite        Decimal   @db.Decimal(10, 2)
  stockAvant      Decimal   @db.Decimal(10, 2)
  stockApres      Decimal   @db.Decimal(10, 2)
  motif           String?
  reference       String?   // Numéro de bon, facture, etc.
  
  produit         Produit   @relation(fields: [produitId], references: [id])
  produitId       String
  
  createdAt       DateTime  @default(now())
  
  @@map("mouvements_stock")
}

enum TypeMouvement {
  ENTREE          // Réception marchandise
  SORTIE          // Sortie manuelle
  VENTE           // Vente (automatique)
  AJUSTEMENT      // Inventaire
  PERTE           // Casse, péremption
  TRANSFERT       // Transfert entre établissements
}

// ============================================
// PLAN DE SALLE & TABLES
// ============================================

model Table {
  id              String    @id @default(cuid())
  numero          String
  nom             String?   // Ex: "Terrasse 1", "VIP"
  capacite        Int       @default(4)
  
  // Position sur le plan (pour l'éditeur visuel)
  positionX       Int       @default(0)
  positionY       Int       @default(0)
  largeur         Int       @default(100)
  hauteur         Int       @default(100)
  forme           FormeTable @default(RECTANGLE)
  
  zone            String?   // Salle, Terrasse, VIP, etc.
  actif           Boolean   @default(true)
  
  etablissement   Etablissement @relation(fields: [etablissementId], references: [id])
  etablissementId String
  
  ventes          Vente[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([numero, etablissementId])
  @@map("tables")
}

enum FormeTable {
  RECTANGLE
  CARRE
  ROND
  OVALE
}

// ============================================
// CLIENTS
// ============================================

model Client {
  id              String    @id @default(cuid())
  nom             String
  prenom          String?
  telephone       String?
  email           String?
  adresse         String?
  quartier        String?   // Important pour livraisons au Gabon
  
  // Système de fidélité
  pointsFidelite  Int       @default(0)
  soldeCompte     Decimal   @default(0) @db.Decimal(10, 0) // Compte prépayé
  
  notes           String?
  
  etablissement   Etablissement @relation(fields: [etablissementId], references: [id])
  etablissementId String
  
  ventes          Vente[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("clients")
}

// ============================================
// VENTES & TICKETS
// ============================================

model Vente {
  id              String    @id @default(cuid())
  numero          String    // Numéro de ticket unique
  
  type            TypeVente @default(DIRECT)
  statut          StatutVente @default(EN_COURS)
  
  // Montants en FCFA
  sousTotal       Decimal   @db.Decimal(10, 0)
  totalTva        Decimal   @db.Decimal(10, 0)
  remise          Decimal   @default(0) @db.Decimal(10, 0)
  remiseType      TypeRemise @default(MONTANT)
  total           Decimal   @db.Decimal(10, 0)
  
  // Paiements
  modePaiement    ModePaiement?
  montantRecu     Decimal?  @db.Decimal(10, 0)
  montantRendu    Decimal?  @db.Decimal(10, 0)
  
  // Pour Mobile Money
  referenceTransac String?
  
  notes           String?
  
  // Relations
  utilisateur     Utilisateur @relation(fields: [utilisateurId], references: [id])
  utilisateurId   String
  
  etablissement   Etablissement @relation(fields: [etablissementId], references: [id])
  etablissementId String
  
  table           Table?    @relation(fields: [tableId], references: [id])
  tableId         String?
  
  client          Client?   @relation(fields: [clientId], references: [id])
  clientId        String?
  
  sessionCaisse   SessionCaisse? @relation(fields: [sessionCaisseId], references: [id])
  sessionCaisseId String?
  
  lignes          LigneVente[]
  paiements       Paiement[]
  
  // Pour livraisons
  adresseLivraison String?
  telephoneLivraison String?
  fraisLivraison  Decimal   @default(0) @db.Decimal(10, 0)
  
  ouverteAt       DateTime  @default(now())
  clotureAt       DateTime?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("ventes")
}

model LigneVente {
  id              String    @id @default(cuid())
  
  quantite        Decimal   @db.Decimal(10, 2)
  prixUnitaire    Decimal   @db.Decimal(10, 0)
  tauxTva         Decimal   @db.Decimal(5, 2)
  
  remise          Decimal   @default(0) @db.Decimal(10, 0)
  total           Decimal   @db.Decimal(10, 0)
  
  notes           String?   // Instructions spéciales
  
  // Statut préparation (pour cuisine)
  statutPreparation StatutPreparation @default(EN_ATTENTE)
  
  vente           Vente     @relation(fields: [venteId], references: [id], onDelete: Cascade)
  venteId         String
  
  produit         Produit   @relation(fields: [produitId], references: [id])
  produitId       String
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("lignes_vente")
}

enum TypeVente {
  DIRECT          // Vente au comptoir
  TABLE           // Service à table
  LIVRAISON       // Livraison
  EMPORTER        // À emporter
}

enum StatutVente {
  EN_COURS        // Vente en cours
  VALIDEE         // Validée, en attente paiement
  PAYEE           // Payée
  ANNULEE         // Annulée
}

enum TypeRemise {
  MONTANT         // Remise en FCFA
  POURCENTAGE     // Remise en %
}

enum ModePaiement {
  ESPECES
  CARTE_BANCAIRE
  MOBILE_MONEY    // Airtel Money, Moov Money
  CHEQUE
  VIREMENT
  COMPTE_CLIENT   // Prépaiement
  MIXTE           // Plusieurs modes
}

enum StatutPreparation {
  EN_ATTENTE
  EN_PREPARATION
  PRET
  SERVI
}

// ============================================
// PAIEMENTS (pour paiements multiples)
// ============================================

model Paiement {
  id              String    @id @default(cuid())
  
  mode            ModePaiement
  montant         Decimal   @db.Decimal(10, 0)
  reference       String?   // Référence transaction
  
  vente           Vente     @relation(fields: [venteId], references: [id], onDelete: Cascade)
  venteId         String
  
  createdAt       DateTime  @default(now())
  
  @@map("paiements")
}

// ============================================
// SESSIONS DE CAISSE
// ============================================

model SessionCaisse {
  id              String    @id @default(cuid())
  
  fondCaisse      Decimal   @db.Decimal(10, 0) // Fond de caisse initial
  
  // Totaux calculés
  totalEspeces    Decimal   @default(0) @db.Decimal(10, 0)
  totalCartes     Decimal   @default(0) @db.Decimal(10, 0)
  totalMobileMoney Decimal  @default(0) @db.Decimal(10, 0)
  totalAutres     Decimal   @default(0) @db.Decimal(10, 0)
  
  // Clôture
  espècesComptees Decimal?  @db.Decimal(10, 0)
  ecart           Decimal?  @db.Decimal(10, 0)
  notes           String?
  
  utilisateur     Utilisateur @relation(fields: [utilisateurId], references: [id])
  utilisateurId   String
  
  etablissement   Etablissement @relation(fields: [etablissementId], references: [id])
  etablissementId String
  
  ventes          Vente[]
  
  ouverteAt       DateTime  @default(now())
  clotureAt       DateTime?
  
  @@map("sessions_caisse")
}

// ============================================
// IMPRIMANTES
// ============================================

model Imprimante {
  id              String    @id @default(cuid())
  nom             String
  type            TypeImprimante @default(TICKET)
  
  // Connexion
  connexion       TypeConnexion @default(USB)
  adresseIp       String?
  port            Int?
  cheminUsb       String?   // /dev/usb/lp0 ou nom Windows
  
  // Configuration
  largeurPapier   Int       @default(80) // 58mm ou 80mm
  actif           Boolean   @default(true)
  parDefaut       Boolean   @default(false)
  
  etablissement   Etablissement @relation(fields: [etablissementId], references: [id])
  etablissementId String
  
  categories      Categorie[] // Catégories qui impriment sur cette imprimante
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("imprimantes")
}

enum TypeImprimante {
  TICKET          // Imprimante ticket de caisse
  CUISINE         // Imprimante cuisine
  BAR             // Imprimante bar
}

enum TypeConnexion {
  USB
  RESEAU
  BLUETOOTH
  SERIE
}
```

---

## 4. Fonctionnalités Détaillées

### 4.1 Module Caisse (MVP)

#### 4.1.1 Modes de Vente

**Mode Vente Directe**
- Sélection rapide des produits par catégories
- Affichage grille tactile avec images
- Panier avec modification quantités
- Clavier numérique pour saisie manuelle
- Recherche produit par nom/code
- Application remises (montant ou %)
- Encaissement multi-modes

**Mode Service à Table**
- Plan de salle interactif
- Code couleur des tables:
  - 🟢 Libre
  - 🟡 Occupée (commande en cours)
  - 🔵 En préparation
  - 🟠 Addition demandée
  - 🔴 À nettoyer
- Ajout/modification commandes
- Division d'addition
- Transfert de table

**Mode Livraison**
- Saisie coordonnées client
- Gestion adresse + quartier
- Frais de livraison configurables
- Suivi statut commande
- Historique client

#### 4.1.2 Paiements

| Mode | Spécificités |
|------|-------------|
| Espèces | Calcul rendu monnaie, coupures suggérées |
| Carte Bancaire | Intégration TPE (futur) |
| Mobile Money | Airtel Money, Moov Money - saisie référence |
| Compte Client | Prépaiement, solde affiché |
| Mixte | Combinaison de modes |

#### 4.1.3 Impression Tickets

**Ticket de Caisse**
```
================================
      [LOGO ÉTABLISSEMENT]
        NOM ÉTABLISSEMENT
      Adresse, Téléphone
      NIF: XXXXXXXX
================================
Ticket N°: 2026012600001
Date: 26/01/2026 14:30
Caissier: Jean D.
Table: 5 (Terrasse)
--------------------------------
Qté  Article          Prix
--------------------------------
2    Poulet braisé    12 000
1    Bière Flag       1 500
3    Coca-Cola        1 500
--------------------------------
Sous-total:          15 000 FCFA
TVA (18%):            2 700 FCFA
================================
TOTAL:               17 700 FCFA
================================
Espèces:             20 000 FCFA
Rendu:                2 300 FCFA
--------------------------------
    Merci de votre visite !
         À bientôt !
================================
```

**Ticket Cuisine**
```
*** COMMANDE CUISINE ***
Ticket: 2026012600001
Table: 5 | 14:30
--------------------------------
[x2] POULET BRAISE
     > Bien cuit
     > Sans piment

[x1] POISSON GRILLE
--------------------------------
Serveur: Marie K.
```

### 4.2 Module Gestion Produits

- CRUD complet produits/catégories
- Import/export CSV
- Gestion images (upload, compression)
- Gestion prix et TVA
- Produits composés (menus)
- Suppléments et options
- Codes-barres (scan futur)

### 4.3 Module Gestion Stock

- Entrées de stock (réception)
- Sorties manuelles
- Décompte automatique sur vente
- Alertes stock minimum
- Historique mouvements
- Inventaire avec ajustements

### 4.4 Module Rapports

**Rapport Z (Clôture Caisse)**
- Fond de caisse
- Ventes par mode de paiement
- Écart de caisse
- Détail par catégorie

**Statistiques**
- CA journalier/hebdo/mensuel
- Meilleures ventes
- Heures de pointe
- Performance employés
- Marges par produit

### 4.5 Module Administration

- Gestion utilisateurs et droits
- Configuration établissement
- Paramètres fiscaux (TVA)
- Configuration imprimantes
- Personnalisation tickets
- Sauvegardes

---

## 5. Spécifications Techniques Détaillées

### 5.1 Impression ESC/POS

```typescript
// lib/print/escpos.ts

import { Printer } from 'escpos';
import USB from 'escpos-usb';
import Network from 'escpos-network';

interface PrinterConfig {
  type: 'USB' | 'NETWORK' | 'SERIAL';
  address?: string;
  port?: number;
  path?: string;
  width: 58 | 80;
}

export class TicketPrinter {
  private device: any;
  private printer: Printer;
  private config: PrinterConfig;

  constructor(config: PrinterConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    switch (this.config.type) {
      case 'USB':
        this.device = new USB();
        break;
      case 'NETWORK':
        this.device = new Network(this.config.address!, this.config.port);
        break;
    }
    
    this.printer = new Printer(this.device, {
      encoding: 'CP850', // Support caractères français
      width: this.config.width === 80 ? 48 : 32
    });
  }

  async printTicket(vente: Vente): Promise<void> {
    await this.connect();
    
    return new Promise((resolve, reject) => {
      this.device.open((err: Error) => {
        if (err) return reject(err);

        this.printer
          .align('CT')
          .style('B')
          .size(2, 2)
          .text(vente.etablissement.nom)
          .size(1, 1)
          .style('NORMAL')
          .text(vente.etablissement.adresse || '')
          .text(`Tel: ${vente.etablissement.telephone || ''}`)
          .text(`NIF: ${vente.etablissement.nif || ''}`)
          .drawLine()
          .align('LT')
          .text(`Ticket: ${vente.numero}`)
          .text(`Date: ${formatDate(vente.createdAt)}`)
          .text(`Caissier: ${vente.utilisateur.prenom}`)
          .drawLine();

        // Lignes de vente
        vente.lignes.forEach(ligne => {
          const prix = formatCurrency(ligne.total);
          this.printer
            .tableCustom([
              { text: `${ligne.quantite}x`, align: 'LEFT', width: 0.1 },
              { text: ligne.produit.nom, align: 'LEFT', width: 0.6 },
              { text: prix, align: 'RIGHT', width: 0.3 }
            ]);
        });

        this.printer
          .drawLine()
          .align('RT')
          .text(`Sous-total: ${formatCurrency(vente.sousTotal)} FCFA`)
          .text(`TVA: ${formatCurrency(vente.totalTva)} FCFA`)
          .style('B')
          .size(1, 2)
          .text(`TOTAL: ${formatCurrency(vente.total)} FCFA`)
          .size(1, 1)
          .style('NORMAL')
          .drawLine()
          .align('CT')
          .text('Merci de votre visite !')
          .text('À bientôt !')
          .feed(4)
          .cut()
          .close();

        resolve();
      });
    });
  }
}

// Formatage FCFA (sans décimales)
function formatCurrency(amount: number | Decimal): string {
  return new Intl.NumberFormat('fr-GA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(amount));
}
```

### 5.2 Gestion Hors-Ligne (PWA)

```typescript
// lib/hooks/useOffline.ts

import { useState, useEffect } from 'react';
import { openDB, IDBPDatabase } from 'idb';

interface OfflineVente {
  id: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState<number>(0);
  const [db, setDb] = useState<IDBPDatabase | null>(null);

  useEffect(() => {
    // Initialiser IndexedDB
    const initDB = async () => {
      const database = await openDB('gabon-pos-offline', 1, {
        upgrade(db) {
          db.createObjectStore('ventes', { keyPath: 'id' });
          db.createObjectStore('produits', { keyPath: 'id' });
        }
      });
      setDb(database);
    };

    initDB();

    // Écouter les changements de connexion
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sauvegarder vente hors-ligne
  const saveOfflineVente = async (vente: any) => {
    if (!db) return;
    
    await db.put('ventes', {
      id: `offline-${Date.now()}`,
      data: vente,
      timestamp: Date.now(),
      synced: false
    });
    
    setPendingSync(prev => prev + 1);
  };

  // Synchroniser quand connexion rétablie
  const syncPendingVentes = async () => {
    if (!db || !isOnline) return;
    
    const tx = db.transaction('ventes', 'readwrite');
    const store = tx.objectStore('ventes');
    const pending = await store.getAll();
    
    for (const item of pending.filter(v => !v.synced)) {
      try {
        // Envoyer au serveur
        await fetch('/api/ventes/sync', {
          method: 'POST',
          body: JSON.stringify(item.data)
        });
        
        // Marquer comme synchronisé
        item.synced = true;
        await store.put(item);
        setPendingSync(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Sync error:', error);
      }
    }
  };

  useEffect(() => {
    if (isOnline && pendingSync > 0) {
      syncPendingVentes();
    }
  }, [isOnline]);

  return {
    isOnline,
    pendingSync,
    saveOfflineVente,
    syncPendingVentes
  };
}
```

### 5.3 API Routes Next.js

```typescript
// app/api/ventes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET - Liste des ventes
export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const dateDebut = searchParams.get('dateDebut');
  const dateFin = searchParams.get('dateFin');

  const where = {
    etablissementId: session.user.etablissementId,
    ...(dateDebut && dateFin && {
      createdAt: {
        gte: new Date(dateDebut),
        lte: new Date(dateFin)
      }
    })
  };

  const [ventes, total] = await Promise.all([
    prisma.vente.findMany({
      where,
      include: {
        lignes: { include: { produit: true } },
        utilisateur: { select: { nom: true, prenom: true } },
        table: { select: { numero: true } },
        client: { select: { nom: true, prenom: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.vente.count({ where })
  ]);

  return NextResponse.json({
    data: ventes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}

// POST - Créer une vente
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await request.json();

  // Générer numéro de ticket unique
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  const lastVente = await prisma.vente.findFirst({
    where: {
      etablissementId: session.user.etablissementId,
      numero: { startsWith: dateStr }
    },
    orderBy: { numero: 'desc' }
  });

  const sequence = lastVente 
    ? parseInt(lastVente.numero.slice(-5)) + 1 
    : 1;
  
  const numero = `${dateStr}${sequence.toString().padStart(5, '0')}`;

  // Calculer totaux
  const lignes = body.lignes.map((l: any) => ({
    ...l,
    total: l.quantite * l.prixUnitaire - (l.remise || 0)
  }));

  const sousTotal = lignes.reduce((sum: number, l: any) => sum + l.total, 0);
  const totalTva = lignes.reduce((sum: number, l: any) => 
    sum + (l.total * Number(l.tauxTva) / 100), 0
  );

  const remiseAmount = body.remiseType === 'POURCENTAGE'
    ? sousTotal * (body.remise / 100)
    : body.remise || 0;

  const total = sousTotal + totalTva - remiseAmount + (body.fraisLivraison || 0);

  // Créer la vente
  const vente = await prisma.vente.create({
    data: {
      numero,
      type: body.type,
      statut: body.modePaiement ? 'PAYEE' : 'EN_COURS',
      sousTotal: Math.round(sousTotal),
      totalTva: Math.round(totalTva),
      remise: Math.round(remiseAmount),
      remiseType: body.remiseType || 'MONTANT',
      total: Math.round(total),
      modePaiement: body.modePaiement,
      montantRecu: body.montantRecu,
      montantRendu: body.montantRecu ? body.montantRecu - total : null,
      notes: body.notes,
      utilisateurId: session.user.id,
      etablissementId: session.user.etablissementId,
      tableId: body.tableId,
      clientId: body.clientId,
      sessionCaisseId: body.sessionCaisseId,
      adresseLivraison: body.adresseLivraison,
      telephoneLivraison: body.telephoneLivraison,
      fraisLivraison: body.fraisLivraison || 0,
      clotureAt: body.modePaiement ? new Date() : null,
      lignes: {
        create: lignes.map((l: any) => ({
          produitId: l.produitId,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          tauxTva: l.tauxTva,
          remise: l.remise || 0,
          total: l.total,
          notes: l.notes
        }))
      }
    },
    include: {
      lignes: { include: { produit: true } },
      utilisateur: true,
      etablissement: true
    }
  });

  // Décrémenter stock si applicable
  for (const ligne of lignes) {
    const produit = await prisma.produit.findUnique({
      where: { id: ligne.produitId }
    });
    
    if (produit?.gererStock) {
      await prisma.produit.update({
        where: { id: ligne.produitId },
        data: {
          stockActuel: { decrement: ligne.quantite }
        }
      });

      await prisma.mouvementStock.create({
        data: {
          type: 'VENTE',
          quantite: -ligne.quantite,
          stockAvant: Number(produit.stockActuel),
          stockApres: Number(produit.stockActuel) - ligne.quantite,
          reference: vente.numero,
          produitId: ligne.produitId
        }
      });
    }
  }

  return NextResponse.json(vente, { status: 201 });
}
```

---

## 6. Interface Utilisateur

### 6.1 Design System

**Couleurs**
```css
/* Couleurs principales */
--primary: #2563EB;        /* Bleu principal */
--primary-dark: #1D4ED8;
--secondary: #10B981;      /* Vert succès */
--danger: #EF4444;         /* Rouge erreur */
--warning: #F59E0B;        /* Orange alerte */

/* Statuts tables */
--table-libre: #22C55E;
--table-occupee: #EAB308;
--table-preparation: #3B82F6;
--table-addition: #F97316;
--table-nettoyer: #EF4444;

/* Neutres */
--background: #F8FAFC;
--surface: #FFFFFF;
--text: #1E293B;
--text-muted: #64748B;
--border: #E2E8F0;
```

**Typographie**
```css
--font-family: 'Inter', sans-serif;
--font-size-xs: 0.75rem;   /* 12px */
--font-size-sm: 0.875rem;  /* 14px */
--font-size-base: 1rem;    /* 16px */
--font-size-lg: 1.125rem;  /* 18px */
--font-size-xl: 1.25rem;   /* 20px */
--font-size-2xl: 1.5rem;   /* 24px */
```

### 6.2 Composants Principaux

**Grille Produits (Caisse)**
- Cards tactiles 120x120px minimum
- Image produit + nom + prix
- Indicateur stock faible
- Animation au clic
- Support scroll fluide

**Panier**
- Liste items avec +/- quantité
- Suppression par swipe
- Sous-total en temps réel
- Bouton remise
- Bouton paiement proéminent

**Plan de Salle**
- Drag & drop tables
- Zoom/pan
- Filtres par zone
- Mise à jour temps réel

### 6.3 Responsive Design

| Breakpoint | Usage |
|------------|-------|
| < 640px | Mobile (non recommandé pour caisse) |
| 640-1024px | Tablette portrait |
| 1024-1280px | Tablette paysage / petit écran |
| > 1280px | Desktop / écran tactile |

---

## 7. Sécurité

### 7.1 Authentification
- Supabase Auth (email/password)
- Code PIN pour accès rapide caisse
- Sessions sécurisées (JWT)
- Timeout d'inactivité configurable

### 7.2 Autorisations (RBAC)

| Rôle | Droits |
|------|--------|
| Super Admin | Tout |
| Admin | Établissement complet |
| Manager | Rapports, config produits |
| Caissier | Ventes, consultation |
| Serveur | Tables, commandes |

### 7.3 Protection des Données
- Chiffrement en transit (HTTPS)
- Row Level Security (Supabase)
- Logs d'audit actions sensibles
- Sauvegardes automatiques

---

## 8. Déploiement

### 8.1 Environnements

| Environnement | URL | Base de données |
|---------------|-----|-----------------|
| Développement | localhost:3000 | Supabase local |
| Staging | staging.orema-nplus.ga | Supabase staging |
| Production | app.orema-nplus.ga | Supabase production |

### 8.2 Variables d'Environnement

```env
# .env.local

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Oréma N+

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000
```

### 8.3 CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: pnpm install
        
      - name: Run tests
        run: pnpm test
        
      - name: Build
        run: pnpm build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 9. Roadmap

### Phase 1 - MVP (2-3 mois)
- [x] Architecture projet
- [ ] Authentification basique
- [ ] CRUD Produits/Catégories
- [ ] Module caisse (vente directe)
- [ ] Impression tickets ESC/POS
- [ ] Rapport Z de caisse

### Phase 2 - Service Table (1-2 mois)
- [ ] Plan de salle éditeur
- [ ] Gestion tables
- [ ] Ticket cuisine
- [ ] Statuts préparation

### Phase 3 - Avancé (2-3 mois)
- [ ] Mode livraison
- [ ] Gestion stocks complète
- [ ] Clients & fidélité
- [ ] Rapports avancés
- [ ] Multi-établissements

### Phase 4 - Intégrations (Futur)
- [ ] Terminal paiement (TPE)
- [ ] Mobile Money API
- [ ] Comptabilité export
- [ ] Application mobile serveur
- [ ] Écran cuisine dédié

---

## 10. Estimation Budget

### Développement
| Poste | Estimation |
|-------|------------|
| MVP (Phase 1) | 40-60h |
| Phase 2 | 30-40h |
| Phase 3 | 40-50h |
| Tests & corrections | 20-30h |
| **Total** | **130-180h** |

### Infrastructure (mensuel)
| Service | Coût |
|---------|------|
| Supabase Free | 0 € |
| Supabase Pro (si besoin) | ~25 €/mois |
| Vercel Free | 0 € |
| Vercel Pro (si besoin) | ~20 €/mois |
| Domaine .ga | ~15 €/an |

---

## 11. Conclusion

Ce cahier des charges définit les bases d'un logiciel de caisse moderne, adapté au marché gabonais. L'architecture choisie (Next.js + Supabase) permet :

- **Développement rapide** avec un seul langage (TypeScript)
- **Coûts réduits** grâce aux services cloud gratuits/abordables
- **Scalabilité** pour grandir avec la demande
- **Maintenance simplifiée** avec une stack moderne

Le MVP peut être opérationnel en 2-3 mois, offrant une solution fonctionnelle pour les premiers clients tout en permettant des évolutions futures.

---

*Document généré pour ODILLON Ingénierie d'Entreprises*  
*Libreville, Gabon - Janvier 2026*
