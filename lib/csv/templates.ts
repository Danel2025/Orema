/**
 * Templates CSV pour l'import
 * Orema N+ - Systeme POS
 */

/**
 * Retourne le header du template CSV pour les produits
 */
export function getProductsTemplateHeader(): string[] {
  return [
    "nom",
    "description",
    "codeBarre",
    "prixVente",
    "prixAchat",
    "tauxTva",
    "categorie",
    "gererStock",
    "stockActuel",
    "stockMin",
    "stockMax",
    "unite",
    "disponibleDirect",
    "disponibleTable",
    "disponibleLivraison",
    "disponibleEmporter",
  ];
}

/**
 * Retourne le template CSV vide pour l'import de produits
 */
export function getProductsTemplate(): string {
  const headers = getProductsTemplateHeader();
  const BOM = "\uFEFF"; // UTF-8 BOM pour Excel
  return BOM + headers.join(";") + "\n";
}

/**
 * Retourne un exemple de CSV avec des donnees fictives
 */
export function getProductsExampleCSV(): string {
  const BOM = "\uFEFF";
  const headers = getProductsTemplateHeader();

  const examples = [
    {
      nom: "Poulet braise",
      description: "Poulet grille aux epices africaines",
      codeBarre: "6001234567890",
      prixVente: "5000",
      prixAchat: "3000",
      tauxTva: "STANDARD",
      categorie: "Plats",
      gererStock: "Non",
      stockActuel: "",
      stockMin: "",
      stockMax: "",
      unite: "",
      disponibleDirect: "Oui",
      disponibleTable: "Oui",
      disponibleLivraison: "Oui",
      disponibleEmporter: "Oui",
    },
    {
      nom: "Biere Flag 65cl",
      description: "Biere locale gabonaise",
      codeBarre: "6001234567891",
      prixVente: "1500",
      prixAchat: "900",
      tauxTva: "STANDARD",
      categorie: "Boissons",
      gererStock: "Oui",
      stockActuel: "120",
      stockMin: "24",
      stockMax: "240",
      unite: "bouteille",
      disponibleDirect: "Oui",
      disponibleTable: "Oui",
      disponibleLivraison: "Non",
      disponibleEmporter: "Oui",
    },
    {
      nom: "Eau minerale 1.5L",
      description: "",
      codeBarre: "6001234567892",
      prixVente: "500",
      prixAchat: "300",
      tauxTva: "EXONERE",
      categorie: "Boissons",
      gererStock: "Oui",
      stockActuel: "48",
      stockMin: "12",
      stockMax: "96",
      unite: "bouteille",
      disponibleDirect: "Oui",
      disponibleTable: "Oui",
      disponibleLivraison: "Oui",
      disponibleEmporter: "Oui",
    },
    {
      nom: "Pizza Margherita",
      description: "Tomate, mozzarella, basilic",
      codeBarre: "",
      prixVente: "8000",
      prixAchat: "4500",
      tauxTva: "STANDARD",
      categorie: "Pizzas",
      gererStock: "Non",
      stockActuel: "",
      stockMin: "",
      stockMax: "",
      unite: "",
      disponibleDirect: "Oui",
      disponibleTable: "Oui",
      disponibleLivraison: "Oui",
      disponibleEmporter: "Oui",
    },
    {
      nom: "Cafe expresso",
      description: "Cafe serré italien",
      codeBarre: "",
      prixVente: "1000",
      prixAchat: "200",
      tauxTva: "REDUIT",
      categorie: "Boissons chaudes",
      gererStock: "Non",
      stockActuel: "",
      stockMin: "",
      stockMax: "",
      unite: "tasse",
      disponibleDirect: "Oui",
      disponibleTable: "Oui",
      disponibleLivraison: "Non",
      disponibleEmporter: "Oui",
    },
  ];

  const rows = examples.map((ex) => headers.map((h) => ex[h as keyof typeof ex] || "").join(";"));

  return BOM + headers.join(";") + "\n" + rows.join("\n");
}

/**
 * Description des colonnes pour l'aide utilisateur
 */
export const PRODUCT_COLUMNS_DESCRIPTION = [
  {
    name: "nom",
    required: true,
    description: "Nom du produit (2-100 caracteres)",
    example: "Poulet braise",
  },
  {
    name: "description",
    required: false,
    description: "Description detaillee du produit",
    example: "Poulet grille aux epices",
  },
  {
    name: "codeBarre",
    required: false,
    description: "Code-barres EAN/UPC (unique)",
    example: "6001234567890",
  },
  {
    name: "prixVente",
    required: true,
    description: "Prix de vente en FCFA (entier positif)",
    example: "5000",
  },
  {
    name: "prixAchat",
    required: false,
    description: "Prix d'achat en FCFA (pour le calcul des marges)",
    example: "3000",
  },
  {
    name: "tauxTva",
    required: false,
    description: "Taux TVA: STANDARD (18%), REDUIT (10%), EXONERE (0%)",
    example: "STANDARD",
  },
  {
    name: "categorie",
    required: true,
    description: "Nom de la categorie (sera creee si n'existe pas)",
    example: "Plats",
  },
  {
    name: "gererStock",
    required: false,
    description: "Activer la gestion de stock (Oui/Non)",
    example: "Oui",
  },
  {
    name: "stockActuel",
    required: false,
    description: "Quantite en stock actuelle",
    example: "50",
  },
  {
    name: "stockMin",
    required: false,
    description: "Seuil d'alerte stock bas",
    example: "10",
  },
  {
    name: "stockMax",
    required: false,
    description: "Stock maximum",
    example: "100",
  },
  {
    name: "unite",
    required: false,
    description: "Unite de mesure (kg, L, piece, etc.)",
    example: "kg",
  },
  {
    name: "disponibleDirect",
    required: false,
    description: "Disponible en vente directe (Oui/Non, defaut: Oui)",
    example: "Oui",
  },
  {
    name: "disponibleTable",
    required: false,
    description: "Disponible en service table (Oui/Non, defaut: Oui)",
    example: "Oui",
  },
  {
    name: "disponibleLivraison",
    required: false,
    description: "Disponible en livraison (Oui/Non, defaut: Oui)",
    example: "Oui",
  },
  {
    name: "disponibleEmporter",
    required: false,
    description: "Disponible a emporter (Oui/Non, defaut: Oui)",
    example: "Oui",
  },
];
