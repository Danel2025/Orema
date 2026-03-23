/**
 * Schémas de validation Zod pour l'inscription
 * Wizard en 2 étapes: Utilisateur + Établissement
 */

import { z } from "zod";

/**
 * Étape 1: Informations utilisateur
 */
export const registerUserSchema = z
  .object({
    email: z.string().min(1, "L'email est requis").email("Email invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
      ),
    confirmPassword: z.string().min(1, "Veuillez confirmer le mot de passe"),
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

/**
 * Étape 2: Informations établissement
 */
export const registerEtablissementSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom de l'établissement doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  telephone: z
    .string()
    .max(20, "Le téléphone ne peut pas dépasser 20 caractères")
    .regex(/^(\+241\s?)?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/, "Format invalide. Ex: +241 01 23 45 67")
    .optional()
    .or(z.literal("")),
  adresse: z
    .string()
    .max(255, "L'adresse ne peut pas dépasser 255 caractères")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Email de l'établissement invalide").optional().or(z.literal("")),
  nif: z.string().max(50, "Le NIF ne peut pas dépasser 50 caractères").optional().or(z.literal("")),
  rccm: z
    .string()
    .max(50, "Le RCCM ne peut pas dépasser 50 caractères")
    .optional()
    .or(z.literal("")),
});

export type RegisterEtablissementInput = z.infer<typeof registerEtablissementSchema>;

/**
 * Schéma complet pour l'inscription (combinaison des 2 étapes)
 */
export const registerCompleteSchema = z.object({
  user: registerUserSchema,
  etablissement: registerEtablissementSchema,
});

export type RegisterCompleteInput = z.infer<typeof registerCompleteSchema>;
