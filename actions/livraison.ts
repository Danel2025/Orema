"use server";

/**
 * Server Actions pour le suivi de livraison
 *
 * Utilise les tables `livraisons` et `historique_livraison` en base de données.
 * L'API publique (noms de fonctions, types de retour) est identique à l'ancienne
 * implémentation qui stockait les données dans ventes.notes.
 */

import { revalidatePath } from "next/cache";
import { createAuthenticatedClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  STATUT_LIVRAISON,
  TRANSITIONS_AUTORISEES,
  STATUTS_ACTIFS,
  type StatutLivraison,
  type Livraison,
  type HistoriqueLivraison,
  type LivraisonAvecHistorique,
  type StatistiquesLivraison,
  type ActionResult,
} from "@/lib/delivery/types";

// ============================================================================
// UTILITAIRES INTERNES
// ============================================================================

/**
 * Crée un client Supabase authentifié à partir de l'utilisateur courant.
 * Retourne null + error si non authentifié.
 */
async function getAuthClient() {
  const user = await getCurrentUser();
  if (!user) return { client: null, user: null, error: "Vous devez être connecté" } as const;
  if (!user.etablissementId)
    return { client: null, user: null, error: "Aucun établissement associé" } as const;

  const etablissementId = user.etablissementId;

  const client = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId,
    role: user.role,
  });

  return { client, user: { ...user, etablissementId }, error: null } as const;
}

// ============================================================================
// SERVER ACTIONS — MUTATIONS
// ============================================================================

/**
 * Crée une entrée de suivi de livraison pour une vente existante.
 * Appelé automatiquement après la création d'une vente de type LIVRAISON,
 * ou manuellement pour ajouter le suivi à une vente existante.
 */
export async function creerLivraison(
  venteId: string,
  adresse: string,
  telephone: string,
  clientNom?: string,
  fraisLivraison?: number
): Promise<ActionResult<Livraison>> {
  const { client: supabase, user, error: authError } = await getAuthClient();
  if (!supabase || !user) return { success: false, error: authError };

  try {
    // Vérifier que la vente existe et est de type LIVRAISON
    const { data: vente, error: venteError } = await supabase
      .from("ventes")
      .select(
        "id, numero_ticket, type, total_final, frais_livraison, adresse_livraison, created_at, updated_at, etablissement_id"
      )
      .eq("id", venteId)
      .eq("etablissement_id", user.etablissementId)
      .single();

    if (venteError || !vente) {
      return { success: false, error: "Vente non trouvée" };
    }

    if (vente.type !== "LIVRAISON") {
      return { success: false, error: "Cette vente n'est pas de type LIVRAISON" };
    }

    // Vérifier qu'il n'y a pas déjà un suivi de livraison
    const { data: existingLivraison } = await supabase
      .from("livraisons")
      .select("id")
      .eq("vente_id", venteId)
      .maybeSingle();

    if (existingLivraison) {
      return { success: false, error: "Un suivi de livraison existe déjà pour cette vente" };
    }

    // Créer la livraison
    const { data: livraison, error: insertError } = await supabase
      .from("livraisons")
      .insert({
        vente_id: venteId,
        statut: STATUT_LIVRAISON.EN_PREPARATION,
        adresse,
        telephone,
        livreur_nom: clientNom ?? null,
        estimation_minutes: 30,
      })
      .select()
      .single();

    if (insertError || !livraison) {
      throw insertError ?? new Error("Erreur lors de la création de la livraison");
    }

    // Créer l'entrée d'historique initiale
    await supabase.from("historique_livraison").insert({
      livraison_id: livraison.id,
      statut: STATUT_LIVRAISON.EN_PREPARATION,
      note: "Livraison créée",
    });

    // Mettre à jour l'adresse et les frais de livraison sur la vente si fournis
    const venteUpdate: Record<string, unknown> = {};
    if (adresse) venteUpdate.adresse_livraison = adresse;
    if (fraisLivraison !== undefined) venteUpdate.frais_livraison = fraisLivraison;

    if (Object.keys(venteUpdate).length > 0) {
      await supabase.from("ventes").update(venteUpdate).eq("id", venteId);
    }

    const result: Livraison = {
      id: livraison.id,
      venteId: venteId,
      numeroTicket: vente.numero_ticket,
      statut: STATUT_LIVRAISON.EN_PREPARATION,
      adresse,
      telephone,
      clientNom: clientNom ?? null,
      livreurId: null,
      livreurNom: null,
      estimationMinutes: 30,
      notes: null,
      montantTotal: Number(vente.total_final),
      fraisLivraison: fraisLivraison ?? Number(vente.frais_livraison ?? 0),
      createdAt: livraison.created_at ?? new Date().toISOString(),
      updatedAt: livraison.updated_at ?? new Date().toISOString(),
    };

    revalidatePath("/caisse");
    revalidatePath("/livraisons");

    return { success: true, data: result };
  } catch (error) {
    console.error("[creerLivraison] Erreur:", error);
    return { success: false, error: "Erreur lors de la création du suivi de livraison" };
  }
}

