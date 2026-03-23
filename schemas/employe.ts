/**
 * Schemas de validation Zod pour le module Employes
 */

import { z } from "zod";

/**
 * Roles disponibles
 */
export const ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "CAISSIER", "SERVEUR"] as const;
export type RoleType = (typeof ROLES)[number];

/**
 * Labels des roles en francais
 */
export const ROLE_LABELS: Record<RoleType, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  CAISSIER: "Caissier",
  SERVEUR: "Serveur",
};

/**
 * Couleurs des badges de role
 */
export const ROLE_COLORS: Record<RoleType, "red" | "violet" | "amber" | "blue" | "green"> = {
  SUPER_ADMIN: "red",
  ADMIN: "violet",
  MANAGER: "amber",
  CAISSIER: "blue",
  SERVEUR: "green",
};

/**
 * Schema pour la creation d'un employe
 */
export const createEmployeSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caracteres"),
  prenom: z.string().min(2, "Le prenom doit contenir au moins 2 caracteres"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "CAISSIER", "SERVEUR"]),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
    ),
  pinCode: z
    .string()
    .regex(/^\d{4,6}$/, "Le PIN doit contenir entre 4 et 6 chiffres")
    .optional(),
  actif: z.boolean().default(true),
});

export type CreateEmployeInput = z.infer<typeof createEmployeSchema>;

/**
 * Schema pour la mise a jour d'un employe
 */
export const updateEmployeSchema = z.object({
  id: z.string().uuid("ID invalide"),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caracteres"),
  prenom: z.string().min(2, "Le prenom doit contenir au moins 2 caracteres"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional().nullable(),
  role: z.enum(ROLES, { message: "Role invalide" }),
  actif: z.boolean(),
});

export type UpdateEmployeInput = z.infer<typeof updateEmployeSchema>;

/**
 * Schema pour le reset du PIN
 */
export const resetPinSchema = z.object({
  employeId: z.string().uuid("ID employe invalide"),
  newPin: z.string().regex(/^\d{4,6}$/, "Le PIN doit contenir entre 4 et 6 chiffres"),
});

export type ResetPinInput = z.infer<typeof resetPinSchema>;

/**
 * Schema pour le reset du mot de passe
 */
export const resetPasswordSchema = z.object({
  employeId: z.string().uuid("ID employe invalide"),
  newPassword: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
    ),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Schema pour le changement de statut
 */
export const toggleStatusSchema = z.object({
  employeId: z.string().uuid("ID employe invalide"),
  actif: z.boolean(),
});

export type ToggleStatusInput = z.infer<typeof toggleStatusSchema>;

/**
 * Permissions par role
 */
export interface RolePermissions {
  canManageEmployees: boolean;
  canManageProducts: boolean;
  canManageStock: boolean;
  canManageClients: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canMakeSales: boolean;
  canManageTables: boolean;
  canAccessCashRegister: boolean;
  canCloseSession: boolean;
  canApplyDiscount: boolean;
  canCancelSale: boolean;
}

export const ROLE_PERMISSIONS: Record<RoleType, RolePermissions> = {
  SUPER_ADMIN: {
    canManageEmployees: true,
    canManageProducts: true,
    canManageStock: true,
    canManageClients: true,
    canViewReports: true,
    canManageSettings: true,
    canMakeSales: true,
    canManageTables: true,
    canAccessCashRegister: true,
    canCloseSession: true,
    canApplyDiscount: true,
    canCancelSale: true,
  },
  ADMIN: {
    canManageEmployees: true,
    canManageProducts: true,
    canManageStock: true,
    canManageClients: true,
    canViewReports: true,
    canManageSettings: true,
    canMakeSales: true,
    canManageTables: true,
    canAccessCashRegister: true,
    canCloseSession: true,
    canApplyDiscount: true,
    canCancelSale: true,
  },
  MANAGER: {
    canManageEmployees: false,
    canManageProducts: true,
    canManageStock: true,
    canManageClients: true,
    canViewReports: true,
    canManageSettings: false,
    canMakeSales: true,
    canManageTables: true,
    canAccessCashRegister: true,
    canCloseSession: true,
    canApplyDiscount: true,
    canCancelSale: true,
  },
  CAISSIER: {
    canManageEmployees: false,
    canManageProducts: false,
    canManageStock: false,
    canManageClients: true,
    canViewReports: false,
    canManageSettings: false,
    canMakeSales: true,
    canManageTables: false,
    canAccessCashRegister: true,
    canCloseSession: true,
    canApplyDiscount: false,
    canCancelSale: false,
  },
  SERVEUR: {
    canManageEmployees: false,
    canManageProducts: false,
    canManageStock: false,
    canManageClients: false,
    canViewReports: false,
    canManageSettings: false,
    canMakeSales: true,
    canManageTables: true,
    canAccessCashRegister: false,
    canCloseSession: false,
    canApplyDiscount: false,
    canCancelSale: false,
  },
};
