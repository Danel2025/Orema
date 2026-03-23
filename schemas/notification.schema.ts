import { z } from "zod";

// ============================================================================
// Enum TypeNotification
// ============================================================================

export const TYPE_NOTIFICATION = {
  COMMANDE: "COMMANDE",
  STOCK: "STOCK",
  TABLE: "TABLE",
  PAIEMENT: "PAIEMENT",
  SYSTEME: "SYSTEME",
  LIVRAISON: "LIVRAISON",
  CAISSE: "CAISSE",
} as const;

export type TypeNotification = (typeof TYPE_NOTIFICATION)[keyof typeof TYPE_NOTIFICATION];

export const typeNotificationSchema = z.enum([
  "COMMANDE",
  "STOCK",
  "TABLE",
  "PAIEMENT",
  "SYSTEME",
  "LIVRAISON",
  "CAISSE",
]);

// ============================================================================
// Schema de notification
// ============================================================================

export const notificationSchema = z.object({
  id: z.string().uuid(),
  type: typeNotificationSchema,
  titre: z.string().min(1),
  message: z.string().min(1),
  lue: z.boolean().default(false),
  donnees: z.record(z.string(), z.unknown()).default({}),
  lien: z.string().nullable().optional(),
  utilisateur_id: z.string().uuid(),
  etablissement_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type NotificationData = z.infer<typeof notificationSchema>;

// ============================================================================
// Schema de creation
// ============================================================================

export const createNotificationSchema = z.object({
  type: typeNotificationSchema,
  titre: z.string().min(1, "Le titre est requis").max(200),
  message: z.string().min(1, "Le message est requis").max(1000),
  donnees: z.record(z.string(), z.unknown()).default({}),
  lien: z.string().nullable().optional(),
  utilisateur_id: z.string().uuid(),
  etablissement_id: z.string().uuid(),
});

export type CreateNotificationData = z.infer<typeof createNotificationSchema>;

// ============================================================================
// Schema pour creer une notification broadcast (a plusieurs utilisateurs)
// ============================================================================

export const broadcastNotificationSchema = z.object({
  type: typeNotificationSchema,
  titre: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  donnees: z.record(z.string(), z.unknown()).default({}),
  lien: z.string().nullable().optional(),
  etablissement_id: z.string().uuid(),
  /** Roles cibles — si vide, envoie a tous les utilisateurs de l'etablissement */
  roles: z.array(z.string()).optional(),
});

export type BroadcastNotificationData = z.infer<typeof broadcastNotificationSchema>;
