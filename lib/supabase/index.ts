/**
 * Point d'entree pour les clients Supabase
 *
 * Usage:
 * - Client Components: import { createClient } from '@/lib/supabase/client'
 * - Server Components/Actions: import { createClient } from '@/lib/supabase/server'
 * - Proxy (Next.js 16): import { updateSession } from '@/lib/supabase/session-utils'
 */

// Re-export pour faciliter les imports
export { createClient as createBrowserClient } from "./client";
export { createClient as createServerClient, createServiceClient } from "./server";
export { updateSession } from "./session-utils";
