import { z } from "zod";

/**
 * Schema Zod pour une ligne de vente
 */
export const ligneVenteSchema = z.object({
  produitId: z.string().min(1, "Le produit est requis"),
  quantite: z.number().int().positive("La quantité doit être positive"),
  notes: z.string().max(200, "Les notes ne peuvent pas dépasser 200 caractères").optional(),
});

/**
 * Schema Zod pour la remise
 */
export const remiseSchema = z.object({
  type: z.enum(["POURCENTAGE", "MONTANT_FIXE"]),
  valeur: z.number().positive("La valeur de la remise doit être positive"),
});

/**
 * Schema Zod pour la création d'une vente
 */
export const venteSchema = z.object({
  type: z.enum(["DIRECT", "TABLE", "LIVRAISON", "EMPORTER"]),

  tableId: z.string().optional(),

  clientId: z.string().optional(),

  lignes: z.array(ligneVenteSchema).min(1, "Au moins un produit doit être ajouté à la vente"),

  remise: remiseSchema.optional(),

  adresseLivraison: z.string().max(200).optional(),

  fraisLivraison: z.number().int().min(0).optional(),

  notes: z.string().max(500).optional(),
});

export type VenteFormData = z.infer<typeof venteSchema>;

/**
 * Schema Zod pour un paiement
 */
export const paiementSchema = z.object({
  montant: z.number().positive("Le montant doit être positif").int(),

  modePaiement: z.enum([
    "ESPECES",
    "CARTE_BANCAIRE",
    "AIRTEL_MONEY",
    "MOOV_MONEY",
    "CHEQUE",
    "VIREMENT",
    "COMPTE_CLIENT",
    "MIXTE",
  ]),

  reference: z.string().max(100).optional(),

  montantRecu: z.number().int().optional(),

  monnaieRendue: z.number().int().optional(),
});

export type PaiementFormData = z.infer<typeof paiementSchema>;

/**
 * Schema pour la validation du paiement complet
 */
export const paiementCompletSchema = z.object({
  venteId: z.string().min(1),
  paiements: z.array(paiementSchema).min(1, "Au moins un mode de paiement est requis"),
});

export type PaiementCompletData = z.infer<typeof paiementCompletSchema>;

/**
 * Schema pour le filtre des ventes
 */
export const venteFilterSchema = z.object({
  dateDebut: z.date().optional(),
  dateFin: z.date().optional(),
  type: z.enum(["DIRECT", "TABLE", "LIVRAISON", "EMPORTER"]).optional(),
  statut: z.enum(["EN_COURS", "PAYEE", "ANNULEE"]).optional(),
  utilisateurId: z.string().optional(),
  clientId: z.string().optional(),
});

export type VenteFilterData = z.infer<typeof venteFilterSchema>;
