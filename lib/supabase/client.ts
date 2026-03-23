/**
 * Client Supabase pour le navigateur (Client Components)
 *
 * Ce client est utilise dans les composants React cote client.
 * Il gere automatiquement les cookies de session via document.cookie.
 *
 * Pattern singleton: une seule instance est creee et reutilisee.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// Re-export Database for consumers that need the type
export type { Database };

/**
 * Cree un client Supabase pour utilisation dans le navigateur.
 *
 * @example
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 *
 * export function MyComponent() {
 *   const supabase = createClient()
 *   // ...
 * }
 * ```
 */
export function createClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
