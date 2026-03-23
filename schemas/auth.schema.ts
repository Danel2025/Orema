import { z } from "zod";

/**
 * Schema Zod pour le login par email/password
 */
export const loginEmailSchema = z.object({
  email: z.string().email("Email invalide").min(1, "L'email est requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export type LoginEmailData = z.infer<typeof loginEmailSchema>;

/**
 * Schema Zod pour le login par PIN
 */
export const loginPinSchema = z.object({
  pinCode: z
    .string()
    .length(4, "Le code PIN doit contenir 4 chiffres")
    .regex(/^\d+$/, "Le code PIN doit contenir uniquement des chiffres"),
});

export type LoginPinData = z.infer<typeof loginPinSchema>;

/**
 * Schema Zod pour la création d'un utilisateur
 */
export const utilisateurSchema = z.object({
  email: z.string().email("Email invalide"),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "CAISSIER", "SERVEUR"]),
  pinCode: z.string().length(4).regex(/^\d+$/).optional(),
  etablissementId: z.string().min(1),
});

export type UtilisateurFormData = z.infer<typeof utilisateurSchema>;
