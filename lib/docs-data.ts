import type {
  LucideIcon} from "lucide-react";
import {
  Rocket,
  Settings,
  CreditCard,
  Database,
  Users,
  Printer,
  BarChart3,
  Shield,
  Code
} from "lucide-react";

export interface DocArticle {
  slug: string;
  title: string;
  description: string;
  readTime: string;
  content: string;
}

export interface DocCategory {
  slug: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  articles: DocArticle[];
}

export const docsCategories: DocCategory[] = [
  {
    slug: "demarrage",
    icon: Rocket,
    title: "Démarrage rapide",
    description: "Premiers pas avec Oréma N+",
    color: "green",
    articles: [
      {
        slug: "installation-configuration",
        title: "Installation et configuration",
        description: "Guide complet pour installer et configurer Oréma N+ sur votre système",
        readTime: "5 min",
        content: `
## Installation et configuration

Bienvenue dans le guide d'installation d'Oréma N+ ! Ce guide vous accompagnera pas à pas dans la mise en place de votre système de caisse.

### Prérequis

Avant de commencer, assurez-vous d'avoir :
- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Une connexion Internet stable
- Un écran d'au moins 1024x768 pixels (tablette ou ordinateur)

### Étape 1 : Créer votre compte

1. Rendez-vous sur **orema-nplus.ga/register**
2. Remplissez le formulaire avec vos informations
3. Validez votre adresse email en cliquant sur le lien reçu
4. Connectez-vous à votre espace

### Étape 2 : Configurer votre établissement

Une fois connecté, vous serez guidé pour créer votre premier établissement :

- **Nom de l'établissement** : Le nom qui apparaîtra sur vos tickets
- **Adresse** : L'adresse complète de votre commerce
- **NIF** : Votre Numéro d'Identification Fiscale
- **RCCM** : Votre numéro au Registre du Commerce

### Étape 3 : Personnaliser les paramètres

Accédez à **Paramètres > Général** pour :
- Configurer votre devise (FCFA par défaut)
- Définir votre fuseau horaire (Africa/Libreville)
- Ajouter votre logo
- Personnaliser vos tickets de caisse

### Prochaines étapes

Une fois l'installation terminée, consultez nos guides pour :
- Ajouter vos premiers produits
- Configurer votre imprimante
- Former votre équipe

> **Conseil** : Prenez le temps de bien configurer votre établissement dès le départ. Ces informations apparaîtront sur tous vos documents officiels.
        `,
      },
      {
        slug: "premier-etablissement",
        title: "Créer votre premier établissement",
        description: "Configurez les informations de base de votre commerce",
        readTime: "3 min",
        content: `
## Créer votre premier établissement

Votre établissement est le cœur de votre configuration Oréma N+. Toutes les données (produits, ventes, rapports) sont liées à un établissement.

### Informations requises

| Champ | Description | Obligatoire |
|-------|-------------|-------------|
| Nom | Nom commercial de votre établissement | Oui |
| Adresse | Adresse physique complète | Oui |
| Téléphone | Numéro de contact | Oui |
| NIF | Numéro d'Identification Fiscale | Oui |
| RCCM | Registre du Commerce | Non |

### Étapes de création

1. **Accédez aux paramètres** via le menu latéral
2. **Cliquez sur "Établissement"** dans le sous-menu
3. **Remplissez le formulaire** avec vos informations
4. **Uploadez votre logo** (format PNG ou JPG, max 2MB)
5. **Enregistrez** vos modifications

### Conseils

- Utilisez le nom commercial exact pour vos documents fiscaux
- Vérifiez l'orthographe de l'adresse (elle apparaît sur les tickets)
- Le logo sera redimensionné automatiquement pour l'impression

### Multi-établissements

Avec le plan Business, vous pouvez gérer plusieurs établissements depuis un seul compte. Chaque établissement a :
- Ses propres produits et tarifs
- Son propre stock
- Ses propres rapports
- Son équipe dédiée
        `,
      },
      {
        slug: "ajouter-produits",
        title: "Ajouter vos produits",
        description: "Créez votre catalogue de produits et services",
        readTime: "10 min",
        content: `
## Ajouter vos produits

Un catalogue bien organisé est essentiel pour une utilisation efficace de votre caisse. Ce guide vous montre comment structurer et ajouter vos produits.

### Créer des catégories

Avant d'ajouter des produits, créez vos catégories :

1. Allez dans **Produits > Catégories**
2. Cliquez sur **"Nouvelle catégorie"**
3. Définissez :
   - Nom de la catégorie
   - Couleur d'affichage
   - Imprimante associée (cuisine, bar, etc.)

**Exemples de catégories :**
- Boissons chaudes
- Boissons fraîches
- Entrées
- Plats principaux
- Desserts
- Alcools

### Ajouter un produit manuellement

1. Allez dans **Produits > Liste des produits**
2. Cliquez sur **"Nouveau produit"**
3. Remplissez les informations :

\`\`\`
Nom : Poulet braisé
Catégorie : Plats principaux
Prix de vente : 5 500 FCFA
TVA : 18% (standard)
Code-barres : (optionnel)
Description : Poulet braisé servi avec alloco
\`\`\`

### Import CSV

Pour un import massif de produits :

1. Téléchargez notre **modèle CSV**
2. Remplissez-le avec vos produits
3. Importez via **Produits > Importer**

Format du fichier CSV :
\`\`\`csv
nom,categorie,prix,tva,stock,description
Poulet braisé,Plats,5500,18,50,Poulet braisé avec alloco
Coca-Cola 33cl,Boissons,1000,18,100,Coca-Cola canette
\`\`\`

### Gestion des variantes

Pour les produits avec options (tailles, suppléments) :

1. Créez le produit principal
2. Ajoutez des **modificateurs** :
   - Supplément fromage (+500 FCFA)
   - Grande portion (+1000 FCFA)
   - Sans piment (gratuit)

### Conseils d'organisation

> **Astuce** : Commencez par vos 20 produits les plus vendus. Vous pourrez ajouter les autres progressivement.

- Utilisez des noms courts et clairs
- Organisez par catégories logiques
- Attribuez des codes-barres pour un scan rapide
        `,
      },
      {
        slug: "configurer-paiements",
        title: "Configurer vos modes de paiement",
        description: "Activez les moyens de paiement acceptés par votre commerce",
        readTime: "5 min",
        content: `
## Configurer vos modes de paiement

Oréma N+ supporte une grande variété de moyens de paiement adaptés au marché gabonais.

### Modes de paiement disponibles

| Mode | Description | Configuration |
|------|-------------|---------------|
| Espèces | Paiement cash | Activé par défaut |
| Carte bancaire | Via terminal externe | Activer dans paramètres |
| Airtel Money | Mobile Money Airtel | Numéro marchand requis |
| Moov Money | Mobile Money Moov | Numéro marchand requis |
| Chèque | Paiement par chèque | Activer dans paramètres |
| Compte client | Crédit client | Configurer les limites |

### Configurer Mobile Money

#### Airtel Money

1. Allez dans **Paramètres > Paiements**
2. Activez **Airtel Money**
3. Entrez votre **numéro marchand**
4. Testez avec une petite transaction

#### Moov Money

1. Allez dans **Paramètres > Paiements**
2. Activez **Moov Money**
3. Entrez votre **numéro marchand**
4. Testez avec une petite transaction

### Paiement mixte

Vos clients peuvent payer avec plusieurs moyens :

**Exemple :**
- Total : 15 000 FCFA
- Espèces : 10 000 FCFA
- Airtel Money : 5 000 FCFA

Le système enregistre chaque partie du paiement avec sa référence.

### Compte client (Crédit)

Pour les clients réguliers de confiance :

1. Créez le client dans **Clients > Nouveau**
2. Activez **"Autoriser le crédit"**
3. Définissez la **limite de crédit**
4. Suivez les soldes dans **Clients > Comptes**

### Sécurité des paiements

- Toutes les transactions sont enregistrées avec horodatage
- Les références Mobile Money sont stockées pour le rapprochement
- Accès aux rapports de paiement pour vérification
        `,
      },
    ],
  },
  {
    slug: "configuration",
    icon: Settings,
    title: "Configuration",
    description: "Personnalisez votre système",
    color: "blue",
    articles: [
      {
        slug: "parametres-generaux",
        title: "Paramètres généraux",
        description: "Configurez les options de base de votre système",
        readTime: "8 min",
        content: `
## Paramètres généraux

Les paramètres généraux définissent le comportement global de votre système Oréma N+.

### Accéder aux paramètres

1. Cliquez sur **Paramètres** dans le menu latéral
2. Sélectionnez **Général**

### Options disponibles

#### Informations de l'établissement
- Nom commercial
- Adresse complète
- Téléphone et email
- Logo (pour tickets et rapports)

#### Localisation
- **Devise** : FCFA (Franc CFA) - par défaut
- **Fuseau horaire** : Africa/Libreville
- **Langue** : Français
- **Format de date** : JJ/MM/AAAA

#### Options de caisse
- **Ouverture de caisse obligatoire** : Exiger un fond de caisse au démarrage
- **Fermeture automatique** : Fermer les sessions après X heures
- **Impression automatique** : Imprimer le ticket après chaque vente
- **Son de validation** : Jouer un son lors de la validation

#### Numérotation des tickets
- **Format** : AAAAMMJJ00001
- **Réinitialisation** : Quotidienne
- **Préfixe** : Personnalisable par établissement

### Sauvegarder les modifications

N'oubliez pas de cliquer sur **"Enregistrer"** après chaque modification. Les changements sont appliqués immédiatement.
        `,
      },
      {
        slug: "gestion-categories",
        title: "Gestion des catégories",
        description: "Organisez vos produits par catégories",
        readTime: "5 min",
        content: `
## Gestion des catégories

Les catégories permettent d'organiser vos produits et de configurer l'impression par poste (cuisine, bar).

### Créer une catégorie

1. Allez dans **Produits > Catégories**
2. Cliquez sur **"Nouvelle catégorie"**
3. Configurez :

| Option | Description |
|--------|-------------|
| Nom | Nom affiché sur la caisse |
| Couleur | Couleur de fond pour identification rapide |
| Icône | Icône optionnelle |
| Imprimante | Imprimante de destination des bons |
| Ordre | Position dans la liste |

### Couleurs recommandées

- **Bleu** : Boissons
- **Orange** : Plats chauds
- **Vert** : Salades, entrées
- **Rose** : Desserts
- **Violet** : Alcools
- **Gris** : Divers

### Impression par catégorie

Assignez chaque catégorie à une imprimante :

- **Boissons** → Imprimante Bar
- **Plats** → Imprimante Cuisine
- **Desserts** → Imprimante Cuisine
- **Tickets** → Imprimante Caisse

### Réorganiser les catégories

Glissez-déposez les catégories pour modifier leur ordre d'affichage sur l'interface de caisse.
        `,
      },
      {
        slug: "configuration-taxes",
        title: "Configuration des taxes (TVA)",
        description: "Paramétrez les taux de TVA selon la législation gabonaise",
        readTime: "4 min",
        content: `
## Configuration des taxes (TVA)

Oréma N+ est préconfiguré avec les taux de TVA gabonais. Voici comment les gérer.

### Taux de TVA au Gabon

| Taux | Application |
|------|-------------|
| 18% | Taux standard (défaut) |
| 10% | Taux réduit (certains produits) |
| 0% | Exonéré |

### Configurer la TVA par produit

1. Allez dans **Produits > Liste**
2. Éditez un produit
3. Dans le champ **TVA**, sélectionnez le taux approprié

### Créer un nouveau taux

Si nécessaire (évolution législative) :

1. **Paramètres > Fiscalité**
2. **"Nouveau taux"**
3. Définissez le nom et le pourcentage
4. Enregistrez

### Calcul de la TVA

La TVA est calculée **par ligne** puis totalisée :

\`\`\`
Produit A : 1 000 FCFA HT × 18% = 180 FCFA TVA
Produit B : 2 000 FCFA HT × 18% = 360 FCFA TVA
Total TVA : 540 FCFA
Total TTC : 3 540 FCFA
\`\`\`

### Affichage sur les tickets

Les tickets affichent :
- Le détail par taux de TVA
- Le total HT
- Le total TVA
- Le total TTC

### Conformité fiscale

Oréma N+ génère des rapports conformes aux exigences de la Direction Générale des Impôts du Gabon.
        `,
      },
      {
        slug: "personnalisation-tickets",
        title: "Personnalisation des tickets",
        description: "Customisez l'apparence de vos tickets de caisse",
        readTime: "6 min",
        content: `
## Personnalisation des tickets

Créez des tickets professionnels à l'image de votre établissement.

### Éléments personnalisables

#### En-tête
- Logo de l'établissement
- Nom commercial
- Adresse
- Téléphone
- NIF / RCCM

#### Corps du ticket
- Format des lignes produit
- Affichage des réductions
- Détail de la TVA

#### Pied de page
- Message de remerciement
- Conditions de retour
- Informations promotionnelles
- QR Code (optionnel)

### Configurer l'en-tête

1. **Paramètres > Impression > Format ticket**
2. Dans la section **En-tête** :
   - Uploadez votre logo (PNG, max 200×100px)
   - Vérifiez les informations légales

### Messages personnalisés

Ajoutez jusqu'à 3 lignes de texte personnalisé :

\`\`\`
Merci de votre visite !
Suivez-nous sur Facebook : @MonRestaurant
-10% sur votre prochaine commande avec ce ticket
\`\`\`

### Aperçu et test

1. Cliquez sur **"Aperçu"** pour voir le résultat
2. Cliquez sur **"Imprimer test"** pour vérifier sur papier
3. Ajustez si nécessaire

### Conseils

- Gardez les messages courts (largeur limitée à 48 caractères)
- Testez l'impression après chaque modification
- Utilisez un logo simple pour une meilleure lisibilité
        `,
      },
    ],
  },
  {
    slug: "caisse-ventes",
    icon: CreditCard,
    title: "Caisse & Ventes",
    description: "Gérez vos transactions",
    color: "violet",
    articles: [
      {
        slug: "interface-caisse",
        title: "Interface de caisse",
        description: "Maîtrisez l'interface de vente pour des transactions rapides",
        readTime: "10 min",
        content: `
## Interface de caisse

L'interface de caisse est conçue pour une utilisation rapide et intuitive, optimisée pour les écrans tactiles.

### Vue d'ensemble

L'écran de caisse est divisé en zones :

| Zone | Position | Fonction |
|------|----------|----------|
| Catégories | Gauche | Filtrer les produits |
| Produits | Centre | Sélectionner les articles |
| Panier | Droite | Voir la commande en cours |
| Actions | Bas | Paiement, annulation |

### Ajouter des produits

**Méthode 1 : Clic/Touch**
- Cliquez sur une catégorie
- Cliquez sur le produit souhaité
- Le produit s'ajoute au panier

**Méthode 2 : Recherche**
- Utilisez la barre de recherche
- Tapez le nom du produit
- Sélectionnez dans les résultats

**Méthode 3 : Code-barres**
- Scannez le code-barres
- Le produit s'ajoute automatiquement

### Modifier une ligne

Dans le panier :
- **+/-** : Modifier la quantité
- **Crayon** : Modifier le prix ou ajouter une note
- **Poubelle** : Supprimer la ligne

### Appliquer une remise

1. Cliquez sur la ligne concernée
2. Sélectionnez **"Remise"**
3. Choisissez :
   - Pourcentage (ex: -10%)
   - Montant fixe (ex: -500 FCFA)

### Raccourcis clavier

| Touche | Action |
|--------|--------|
| F1 | Recherche produit |
| F2 | Paiement espèces |
| F3 | Paiement carte |
| Échap | Annuler |
| Entrée | Valider |
        `,
      },
      {
        slug: "modes-vente",
        title: "Modes de vente",
        description: "Sur place, à emporter, livraison - gérez tous les scénarios",
        readTime: "7 min",
        content: `
## Modes de vente

Oréma N+ s'adapte à tous vos modes de service.

### Types de vente

#### Sur place
- Associer à une table
- Suivi de l'occupation
- Addition divisible

#### À emporter
- Vente directe sans table
- Numéro de commande
- Préparation prioritaire

#### Livraison
- Informations client requises
- Adresse de livraison
- Frais de livraison configurables
- Suivi du livreur

### Changer de mode

1. Avant de commencer la vente
2. Cliquez sur le sélecteur de mode (haut de l'écran)
3. Choisissez le mode approprié

### Configuration par produit

Certains produits peuvent être :
- Disponibles uniquement sur place
- Disponibles uniquement en livraison
- Avec prix différent selon le mode

Configurez dans **Produits > Éditer > Disponibilité**.

### Frais de livraison

1. **Paramètres > Ventes > Livraison**
2. Définissez :
   - Frais fixes
   - Ou frais par zone/distance
   - Minimum de commande

### Rapports par mode

Consultez vos statistiques par mode de vente dans **Rapports > Ventes par mode**.
        `,
      },
      {
        slug: "paiements-multiples",
        title: "Paiements multiples",
        description: "Gérez les paiements mixtes et fractionnés",
        readTime: "5 min",
        content: `
## Paiements multiples

Permettez à vos clients de payer avec plusieurs moyens de paiement.

### Scénario type

Un client souhaite payer :
- 50 000 FCFA en espèces
- 25 000 FCFA en Airtel Money

### Procédure

1. Cliquez sur **"Payer"**
2. Sélectionnez **"Paiement multiple"**
3. Ajoutez le premier paiement :
   - Mode : Espèces
   - Montant : 50 000 FCFA
4. Ajoutez le second paiement :
   - Mode : Airtel Money
   - Montant : 25 000 FCFA
   - Référence : [numéro de transaction]
5. Validez

### Rendu de monnaie

Si le total payé dépasse le montant dû :
- Le système calcule automatiquement le rendu
- Le rendu est toujours en espèces

### Ticket

Le ticket détaille chaque mode de paiement utilisé avec :
- Le montant par mode
- Les références (Mobile Money)
- Le rendu éventuel

### Annulation

En cas d'erreur sur un paiement multiple :
1. Annulez la transaction complète
2. Recommencez avec les bons montants
        `,
      },
      {
        slug: "gestion-remises",
        title: "Gestion des remises",
        description: "Appliquez des réductions et promotions",
        readTime: "4 min",
        content: `
## Gestion des remises

Fidélisez vos clients avec des remises bien gérées.

### Types de remises

| Type | Application | Exemple |
|------|-------------|---------|
| Pourcentage ligne | Sur un produit | -10% sur le dessert |
| Montant ligne | Sur un produit | -500 FCFA |
| Pourcentage total | Sur la commande | -15% fidélité |
| Montant total | Sur la commande | -2000 FCFA |

### Appliquer une remise ligne

1. Dans le panier, cliquez sur le produit
2. Sélectionnez **"Remise"**
3. Choisissez le type et la valeur
4. Validez

### Appliquer une remise globale

1. Cliquez sur **"Remise"** (bas du panier)
2. Choisissez le type et la valeur
3. Ajoutez un motif (optionnel)
4. Validez

### Remises automatiques

Configurez des remises automatiques dans **Paramètres > Promotions** :
- Happy Hour (horaires définis)
- Remise fidélité (selon points)
- Remise quantité (3 achetés = 1 offert)

### Traçabilité

Toutes les remises sont enregistrées avec :
- L'utilisateur qui l'a appliquée
- Le motif
- Le montant de la réduction

Consultez le rapport dans **Rapports > Remises**.
        `,
      },
    ],
  },
  {
    slug: "produits-stocks",
    icon: Database,
    title: "Produits & Stocks",
    description: "Gérez votre inventaire",
    color: "purple",
    articles: [
      {
        slug: "creer-modifier-produits",
        title: "Créer et modifier des produits",
        description: "Guide complet de gestion du catalogue produits",
        readTime: "8 min",
        content: `
## Créer et modifier des produits

Votre catalogue produits est au cœur de votre activité. Apprenez à le gérer efficacement.

### Créer un produit

1. **Produits > Nouveau produit**
2. Remplissez les champs :

| Champ | Description | Obligatoire |
|-------|-------------|-------------|
| Nom | Nom affiché | Oui |
| Catégorie | Catégorie parente | Oui |
| Prix de vente | Prix TTC | Oui |
| TVA | Taux applicable | Oui |
| Code-barres | Pour scan | Non |
| Description | Détails | Non |
| Image | Photo du produit | Non |

### Modifier un produit

1. **Produits > Liste**
2. Recherchez le produit
3. Cliquez sur **"Modifier"**
4. Effectuez vos changements
5. **Enregistrez**

### Dupliquer un produit

Pour créer des variantes rapidement :
1. Ouvrez le produit original
2. Cliquez sur **"Dupliquer"**
3. Modifiez le nom et le prix
4. Enregistrez

### Archiver vs Supprimer

- **Archiver** : Le produit n'apparaît plus en caisse mais reste dans l'historique
- **Supprimer** : Suppression définitive (impossible si déjà vendu)

### Import en masse

Pour importer plusieurs produits :
1. Téléchargez le modèle CSV
2. Remplissez vos produits
3. **Produits > Importer**
4. Vérifiez l'aperçu
5. Confirmez l'import
        `,
      },
      {
        slug: "import-export-csv",
        title: "Import/Export CSV",
        description: "Importez et exportez vos données en masse",
        readTime: "6 min",
        content: `
## Import/Export CSV

Gagnez du temps en important ou exportant vos données en masse.

### Format du fichier CSV

\`\`\`csv
nom,categorie,prix,tva,stock,code_barres,description
Coca-Cola 33cl,Boissons,1000,18,100,3124567890123,Canette
Fanta Orange 33cl,Boissons,1000,18,80,3124567890124,Canette
\`\`\`

### Importer des produits

1. **Produits > Importer**
2. Téléchargez le modèle si nécessaire
3. Sélectionnez votre fichier CSV
4. Mappez les colonnes (si différent du modèle)
5. Prévisualisez les données
6. Confirmez l'import

### Règles d'import

- Les produits existants (même code-barres) sont mis à jour
- Les nouvelles catégories sont créées automatiquement
- Les erreurs sont listées pour correction

### Exporter des produits

1. **Produits > Exporter**
2. Choisissez les colonnes à exporter
3. Filtrez si nécessaire (par catégorie)
4. Téléchargez le fichier

### Cas d'usage

- Migration depuis un autre système
- Mise à jour massive des prix
- Sauvegarde du catalogue
- Partage entre établissements
        `,
      },
      {
        slug: "gestion-stocks",
        title: "Gestion des stocks",
        description: "Suivez vos niveaux de stock en temps réel",
        readTime: "10 min",
        content: `
## Gestion des stocks

Évitez les ruptures et optimisez vos approvisionnements.

### Activer le suivi de stock

Par produit :
1. Éditez le produit
2. Activez **"Gérer le stock"**
3. Définissez le stock initial
4. Définissez le seuil d'alerte

### Mouvements de stock

Les mouvements sont automatiques ou manuels :

| Type | Déclencheur |
|------|-------------|
| Sortie (vente) | Automatique à chaque vente |
| Entrée (réception) | Manuel ou bon de commande |
| Ajustement | Inventaire, casse, vol |
| Transfert | Entre établissements |

### Réception de marchandise

1. **Stocks > Réception**
2. Sélectionnez le fournisseur
3. Ajoutez les produits reçus
4. Indiquez les quantités
5. Validez la réception

### Inventaire

Pour un inventaire physique :
1. **Stocks > Inventaire**
2. Sélectionnez les catégories
3. Comptez physiquement
4. Saisissez les quantités réelles
5. Le système calcule les écarts
6. Validez les ajustements

### Alertes de stock

Recevez des alertes quand :
- Un produit atteint le seuil minimum
- Un produit est en rupture
- Un mouvement anormal est détecté

Configurez dans **Paramètres > Alertes**.

### Rapports de stock

- État des stocks actuel
- Historique des mouvements
- Valorisation du stock
- Produits les plus/moins vendus
        `,
      },
      {
        slug: "produits-composes",
        title: "Produits composés et suppléments",
        description: "Créez des menus, formules et options",
        readTime: "7 min",
        content: `
## Produits composés et suppléments

Gérez les formules, menus et options de personnalisation.

### Produits composés (Menus)

Un menu combine plusieurs produits à prix fixe.

**Exemple : Menu Midi**
- 1 Plat au choix
- 1 Boisson au choix
- Prix : 4 500 FCFA (au lieu de 5 500 FCFA)

#### Créer un menu

1. **Produits > Nouveau > Produit composé**
2. Définissez le nom et le prix
3. Ajoutez les composants :
   - Catégorie "Plat" : 1 choix parmi [liste]
   - Catégorie "Boisson" : 1 choix parmi [liste]
4. Enregistrez

### Suppléments et options

Proposez des personnalisations payantes ou gratuites.

**Exemples :**
- Supplément fromage : +500 FCFA
- Supplément bacon : +800 FCFA
- Sans oignon : gratuit
- Grande portion : +1 000 FCFA

#### Créer des modificateurs

1. **Produits > Modificateurs**
2. Créez un groupe (ex: "Suppléments burger")
3. Ajoutez les options avec leurs prix
4. Assignez aux produits concernés

### En caisse

Quand un produit a des options :
1. Ajoutez le produit au panier
2. Une popup affiche les options
3. Sélectionnez les choix du client
4. Les suppléments s'ajoutent au prix

### Gestion du stock

Pour les produits composés :
- Option 1 : Stock du menu lui-même
- Option 2 : Stock des composants (recommandé)

Le système peut déduire automatiquement le stock de chaque ingrédient.
        `,
      },
    ],
  },
  {
    slug: "plan-salle",
    icon: Users,
    title: "Plan de salle",
    description: "Gestion des tables",
    color: "cyan",
    articles: [
      {
        slug: "creer-plan-salle",
        title: "Créer votre plan de salle",
        description: "Configurez la disposition de vos tables",
        readTime: "10 min",
        content: `
## Créer votre plan de salle

Un plan de salle visuel facilite le service en salle et le suivi des tables.

### Accéder à l'éditeur

1. **Salle > Plan de salle**
2. Cliquez sur **"Modifier le plan"**

### Ajouter des tables

1. Cliquez sur **"+ Table"**
2. Placez la table sur le plan (glisser-déposer)
3. Configurez :
   - Numéro de table
   - Nombre de places
   - Forme (ronde, carrée, rectangulaire)

### Organiser le plan

- **Glisser** : Déplacez les tables
- **Redimensionner** : Ajustez la taille
- **Rotation** : Tournez la table
- **Dupliquer** : Copiez une table

### Zones et étages

Pour les grands établissements :

1. Créez des **zones** (Terrasse, Intérieur, VIP)
2. Ou des **étages** (RDC, 1er étage)
3. Naviguez entre les zones avec les onglets

### Éléments décoratifs

Ajoutez du contexte visuel :
- Murs et cloisons
- Comptoir / Bar
- Entrée
- Cuisine
- Toilettes

### Enregistrer

Cliquez sur **"Enregistrer"** pour appliquer les modifications.

> **Note** : Les modifications du plan n'affectent pas les commandes en cours.
        `,
      },
      {
        slug: "gestion-tables",
        title: "Gestion des tables",
        description: "Suivez l'occupation et le statut de vos tables",
        readTime: "5 min",
        content: `
## Gestion des tables

Visualisez en temps réel l'état de votre salle.

### Statuts des tables

| Couleur | Statut | Signification |
|---------|--------|---------------|
| 🟢 Vert | Libre | Table disponible |
| 🟡 Jaune | Occupée | Clients installés, commande en cours |
| 🔵 Bleu | En préparation | Commande envoyée en cuisine |
| 🟠 Orange | Addition | Addition demandée |
| 🔴 Rouge | À nettoyer | Clients partis, table à débarrasser |

### Ouvrir une table

1. Cliquez sur une table **verte** (libre)
2. Indiquez le nombre de couverts
3. Prenez la commande
4. La table passe en **jaune**

### Ajouter à une table

Pour ajouter des produits à une table occupée :
1. Cliquez sur la table
2. Ajoutez les nouveaux produits
3. Envoyez en cuisine si nécessaire

### Changer le statut

- **Envoyer en cuisine** : Jaune → Bleu
- **Demander l'addition** : Bleu → Orange
- **Encaisser** : Orange → Rouge
- **Nettoyer** : Rouge → Vert

### Informations affichées

Sur chaque table :
- Numéro de table
- Nombre de couverts
- Montant en cours
- Temps d'occupation
        `,
      },
      {
        slug: "division-transfert",
        title: "Division et transfert d'additions",
        description: "Divisez l'addition ou transférez vers une autre table",
        readTime: "6 min",
        content: `
## Division et transfert d'additions

Gérez les situations courantes de partage et déplacement.

### Diviser une addition

Quand les clients veulent payer séparément :

#### Division égale
1. Ouvrez la table
2. Cliquez sur **"Diviser"**
3. Choisissez **"Parts égales"**
4. Indiquez le nombre de parts
5. Encaissez chaque part

#### Division par produit
1. Ouvrez la table
2. Cliquez sur **"Diviser"**
3. Choisissez **"Par produit"**
4. Assignez chaque produit à une part
5. Encaissez chaque part

### Transférer des produits

Pour déplacer des articles vers une autre table :

1. Ouvrez la table source
2. Sélectionnez les produits à transférer
3. Cliquez sur **"Transférer"**
4. Sélectionnez la table destination
5. Confirmez

### Fusionner des tables

Quand des clients se regroupent :

1. Ouvrez une des tables
2. Cliquez sur **"Fusionner"**
3. Sélectionnez l'autre table
4. Les commandes sont combinées

### Conseils

- Prévenez la cuisine en cas de transfert
- Vérifiez les montants après division
- Les produits transférés gardent leur historique
        `,
      },
      {
        slug: "zones-etages",
        title: "Zones et étages",
        description: "Organisez votre établissement par zones",
        readTime: "4 min",
        content: `
## Zones et étages

Pour les grands établissements, organisez votre salle en sections.

### Créer une zone

1. **Salle > Zones**
2. Cliquez sur **"Nouvelle zone"**
3. Nommez la zone (ex: "Terrasse")
4. Assignez les tables à cette zone

### Exemples de zones

- **Intérieur** : Tables 1-20
- **Terrasse** : Tables T1-T15
- **Salon VIP** : Tables V1-V5
- **Bar** : Comptoir + tabourets

### Navigation entre zones

En mode service :
- Utilisez les onglets en haut du plan
- Ou le menu déroulant sur mobile
- Chaque zone a son propre plan visuel

### Créer des étages

Pour les établissements à plusieurs niveaux :

1. **Salle > Étages**
2. Créez **"RDC"**, **"1er étage"**, etc.
3. Chaque étage a ses propres zones

### Statistiques par zone

Consultez les performances par zone :
- Chiffre d'affaires par zone
- Taux d'occupation
- Temps moyen d'occupation
- Tables les plus rentables
        `,
      },
    ],
  },
  {
    slug: "impression",
    icon: Printer,
    title: "Impression",
    description: "Tickets et imprimantes",
    color: "amber",
    articles: [
      {
        slug: "configurer-imprimante",
        title: "Configurer une imprimante",
        description: "Installez et configurez vos imprimantes thermiques",
        readTime: "8 min",
        content: `
## Configurer une imprimante

Oréma N+ est compatible avec les imprimantes thermiques ESC/POS.

### Imprimantes compatibles

| Marque | Modèles testés |
|--------|----------------|
| Epson | TM-T20, TM-T88 |
| Star | TSP100, TSP650 |
| Bixolon | SRP-350 |
| Générique | Toute ESC/POS 80mm |

### Types de connexion

#### USB
1. Connectez l'imprimante au PC/tablette
2. Installez les pilotes si nécessaire
3. Dans Oréma N+ : **Paramètres > Imprimantes > USB**

#### Réseau (Ethernet/WiFi)
1. Connectez l'imprimante au réseau
2. Notez son adresse IP
3. Dans Oréma N+ : **Paramètres > Imprimantes > Réseau**
4. Entrez l'adresse IP et le port (généralement 9100)

#### Bluetooth
1. Appairez l'imprimante avec votre appareil
2. Dans Oréma N+ : **Paramètres > Imprimantes > Bluetooth**
3. Sélectionnez l'imprimante dans la liste

### Test d'impression

Après configuration :
1. Cliquez sur **"Tester"**
2. Un ticket de test s'imprime
3. Vérifiez la qualité et l'alignement

### Dépannage

- **Pas d'impression** : Vérifiez la connexion et le papier
- **Caractères incorrects** : Vérifiez l'encodage (UTF-8)
- **Impression lente** : Réduisez la qualité ou passez en réseau
        `,
      },
      {
        slug: "impression-cuisine-bar",
        title: "Impression cuisine/bar",
        description: "Configurez les bons de commande par poste",
        readTime: "6 min",
        content: `
## Impression cuisine/bar

Envoyez automatiquement les commandes aux bons postes.

### Principe

Chaque catégorie de produit est assignée à une imprimante :
- **Plats** → Imprimante Cuisine
- **Boissons** → Imprimante Bar
- **Desserts** → Imprimante Cuisine

### Configuration

1. **Paramètres > Imprimantes**
2. Pour chaque imprimante, définissez :
   - Nom (ex: "Cuisine")
   - Rôle : Cuisine / Bar / Ticket
3. **Produits > Catégories**
4. Assignez chaque catégorie à son imprimante

### Bon de commande

Le bon de commande affiche :
- Numéro de table
- Heure de commande
- Liste des produits
- Notes spéciales
- Nom du serveur

### Réimpression

Si un bon est perdu :
1. Ouvrez la commande
2. Cliquez sur **"Réimprimer bon cuisine"**
3. Sélectionnez les produits à réimprimer

### Écran cuisine (alternative)

Au lieu d'imprimer, affichez les commandes sur écran :
1. Installez un écran en cuisine
2. Activez le **mode KDS** (Kitchen Display System)
3. Les commandes apparaissent et disparaissent une fois préparées
        `,
      },
      {
        slug: "format-tickets",
        title: "Format des tickets",
        description: "Personnalisez la mise en page de vos impressions",
        readTime: "5 min",
        content: `
## Format des tickets

Créez des tickets professionnels et lisibles.

### Largeur du papier

Oréma N+ supporte :
- **80mm** : Standard (recommandé)
- **58mm** : Compact (moins d'infos)

Configurez dans **Paramètres > Impression > Largeur papier**.

### Structure du ticket

\`\`\`
┌─────────────────────────────┐
│         [LOGO]              │
│      NOM ÉTABLISSEMENT      │
│        Adresse              │
│     Tel: +241 XX XX XX      │
│     NIF: XXXXXXXXXX         │
├─────────────────────────────┤
│ Ticket #: 202601280001      │
│ Date: 28/01/2026 14:30      │
│ Caissier: Marie             │
│ Table: 5                    │
├─────────────────────────────┤
│ 2x Poulet braisé    11 000  │
│ 1x Coca-Cola         1 000  │
│ 1x Eau minérale        500  │
├─────────────────────────────┤
│ Sous-total:         12 500  │
│ TVA (18%):           2 250  │
│ TOTAL:              12 500  │
├─────────────────────────────┤
│ Espèces:            15 000  │
│ Rendu:               2 500  │
├─────────────────────────────┤
│   Merci de votre visite !   │
│  Suivez-nous sur Facebook   │
└─────────────────────────────┘
\`\`\`

### Options d'affichage

Choisissez ce qui apparaît :
- ☑️ Logo
- ☑️ Adresse complète
- ☑️ NIF / RCCM
- ☑️ Détail TVA
- ☑️ Nom du caissier
- ☑️ Message personnalisé
        `,
      },
      {
        slug: "depannage-impression",
        title: "Dépannage impression",
        description: "Résolvez les problèmes d'impression courants",
        readTime: "10 min",
        content: `
## Dépannage impression

Solutions aux problèmes les plus fréquents.

### L'imprimante n'imprime pas

**Vérifications de base :**
1. ✅ L'imprimante est allumée
2. ✅ Le câble est bien branché
3. ✅ Il y a du papier
4. ✅ Le couvercle est fermé

**Tests :**
1. Imprimez une page de test (bouton sur l'imprimante)
2. Si ça marche, le problème est logiciel
3. Sinon, problème matériel

### Caractères bizarres

Si vous voyez des symboles étranges :
1. **Paramètres > Impression > Encodage**
2. Essayez **UTF-8** ou **CP437**
3. Testez après chaque changement

### Impression trop lente

- Passez en connexion réseau (plus rapide que USB)
- Réduisez la qualité d'impression
- Désactivez le logo si très détaillé

### Papier qui bourre

- Utilisez du papier thermique de qualité
- Vérifiez le diamètre du rouleau
- Nettoyez la tête d'impression

### Impression pâle

- Le papier est peut-être à l'envers (côté thermique)
- La tête d'impression est sale → Nettoyez
- Le papier est de mauvaise qualité

### WiFi instable

Si l'imprimante WiFi perd la connexion :
- Assignez une IP fixe
- Rapprochez du routeur
- Passez en Ethernet si possible

### Contacter le support

Si le problème persiste :
- Notez le modèle d'imprimante
- Faites une capture d'écran de l'erreur
- Contactez support@orema-nplus.ga
        `,
      },
    ],
  },
  {
    slug: "rapports",
    icon: BarChart3,
    title: "Rapports & Statistiques",
    description: "Analysez vos performances",
    color: "green",
    articles: [
      {
        slug: "tableau-bord",
        title: "Tableau de bord",
        description: "Vue d'ensemble de votre activité",
        readTime: "5 min",
        content: `
## Tableau de bord

Votre tableau de bord affiche les indicateurs clés en temps réel.

### Indicateurs principaux

| Indicateur | Description |
|------------|-------------|
| CA du jour | Chiffre d'affaires depuis l'ouverture |
| Tickets | Nombre de transactions |
| Panier moyen | CA / Nombre de tickets |
| Couverts | Nombre de clients servis |

### Graphiques

- **Ventes par heure** : Identifiez vos pics d'activité
- **Top produits** : Vos meilleures ventes du jour
- **Répartition paiements** : Cash vs Mobile Money vs Carte

### Comparaisons

Comparez avec :
- Hier
- Même jour semaine dernière
- Même jour mois dernier

Les flèches indiquent la tendance (↑ hausse, ↓ baisse).

### Personnalisation

Choisissez les widgets affichés :
1. Cliquez sur **"Personnaliser"**
2. Glissez-déposez les widgets
3. Redimensionnez selon vos besoins
4. Enregistrez la disposition

### Actualisation

Les données se rafraîchissent automatiquement toutes les 30 secondes. Cliquez sur 🔄 pour forcer l'actualisation.
        `,
      },
      {
        slug: "rapport-z",
        title: "Rapport Z (clôture de caisse)",
        description: "Effectuez la clôture quotidienne de votre caisse",
        readTime: "7 min",
        content: `
## Rapport Z (clôture de caisse)

Le rapport Z est le document officiel de clôture de caisse.

### Quand faire le rapport Z ?

- À la fin de chaque journée de travail
- À chaque changement de caissier (optionnel)
- Avant l'ouverture du lendemain

### Procédure de clôture

1. **Rapports > Rapport Z**
2. Comptez physiquement votre caisse
3. Saisissez les montants par mode de paiement :
   - Espèces comptées
   - Reçus cartes
   - Reçus Mobile Money
4. Le système calcule les écarts
5. Validez la clôture

### Contenu du rapport

\`\`\`
═══════════════════════════════
       RAPPORT Z - CLÔTURE
═══════════════════════════════
Date: 28/01/2026
Ouverture: 08:00 | Clôture: 22:00
Caissier: Marie KOUMBA
───────────────────────────────
VENTES
  Nombre de tickets:        45
  Chiffre d'affaires:  450 000
  Dont TVA:             81 000
───────────────────────────────
PAIEMENTS
  Espèces:            280 000
  Cartes:              80 000
  Airtel Money:        60 000
  Moov Money:          30 000
───────────────────────────────
CAISSE
  Fond de caisse:      50 000
  Encaissements:      280 000
  Théorique:          330 000
  Compté:             329 500
  Écart:                 -500
───────────────────────────────
\`\`\`

### Archivage

Les rapports Z sont :
- Numérotés séquentiellement
- Archivés pendant 10 ans
- Exportables en PDF
- Conformes aux exigences fiscales
        `,
      },
      {
        slug: "statistiques-vente",
        title: "Statistiques de vente",
        description: "Analysez vos performances en détail",
        readTime: "8 min",
        content: `
## Statistiques de vente

Des analyses détaillées pour piloter votre activité.

### Rapports disponibles

#### Par période
- Ventes quotidiennes
- Ventes hebdomadaires
- Ventes mensuelles
- Ventes annuelles

#### Par dimension
- Par produit
- Par catégorie
- Par mode de vente
- Par caissier
- Par mode de paiement

### Ventes par produit

Identifiez vos stars et vos flops :
- Top 10 des ventes
- Produits jamais vendus
- Évolution dans le temps
- Marge par produit

### Ventes par heure

Graphique des ventes par tranche horaire :
- Identifiez les pics (rush)
- Optimisez vos équipes
- Planifiez les promotions

### Analyse des clients

Si vous enregistrez les clients :
- Fréquence de visite
- Panier moyen par client
- Produits préférés
- Historique d'achat

### Export

Tous les rapports sont exportables :
- **PDF** : Pour impression et archivage
- **Excel** : Pour analyse personnalisée
- **CSV** : Pour import dans d'autres outils
        `,
      },
      {
        slug: "export-donnees",
        title: "Export des données",
        description: "Exportez vos données pour analyse ou archivage",
        readTime: "4 min",
        content: `
## Export des données

Exportez vos données dans différents formats.

### Types d'export

| Données | Formats | Usage |
|---------|---------|-------|
| Ventes | PDF, Excel, CSV | Comptabilité |
| Produits | CSV | Sauvegarde, migration |
| Clients | CSV | CRM externe |
| Stocks | Excel | Inventaire |
| Rapports Z | PDF | Archives fiscales |

### Export des ventes

1. **Rapports > Ventes**
2. Sélectionnez la période
3. Appliquez les filtres souhaités
4. Cliquez sur **"Exporter"**
5. Choisissez le format

### Export comptable

Pour votre comptable :
1. **Rapports > Export comptable**
2. Sélectionnez le mois
3. Format compatible avec les logiciels comptables gabonais

### Export automatique

Configurez des exports automatiques :
1. **Paramètres > Exports**
2. Définissez la fréquence (quotidien, hebdo, mensuel)
3. Choisissez le format et la destination (email)

### Sauvegarde complète

Pour une sauvegarde de toutes vos données :
1. **Paramètres > Sauvegarde**
2. Cliquez sur **"Exporter tout"**
3. Téléchargez l'archive ZIP

> **Important** : Conservez vos rapports Z pendant 10 ans minimum (obligation légale).
        `,
      },
    ],
  },
  {
    slug: "securite",
    icon: Shield,
    title: "Sécurité & Accès",
    description: "Protégez vos données",
    color: "red",
    articles: [
      {
        slug: "gestion-utilisateurs",
        title: "Gestion des utilisateurs",
        description: "Créez et gérez les comptes de votre équipe",
        readTime: "6 min",
        content: `
## Gestion des utilisateurs

Contrôlez qui peut accéder à votre système et avec quels droits.

### Créer un utilisateur

1. **Employés > Nouvel employé**
2. Remplissez les informations :
   - Nom et prénom
   - Email (pour la connexion)
   - Téléphone
   - Rôle
3. Un email d'invitation est envoyé

### Rôles disponibles

| Rôle | Accès |
|------|-------|
| Super Admin | Tout |
| Admin | Tout sauf paramètres critiques |
| Manager | Rapports, stocks, caisse |
| Caissier | Caisse uniquement |
| Serveur | Commandes et tables |

### Modifier un utilisateur

1. **Employés > Liste**
2. Cliquez sur l'employé
3. Modifiez les informations ou le rôle
4. Enregistrez

### Désactiver un compte

Pour un employé qui quitte :
1. Ouvrez son profil
2. Cliquez sur **"Désactiver"**
3. L'accès est immédiatement révoqué

> **Note** : Ne supprimez pas les comptes pour conserver l'historique des transactions.

### Réinitialiser un mot de passe

1. Ouvrez le profil de l'employé
2. Cliquez sur **"Réinitialiser mot de passe"**
3. Un email est envoyé avec un lien de réinitialisation
        `,
      },
      {
        slug: "roles-permissions",
        title: "Rôles et permissions",
        description: "Définissez finement les droits d'accès",
        readTime: "8 min",
        content: `
## Rôles et permissions

Personnalisez les accès selon vos besoins.

### Permissions par module

| Module | Super Admin | Admin | Manager | Caissier | Serveur |
|--------|-------------|-------|---------|----------|---------|
| Caisse | ✅ | ✅ | ✅ | ✅ | ❌ |
| Salle | ✅ | ✅ | ✅ | ❌ | ✅ |
| Produits | ✅ | ✅ | ✅ | ❌ | ❌ |
| Stocks | ✅ | ✅ | ✅ | ❌ | ❌ |
| Rapports | ✅ | ✅ | ✅ | ❌ | ❌ |
| Employés | ✅ | ✅ | ❌ | ❌ | ❌ |
| Paramètres | ✅ | ⚠️ | ❌ | ❌ | ❌ |

⚠️ = Accès partiel

### Créer un rôle personnalisé

1. **Paramètres > Rôles**
2. Cliquez sur **"Nouveau rôle"**
3. Nommez le rôle (ex: "Chef de rang")
4. Cochez les permissions souhaitées
5. Enregistrez

### Permissions détaillées

Pour chaque module, définissez :
- **Voir** : Accès en lecture
- **Créer** : Ajouter de nouveaux éléments
- **Modifier** : Éditer les éléments existants
- **Supprimer** : Effacer des éléments

### Actions sensibles

Certaines actions nécessitent une confirmation :
- Annulation de vente
- Remise > 20%
- Suppression de produit
- Modification de rapport Z
        `,
      },
      {
        slug: "connexion-pin",
        title: "Connexion par code PIN",
        description: "Accès rapide pour les caissiers",
        readTime: "3 min",
        content: `
## Connexion par code PIN

Permettez à vos caissiers de se connecter rapidement avec un code PIN.

### Avantages

- ⚡ Connexion en 2 secondes
- 🔄 Changement d'utilisateur facile
- 🔒 Sécurité maintenue
- 📱 Idéal pour écrans tactiles

### Activer le PIN pour un utilisateur

1. Ouvrez le profil de l'employé
2. Section **"Code PIN"**
3. Activez l'option
4. Définissez un code à 4-6 chiffres
5. Confirmez le code
6. Enregistrez

### Utilisation

Sur l'écran de connexion :
1. Sélectionnez **"Connexion PIN"**
2. Choisissez votre profil (ou tapez votre identifiant)
3. Entrez votre code PIN
4. Vous êtes connecté !

### Sécurité

- Le PIN est hashé (jamais stocké en clair)
- 3 tentatives maximum avant blocage
- Déblocage par un Admin
- Le PIN ne remplace pas le mot de passe pour les actions sensibles

### Bonnes pratiques

- Utilisez un code unique (pas 0000 ou 1234)
- Ne partagez jamais votre PIN
- Changez-le régulièrement
- Déconnectez-vous quand vous quittez la caisse
        `,
      },
      {
        slug: "sauvegarde-donnees",
        title: "Sauvegarde des données",
        description: "Protégez vos données contre la perte",
        readTime: "5 min",
        content: `
## Sauvegarde des données

Vos données sont précieuses. Voici comment elles sont protégées.

### Sauvegarde automatique

Oréma N+ effectue automatiquement :
- **Sauvegarde continue** : Chaque transaction est enregistrée en temps réel
- **Sauvegarde quotidienne** : Archive complète chaque nuit à 3h00
- **Sauvegarde hebdomadaire** : Archive long terme chaque dimanche

### Où sont stockées les données ?

- Serveurs sécurisés Supabase
- Réplication sur plusieurs centres de données
- Chiffrement AES-256 au repos

### Mode hors-ligne

En cas de coupure Internet :
1. Les données sont stockées localement
2. Vous continuez à travailler normalement
3. Synchronisation automatique au retour de la connexion

### Sauvegarde manuelle

Pour une sauvegarde personnelle :
1. **Paramètres > Sauvegarde**
2. Cliquez sur **"Créer une sauvegarde"**
3. Téléchargez le fichier
4. Conservez-le en lieu sûr

### Restauration

En cas de besoin :
1. Contactez le support
2. Fournissez la date souhaitée
3. Nous restaurons vos données

> **Important** : La restauration remplace les données actuelles. Les transactions postérieures à la sauvegarde seront perdues.

### Conformité

Nos pratiques respectent :
- RGPD (protection des données personnelles)
- Réglementation gabonaise sur la conservation des données fiscales
        `,
      },
    ],
  },
  {
    slug: "api",
    icon: Code,
    title: "API & Intégrations",
    description: "Pour les développeurs",
    color: "gray",
    articles: [
      {
        slug: "introduction-api",
        title: "Introduction à l'API",
        description: "Découvrez les possibilités de notre API REST",
        readTime: "10 min",
        content: `
## Introduction à l'API

L'API Oréma N+ permet d'intégrer notre système avec vos applications.

### Vue d'ensemble

- **Type** : REST API
- **Format** : JSON
- **Authentification** : Bearer Token (JWT)
- **Base URL** : \`https://api.orema-nplus.ga/v1\`

### Cas d'usage

- Synchronisation avec votre comptabilité
- Intégration avec votre site de commande en ligne
- Connexion avec votre CRM
- Tableaux de bord personnalisés
- Applications mobiles tierces

### Endpoints principaux

| Endpoint | Description |
|----------|-------------|
| /products | Gestion des produits |
| /categories | Gestion des catégories |
| /sales | Transactions de vente |
| /customers | Base clients |
| /reports | Rapports et statistiques |
| /stock | Mouvements de stock |

### Rate Limiting

- 100 requêtes par minute (plan Standard)
- 500 requêtes par minute (plan Business)
- 2000 requêtes par minute (plan Enterprise)

### Sandbox

Un environnement de test est disponible :
\`https://sandbox.orema-nplus.ga/v1\`

Utilisez-le pour développer sans affecter vos données de production.
        `,
      },
      {
        slug: "authentification-api",
        title: "Authentification",
        description: "Sécurisez vos appels API",
        readTime: "8 min",
        content: `
## Authentification

Toutes les requêtes API doivent être authentifiées.

### Obtenir une clé API

1. **Paramètres > API**
2. Cliquez sur **"Générer une clé"**
3. Nommez la clé (ex: "Intégration comptable")
4. Copiez la clé (elle ne sera plus affichée)

### Utilisation

Ajoutez la clé dans le header de chaque requête :

\`\`\`bash
curl -X GET "https://api.orema-nplus.ga/v1/products" \\
  -H "Authorization: Bearer VOTRE_CLE_API" \\
  -H "Content-Type: application/json"
\`\`\`

### Tokens JWT

Pour les applications utilisateur, utilisez OAuth2 :

\`\`\`bash
POST /auth/token
{
  "email": "user@example.com",
  "password": "********"
}
\`\`\`

Réponse :
\`\`\`json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_in": 3600
}
\`\`\`

### Rafraîchir le token

\`\`\`bash
POST /auth/refresh
{
  "refresh_token": "eyJhbGc..."
}
\`\`\`

### Sécurité

- Ne partagez jamais vos clés API
- Utilisez HTTPS uniquement
- Révoquez les clés compromises immédiatement
- Utilisez des clés différentes par application
        `,
      },
      {
        slug: "endpoints-api",
        title: "Endpoints disponibles",
        description: "Documentation complète des endpoints",
        readTime: "15 min",
        content: `
## Endpoints disponibles

Documentation des principaux endpoints de l'API.

### Produits

#### Lister les produits
\`\`\`
GET /products
?category=boissons
&limit=50
&offset=0
\`\`\`

#### Créer un produit
\`\`\`
POST /products
{
  "name": "Coca-Cola 33cl",
  "category_id": "cat_123",
  "price": 1000,
  "tax_rate": 18
}
\`\`\`

#### Modifier un produit
\`\`\`
PUT /products/{id}
{
  "price": 1200
}
\`\`\`

### Ventes

#### Créer une vente
\`\`\`
POST /sales
{
  "items": [
    {"product_id": "prod_123", "quantity": 2},
    {"product_id": "prod_456", "quantity": 1}
  ],
  "payments": [
    {"method": "cash", "amount": 5000}
  ]
}
\`\`\`

#### Récupérer une vente
\`\`\`
GET /sales/{id}
\`\`\`

### Rapports

#### Ventes du jour
\`\`\`
GET /reports/daily
?date=2026-01-28
\`\`\`

#### Top produits
\`\`\`
GET /reports/top-products
?period=month
&limit=10
\`\`\`

### Codes de réponse

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Non trouvé |
| 429 | Rate limit atteint |
| 500 | Erreur serveur |
        `,
      },
      {
        slug: "webhooks",
        title: "Webhooks",
        description: "Recevez des notifications en temps réel",
        readTime: "10 min",
        content: `
## Webhooks

Les webhooks vous notifient en temps réel des événements.

### Événements disponibles

| Événement | Déclencheur |
|-----------|-------------|
| sale.created | Nouvelle vente |
| sale.refunded | Remboursement |
| product.created | Nouveau produit |
| product.updated | Produit modifié |
| stock.low | Stock sous le seuil |
| stock.out | Rupture de stock |

### Configurer un webhook

1. **Paramètres > API > Webhooks**
2. Cliquez sur **"Nouveau webhook"**
3. Entrez l'URL de destination
4. Sélectionnez les événements
5. Enregistrez

### Format des notifications

\`\`\`json
{
  "event": "sale.created",
  "timestamp": "2026-01-28T14:30:00Z",
  "data": {
    "sale_id": "sale_789",
    "total": 5500,
    "items_count": 3,
    "payment_method": "cash"
  }
}
\`\`\`

### Sécurité

Chaque webhook inclut une signature HMAC :

\`\`\`
X-Orema-Signature: sha256=abc123...
\`\`\`

Vérifiez cette signature avec votre clé secrète.

### Retry policy

En cas d'échec (non-2xx) :
- Retry après 1 minute
- Retry après 5 minutes
- Retry après 30 minutes
- Retry après 2 heures
- Abandon et notification admin

### Tester

Utilisez le bouton **"Envoyer un test"** pour vérifier votre endpoint.
        `,
      },
    ],
  },
];

// Helper functions
export function getCategoryBySlug(slug: string): DocCategory | undefined {
  return docsCategories.find((cat) => cat.slug === slug);
}

export function getArticleBySlug(
  categorySlug: string,
  articleSlug: string
): DocArticle | undefined {
  const category = getCategoryBySlug(categorySlug);
  return category?.articles.find((art) => art.slug === articleSlug);
}

export function getAllArticles(): Array<DocArticle & { category: DocCategory }> {
  return docsCategories.flatMap((category) =>
    category.articles.map((article) => ({
      ...article,
      category,
    }))
  );
}

export function searchDocs(query: string): Array<DocArticle & { category: DocCategory }> {
  const lowerQuery = query.toLowerCase();
  return getAllArticles().filter(
    (article) =>
      article.title.toLowerCase().includes(lowerQuery) ||
      article.description.toLowerCase().includes(lowerQuery) ||
      article.content.toLowerCase().includes(lowerQuery)
  );
}
