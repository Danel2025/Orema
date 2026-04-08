import { z } from "zod";

/**
 * Types de repas disponibles pour les avis
 */
export const TYPE_REPAS = [
  "petit_dejeuner",
  "dejeuner",
  "diner",
  "autre",
] as const;

export const TYPE_REPAS_LABELS: Record<(typeof TYPE_REPAS)[number], string> = {
  petit_dejeuner: "Petit-déjeuner",
  dejeuner: "Déjeuner",
  diner: "Dîner",
  autre: "Autre",
};

/**
 * Schema Zod pour la soumission d'un avis client
 */
export const avisSchema = z.object({
  note: z
    .number()
    .int("La note doit être un entier")
    .min(1, "La note minimale est 1")
    .max(5, "La note maximale est 5"),

  contenu: z
    .string()
    .min(10, "L'avis doit contenir au moins 10 caractères")
    .max(1000, "L'avis ne peut pas dépasser 1000 caractères")
    .transform((val) => val.trim()),

  client_prenom: z
    .string()
    .max(50, "Le prénom ne peut pas dépasser 50 caractères")
    .transform((val) => val.trim())
    .optional()
    .or(z.literal("")),

  type_repas: z.enum(TYPE_REPAS).optional(),
});

export type AvisFormData = z.infer<typeof avisSchema>;

/**
 * Tons disponibles pour la génération de réponse
 */
export const TONS_REPONSE = ["professionnel", "chaleureux", "empathique"] as const;
export type TonReponse = (typeof TONS_REPONSE)[number];

export const TONS_REPONSE_LABELS: Record<TonReponse, string> = {
  professionnel: "Professionnel",
  chaleureux: "Chaleureux",
  empathique: "Empathique",
};

/**
 * Type d'un avis tel que retourné par la DB
 */
export interface Avis {
  id: string;
  etablissement_id: string;
  client_prenom: string | null;
  note: number;
  contenu: string;
  type_repas: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Type d'une réponse à un avis
 */
export interface AvisReponse {
  id: string;
  avis_id: string;
  contenu: string;
  ton_detecte: "positif" | "mitige" | "negatif";
  publie: boolean;
  created_at: string;
}

/**
 * Type d'un avis avec sa réponse (jointure)
 */
export interface AvisAvecReponse extends Avis {
  reponse?: AvisReponse | null;
}

/**
 * Résultat d'analyse IA
 */
export interface AnalyseResult {
  id?: string;
  periode: string;
  total_avis: number;
  note_moyenne: number;
  points_forts: string[];
  points_faibles: string[];
  tendance: "positive" | "stable" | "negative";
  avis_notables: AvisNotable[];
  actions_recommandees: string[];
}

/**
 * Avis notable dans une analyse
 */
export interface AvisNotable {
  id: string;
  note: number;
  contenu: string;
  raison: string;
}
