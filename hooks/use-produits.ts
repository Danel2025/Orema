"use client";

/**
 * Hook React Query pour la gestion des produits avec pagination
 *
 * Utilise TanStack Query pour:
 * - Cache automatique des données
 * - Revalidation intelligente
 * - Pagination côté serveur
 * - Invalidation après mutations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProduitsPaginated,
  getProduitById,
  createProduit,
  updateProduit,
  deleteProduit,
  toggleProduitActif,
  type PaginationOptions,
} from "@/actions/produits";
import type { ProduitFormData } from "@/schemas/produit.schema";

// Clés de cache
export const produitsKeys = {
  all: ["produits"] as const,
  lists: () => [...produitsKeys.all, "list"] as const,
  list: (filters: PaginationOptions) => [...produitsKeys.lists(), filters] as const,
  details: () => [...produitsKeys.all, "detail"] as const,
  detail: (id: string) => [...produitsKeys.details(), id] as const,
};

/**
 * Hook pour récupérer les produits avec pagination
 */
export function useProduits(options: PaginationOptions = {}) {
  return useQuery({
    queryKey: produitsKeys.list(options),
    queryFn: () => getProduitsPaginated(options),
    staleTime: 30 * 1000, // 30 secondes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour récupérer un produit par son ID
 */
export function useProduit(id: string | null) {
  return useQuery({
    queryKey: produitsKeys.detail(id || ""),
    queryFn: () => (id ? getProduitById(id) : null),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour créer un produit
 */
export function useCreateProduit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProduitFormData) => createProduit(data),
    onSuccess: () => {
      // Invalider toutes les listes de produits
      queryClient.invalidateQueries({ queryKey: produitsKeys.lists() });
    },
  });
}

/**
 * Hook pour mettre à jour un produit
 */
export function useUpdateProduit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProduitFormData }) => updateProduit(id, data),
    onSuccess: (_, variables) => {
      // Invalider la liste et le détail
      queryClient.invalidateQueries({ queryKey: produitsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: produitsKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook pour supprimer un produit
 */
export function useDeleteProduit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduit(id),
    onSuccess: (_, id) => {
      // Invalider la liste et supprimer le détail du cache
      queryClient.invalidateQueries({ queryKey: produitsKeys.lists() });
      queryClient.removeQueries({ queryKey: produitsKeys.detail(id) });
    },
  });
}

/**
 * Hook pour activer/désactiver un produit
 */
export function useToggleProduitActif() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleProduitActif(id),
    onSuccess: (_, id) => {
      // Invalider la liste et le détail
      queryClient.invalidateQueries({ queryKey: produitsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: produitsKeys.detail(id) });
    },
  });
}

/**
 * Hook utilitaire pour précharger la page suivante
 */
export function usePrefetchNextPage(currentOptions: PaginationOptions) {
  const queryClient = useQueryClient();

  return () => {
    const nextPage = (currentOptions.page || 1) + 1;
    queryClient.prefetchQuery({
      queryKey: produitsKeys.list({ ...currentOptions, page: nextPage }),
      queryFn: () => getProduitsPaginated({ ...currentOptions, page: nextPage }),
      staleTime: 30 * 1000,
    });
  };
}
