/**
 * Schémas de validation pour les catégories
 */

import { z } from "zod";

/**
 * Type pour la destination de préparation
 */
export type DestinationPreparation = "AUTO" | "CUISINE" | "BAR" | "AUCUNE";

/**
 * Options de destination de préparation pour l'UI
 */
export const destinationOptions = [
  {
    value: "AUTO" as const,
    label: "Automatique",
    description: "Détection par nom de catégorie",
  },
  {
    value: "CUISINE" as const,
    label: "Cuisine",
    description: "Envoyé à l'écran et imprimante cuisine",
  },
  {
    value: "BAR" as const,
    label: "Bar",
    description: "Envoyé à l'écran et imprimante bar",
  },
  {
    value: "AUCUNE" as const,
    label: "Aucune",
    description: "Pas de bon de préparation",
  },
];

/**
 * Couleurs disponibles pour les catégories
 */
export const categorieColors = [
  { value: "#f97316", label: "Orange", name: "orange" },
  { value: "#3b82f6", label: "Bleu", name: "blue" },
  { value: "#22c55e", label: "Vert", name: "green" },
  { value: "#a855f7", label: "Violet", name: "purple" },
  { value: "#ef4444", label: "Rouge", name: "red" },
  { value: "#f59e0b", label: "Ambre", name: "amber" },
  { value: "#06b6d4", label: "Cyan", name: "cyan" },
  { value: "#ec4899", label: "Rose", name: "pink" },
  { value: "#14b8a6", label: "Teal", name: "teal" },
  { value: "#6366f1", label: "Indigo", name: "indigo" },
] as const;

/**
 * Icônes disponibles pour les catégories (Lucide React)
 */
export const categorieIcons = [
  { value: "Coffee", label: "Café/Boissons" },
  { value: "UtensilsCrossed", label: "Plats" },
  { value: "Salad", label: "Entrées/Salades" },
  { value: "IceCreamCone", label: "Desserts" },
  { value: "Beer", label: "Bières" },
  { value: "Wine", label: "Vins" },
  { value: "Sandwich", label: "Sandwichs" },
  { value: "Pizza", label: "Pizzas" },
  { value: "Soup", label: "Soupes" },
  { value: "Beef", label: "Viandes" },
  { value: "Fish", label: "Poissons" },
  { value: "Egg", label: "Petit-déjeuner" },
  { value: "Croissant", label: "Pâtisseries" },
  { value: "Apple", label: "Fruits" },
  { value: "ShoppingBag", label: "Général" },
  { value: "Package", label: "Autres" },
] as const;

/**
 * Schéma de création/édition d'une catégorie
 */
export const categorieSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  couleur: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal (#RRGGBB)")
    .default("#f97316"),
  icone: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  ordre: z.coerce.number().int().min(0).default(0),
  actif: z.boolean().default(true),
  imprimanteId: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val))
    .refine(
      (val) =>
        val === null ||
        val === undefined ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val),
      {
        message: "L'identifiant de l'imprimante doit être un UUID valide",
      }
    ),
  destinationPreparation: z
    .enum(["AUTO", "CUISINE", "BAR", "AUCUNE"])
    .default("AUTO"),
});

export type CategorieFormData = z.infer<typeof categorieSchema>;

/**
 * Schéma pour les filtres de recherche
 */
export const categorieFilterSchema = z.object({
  search: z.string().optional(),
  actif: z.boolean().optional(),
});

export type CategorieFilterData = z.infer<typeof categorieFilterSchema>;
