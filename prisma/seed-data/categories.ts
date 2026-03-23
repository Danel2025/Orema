/**
 * Données des catégories pour le seed
 * Oréma N+ POS System - Gabon
 */

export interface CategorieData {
  nom: string;
  couleur: string;
  icone: string;
  ordre: number;
  imprimante: "BAR" | "CUISINE" | "TICKET";
}

export const categories: CategorieData[] = [
  // Boissons
  { nom: "Bières", couleur: "#F59E0B", icone: "Beer", ordre: 1, imprimante: "BAR" },
  { nom: "Sodas", couleur: "#EF4444", icone: "Cup", ordre: 2, imprimante: "BAR" },
  { nom: "Jus", couleur: "#F97316", icone: "Citrus", ordre: 3, imprimante: "BAR" },
  { nom: "Eaux", couleur: "#3B82F6", icone: "Droplets", ordre: 4, imprimante: "BAR" },
  { nom: "Alcoolmix", couleur: "#8B5CF6", icone: "Wine", ordre: 5, imprimante: "BAR" },
  { nom: "Vins", couleur: "#7C3AED", icone: "Wine", ordre: 6, imprimante: "BAR" },
  { nom: "Champagnes", couleur: "#D4AF37", icone: "Sparkles", ordre: 7, imprimante: "BAR" },
  { nom: "Spiritueux", couleur: "#1F2937", icone: "GlassWater", ordre: 8, imprimante: "BAR" },
  { nom: "Liqueurs", couleur: "#A855F7", icone: "Martini", ordre: 9, imprimante: "BAR" },
  { nom: "Cocktails", couleur: "#EC4899", icone: "Martini", ordre: 10, imprimante: "BAR" },
  { nom: "Boissons Chaudes", couleur: "#92400E", icone: "Coffee", ordre: 11, imprimante: "BAR" },

  // Nourriture
  { nom: "Entrées", couleur: "#10B981", icone: "Salad", ordre: 12, imprimante: "CUISINE" },
  { nom: "Plats Viandes", couleur: "#DC2626", icone: "Beef", ordre: 13, imprimante: "CUISINE" },
  { nom: "Plats Poissons", couleur: "#0EA5E9", icone: "Fish", ordre: 14, imprimante: "CUISINE" },
  { nom: "Accompagnements", couleur: "#84CC16", icone: "Carrot", ordre: 15, imprimante: "CUISINE" },
  { nom: "Pizzas", couleur: "#EA580C", icone: "Pizza", ordre: 16, imprimante: "CUISINE" },
  { nom: "Burgers", couleur: "#B45309", icone: "Sandwich", ordre: 17, imprimante: "CUISINE" },
  { nom: "Desserts", couleur: "#F472B6", icone: "IceCreamCone", ordre: 18, imprimante: "CUISINE" },
  {
    nom: "Petit-Déjeuner",
    couleur: "#FBBF24",
    icone: "Croissant",
    ordre: 19,
    imprimante: "CUISINE",
  },
];
