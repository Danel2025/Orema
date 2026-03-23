/**
 * Schemas de validation pour les ecrans d'affichage
 */

import { z } from "zod";

/**
 * Types d'ecran disponibles
 */
export const typeEcranOptions = [
  { value: "CUISINE", label: "Cuisine" },
  { value: "BAR", label: "Bar" },
  { value: "PERSONNALISE", label: "Personnalise" },
] as const;

/**
 * Schema pour creer/modifier un ecran d'affichage
 */
export const ecranSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caracteres")
    .max(100, "Le nom ne peut pas depasser 100 caracteres"),
  type: z.enum(["CUISINE", "BAR", "PERSONNALISE"]),
  categories: z.array(z.string().uuid()).optional().nullable(),
  son_actif: z.boolean().default(true),
  delai_urgence_minutes: z.coerce
    .number()
    .int()
    .min(1, "Le delai doit etre d'au moins 1 minute")
    .max(120, "Le delai ne peut pas depasser 120 minutes")
    .default(15),
});

export type EcranFormData = z.output<typeof ecranSchema>;
export type EcranFormInput = z.input<typeof ecranSchema>;
