import { z } from "zod";

/**
 * Enum des formes de table
 */
export const FormeTable = {
  RONDE: "RONDE",
  CARREE: "CARREE",
  RECTANGULAIRE: "RECTANGULAIRE",
} as const;

export type FormeTableType = (typeof FormeTable)[keyof typeof FormeTable];

/**
 * Enum des statuts de table
 */
export const StatutTable = {
  LIBRE: "LIBRE",
  OCCUPEE: "OCCUPEE",
  EN_PREPARATION: "EN_PREPARATION",
  ADDITION: "ADDITION",
  A_NETTOYER: "A_NETTOYER",
} as const;

export type StatutTableType = (typeof StatutTable)[keyof typeof StatutTable];

/**
 * Couleurs associées aux statuts
 */
export const STATUT_TABLE_COLORS: Record<StatutTableType, string> = {
  LIBRE: "green",
  OCCUPEE: "yellow",
  EN_PREPARATION: "blue",
  ADDITION: "orange",
  A_NETTOYER: "red",
};

/**
 * Labels en français pour les statuts
 */
export const STATUT_TABLE_LABELS: Record<StatutTableType, string> = {
  LIBRE: "Libre",
  OCCUPEE: "Occupée",
  EN_PREPARATION: "En préparation",
  ADDITION: "Addition demandée",
  A_NETTOYER: "À nettoyer",
};

/**
 * Labels pour les formes
 */
export const FORME_TABLE_LABELS: Record<FormeTableType, string> = {
  RONDE: "Ronde",
  CARREE: "Carrée",
  RECTANGULAIRE: "Rectangulaire",
};

/**
 * Schema Zod pour la création/édition d'une table
 */
export const tableSchema = z.object({
  numero: z
    .string()
    .min(1, "Le numéro est requis")
    .max(20, "Le numéro ne peut pas dépasser 20 caractères"),

  capacite: z
    .number()
    .int("La capacité doit être un nombre entier")
    .min(1, "La capacité doit être d'au moins 1 place")
    .max(50, "La capacité ne peut pas dépasser 50 places"),

  forme: z.enum(["RONDE", "CARREE", "RECTANGULAIRE"]).default("CARREE"),

  zoneId: z.string().uuid("ID de zone invalide").optional().nullable(),

  positionX: z.number().optional(),
  positionY: z.number().optional(),
  largeur: z.number().min(40).max(300).optional(),
  hauteur: z.number().min(40).max(300).optional(),

  active: z.boolean().default(true),
});

export type TableFormData = z.infer<typeof tableSchema>;

/**
 * Schema pour la mise à jour de position (drag & drop)
 */
export const tablePositionSchema = z.object({
  id: z.string().uuid(),
  positionX: z.number(),
  positionY: z.number(),
});

export type TablePositionData = z.infer<typeof tablePositionSchema>;

/**
 * Schema pour la mise à jour du statut
 */
export const tableStatutSchema = z.object({
  id: z.string().uuid(),
  statut: z.enum(["LIBRE", "OCCUPEE", "EN_PREPARATION", "ADDITION", "A_NETTOYER"]),
});

export type TableStatutData = z.infer<typeof tableStatutSchema>;

/**
 * Schema pour le transfert de table
 */
export const tableTransferSchema = z.object({
  fromTableId: z.string().uuid("ID de table source invalide"),
  toTableId: z.string().uuid("ID de table destination invalide"),
  markSourceAsClean: z.boolean().optional().default(false),
}).refine((data) => data.fromTableId !== data.toTableId, {
  message: "La table source et la table de destination doivent être différentes",
  path: ["toTableId"],
});

export type TableTransferData = z.infer<typeof tableTransferSchema>;

/**
 * Schema pour le filtrage des tables
 */
export const tableFilterSchema = z.object({
  zoneId: z.string().uuid().optional(),
  statut: z.enum(["LIBRE", "OCCUPEE", "EN_PREPARATION", "ADDITION", "A_NETTOYER"]).optional(),
  active: z.boolean().optional(),
});

export type TableFilterData = z.infer<typeof tableFilterSchema>;
