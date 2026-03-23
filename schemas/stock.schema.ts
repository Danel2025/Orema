/**
 * Schemas Zod pour la gestion des stocks
 */

import { z } from "zod";

/**
 * Types de mouvements de stock
 */
export const TypeMouvementSchema = z.enum(["ENTREE", "SORTIE", "AJUSTEMENT", "PERTE", "INVENTAIRE"]);

export type TypeMouvementType = z.infer<typeof TypeMouvementSchema>;

/**
 * Schema pour créer un mouvement de stock
 */
export const createMovementSchema = z.object({
  produitId: z.string().uuid("ID produit invalide"),
  type: TypeMouvementSchema,
  quantite: z
    .number()
    .int("La quantité doit être un nombre entier")
    .positive("La quantité doit être positive"),
  motif: z.string().min(1, "Le motif est requis").max(500, "Motif trop long"),
  reference: z.string().max(100, "Référence trop longue").optional(),
  prixUnitaire: z
    .number()
    .int("Le prix doit être un nombre entier")
    .nonnegative("Le prix ne peut pas être négatif")
    .optional(),
});

export type CreateMovementInput = z.infer<typeof createMovementSchema>;

/**
 * Schema pour une ligne d'inventaire
 */
export const inventoryLineSchema = z.object({
  produitId: z.string().uuid("ID produit invalide"),
  quantiteReelle: z
    .number()
    .int("La quantité doit être un nombre entier")
    .nonnegative("La quantité ne peut pas être négative"),
  notes: z.string().max(500, "Notes trop longues").optional(),
});

export type InventoryLineInput = z.infer<typeof inventoryLineSchema>;

/**
 * Schema pour démarrer un inventaire
 */
export const startInventorySchema = z.object({
  categorieId: z.string().uuid("ID catégorie invalide").optional(),
  notes: z.string().max(1000, "Notes trop longues").optional(),
});

export type StartInventoryInput = z.infer<typeof startInventorySchema>;

/**
 * Statut de stock d'un produit
 */
export const StockStatusSchema = z.enum(["OK", "ALERTE", "RUPTURE"]);

export type StockStatus = z.infer<typeof StockStatusSchema>;

/**
 * Interface pour un produit avec son statut de stock
 */
export interface ProduitAvecStatutStock {
  id: string;
  nom: string;
  stockActuel: number | null;
  stockMin: number | null;
  stockMax: number | null;
  unite: string | null;
  prixAchat: number | null;
  prixVente: number;
  gererStock: boolean;
  statut: StockStatus;
  categorie: {
    id: string;
    nom: string;
    couleur: string;
  };
}

/**
 * Interface pour un mouvement de stock
 */
export interface MouvementStockAvecProduit {
  id: string;
  type: TypeMouvementType;
  quantite: number;
  quantiteAvant: number;
  quantiteApres: number;
  prixUnitaire: number | null;
  motif: string | null;
  reference: string | null;
  createdAt: Date;
  produit: {
    id: string;
    nom: string;
    unite: string | null;
  };
}

/**
 * Interface pour une alerte de stock
 */
export interface AlerteStock {
  id: string;
  nom: string;
  stockActuel: number;
  stockMin: number;
  unite: string | null;
  statut: "ALERTE" | "RUPTURE";
  categorie: {
    id: string;
    nom: string;
    couleur: string;
  };
}

/**
 * Interface pour la valorisation du stock
 */
export interface ValorisationStock {
  totalProduits: number;
  valeurTotale: number;
  valeurParCategorie: {
    categorieId: string;
    categorieNom: string;
    couleur: string;
    nombreProduits: number;
    valeur: number;
  }[];
}

/**
 * Interface pour un inventaire en cours
 */
export interface InventaireEnCours {
  id: string;
  dateDebut: Date;
  lignes: {
    produitId: string;
    produitNom: string;
    stockTheorique: number;
    quantiteReelle: number | null;
    ecart: number | null;
    unite: string | null;
  }[];
}
