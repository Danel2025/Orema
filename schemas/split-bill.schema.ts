import { z } from "zod";

/**
 * Schema pour le mode de division
 */
export const splitModeSchema = z.enum(["equal", "custom", "items"]);

/**
 * Schema pour une part payee
 */
export const splitPartPaymentSchema = z.object({
  partId: z.string().min(1, "L'ID de la part est requis"),
  modePaiement: z.enum([
    "ESPECES",
    "CARTE_BANCAIRE",
    "AIRTEL_MONEY",
    "MOOV_MONEY",
    "CHEQUE",
    "VIREMENT",
    "COMPTE_CLIENT",
  ]),
  montant: z.number().int().positive("Le montant doit être positif"),
  reference: z.string().max(100).optional(),
  montantRecu: z.number().int().optional(),
  monnaieRendue: z.number().int().optional(),
});

export type SplitPartPaymentData = z.infer<typeof splitPartPaymentSchema>;

/**
 * Schema pour la division egale
 */
export const splitBillEqualSchema = z.object({
  venteId: z.string().min(1, "L'ID de la vente est requis"),
  nombrePersonnes: z
    .number()
    .int()
    .min(2, "Il faut au moins 2 personnes")
    .max(20, "Maximum 20 personnes"),
});

export type SplitBillEqualData = z.infer<typeof splitBillEqualSchema>;

/**
 * Schema pour la division par montants personnalises
 */
export const splitBillCustomSchema = z.object({
  venteId: z.string().min(1, "L'ID de la vente est requis"),
  montants: z
    .array(z.number().int().positive("Chaque montant doit être positif"))
    .min(2, "Il faut au moins 2 montants"),
});

export type SplitBillCustomData = z.infer<typeof splitBillCustomSchema>;

/**
 * Schema pour un article attribue a une personne
 */
export const itemAssignmentSchema = z.object({
  produitId: z.string().min(1),
  personneIndex: z.number().int().min(0),
});

/**
 * Schema pour la division par articles
 */
export const splitBillByItemsSchema = z.object({
  venteId: z.string().min(1, "L'ID de la vente est requis"),
  itemsParPersonne: z.array(
    z.object({
      personneIndex: z.number().int().min(0),
      produitIds: z.array(z.string().min(1)),
    })
  ),
});

export type SplitBillByItemsData = z.infer<typeof splitBillByItemsSchema>;

/**
 * Schema pour payer une part
 */
export const payPartSchema = z.object({
  venteId: z.string().min(1, "L'ID de la vente est requis"),
  partId: z.string().min(1, "L'ID de la part est requis"),
  montant: z.number().int().positive("Le montant doit être positif"),
  modePaiement: z.enum([
    "ESPECES",
    "CARTE_BANCAIRE",
    "AIRTEL_MONEY",
    "MOOV_MONEY",
    "CHEQUE",
    "VIREMENT",
    "COMPTE_CLIENT",
  ]),
  reference: z.string().max(100).optional(),
  montantRecu: z.number().int().optional(),
  monnaieRendue: z.number().int().optional(),
  sessionCaisseId: z.string().min(1).optional(),
});

export type PayPartData = z.infer<typeof payPartSchema>;

/**
 * Schema pour la validation complete d'une division
 */
export const completeSplitBillSchema = z.object({
  venteId: z.string().optional(), // Optionnel si nouvelle vente
  mode: splitModeSchema,
  parts: z.array(
    z.object({
      id: z.string().min(1),
      montant: z.number().int().min(0),
      paye: z.boolean(),
      modePaiement: z
        .enum([
          "ESPECES",
          "CARTE_BANCAIRE",
          "AIRTEL_MONEY",
          "MOOV_MONEY",
          "CHEQUE",
          "VIREMENT",
          "COMPTE_CLIENT",
        ])
        .optional(),
      reference: z.string().max(100).optional(),
      items: z.array(z.string()).optional(),
      nom: z.string().max(50).optional(),
    })
  ),
});

export type CompleteSplitBillData = z.infer<typeof completeSplitBillSchema>;