/**
 * Assigne un livreur à une livraison
 */
export async function assignerLivreur(
  livraisonId: string,
  livreurId: string,
  livreurNom: string
): Promise<ActionResult> {
  const { client: supabase, user, error: authError } = await getAuthClient();
  if (!supabase || !user) return { success: false, error: authError };

  try {
    // Récupérer la livraison
    const { data: livraison, error } = await supabase
      .from("livraisons")
      .select("id, statut")
      .eq("id", livraisonId)
      .single();

    if (error || !livraison) {
      return { success: false, error: "Livraison non trouvée" };
    }

    // On ne peut assigner un livreur que si la livraison est en préparation ou prête
    if (
      livraison.statut !== STATUT_LIVRAISON.EN_PREPARATION &&
      livraison.statut !== STATUT_LIVRAISON.PRETE
    ) {
      return {
        success: false,
        error: `Impossible d'assigner un livreur en statut "${livraison.statut}"`,
      };
    }

    // Mettre à jour la livraison
    const { error: updateError } = await supabase
      .from("livraisons")
      .update({
        livreur_id: livreurId,
        livreur_nom: livreurNom,
      })
      .eq("id", livraisonId);

    if (updateError) throw updateError;

    // Ajouter une entrée d'historique
    await supabase.from("historique_livraison").insert({
      livraison_id: livraisonId,
      statut: livraison.statut,
      note: `Livreur assigné: ${livreurNom}`,
    });

    revalidatePath("/livraisons");

    return { success: true };
  } catch (error) {
    console.error("[assignerLivreur] Erreur:", error);
    return { success: false, error: "Erreur lors de l'assignation du livreur" };
  }
}

/**
 * Met à jour le statut d'une livraison et crée une entrée d'historique
 */
export async function updateStatutLivraison(
  livraisonId: string,
  nouveauStatut: StatutLivraison,
  note?: string
): Promise<ActionResult> {
  const { client: supabase, user, error: authError } = await getAuthClient();
  if (!supabase || !user) return { success: false, error: authError };

  try {
    // Récupérer la livraison
    const { data: livraison, error } = await supabase
      .from("livraisons")
      .select("id, statut")
      .eq("id", livraisonId)
      .single();

    if (error || !livraison) {
      return { success: false, error: "Livraison non trouvée" };
    }

    // Vérifier la transition de statut
    const ancienStatut = livraison.statut as StatutLivraison;
    const transitionsPermises = TRANSITIONS_AUTORISEES[ancienStatut];
    if (!transitionsPermises.includes(nouveauStatut)) {
      return {
        success: false,
        error: `Transition de "${ancienStatut}" vers "${nouveauStatut}" non autorisée`,
      };
    }

    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from("livraisons")
      .update({ statut: nouveauStatut })
      .eq("id", livraisonId);

    if (updateError) throw updateError;

    // Créer l'entrée d'historique
    await supabase.from("historique_livraison").insert({
      livraison_id: livraisonId,
      statut: nouveauStatut,
      note: note ?? null,
    });

    revalidatePath("/livraisons");
    revalidatePath("/caisse");

    return { success: true };
  } catch (error) {
    console.error("[updateStatutLivraison] Erreur:", error);
    return { success: false, error: "Erreur lors de la mise à jour du statut" };
  }
}

// ============================================================================
// SERVER ACTIONS — QUERIES
// ============================================================================

/**
 * Récupère toutes les livraisons en cours (statuts actifs)
 */
