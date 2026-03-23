/**
 * Données template de seed pour un restaurant gabonais typique
 *
 * Utilisé pour peupler un nouvel établissement avec des catégories
 * et produits types, avec des prix réalistes en FCFA.
 */

export interface SeedProduct {
  nom: string;
  prix_vente: number;
  taux_tva: number;
  description?: string;
  disponible: boolean;
}

export interface SeedCategory {
  nom: string;
  couleur: string;
  description?: string;
  ordre: number;
  produits: SeedProduct[];
}

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    nom: "Boissons",
    couleur: "#3B82F6",
    description: "Boissons non alcoolisées",
    ordre: 1,
    produits: [
      { nom: "Coca-Cola", prix_vente: 1000, taux_tva: 18, disponible: true },
      { nom: "Fanta Orange", prix_vente: 1000, taux_tva: 18, disponible: true },
      { nom: "Sprite", prix_vente: 1000, taux_tva: 18, disponible: true },
      { nom: "Top Ananas", prix_vente: 500, taux_tva: 18, disponible: true },
      { nom: "Eau minérale 50cl", prix_vente: 500, taux_tva: 18, disponible: true },
      { nom: "Eau minérale 1.5L", prix_vente: 1000, taux_tva: 18, disponible: true },
      { nom: "Schweppes Tonic", prix_vente: 1000, taux_tva: 18, disponible: true },
      { nom: "Orangina", prix_vente: 1000, taux_tva: 18, disponible: true },
      { nom: "Jus de fruits", prix_vente: 1500, taux_tva: 18, disponible: true },
    ],
  },
  {
    nom: "Boissons Alcoolisées",
    couleur: "#8B5CF6",
    description: "Bières, vins et spiritueux",
    ordre: 2,
    produits: [
      { nom: "Régab 33cl", prix_vente: 1500, taux_tva: 18, disponible: true },
      { nom: "Castel 33cl", prix_vente: 1500, taux_tva: 18, disponible: true },
      { nom: "Flag 33cl", prix_vente: 1500, taux_tva: 18, disponible: true },
      { nom: "Beaufort 33cl", prix_vente: 2000, taux_tva: 18, disponible: true },
      { nom: "Guinness 33cl", prix_vente: 2000, taux_tva: 18, disponible: true },
      { nom: "Heineken 33cl", prix_vente: 2500, taux_tva: 18, disponible: true },
      { nom: "Verre vin rouge", prix_vente: 2500, taux_tva: 18, disponible: true },
      { nom: "Verre vin blanc", prix_vente: 2500, taux_tva: 18, disponible: true },
      { nom: "Whisky dose", prix_vente: 3000, taux_tva: 18, disponible: true },
    ],
  },
  {
    nom: "Entrées",
    couleur: "#10B981",
    description: "Entrées et hors-d'oeuvres",
    ordre: 3,
    produits: [
      { nom: "Salade verte", prix_vente: 2000, taux_tva: 18, disponible: true },
      { nom: "Salade mixte", prix_vente: 2500, taux_tva: 18, disponible: true },
      { nom: "Beignets de crevettes", prix_vente: 3500, taux_tva: 18, disponible: true },
      { nom: "Beignets de banane plantain", prix_vente: 1500, taux_tva: 18, disponible: true },
      { nom: "Croquettes de poisson", prix_vente: 3000, taux_tva: 18, disponible: true },
      { nom: "Soupe de poisson", prix_vente: 2500, taux_tva: 18, disponible: true },
    ],
  },
  {
    nom: "Plats Principaux",
    couleur: "#EF4444",
    description: "Plats de résistance",
    ordre: 4,
    produits: [
      { nom: "Poulet braisé", prix_vente: 5000, taux_tva: 18, disponible: true },
      { nom: "Poisson braisé", prix_vente: 6000, taux_tva: 18, disponible: true },
      { nom: "Poulet DG (Directeur Général)", prix_vente: 5500, taux_tva: 18, disponible: true },
      { nom: "Poulet Nyembwé", prix_vente: 6500, taux_tva: 18, disponible: true },
      { nom: "Bœuf sauce arachide", prix_vente: 5000, taux_tva: 18, disponible: true },
      { nom: "Côtes de porc grillées", prix_vente: 5500, taux_tva: 18, disponible: true },
      { nom: "Travers de porc", prix_vente: 6000, taux_tva: 18, disponible: true },
      { nom: "Poisson en papillote", prix_vente: 7000, taux_tva: 18, disponible: true },
      { nom: "Crevettes sautées", prix_vente: 8000, taux_tva: 18, disponible: true },
      { nom: "Omelette garnie", prix_vente: 3000, taux_tva: 18, disponible: true },
    ],
  },
  {
    nom: "Grillades",
    couleur: "#F97316",
    description: "Viandes et poissons grillés",
    ordre: 5,
    produits: [
      { nom: "Brochettes de bœuf (x3)", prix_vente: 4000, taux_tva: 18, disponible: true },
      { nom: "Brochettes de poulet (x3)", prix_vente: 3500, taux_tva: 18, disponible: true },
      { nom: "Côtelettes d'agneau", prix_vente: 6500, taux_tva: 18, disponible: true },
      { nom: "Entrecôte grillée", prix_vente: 7000, taux_tva: 18, disponible: true },
      { nom: "Poisson grillé entier", prix_vente: 6000, taux_tva: 18, disponible: true },
      { nom: "Gambas grillées", prix_vente: 9000, taux_tva: 18, disponible: true },
    ],
  },
  {
    nom: "Accompagnements",
    couleur: "#F59E0B",
    description: "Garnitures et accompagnements",
    ordre: 6,
    produits: [
      { nom: "Riz blanc", prix_vente: 1000, taux_tva: 18, disponible: true },
      { nom: "Riz sauté", prix_vente: 1500, taux_tva: 18, disponible: true },
      { nom: "Plantains frits (alloco)", prix_vente: 1500, taux_tva: 18, disponible: true },
      { nom: "Frites de pomme de terre", prix_vente: 1500, taux_tva: 18, disponible: true },
      { nom: "Attiéké", prix_vente: 1000, taux_tva: 18, disponible: true },
      { nom: "Feuilles de manioc", prix_vente: 1500, taux_tva: 18, disponible: true },
      { nom: "Bâton de manioc", prix_vente: 500, taux_tva: 18, disponible: true },
      { nom: "Légumes sautés", prix_vente: 1500, taux_tva: 18, disponible: true },
      { nom: "Haricots verts", prix_vente: 1500, taux_tva: 18, disponible: true },
      { nom: "Banane plantain bouillie", prix_vente: 1000, taux_tva: 18, disponible: true },
    ],
  },
  {
    nom: "Desserts",
    couleur: "#EC4899",
    description: "Desserts et douceurs",
    ordre: 7,
    produits: [
      { nom: "Gâteau au chocolat", prix_vente: 2500, taux_tva: 18, disponible: true },
      { nom: "Salade de fruits frais", prix_vente: 2000, taux_tva: 18, disponible: true },
      { nom: "Crème caramel", prix_vente: 2000, taux_tva: 18, disponible: true },
      { nom: "Glace (2 boules)", prix_vente: 1500, taux_tva: 18, disponible: true },
      { nom: "Banana split", prix_vente: 3000, taux_tva: 18, disponible: true },
      { nom: "Beignets sucrés", prix_vente: 1500, taux_tva: 18, disponible: true },
    ],
  },
  {
    nom: "Cocktails",
    couleur: "#06B6D4",
    description: "Cocktails classiques et tropicaux",
    ordre: 8,
    produits: [
      { nom: "Mojito", prix_vente: 4000, taux_tva: 18, disponible: true },
      { nom: "Piña Colada", prix_vente: 4500, taux_tva: 18, disponible: true },
      { nom: "Margarita", prix_vente: 4000, taux_tva: 18, disponible: true },
      { nom: "Sex on the Beach", prix_vente: 4500, taux_tva: 18, disponible: true },
      { nom: "Planteur", prix_vente: 3500, taux_tva: 18, disponible: true },
      { nom: "Ti-Punch", prix_vente: 3000, taux_tva: 18, disponible: true },
    ],
  },
  {
    nom: "Jus & Smoothies",
    couleur: "#84CC16",
    description: "Jus de fruits frais et smoothies",
    ordre: 9,
    produits: [
      { nom: "Jus d'ananas frais", prix_vente: 2000, taux_tva: 18, disponible: true },
      { nom: "Jus de mangue frais", prix_vente: 2000, taux_tva: 18, disponible: true },
      { nom: "Jus de corossol", prix_vente: 2500, taux_tva: 18, disponible: true },
      { nom: "Smoothie banane", prix_vente: 2500, taux_tva: 18, disponible: true },
      { nom: "Jus de gingembre", prix_vente: 1500, taux_tva: 18, disponible: true },
      { nom: "Cocktail de fruits", prix_vente: 2500, taux_tva: 18, disponible: true },
    ],
  },
];

/**
 * Retourne le nombre total de produits dans les templates
 */
export function getTotalSeedProducts(): number {
  return SEED_CATEGORIES.reduce((total, cat) => total + cat.produits.length, 0);
}

/**
 * Retourne un apercu des donnees de seed
 */
export function getSeedPreview() {
  return {
    categories: SEED_CATEGORIES.length,
    produits: getTotalSeedProducts(),
    details: SEED_CATEGORIES.map((cat) => ({
      categorie: cat.nom,
      couleur: cat.couleur,
      nbProduits: cat.produits.length,
    })),
  };
}
