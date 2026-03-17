/**
 * Client de base de données Supabase
 * Réexporte les clients Supabase configurés pour utilisation dans les queries
 */

// Réexport des clients Supabase existants
// Type pour le client Supabase
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export { createClient, createServiceClient } from '@/lib/supabase/server'
export { createClient as createBrowserClient } from '@/lib/supabase/client'

export type DbClient = SupabaseClient<Database>

/**
 * Helper pour obtenir le client approprié selon le contexte
 * - Côté serveur: utilise createClient (avec cookies)
 * - Pour les opérations admin: utilise createServiceClient (bypass RLS)
 */
export async function getServerClient(): Promise<DbClient> {
  const { createClient } = await import('@/lib/supabase/server')
  return createClient()
}

export function getServiceClient(): DbClient {
  const { createServiceClient } = require('@/lib/supabase/server')
  return createServiceClient()
}

/**
 * Contexte utilisateur pour RLS
 */
export interface RlsContext {
  userId: string
  etablissementId: string
  role: string
}

/**
 * Crée un client authentifié avec contexte RLS
 *
 * Cette fonction crée un client Supabase et définit les variables de session
 * pour que les politiques RLS puissent identifier l'utilisateur même avec l'auth PIN.
 *
 * @example
 * ```ts
 * const user = await getCurrentUser()
 * const supabase = await createAuthenticatedClient({
 *   userId: user.userId,
 *   etablissementId: user.etablissementId,
 *   role: user.role
 * })
 * ```
 */
export async function createAuthenticatedClient(context: RlsContext): Promise<DbClient> {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  // Définir le contexte utilisateur pour RLS via set_config
  // Ces valeurs sont lues par les fonctions RLS (get_user_id, get_user_etablissement_id, etc.)
  await supabase.rpc('set_rls_context', {
    p_user_id: context.userId,
    p_etablissement_id: context.etablissementId,
    p_role: context.role
  })

  return supabase
}
