import { z } from "zod";

/**
 * Rôles disponibles dans le système
 */
export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "CAISSIER",
  "SERVEUR",
] as const;

/**
 * Limites de remise par défaut par rôle
 * Utilisé pour initialiser les règles d'un nouvel établissement
 */
export const ROLES_DEFAUT_REMISE: Record<string, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 50,
  MANAGER: 20,
  CAISSIER: 5,
  SERVEUR: 0,
};

/**
 * Schema pour une règle de tarification par rôle
 */
export const regleTarificationSchema = z.object({
  role: z.enum(ROLES),
  remiseMaxPourcent: z.number().min(0).max(100),
  peutModifierPrix: z.boolean(),
  peutAppliquerRemise: z.boolean(),
  plafondRemiseTransaction: z.number().int().min(0).default(0), // 0 = illimité
  necessiteApprobationAuDela: z
    .number()
    .min(0)
    .max(100)
    .nullable()
    .default(null),
});

/**
 * Schema pour sauvegarder toutes les règles d'un établissement
 */
export const saveReglesSchema = z.object({
  regles: z.array(regleTarificationSchema).min(1),
});

/**
 * Schema changement de prix (pour audit)
 */
export const historiquePrixSchema = z.object({
  produitId: z.string().uuid(),
  ancienPrix: z.number().int().positive(),
  nouveauPrix: z.number().int().positive(),
  raison: z.string().max(500).optional(),
});

/**
 * Schema demande d'approbation remise
 */
export const approbationRemiseSchema = z.object({
  montantRemise: z.number().int().positive(),
  pourcentageRemise: z.number().min(0).max(100),
  montantVente: z.number().int().positive(),
  commentaire: z.string().max(500).optional(),
});

/**
 * Schema réponse approbation
 */
export const reponseApprobationSchema = z.object({
  approbationId: z.string().uuid(),
  statut: z.enum(["approuvee", "refusee"]),
  commentaire: z.string().max(500).optional(),
});

/**
 * Schema tarif horaire
 */
export const tarifHoraireSchema = z.object({
  nom: z.string().min(1).max(100),
  heureDebut: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  heureFin: z.string().regex(/^\d{2}:\d{2}$/),
  joursSemaine: z.array(z.number().int().min(1).max(7)).min(1),
  typeAjustement: z.enum(["pourcentage", "montant_fixe"]),
  valeurAjustement: z.number(), // négatif = réduction, positif = majoration
  categorieId: z.string().uuid().nullable().default(null),
  actif: z.boolean().default(true),
  priorite: z.number().int().default(0),
});

/**
 * Schema configuration globale tarification
 */
export const configTarificationSchema = z.object({
  protectionMargeActive: z.boolean(),
  margeMinimumGlobale: z.number().min(0).max(100),
  approbationRemiseActive: z.boolean(),
  tarifsHorairesActifs: z.boolean(),
});

// Types exportés
export type RegleTarification = z.infer<typeof regleTarificationSchema>;
export type SaveReglesInput = z.infer<typeof saveReglesSchema>;
export type HistoriquePrixInput = z.infer<typeof historiquePrixSchema>;
export type ApprobationRemiseInput = z.infer<typeof approbationRemiseSchema>;
export type ReponseApprobationInput = z.infer<
  typeof reponseApprobationSchema
>;
export type TarifHoraireInput = z.infer<typeof tarifHoraireSchema>;
export type ConfigTarification = z.infer<typeof configTarificationSchema>;
