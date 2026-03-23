/**
 * Point d'entrée principal pour l'authentification
 *
 * Ce module exporte les fonctions d'authentification.
 * Mode actuel: SUPABASE AUTH (primary) + JWT custom (fallback pour PIN)
 */

// Fonctions de hachage (utilisées par les deux modes)
export * from "./password";

// Sessions JWT custom - exports renommés (utilisé pour PIN auth)
export {
  createSession,
  verifySession,
  getSession as getLegacySession,
  setSessionCookie,
  deleteSessionCookie,
  type SessionPayload,
} from "./session";

// Supabase Auth - MODE PRINCIPAL
export {
  getSupabaseUser,
  getCurrentUser,
  requireAuth,
  requireRole,
  requireAnyRole,
  getEtablissementId,
  isAuthenticated,
  hasRole,
  hasAnyRole,
  signOut,
  type AuthUser,
} from "./supabase";

// Contexte et hooks client
export {
  AuthProvider,
  useAuth,
  useCurrentUser,
  useCanAccessRoute,
  type AuthUser as AuthUserContext,
  type AuthContextValue,
} from "./context";
