import { z } from "zod";

/**
 * Helper pour les chaines optionnelles
 */
const optionalString = z.union([z.string(), z.null(), z.undefined()]).transform((val) => {
  if (val === null || val === undefined || val === "") return undefined;
  return val.trim();
});

/**
 * Helper pour les emails optionnels
 */
const optionalEmail = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === null || val === undefined || val === "") return undefined;
    return val.trim();
  })
  .refine((val) => val === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: "Format d'email invalide",
  });

/**
 * Helper pour les telephones optionnels (format Gabon)
 */
const optionalPhone = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === null || val === undefined || val === "") return undefined;
    // Nettoyer le numero (garder uniquement chiffres et +)
    return val.replace(/[^\d+]/g, "");
  })
  .refine(
    (val) => {
      if (val === undefined) return true;
      // Format Gabon: +241 XX XX XX XX ou 0X XX XX XX ou XX XX XX XX
      return val.length >= 8 && val.length <= 15;
    },
    {
      message: "Numero de telephone invalide (8-15 chiffres)",
    }
  );

/**
 * Helper pour les montants positifs ou nuls (FCFA)
 */
const nonNegativeAmount = z.coerce
  .number()
  .int("Le montant doit être un entier (FCFA)")
  .min(0, "Le montant ne peut pas être négatif");

/**
 * Schema Zod pour la création/édition d'un client
 */
export const clientSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .transform((val) => val.trim()),

  prenom: optionalString,

  telephone: optionalPhone,

  email: optionalEmail,

  adresse: optionalString,

  // NIF pour les entreprises (optionnel)
  nif: optionalString,

  // Notes internes
  notes: optionalString,

  // Autorisation de crédit
  creditAutorise: z.boolean().default(false),

  limitCredit: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === null || val === undefined || val === "") return undefined;
      const num = typeof val === "number" ? val : Number(val);
      if (isNaN(num)) return undefined;
      return num;
    })
    .refine((val) => val === undefined || (Number.isInteger(val) && val >= 0), {
      message: "La limite de crédit doit être un entier positif ou nul",
    }),

  actif: z.boolean().default(true),
});

export type ClientFormData = z.infer<typeof clientSchema>;

/**
 * Schema pour le rechargement du compte prépayé
 */
export const rechargeCompteSchema = z.object({
  clientId: z.string().uuid("ID client invalide"),
  montant: nonNegativeAmount.refine((val) => val > 0, {
    message: "Le montant doit être supérieur à 0",
  }),
  reference: optionalString,
  notes: optionalString,
});

export type RechargeCompteData = z.infer<typeof rechargeCompteSchema>;

/**
 * Schema pour la recherche/filtrage de clients
 */
export const clientFilterSchema = z.object({
  search: z.string().optional(),
  actif: z.boolean().optional(),
  avecCredit: z.boolean().optional(),
  avecSoldePrepaye: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ClientFilterData = z.infer<typeof clientFilterSchema>;