export async function getLivraisonsEnCours(
  etablissementId?: string
): Promise<ActionResult<Livraison[]>> {
  const { client: supabase, user, error: authError } = await getAuthClient();
  if (!supabase || !user) return { success: false, error: authError };

  try {
    // Requête sur livraisons JOIN ventes pour obtenir les infos complètes
    const { data: rows, error } = await supabase
      .from("livraisons")
      .select(
        `
        id,
        vente_id,
        statut,
        adresse,
        telephone,
        livreur_id,
        livreur_nom,
        estimation_minutes,
        notes,
        created_at,
        updated_at,
        ventes!inner (
          id,
          numero_ticket,
          total_final,
          frais_livraison,
          etablissement_id,
          clients ( nom, prenom, telephone )
        )
      `
      )
      .in("statut", STATUTS_ACTIFS)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const livraisons: Livraison[] = (rows ?? [])
      .map((row) => {
        const vente = row.ventes as unknown as {
          id: string;
          numero_ticket: string;
          total_final: number;
          frais_livraison: number | null;
          etablissement_id: string;
          clients: { nom: string; prenom?: string | null; telephone?: string | null } | null;
        };

        // Filtrer par etablissement si spécifié
        const etabId = etablissementId ?? user.etablissementId;
        if (vente.etablissement_id !== etabId) return null;

        return {
          id: row.id,
          venteId: row.vente_id,
          numeroTicket: vente.numero_ticket,
          statut: row.statut as StatutLivraison,
          adresse: row.adresse,
          telephone: row.telephone,
          clientNom: vente.clients?.nom ?? null,
          livreurId: row.livreur_id ?? null,
          livreurNom: row.livreur_nom ?? null,
          estimationMinutes: row.estimation_minutes ?? null,
          notes: row.notes ?? null,
          montantTotal: Number(vente.total_final),
          fraisLivraison: Number(vente.frais_livraison ?? 0),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        } as Livraison;
      })
      .filter((l): l is Livraison => l !== null);

    return { success: true, data: livraisons };
  } catch (error) {
    console.error("[getLivraisonsEnCours] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération des livraisons" };
  }
}

/**
 * Récupère le détail d'une livraison avec son historique complet
 */
