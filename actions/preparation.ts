"use server";

/**
 * Server Actions pour la gestion des statuts de preparation
 * Utilise par le personnel de cuisine et de bar pour suivre les commandes
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { isBarCategory } from "@/lib/print/router";
import type { ActionResult } from "@/lib/action-types";
import type { StatutPreparation } from "@/lib/db/types";
import { creerNotification } from "@/actions/notifications";

// ============================================================================
// SCHEMAS DE VALIDATION ZOD
// ============================================================================

const StatutPreparationEnum = z.enum(
  ["EN_ATTENTE", "EN_PREPARATION", "PRETE", "SERVIE"],
  { message: "Statut de preparation invalide" }
);

const UpdatePreparationStatusSchema = z.object({
  ligneVenteId: z.string().uuid("ID de ligne de vente invalide"),
  statut: StatutPreparationEnum,
});

const UpdateBulkPreparationStatusSchema = z.object({
  ligneVenteIds: z
    .array(z.string().uuid("ID de ligne de vente invalide"))
    .min(1, "Au moins une ligne de vente est requise")
    .max(100, "Maximum 100 lignes a la fois"),
  statut: StatutPreparationEnum,
});

const GetPendingOrdersSchema = z.object({
  type: z.enum(["cuisine", "bar"], { message: "Type invalide (cuisine ou bar)" }),
  etablissementId: z.string().uuid("ID etablissement invalide"),
});

// ============================================================================
// TYPES
// ============================================================================

export interface PendingOrderLine {
  id: string;
  produit_nom: string;
  produit_id: string;
  quantite: number;
  notes: string | null;
  statut_preparation: StatutPreparation;
  supplements: Array<{ nom: string; prix: number }>;
  categorie_nom: string | null;
}

export interface PendingOrder {
  vente_id: string;
  numero_ticket: string;
  type_vente: string;
  created_at: string;
  table_numero: string | null;
  table_zone: string | null;
  serveur_nom: string | null;
  lignes: PendingOrderLine[];
}

// ============================================================================
// TRANSITION VALIDATION
// ============================================================================

/**
 * Validates that a preparation status transition is allowed.
 * Allowed transitions:
 *   EN_ATTENTE -> EN_PREPARATION
 *   EN_PREPARATION -> PRETE
 *   PRETE -> SERVIE
 *   Any status -> EN_ATTENTE (reset)
 */
const VALID_TRANSITIONS: Record<StatutPreparation, StatutPreparation[]> = {
  EN_ATTENTE: ["EN_PREPARATION"],
  EN_PREPARATION: ["PRETE", "EN_ATTENTE"],
  PRETE: ["SERVIE", "EN_ATTENTE"],
  SERVIE: ["EN_ATTENTE"],
};

function isValidTransition(
  current: StatutPreparation,
  next: StatutPreparation
): boolean {
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
}

// ============================================================================
// NOTIFICATION HELPER
// ============================================================================

/**
 * Notifie le serveur qu'une commande est prete.
 * Recupere les infos de la vente (ticket, table, serveur) et cree une notification.
 * Ne doit jamais bloquer le flux principal.
 */
