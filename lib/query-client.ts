/**
 * Utilitaire QueryClient pour Next.js App Router
 *
 * Ce fichier expose getQueryClient() pour une utilisation dans les Server Components
 * Pattern recommandé par TanStack Query pour SSR avec Next.js 16
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
 */

import { QueryClient, defaultShouldDehydrateQuery, isServer } from "@tanstack/react-query";

/**
 * Crée une nouvelle instance QueryClient avec les options optimisées pour SSR
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Avec SSR, on définit un staleTime > 0 pour éviter
        // le refetch immédiat côté client après l'hydratation
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
      dehydrate: {
        // Inclure les queries en pending dans la déshydratation
        // pour supporter le streaming de Next.js
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
        // Ne pas masquer les erreurs Next.js (détection de pages dynamiques)
        shouldRedactErrors: () => false,
      },
    },
  });
}

// Variable globale pour le client côté navigateur
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Retourne un QueryClient selon le contexte (serveur ou navigateur)
 *
 * - Serveur: Toujours créer un nouveau client (isolation des requêtes)
 * - Navigateur: Réutiliser le même client (état partagé)
 *
 * @example
 * ```tsx
 * // Dans un Server Component
 * import { getQueryClient } from "@/lib/query-client";
 *
 * export default async function Page() {
 *   const queryClient = getQueryClient();
 *
 *   await queryClient.prefetchQuery({
 *     queryKey: ["products"],
 *     queryFn: fetchProducts,
 *   });
 *
 *   return (
 *     <HydrationBoundary state={dehydrate(queryClient)}>
 *       <ProductList />
 *     </HydrationBoundary>
 *   );
 * }
 * ```
 */
export function getQueryClient() {
  if (isServer) {
    // Serveur: toujours créer un nouveau query client
    // pour éviter le partage de données entre les requêtes
    return makeQueryClient();
  } else {
    // Navigateur: créer un nouveau client seulement s'il n'existe pas
    // TRÈS IMPORTANT pour éviter de recréer un client si React suspend
    // pendant le rendu initial
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
