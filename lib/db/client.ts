/**
 * Client de base de données Supabase
 * Réexporte les clients Supabase configurés pour utilisation dans les queries
 */

// Réexport des clients Supabase existants
// Type pour le client Supabase
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export { createClient, createServiceClient } from "@/lib/supabase/server";
export { createClient as createBrowserClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbClient = SupabaseClient<any>;

// Keep Database re-export for code that needs the raw type
export type { Database };

/**
 * Helper pour obtenir le client approprié selon le contexte
 * - Côté serveur: utilise createClient (avec cookies)
 * - Pour les opérations admin: utilise createServiceClient (bypass RLS)
 */
export async function getServerClient(): Promise<DbClient> {
  const { createClient } = await import("@/lib/supabase/server");
  return createClient();
}

export function getServiceClient(): DbClient {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createServiceClient } = require("@/lib/supabase/server");
  return createServiceClient();
}

/**
 * Contexte utilisateur pour RLS
 */
export interface RlsContext {
  userId: string;
  etablissementId: string;
  role: string;
}

/**
 * Client Supabase scopé par établissement.
 *
 * Contient le client Supabase ET le contexte d'établissement afin que les
 * Server Actions puissent systématiquement filtrer par `etablissement_id`.
 *
 * Le vrai RLS via `set_config` ne fonctionne PAS avec PostgREST/pgbouncer
 * (chaque requête HTTP obtient une connexion différente, donc les variables
 * de session sont perdues). On utilise donc un filtrage applicatif.
 */
export interface ScopedClient {
  /** Le client Supabase (service client, bypass RLS) */
  client: DbClient;
  /** L'ID de l'établissement pour filtrer les requêtes */
  etablissementId: string;
  /** L'ID de l'utilisateur authentifié */
  userId: string;
  /** Le rôle de l'utilisateur */
  role: string;
}

/**
 * Crée un client authentifié scopé pour les Server Actions.
 *
 * Retourne un `ScopedClient` avec le client Supabase ET le contexte RLS.
 * Utiliser `scoped.client` pour les requêtes et `scoped.etablissementId`
 * dans les filtres `.eq("etablissement_id", ...)`.
 *
 * @example
 * ```ts
 * const user = await getCurrentUser()
 * const scoped = await createScopedClient({
 *   userId: user.userId,
 *   etablissementId: user.etablissementId,
 *   role: user.role
 * })
 * const { data } = await scoped.client
 *   .from("ventes")
 *   .select("*")
 *   .eq("etablissement_id", scoped.etablissementId)
 * ```
 */
export async function createScopedClient(context: RlsContext): Promise<ScopedClient> {
  if (!context.etablissementId) {
    throw new Error("createScopedClient: etablissementId is required");
  }
  if (!context.userId) {
    throw new Error("createScopedClient: userId is required");
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();

  return {
    client,
    etablissementId: context.etablissementId,
    userId: context.userId,
    role: context.role,
  };
}

/**
 * Crée un client authentifié pour les Server Actions.
 *
 * Valide que le contexte RLS est complet (userId et etablissementId requis)
 * avant de retourner le service client.
 *
 * IMPORTANT: Cette fonction retourne un DbClient brut pour compatibilité.
 * Les Server Actions doivent TOUJOURS ajouter `.eq("etablissement_id", ...)`
 * à leurs requêtes. Pour une approche plus sûre, utiliser `createScopedClient`.
 */
export async function createAuthenticatedClient(context: RlsContext): Promise<DbClient> {
  if (!context.etablissementId) {
    throw new Error("createAuthenticatedClient: etablissementId is required — cannot create an unscoped admin client");
  }
  if (!context.userId) {
    throw new Error("createAuthenticatedClient: userId is required");
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  return createServiceClient();
}
