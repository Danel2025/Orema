/**
 * Schemas de validation pour le systeme de sauvegarde
 */

import { z } from "zod";

// ============================================================================
// CATEGORIES DE DONNEES
// ============================================================================

/**
 * Categories de donnees pouvant etre sauvegardees
 */
export const backupCategories = [
  {
    key: "ventes",
    label: "Ventes et paiements",
    description: "Ventes, lignes de vente, paiements, sessions de caisse",
    tables: ["ventes", "lignes_vente", "paiements", "sessions_caisse"],
  },
  {
    key: "clients",
    label: "Clients",
    description: "Informations clients et historique",
    tables: ["clients"],
  },
  {
    key: "produits",
    label: "Produits et categories",
    description: "Catalogue produits avec categories",
    tables: ["produits", "categories"],
  },
  {
    key: "stocks",
    label: "Mouvements de stock",
    description: "Historique des mouvements de stock",
    tables: ["mouvements_stock"],
  },
  {
    key: "tables",
    label: "Tables et zones",
    description: "Plan de salle avec tables et zones",
    tables: ["tables", "zones"],
  },
  {
    key: "imprimantes",
    label: "Imprimantes",
    description: "Configuration des imprimantes",
    tables: ["imprimantes"],
  },
  {
    key: "utilisateurs",
    label: "Utilisateurs",
    description: "Comptes utilisateurs et permissions",
    tables: ["utilisateurs"],
  },
] as const;

export type BackupCategoryKey = (typeof backupCategories)[number]["key"];

// ============================================================================
// TYPES DE BACKUP
// ============================================================================

export const backupTypeOptions = [
  { value: "full", label: "Sauvegarde complete", description: "Toutes les categories de donnees" },
  {
    value: "partial",
    label: "Sauvegarde partielle",
    description: "Catégories sélectionnées uniquement",
  },
] as const;

export const backupFormatOptions = [
  { value: "json", label: "JSON", description: "Format natif, recommande pour restauration" },
  { value: "csv", label: "CSV", description: "Compatible tableurs (Excel, Google Sheets)" },
] as const;

// ============================================================================
// SCHEMA: Creation de sauvegarde
// ============================================================================

export const createBackupSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  type: z.enum(["full", "partial"]),
  categories: z.array(z.string()).min(1, "Sélectionnez au moins une catégorie de données"),
  format: z.enum(["json", "csv"]).default("json"),
});

export type CreateBackupInput = z.infer<typeof createBackupSchema>;

// ============================================================================
// SCHEMA: Planification de sauvegarde
// ============================================================================

export const frequenceOptions = [
  { value: "daily", label: "Quotidienne", description: "Tous les jours" },
  { value: "weekly", label: "Hebdomadaire", description: "Une fois par semaine" },
  { value: "monthly", label: "Mensuelle", description: "Une fois par mois" },
] as const;

export const jourSemaineOptions = [
  { value: 0, label: "Dimanche" },
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
] as const;

export const backupScheduleSchema = z
  .object({
    nom: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caracteres")
      .max(100, "Le nom ne peut pas depasser 100 caracteres"),
    actif: z.boolean().default(true),
    frequence: z.enum(["daily", "weekly", "monthly"]),
    heureExecution: z.string().regex(/^\d{2}:\d{2}$/, "Format attendu: HH:MM"),
    jourSemaine: z
      .number()
      .int()
      .min(0, "Jour invalide")
      .max(6, "Jour invalide")
      .optional()
      .nullable(),
    jourMois: z
      .number()
      .int()
      .min(1, "Jour invalide")
      .max(31, "Jour invalide")
      .optional()
      .nullable(),
    type: z.enum(["full", "partial"]).default("full"),
    categories: z.array(z.string()),
    retentionJours: z
      .number()
      .int()
      .min(1, "Minimum 1 jour")
      .max(365, "Maximum 365 jours")
      .default(30),
  })
  .refine(
    (data) => {
      // Si weekly, jour de la semaine requis
      if (data.frequence === "weekly" && data.jourSemaine === undefined) {
        return false;
      }
      return true;
    },
    {
      message: "Le jour de la semaine est requis pour une frequence hebdomadaire",
      path: ["jourSemaine"],
    }
  )
  .refine(
    (data) => {
      // Si monthly, jour du mois requis
      if (data.frequence === "monthly" && data.jourMois === undefined) {
        return false;
      }
      return true;
    },
    {
      message: "Le jour du mois est requis pour une frequence mensuelle",
      path: ["jourMois"],
    }
  );

export type BackupScheduleInput = z.infer<typeof backupScheduleSchema>;

// ============================================================================
// TYPES: Backup record (depuis la base de donnees)
// ============================================================================

export interface BackupRecord {
  id: string;
  etablissement_id: string;
  nom: string;
  description: string | null;
  type: "full" | "partial" | "incremental";
  format: "json" | "csv" | "sql";
  categories: string[];
  storage_path: string | null;
  file_size: number | null;
  record_count: number | null;
  checksum: string | null;
  status: "pending" | "in_progress" | "completed" | "failed";
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
  // Relation
  created_by_user?: {
    nom: string;
    prenom: string | null;
  };
}

export interface BackupScheduleRecord {
  id: string;
  etablissement_id: string;
  nom: string;
  actif: boolean;
  frequence: "daily" | "weekly" | "monthly";
  heure_execution: string;
  jour_semaine: number | null;
  jour_mois: number | null;
  type: "full" | "partial";
  categories: string[];
  retention_jours: number;
  derniere_execution: string | null;
  prochaine_execution: string | null;
  created_at: string;
  updated_at: string;
}
