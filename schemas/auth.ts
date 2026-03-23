/**
 * Schémas de validation Zod pour l'authentification
 */

import { z } from "zod";

/**
 * Schéma pour la connexion par email/password
 */
export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schéma pour la connexion par PIN
 */
export const pinLoginSchema = z.object({
  email: z.string().email("Email invalide"),
  pin: z.string().regex(/^\d{4,6}$/, "Le PIN doit contenir entre 4 et 6 chiffres"),
});

export type PinLoginInput = z.infer<typeof pinLoginSchema>;

/**
 * Schéma pour la création d'un utilisateur
 */
export const createUserSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
    ),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "CAISSIER", "SERVEUR"]),
  pinCode: z
    .string()
    .regex(/^\d{4,6}$/, "Le PIN doit contenir entre 4 et 6 chiffres")
    .optional(),
  etablissementId: z.string().uuid("ID établissement invalide"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Schéma pour la mise à jour du mot de passe
 */
export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z
      .string()
      .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

/**
 * Schéma pour la mise à jour du PIN
 * currentPin est optionnel pour permettre la création d'un nouveau PIN
 */
export const updatePinSchema = z
  .object({
    currentPin: z
      .string()
      .regex(/^\d{4,6}$/, "Le PIN actuel doit contenir entre 4 et 6 chiffres")
      .optional()
      .or(z.literal("")),
    newPin: z.string().regex(/^\d{4,6}$/, "Le nouveau PIN doit contenir entre 4 et 6 chiffres"),
    confirmPin: z.string(),
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: "Les PINs ne correspondent pas",
    path: ["confirmPin"],
  });

export type UpdatePinInput = z.infer<typeof updatePinSchema>;
