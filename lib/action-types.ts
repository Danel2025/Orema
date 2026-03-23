/**
 * Types partagés pour les Server Actions
 */

/**
 * Résultat standard d'une Server Action.
 * Utilisé comme type de retour de toutes les actions admin.
 */
export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
  fieldErrors?: Record<string, string[]>;
};