async function notifierCommandePrete(
  supabase: Awaited<ReturnType<typeof createClient>>,
  venteId: string
): Promise<void> {
  // Recuperer les infos de la vente avec le serveur et la table
  const { data: vente, error: venteError } = await supabase
    .from("ventes")
    .select("id, numero_ticket, type, utilisateur_id, table_id, tables(numero, zones(nom))")
    .eq("id", venteId)
    .single();

  if (venteError || !vente) {
    console.error("[notifierCommandePrete] Vente introuvable:", venteId);
    return;
  }

  // Construire le message avec infos table si disponible
  const table = vente.tables as unknown as {
    numero: string;
    zones: { nom: string } | null;
  } | null;

  let message = `Commande #${vente.numero_ticket} prete !`;
  if (table) {
    message += ` - Table ${table.numero}`;
    if (table.zones?.nom) {
      message += ` (${table.zones.nom})`;
    }
  }

  // Envoyer la notification au serveur qui a pris la commande
  await creerNotification({
    type: "COMMANDE",
    titre: "Commande prete !",
    message,
    lien: "/caisse",
    utilisateurId: vente.utilisateur_id,
    donnees: {
      venteId: vente.id,
      numeroTicket: vente.numero_ticket,
      tableNumero: table?.numero ?? null,
    },
  });
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Met a jour le statut de preparation d'une seule ligne de vente
 */
export async function updatePreparationStatus(
  ligneVenteId: string,
  statut: StatutPreparation
): Promise<ActionResult<{ ligneVenteId: string; statut: StatutPreparation }>> {
  // 1. Validate input
  const parsed = UpdatePreparationStatusSchema.safeParse({ ligneVenteId, statut });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // 2. Auth check
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez etre connecte" };
  if (!user.etablissementId) return { success: false, error: "Aucun etablissement associe" };

  const supabase = await createClient();

  try {
    // 3. Fetch current line to validate transition and verify ownership
    const { data: ligne, error: fetchError } = await supabase
      .from("lignes_vente")
      .select("id, statut_preparation, vente_id, ventes!inner(etablissement_id)")
      .eq("id", parsed.data.ligneVenteId)
      .single();

    if (fetchError || !ligne) {
      return { success: false, error: "Ligne de vente introuvable" };
    }

    // 4. Verify the line belongs to the user's establishment
    const venteData = ligne.ventes as unknown as { etablissement_id: string };
    if (venteData.etablissement_id !== user.etablissementId) {
      return { success: false, error: "Accès refusé" };
    }

    // 5. Validate status transition
    const currentStatut = ligne.statut_preparation as StatutPreparation;
    if (!isValidTransition(currentStatut, parsed.data.statut)) {
      return {
        success: false,
        error: `Transition invalide: ${currentStatut} -> ${parsed.data.statut}`,
      };
    }

    // 6. Update the status
    const { error: updateError } = await supabase
      .from("lignes_vente")
      .update({
        statut_preparation: parsed.data.statut,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.ligneVenteId);

    if (updateError) {
      console.error("[updatePreparationStatus] Erreur update:", updateError);
      return { success: false, error: "Erreur lors de la mise a jour du statut" };
    }

    // 7. Notification "Commande prete" au serveur (non bloquant)
    if (parsed.data.statut === "PRETE") {
      try {
        await notifierCommandePrete(supabase, ligne.vente_id);
      } catch (notifError) {
        console.error("[updatePreparationStatus] Erreur notification (non bloquant):", notifError);
      }
    }

    // 8. Revalidate relevant paths
    revalidatePath("/caisse");
    revalidatePath("/salle");
    revalidatePath("/cuisine");
    revalidatePath("/bar");

    return {
      success: true,
      data: { ligneVenteId: parsed.data.ligneVenteId, statut: parsed.data.statut },
    };
  } catch (error) {
    console.error("[updatePreparationStatus] Exception:", error);
    return { success: false, error: "Une erreur inattendue est survenue" };
  }
}

/**
 * Met a jour le statut de preparation de plusieurs lignes de vente en une fois
 */
export async function updateBulkPreparationStatus(
  ligneVenteIds: string[],
  statut: StatutPreparation
): Promise<ActionResult<{ count: number }>> {
  // 1. Validate input
  const parsed = UpdateBulkPreparationStatusSchema.safeParse({ ligneVenteIds, statut });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // 2. Auth check
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez etre connecte" };
  if (!user.etablissementId) return { success: false, error: "Aucun etablissement associe" };

  const supabase = await createClient();

  try {
    // 3. Fetch all lines to validate transitions and ownership
    const { data: lignes, error: fetchError } = await supabase
      .from("lignes_vente")
      .select("id, statut_preparation, vente_id, ventes!inner(etablissement_id)")
      .in("id", parsed.data.ligneVenteIds);

    if (fetchError) {
      console.error("[updateBulkPreparationStatus] Erreur fetch:", fetchError);
      return { success: false, error: "Erreur lors de la recuperation des lignes" };
    }

    if (!lignes || lignes.length === 0) {
      return { success: false, error: "Aucune ligne de vente trouvee" };
    }

    // 4. Verify all lines belong to the user's establishment
    const invalidLines = lignes.filter((l) => {
      const venteData = l.ventes as unknown as { etablissement_id: string };
      return venteData.etablissement_id !== user.etablissementId;
    });

    if (invalidLines.length > 0) {
      return { success: false, error: "Accès refusé pour certaines lignes" };
    }

    // 5. Validate transitions for all lines
    const invalidTransitions = lignes.filter(
      (l) => !isValidTransition(l.statut_preparation as StatutPreparation, parsed.data.statut)
    );

    if (invalidTransitions.length > 0) {
      const exampleLine = invalidTransitions[0];
      return {
        success: false,
        error: `Transition invalide pour ${invalidTransitions.length} ligne(s). Ex: ${exampleLine.statut_preparation} -> ${parsed.data.statut}`,
      };
    }

    // 6. Collect valid IDs and perform bulk update
    const validIds = lignes.map((l) => l.id);

    const { error: updateError } = await supabase
      .from("lignes_vente")
      .update({
        statut_preparation: parsed.data.statut,
        updated_at: new Date().toISOString(),
      })
      .in("id", validIds);

    if (updateError) {
      console.error("[updateBulkPreparationStatus] Erreur update:", updateError);
      return { success: false, error: "Erreur lors de la mise a jour des statuts" };
    }

    // 7. Notification "Commande prete" au serveur (non bloquant, groupee par vente)
    if (parsed.data.statut === "PRETE") {
      try {
        const venteIds = [...new Set(lignes.map((l) => l.vente_id))];
        for (const venteId of venteIds) {
          await notifierCommandePrete(supabase, venteId);
        }
      } catch (notifError) {
        console.error("[updateBulkPreparationStatus] Erreur notification (non bloquant):", notifError);
      }
    }

    // 8. Revalidate
    revalidatePath("/caisse");
    revalidatePath("/salle");
    revalidatePath("/cuisine");
    revalidatePath("/bar");

    return {
      success: true,
      data: { count: validIds.length },
    };
  } catch (error) {
    console.error("[updateBulkPreparationStatus] Exception:", error);
    return { success: false, error: "Une erreur inattendue est survenue" };
  }
}

/**
 * Recupere les commandes en attente pour la cuisine ou le bar,
 * groupees par vente avec les informations de table et serveur
 */
export async function getPendingOrders(
  type: "cuisine" | "bar",
  etablissementId: string
): Promise<ActionResult<PendingOrder[]>> {
  // 1. Validate input
  const parsed = GetPendingOrdersSchema.safeParse({ type, etablissementId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // 2. Auth check
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez etre connecte" };
  if (!user.etablissementId) return { success: false, error: "Aucun etablissement associe" };

  // Verify the requested establishment matches the user's establishment
  if (parsed.data.etablissementId !== user.etablissementId) {
    return { success: false, error: "Accès refusé" };
  }

  const supabase = await createClient();

  try {
    // 3. Fetch all active order lines (not SERVIE) for the establishment
    //    with vente, table, zone, serveur, produit, and supplements info
    const { data: rawLines, error: fetchError } = await supabase
      .from("lignes_vente")
      .select(
        `
        id,
        quantite,
        notes,
        statut_preparation,
        produit_id,
        vente_id,
        produits!inner(id, nom, categorie_id, categories!inner(id, nom)),
        ventes!inner(
          id,
          numero_ticket,
          type,
          created_at,
          etablissement_id,
          table_id,
          utilisateur_id,
          tables(numero, zone_id, zones(nom)),
          utilisateurs(nom, prenom)
        ),
        lignes_vente_supplements(nom, prix)
      `
      )
      .eq("ventes.etablissement_id", parsed.data.etablissementId)
      .in("statut_preparation", ["EN_ATTENTE", "EN_PREPARATION", "PRETE"])
      .eq("ventes.statut", "EN_COURS")
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("[getPendingOrders] Erreur fetch:", fetchError);
      return { success: false, error: "Erreur lors de la recuperation des commandes" };
    }

    if (!rawLines || rawLines.length === 0) {
      return { success: true, data: [] };
    }

    // 4. Filter lines by type (cuisine or bar) based on category name
    const filteredLines = rawLines.filter((line) => {
      const produit = line.produits as unknown as {
        id: string;
        nom: string;
        categorie_id: string;
        categories: { id: string; nom: string };
      };
      const categoryName = produit?.categories?.nom ?? null;

      if (parsed.data.type === "bar") {
        return isBarCategory(categoryName);
      }
      // cuisine = everything that is NOT bar
      return !isBarCategory(categoryName);
    });

    // 5. Group lines by vente_id
    const orderMap = new Map<string, PendingOrder>();

    for (const line of filteredLines) {
      const vente = line.ventes as unknown as {
        id: string;
        numero_ticket: string;
        type: string;
        created_at: string;
        etablissement_id: string;
        table_id: string | null;
        utilisateur_id: string;
        tables: { numero: string; zone_id: string | null; zones: { nom: string } | null } | null;
        utilisateurs: { nom: string; prenom: string } | null;
      };

      const produit = line.produits as unknown as {
        id: string;
        nom: string;
        categorie_id: string;
        categories: { id: string; nom: string };
      };

      const supplements = (
        line.lignes_vente_supplements as unknown as Array<{ nom: string; prix: number }>
      ) ?? [];

      const venteId = vente.id;

      if (!orderMap.has(venteId)) {
        const tableNumero = vente.tables?.numero ?? null;
        const tableZone = vente.tables?.zones?.nom ?? null;
        const serveurNom = vente.utilisateurs
          ? `${vente.utilisateurs.prenom} ${vente.utilisateurs.nom}`
          : null;

        orderMap.set(venteId, {
          vente_id: venteId,
          numero_ticket: vente.numero_ticket,
          type_vente: vente.type,
          created_at: vente.created_at,
          table_numero: tableNumero,
          table_zone: tableZone,
          serveur_nom: serveurNom,
          lignes: [],
        });
      }

      const order = orderMap.get(venteId)!;
      order.lignes.push({
        id: line.id,
        produit_nom: produit.nom,
        produit_id: produit.id,
        quantite: line.quantite,
        notes: line.notes,
        statut_preparation: line.statut_preparation as StatutPreparation,
        supplements: supplements.map((s) => ({ nom: s.nom, prix: Number(s.prix) })),
        categorie_nom: produit.categories?.nom ?? null,
      });
    }

    // 6. Convert map to sorted array (oldest orders first)
    const orders = Array.from(orderMap.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return { success: true, data: orders };
  } catch (error) {
    console.error("[getPendingOrders] Exception:", error);
    return { success: false, error: "Une erreur inattendue est survenue" };
  }
}