export async function getLivraisonByVente(
  venteId: string
): Promise<ActionResult<LivraisonAvecHistorique>> {
  const { client: supabase, user, error: authError } = await getAuthClient();
  if (!supabase || !user) return { success: false, error: authError };

  try {
    // Récupérer la livraison via vente_id
    const { data: livraison, error } = await supabase
      .from("livraisons")
      .select(
        `
        id,
        vente_id,
        statut,
        adresse,
        telephone,
        livreur_id,
        livreur_nom,
        estimation_minutes,
        notes,
        created_at,
        updated_at,
        ventes!inner (
          id,
          numero_ticket,
          total_final,
          frais_livraison,
          clients ( nom, prenom, telephone )
        )
      `
      )
      .eq("vente_id", venteId)
      .single();

    if (error || !livraison) {
      return { success: false, error: "Aucun suivi de livraison trouvé pour cette vente" };
    }

    const vente = livraison.ventes as unknown as {
      id: string;
      numero_ticket: string;
      total_final: number;
      frais_livraison: number | null;
      clients: { nom: string; prenom?: string | null; telephone?: string | null } | null;
    };

    // Récupérer l'historique
    const { data: historique, error: histError } = await supabase
      .from("historique_livraison")
      .select("id, livraison_id, statut, note, created_at")
      .eq("livraison_id", livraison.id)
      .order("created_at", { ascending: true });

    if (histError) throw histError;

    const result: LivraisonAvecHistorique = {
      id: livraison.id,
      venteId: livraison.vente_id,
      numeroTicket: vente.numero_ticket,
      statut: livraison.statut as StatutLivraison,
      adresse: livraison.adresse,
      telephone: livraison.telephone,
      clientNom: vente.clients?.nom ?? null,
      livreurId: livraison.livreur_id ?? null,
      livreurNom: livraison.livreur_nom ?? null,
      estimationMinutes: livraison.estimation_minutes ?? null,
      notes: livraison.notes ?? null,
      montantTotal: Number(vente.total_final),
      fraisLivraison: Number(vente.frais_livraison ?? 0),
      createdAt: livraison.created_at ?? new Date().toISOString(),
      updatedAt: livraison.updated_at ?? new Date().toISOString(),
      historique: (historique ?? []).map((h) => ({
        id: h.id,
        livraisonId: h.livraison_id,
        ancienStatut: null, // L'historique simplifié ne stocke que le nouveau statut
        nouveauStatut: h.statut as StatutLivraison,
        timestamp: h.created_at ?? new Date().toISOString(),
        note: h.note ?? null,
        acteurId: null,
        acteurNom: null,
      })),
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("[getLivraisonByVente] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération de la livraison" };
  }
}

/**
 * Récupère l'historique complet d'une livraison
 */
export async function getHistoriqueLivraison(
  livraisonId: string
): Promise<ActionResult<HistoriqueLivraison[]>> {
  const { client: supabase, user, error: authError } = await getAuthClient();
  if (!supabase || !user) return { success: false, error: authError };

  try {
    const { data: historique, error } = await supabase
      .from("historique_livraison")
      .select("id, livraison_id, statut, note, created_at")
      .eq("livraison_id", livraisonId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const result: HistoriqueLivraison[] = (historique ?? []).map((h) => ({
      id: h.id,
      livraisonId: h.livraison_id,
      ancienStatut: null,
      nouveauStatut: h.statut as StatutLivraison,
      timestamp: h.created_at ?? new Date().toISOString(),
      note: h.note ?? null,
      acteurId: null,
      acteurNom: null,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("[getHistoriqueLivraison] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération de l'historique" };
  }
}

/**
 * Récupère les statistiques de livraison pour une période donnée
 */
export async function getStatistiquesLivraison(
  etablissementId: string,
  dateDebut: string,
  dateFin: string
): Promise<ActionResult<StatistiquesLivraison>> {
  const { client: supabase, user, error: authError } = await getAuthClient();
  if (!supabase || !user) return { success: false, error: authError };

  try {
    // Récupérer les livraisons de la période via jointure avec ventes
    const { data: rows, error } = await supabase
      .from("livraisons")
      .select(
        `
        id,
        statut,
        created_at,
        ventes!inner (
          frais_livraison,
          etablissement_id
        )
      `
      )
      .gte("created_at", dateDebut)
      .lte("created_at", dateFin);

    if (error) throw error;

    let total = 0;
    let enCours = 0;
    let livrees = 0;
    let echouees = 0;
    let annulees = 0;
    let fraisLivraisonTotal = 0;

    for (const row of rows ?? []) {
      const vente = row.ventes as unknown as {
        frais_livraison: number | null;
        etablissement_id: string;
      };

      // Filtrer par établissement
      if (vente.etablissement_id !== etablissementId) continue;

      total++;
      fraisLivraisonTotal += Number(vente.frais_livraison ?? 0);

      switch (row.statut) {
        case STATUT_LIVRAISON.EN_PREPARATION:
        case STATUT_LIVRAISON.PRETE:
        case STATUT_LIVRAISON.EN_COURS:
          enCours++;
          break;
        case STATUT_LIVRAISON.LIVREE:
          livrees++;
          break;
        case STATUT_LIVRAISON.ECHOUEE:
          echouees++;
          break;
        case STATUT_LIVRAISON.ANNULEE:
          annulees++;
          break;
      }
    }

    // Calculer le temps moyen de livraison pour les livraisons terminées
    let tempsLivraisonMoyen = 0;
    if (livrees > 0) {
      // Récupérer les IDs des livraisons livrées pour calculer le temps
      const livraisonIds = (rows ?? [])
        .filter((r) => {
          const v = r.ventes as unknown as { etablissement_id: string };
          return r.statut === STATUT_LIVRAISON.LIVREE && v.etablissement_id === etablissementId;
        })
        .map((r) => r.id);

      if (livraisonIds.length > 0) {
        // Pour chaque livraison livrée, calculer la durée entre création et dernière entrée d'historique LIVREE
        const { data: histEntries } = await supabase
          .from("historique_livraison")
          .select("livraison_id, created_at")
          .in("livraison_id", livraisonIds)
          .eq("statut", STATUT_LIVRAISON.LIVREE);

        if (histEntries && histEntries.length > 0) {
          let tempsTotal = 0;
          let tempsCount = 0;
          for (const entry of histEntries) {
            const livr = (rows ?? []).find((r) => r.id === entry.livraison_id);
            if (livr) {
              const createdAt = new Date(livr.created_at ?? Date.now()).getTime();
              const livreeAt = new Date(entry.created_at ?? Date.now()).getTime();
              const dureeMinutes = Math.round((livreeAt - createdAt) / (1000 * 60));
              if (dureeMinutes > 0) {
                tempsTotal += dureeMinutes;
                tempsCount++;
              }
            }
          }
          tempsLivraisonMoyen = tempsCount > 0 ? Math.round(tempsTotal / tempsCount) : 0;
        }
      }
    }

    const stats: StatistiquesLivraison = {
      total,
      enCours,
      livrees,
      echouees,
      annulees,
      tempsLivraisonMoyen,
      fraisLivraisonTotal,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("[getStatistiquesLivraison] Erreur:", error);
    return { success: false, error: "Erreur lors du calcul des statistiques" };
  }
}

/**
 * Estime le temps de livraison pour une adresse donnée.
 * Pour l'instant, retourne une valeur par défaut de 30 minutes.
 * Peut être enrichi plus tard avec une API de géolocalisation.
 */
export async function estimerTempsLivraison(
  _adresse: string
): Promise<ActionResult<{ estimationMinutes: number }>> {
  return {
    success: true,
    data: { estimationMinutes: 30 },
  };
}
