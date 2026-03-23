/**
 * Client Supabase pour le serveur (Server Components, Server Actions, Route Handlers)
 *
 * Ce client est utilise dans les contextes serveur de Next.js.
 * Il gere les cookies via l'API cookies() de Next.js.
 *
 * IMPORTANT: Ce client supporte les mutations de cookies.
 * Pour le middleware, utilisez le client specifique dans middleware.ts
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * Cree un client Supabase pour utilisation cote serveur.
 *
 * @example
 * ```tsx
 * // Server Component
 * import { createClient } from '@/lib/supabase/server'
 *
 * export default async function Page() {
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *   // ...
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Server Action
 * 'use server'
 * import { createClient } from '@/lib/supabase/server'
 *
 * export async function myAction() {
 *   const supabase = await createClient()
 *   // ...
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // La mutation de cookies peut echouer dans certains contextes
            // (ex: Server Components en lecture seule)
            // Ce n'est pas critique car le middleware gere le refresh des sessions
            console.warn("[Supabase Server] Cookie mutation failed:", error);
          }
        },
      },
    }
  );
}

/**
 * Cree un client Supabase avec le Service Role Key (admin)
 *
 * ATTENTION: Ce client bypass toutes les politiques RLS!
 * A utiliser uniquement pour les operations administratives.
 *
 * @example
 * ```tsx
 * import { createServiceClient } from '@/lib/supabase/server'
 *
 * // Migration ou operation admin
 * const supabase = createServiceClient()
 * const { data } = await supabase.from('utilisateurs').select('*')
 * ```
 */
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<any>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // Service client n'a pas besoin de cookies
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
