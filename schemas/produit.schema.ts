import { z } from "zod";

/**
 * Helper pour les nombres optionnels positifs (prix d'achat)
 * Accepte: number, string, null, undefined, ""
 * Retourne: number | undefined
 */
const optionalPositiveInt = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === null || val === undefined || val === "") return undefined;
    const num = typeof val === "number" ? val : Number(val);
    if (isNaN(num)) return undefined;
    return num;
  })
  .refine((val) => val === undefined || (Number.isInteger(val) && val > 0), {
    message: "Le montant doit être un entier positif",
  });

/**
 * Helper pour les nombres optionnels >= 0 (stock)
 */
const optionalNonNegativeInt = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === null || val === undefined || val === "") return undefined;
    const num = typeof val === "number" ? val : Number(val);
    if (isNaN(num)) return undefined;
    return num;
  })
  .refine((val) => val === undefined || (Number.isInteger(val) && val >= 0), {
    message: "Le montant doit être un entier positif ou nul",
  });

/**
 * Helper pour les chaînes optionnelles
 */
const optionalString = z.union([z.string(), z.null(), z.undefined()]).transform((val) => {
  if (val === null || val === undefined || val === "") return undefined;
  return val;
});

/**
 * Schema Zod pour la création/édition d'un produit
 */
export const produitSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),

  description: optionalString,

  codeBarre: optionalString,

  image: optionalString,

  prixVente: z.coerce
    .number()
    .positive("Le prix de vente doit être positif")
    .int("Le prix de vente doit être un montant entier (FCFA)"),

  tauxTva: z.coerce
    .number()
    .min(0, "Le taux de TVA doit être positif ou nul")
    .max(100, "Le taux de TVA ne peut pas dépasser 100%"),

  prixAchat: optionalPositiveInt,

  categorieId: z.string().min(1, "La catégorie est requise"),

  gererStock: z.boolean().default(false),

  stockActuel: optionalNonNegativeInt,
  stockMin: optionalNonNegativeInt,
  stockMax: optionalNonNegativeInt,

  unite: optionalString,

  disponibleDirect: z.boolean().default(true),
  disponibleTable: z.boolean().default(true),
  disponibleLivraison: z.boolean().default(true),
  disponibleEmporter: z.boolean().default(true),

  actif: z.boolean().default(true),
});

export type ProduitFormData = z.infer<typeof produitSchema>;

/**
 * Schema pour la recherche/filtrage de produits
 */
export const produitFilterSchema = z.object({
  search: z.string().optional(),
  categorieId: z.string().optional(),
  actif: z.boolean().optional(),
  disponiblePour: z.enum(["DIRECT", "TABLE", "LIVRAISON", "EMPORTER"]).optional(),
  gererStock: z.boolean().optional(),
});

export type ProduitFilterData = z.infer<typeof produitFilterSchema>;

/**
 * Helper pour parser les booléens depuis un CSV
 * Accepte: boolean, "oui"/"non", "true"/"false", "1"/"0", "vrai"/"faux"
 */
const csvBoolean = z.union([z.boolean(), z.string()]).transform((val) => {
  if (typeof val === "boolean") return val;
  const lower = val.toLowerCase().trim();
  const trueValues = ["oui", "true", "1", "vrai", "yes"];
  const falseValues = ["non", "false", "0", "faux", "no"];
  if (trueValues.includes(lower)) return true;
  if (falseValues.includes(lower)) return false;
  // Valeur non reconnue : défaut à true (comportement sûr pour disponibilité)
  return true;
});

/**
 * Schema pour l'import CSV de produits
 */
export const produitCsvSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),

  description: z.string().optional().nullable(),

  codeBarre: z.string().optional().nullable(),

  prixVente: z.coerce
    .number()
    .positive("Le prix de vente doit être positif")
    .int("Le prix de vente doit être un montant entier (FCFA)"),

  prixAchat: z.coerce.number().positive().int().optional().nullable(),

  tauxTva: z.coerce.number().refine((val) => [0, 10, 18].includes(val), {
    message: "Le taux TVA doit être 0, 10 ou 18",
  }),

  categorie: z.string().min(1, "La catégorie est requise"),

  gererStock: csvBoolean,

  stockActuel: z.coerce.number().int().nonnegative().optional().nullable(),
  stockMin: z.coerce.number().int().nonnegative().optional().nullable(),
  stockMax: z.coerce.number().int().nonnegative().optional().nullable(),

  unite: z.string().optional().nullable(),

  disponibleDirect: csvBoolean.optional().default(true),
  disponibleTable: csvBoolean.optional().default(true),
  disponibleLivraison: csvBoolean.optional().default(true),
  disponibleEmporter: csvBoolean.optional().default(true),
});

export type ProduitCsvData = z.infer<typeof produitCsvSchema>;
