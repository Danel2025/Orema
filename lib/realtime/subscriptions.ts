/**
 * Souscriptions Supabase Realtime
 *
 * Fonctions pour s'abonner aux changements en temps réel
 * sur les tables, commandes (lignes_vente) et stocks (produits).
 *
 * Chaque fonction retourne un cleanup function pour se désabonner.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { Table, LigneVente, Produit } from "@/lib/db/types";

// ============================================================================
// Callbacks types
// ============================================================================

export interface NotificationChangeCallbacks {
  onInsert?: (notification: Record<string, unknown>) => void;
  onUpdate?: (notification: Record<string, unknown>) => void;
  onDelete?: (oldNotification: Partial<Record<string, unknown>>) => void;
  onError?: (error: Error) => void;
}

export interface TableChangeCallbacks {
  onInsert?: (table: Table) => void;
  onUpdate?: (table: Table) => void;
  onDelete?: (oldTable: Partial<Table>) => void;
  onError?: (error: Error) => void;
}

export interface OrderChangeCallbacks {
  onInsert?: (ligne: LigneVente) => void;
  onUpdate?: (ligne: LigneVente) => void;
  onDelete?: (oldLigne: Partial<LigneVente>) => void;
  onError?: (error: Error) => void;
}

export interface StockChangeCallbacks {
  onUpdate?: (produit: Produit) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// Subscribe to Tables changes
// ============================================================================

/**
 * S'abonne aux changements en temps réel de la table `tables`
 * filtré par etablissement_id.
 *
 * @returns Fonction de cleanup pour se désabonner
 */
export function subscribeToTables(
  supabase: SupabaseClient<Database>,
  etablissementId: string,
  callbacks: TableChangeCallbacks
): () => void {
  const channel = supabase
    .channel(`tables-${etablissementId}`)
    .on<Table>(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tables",
        filter: `etablissement_id=eq.${etablissementId}`,
      },
      (payload) => {
        try {
          switch (payload.eventType) {
            case "INSERT":
              callbacks.onInsert?.(payload.new as Table);
              break;
            case "UPDATE":
              callbacks.onUpdate?.(payload.new as Table);
              break;
            case "DELETE":
              callbacks.onDelete?.(payload.old as Partial<Table>);
              break;
          }
        } catch (error) {
          callbacks.onError?.(
            error instanceof Error ? error : new Error("Erreur traitement changement table")
          );
        }
      }
    )
    .subscribe((status, err) => {
      if (err) {
        callbacks.onError?.(new Error(`Erreur souscription tables: ${err.message}`));
      }
    });

  return () => {
    channel.unsubscribe();
  };
}

// ============================================================================
// Subscribe to Orders (lignes_vente) changes
// ============================================================================

/**
 * S'abonne aux changements en temps réel de la table `lignes_vente`.
 *
 * Note: lignes_vente n'a pas de colonne etablissement_id directement.
 * On écoute tous les événements sans filtre d'établissement.
 * Le filtrage par établissement peut être fait côté client via vente_id.
 *
 * @returns Fonction de cleanup pour se désabonner
 */
export function subscribeToOrders(
  supabase: SupabaseClient<Database>,
  etablissementId: string,
  callbacks: OrderChangeCallbacks
): () => void {
  const channel = supabase
    .channel(`orders-${etablissementId}`)
    .on<LigneVente>(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "lignes_vente",
      },
      (payload) => {
        try {
          callbacks.onInsert?.(payload.new as LigneVente);
        } catch (error) {
          callbacks.onError?.(
            error instanceof Error ? error : new Error("Erreur traitement nouvelle commande")
          );
        }
      }
    )
    .on<LigneVente>(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "lignes_vente",
      },
      (payload) => {
        try {
          callbacks.onUpdate?.(payload.new as LigneVente);
        } catch (error) {
          callbacks.onError?.(
            error instanceof Error ? error : new Error("Erreur traitement changement commande")
          );
        }
      }
    )
    .on<LigneVente>(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "lignes_vente",
      },
      (payload) => {
        try {
          callbacks.onDelete?.(payload.old as Partial<LigneVente>);
        } catch (error) {
          callbacks.onError?.(
            error instanceof Error ? error : new Error("Erreur traitement suppression commande")
          );
        }
      }
    )
    .subscribe((status, err) => {
      if (err) {
        callbacks.onError?.(new Error(`Erreur souscription commandes: ${err.message}`));
      }
    });

  return () => {
    channel.unsubscribe();
  };
}

// ============================================================================
// Subscribe to Stock (produits) changes
// ============================================================================

/**
 * S'abonne aux changements en temps réel sur la table `produits`
 * pour détecter les changements de stock (stock_actuel).
 * Filtré par etablissement_id.
 *
 * @returns Fonction de cleanup pour se désabonner
 */
export function subscribeToStock(
  supabase: SupabaseClient<Database>,
  etablissementId: string,
  callbacks: StockChangeCallbacks
): () => void {
  const channel = supabase
    .channel(`stock-${etablissementId}`)
    .on<Produit>(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "produits",
        filter: `etablissement_id=eq.${etablissementId}`,
      },
      (payload) => {
        try {
          callbacks.onUpdate?.(payload.new as Produit);
        } catch (error) {
          callbacks.onError?.(
            error instanceof Error ? error : new Error("Erreur traitement changement stock")
          );
        }
      }
    )
    .subscribe((status, err) => {
      if (err) {
        callbacks.onError?.(new Error(`Erreur souscription stock: ${err.message}`));
      }
    });

  return () => {
    channel.unsubscribe();
  };
}

// ============================================================================
// Subscribe to Notifications changes
// ============================================================================

/**
 * S'abonne aux changements en temps reel de la table `notifications`
 * filtre par utilisateur_id.
 *
 * @returns Fonction de cleanup pour se desabonner
 */
export function subscribeToNotifications(
  supabase: SupabaseClient<Database>,
  utilisateurId: string,
  callbacks: NotificationChangeCallbacks
): () => void {
  const channel = supabase
    .channel(`notifications-${utilisateurId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `utilisateur_id=eq.${utilisateurId}`,
      },
      (payload) => {
        try {
          callbacks.onInsert?.(payload.new as Record<string, unknown>);
        } catch (error) {
          callbacks.onError?.(
            error instanceof Error ? error : new Error("Erreur traitement nouvelle notification")
          );
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `utilisateur_id=eq.${utilisateurId}`,
      },
      (payload) => {
        try {
          callbacks.onUpdate?.(payload.new as Record<string, unknown>);
        } catch (error) {
          callbacks.onError?.(
            error instanceof Error ? error : new Error("Erreur traitement mise a jour notification")
          );
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "notifications",
        filter: `utilisateur_id=eq.${utilisateurId}`,
      },
      (payload) => {
        try {
          callbacks.onDelete?.(payload.old as Partial<Record<string, unknown>>);
        } catch (error) {
          callbacks.onError?.(
            error instanceof Error ? error : new Error("Erreur traitement suppression notification")
          );
        }
      }
    )
    .subscribe((status, err) => {
      if (err) {
        callbacks.onError?.(new Error(`Erreur souscription notifications: ${err.message}`));
      }
    });

  return () => {
    channel.unsubscribe();
  };
}
