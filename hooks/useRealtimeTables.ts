"use client";

/**
 * Hook Realtime pour le plan de salle.
 *
 * S'abonne aux changements en temps réel de la table `tables`
 * pour un établissement donné. Met à jour le state local
 * lors d'INSERT, UPDATE ou DELETE.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeToTables } from "@/lib/realtime/subscriptions";
import type { Table } from "@/lib/db/types";

interface UseRealtimeTablesOptions {
  etablissementId: string | null | undefined;
  enabled?: boolean;
  /** Tables initiales (pré-chargées côté serveur) */
  initialTables?: Table[];
}

interface UseRealtimeTablesReturn {
  tables: Table[];
  isSubscribed: boolean;
  error: Error | null;
}

export function useRealtimeTables({
  etablissementId,
  enabled = true,
  initialTables = [],
}: UseRealtimeTablesOptions): UseRealtimeTablesReturn {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [error, setError] = useState<Error | null>(null);
  const supabaseRef = useRef(createClient());

  const isSubscribed = useMemo(
    () => enabled === true && !!etablissementId,
    [enabled, etablissementId]
  );

  const handleInsert = useCallback((newTable: Table) => {
    setTables((prev) => {
      if (prev.some((t) => t.id === newTable.id)) return prev;
      return [...prev, newTable];
    });
  }, []);

  const handleUpdate = useCallback((updatedTable: Table) => {
    setTables((prev) => prev.map((t) => (t.id === updatedTable.id ? updatedTable : t)));
  }, []);

  const handleDelete = useCallback((oldTable: Partial<Table>) => {
    if (!oldTable.id) return;
    setTables((prev) => prev.filter((t) => t.id !== oldTable.id));
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err);
    console.error("[useRealtimeTables]", err.message);
  }, []);

  useEffect(() => {
    if (!enabled || !etablissementId) {
      return;
    }

    const supabase = supabaseRef.current;
    const cleanup = subscribeToTables(supabase, etablissementId, {
      onInsert: handleInsert,
      onUpdate: handleUpdate,
      onDelete: handleDelete,
      onError: handleError,
    });

    return cleanup;
  }, [etablissementId, enabled, handleInsert, handleUpdate, handleDelete, handleError]);

  return { tables, isSubscribed, error };
}
