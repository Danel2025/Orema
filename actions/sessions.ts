"use server";

/**
 * Server Actions pour la gestion des sessions de caisse
 * Migré vers Supabase - Version optimisée
 */

import { createClient, createServiceClient } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, getCurrentUser } from "@/lib/auth";

// ============================================================================
// SCHEMAS
// ============================================================================

const OpenSessionSchema = z.object({
  fondCaisse: z.number().min(0, "Le fond de caisse ne peut pas être négatif"),
});

const CloseSessionSchema = z.object({
  sessionId: z.string().uuid("ID de session invalide"),
  especesComptees: z.number().min(0, "Le montant ne peut pas être négatif"),
  notesCloture: z.string().optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export interface SessionActive {
  id: string;
  fondCaisse: number;
  totalVentes: number;
  totalEspeces: number;
  totalCartes: number;
  totalMobileMoney: number;
  totalAutres: number;
  nombreVentes: number;
  nombreAnnulations: number;
  dateOuverture: Date;
  utilisateur: { id: string; nom: string; prenom: string | null };
  ventesCount: number;
}

export interface SessionHistoryItem {
  id: string;
  dateOuverture: Date;
  dateCloture: Date;
  fondCaisse: number;
  totalVentes: number;
  totalEspeces: number;
  totalCartes: number;
  totalMobileMoney: number;
  totalAutres: number;
  nombreVentes: number;
  nombreAnnulations: number;
  especesComptees: number | null;
  ecart: number | null;
  notesCloture: string | null;
  utilisateur: { nom: string; prenom: string | null };
}

export interface SessionStats {
  session: {
    id: string;
    dateOuverture: Date;
    dateCloture: Date | null;
    fondCaisse: number;
    especesComptees: number | null;
    ecart: number | null;
    notesCloture: string | null;
    utilisateur: { nom: string; prenom: string | null };
  };
  stats: {
    totalVentes: number;
    nombreVentes: number;
    articlesVendus: number;
    panierMoyen: number;
    paiements: { especes: number; cartes: number; mobileMoney: number; autres: number };
    especesAttendues: number;
    ventesParType: Record<string, { count: number; total: number }>;
    topProduits: Array<{ nom: string; quantite: number; total: number }>;
  };
  ventes: Array<{
    id: string;
    numeroTicket: string;
    type: string;
    totalFinal: number;
    createdAt: Date;
    nombreArticles: number;
  }>;
}

export interface RapportZ {
  session: {
    id: string;
    dateOuverture: Date;
    dateCloture: Date;
    utilisateur: { nom: string; prenom: string | null };
  };
  caisse: { fondCaisse: number; especesComptees: number; especesAttendues: number; ecart: number };
  ventes: {
    totalVentes: number;
    nombreVentes: number;
    nombreAnnulations: number;
    articlesVendus: number;
    panierMoyen: number;
  };
  paiements: { especes: number; cartes: number; mobileMoney: number; autres: number };
  ventesParType: Record<string, { count: number; total: number }>;
  topProduits: Array<{ nom: string; quantite: number; total: number }>;
  tva: { totalHT: number; totalTVA: number; totalTTC: number };
}

// ============================================================================
// HELPERS
// ============================================================================

function calculatePaymentTotals(
  paiements: Array<{ mode_paiement: string; montant: string | number }>
) {
  let especes = 0,
    cartes = 0,
    mobileMoney = 0,
    autres = 0;
  for (const p of paiements) {
    const montant = Number(p.montant);
    switch (p.mode_paiement) {
      case "ESPECES":
        especes += montant;
        break;
      case "CARTE_BANCAIRE":
        cartes += montant;
        break;
      case "AIRTEL_MONEY":
      case "MOOV_MONEY":
        mobileMoney += montant;
        break;
      default:
        autres += montant;
    }
  }
  return { especes, cartes, mobileMoney, autres };
}

// ============================================================================
// ACTIONS
// ============================================================================

export async function getActiveSession(): Promise<SessionActive | null> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) return null;

    // Utiliser le service client pour bypasser les RLS
    const supabase = createServiceClient();
    const { data: session } = await supabase
      .from("sessions_caisse")
      .select("*, utilisateurs(id, nom, prenom)")
      .eq("etablissement_id", user.etablissementId)
      .is("date_cloture", null)
      .order("date_ouverture", { ascending: false })
      .limit(1)
      .single();

    if (!session) return null;

    // Calculer les totaux en temps réel
    const { data: ventes } = await supabase
      .from("ventes")
      .select("total_final, paiements(mode_paiement, montant)")
      .eq("session_caisse_id", session.id)
      .eq("statut", "PAYEE");

    const { count: annulations } = await supabase
      .from("ventes")
      .select("*", { count: "exact", head: true })
      .eq("session_caisse_id", session.id)
      .eq("statut", "ANNULEE");

    let totalVentes = 0,
      totalEspeces = 0,
      totalCartes = 0,
      totalMobileMoney = 0,
      totalAutres = 0;
    for (const v of ventes || []) {
      totalVentes += Number(v.total_final);
      const totals = calculatePaymentTotals(
        (v.paiements || []) as Array<{ mode_paiement: string; montant: string | number }>
      );
      totalEspeces += totals.especes;
      totalCartes += totals.cartes;
      totalMobileMoney += totals.mobileMoney;
      totalAutres += totals.autres;
    }

    return {
      id: session.id,
      fondCaisse: Number(session.fond_caisse),
      totalVentes,
      totalEspeces,
      totalCartes,
      totalMobileMoney,
      totalAutres,
      nombreVentes: (ventes || []).length,
      nombreAnnulations: annulations || 0,
      dateOuverture: new Date(session.date_ouverture),
      utilisateur: session.utilisateurs as { id: string; nom: string; prenom: string | null },
      ventesCount: (ventes || []).length,
    };
  } catch (error) {
    console.error("Erreur getActiveSession:", error);
    throw new Error("Impossible de récupérer la session active");
  }
}

export async function hasActiveSession(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) return false;

    // Utiliser le service client pour bypasser les RLS
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("sessions_caisse")
      .select("id")
      .eq("etablissement_id", user.etablissementId)
      .is("date_cloture", null)
      .limit(1)
      .single();

    return data !== null;
  } catch {
    return false;
  }
}

export async function openSession(data: { fondCaisse: number }) {
  try {
    const user = await requireAuth();
    if (!user.etablissementId) return { success: false, error: "Aucun établissement associé" };
    const validated = OpenSessionSchema.safeParse(data);
    if (!validated.success) return { success: false, error: validated.error.issues[0].message };

    // Utiliser le service client pour bypasser les RLS
    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from("sessions_caisse")
      .select("id")
      .eq("etablissement_id", user.etablissementId)
      .is("date_cloture", null)
      .limit(1)
      .single();

    if (existing)
      return {
        success: false,
        error: "Une session est déjà ouverte. Veuillez la clôturer d'abord.",
      };

    const { data: session, error } = await supabase
      .from("sessions_caisse")
      .insert({
        fond_caisse: validated.data.fondCaisse,
        etablissement_id: user.etablissementId,
        utilisateur_id: user.userId,
      })
      .select("*, utilisateurs(id, nom, prenom)")
      .single();

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      action: "CAISSE_OUVERTURE",
      entite: "SessionCaisse",
      entite_id: session.id,
      description: `Ouverture de caisse avec fond de ${validated.data.fondCaisse} FCFA`,
      nouvelle_valeur: JSON.stringify({
        fondCaisse: validated.data.fondCaisse,
        dateOuverture: session.date_ouverture,
      }),
      utilisateur_id: user.userId,
      etablissement_id: user.etablissementId,
    });

    revalidatePath("/caisse");
    return {
      success: true,
      data: {
        id: session.id,
        fondCaisse: Number(session.fond_caisse),
        dateOuverture: new Date(session.date_ouverture),
        utilisateur: session.utilisateurs,
      },
    };
  } catch (error) {
    console.error("Erreur openSession:", error);
    return { success: false, error: "Impossible d'ouvrir la session" };
  }
}

export async function closeSession(data: {
  sessionId: string;
  especesComptees: number;
  notesCloture?: string;
}) {
  try {
    // 1. Auth en PREMIER - avant toute opération
    const user = await requireAuth();
    if (!user.etablissementId) {
      return { success: false, error: "Aucun établissement associé" };
    }

    const validated = CloseSessionSchema.safeParse(data);
    if (!validated.success) return { success: false, error: validated.error.issues[0].message };

    // Utiliser le service client pour bypasser les RLS
    const supabase = createServiceClient();

    // 2. Fetch session avec filtre etablissement_id pour isolation multi-tenant
    const { data: session } = await supabase
      .from("sessions_caisse")
      .select(
        "*, ventes(statut, total_final, sous_total, total_tva, paiements(mode_paiement, montant), lignes_vente(quantite))"
      )
      .eq("id", validated.data.sessionId)
      .eq("etablissement_id", user.etablissementId)
      .single();

    if (!session) return { success: false, error: "Session introuvable" };
    if (session.date_cloture) return { success: false, error: "Cette session est déjà clôturée" };

    // 3. Vérification ownership : seul le propriétaire ou un admin/manager peut clôturer
    const isOwner = session.utilisateur_id === user.userId;
    const isPrivileged = ["ADMIN", "MANAGER", "SUPER_ADMIN"].includes(user.role);
    if (!isOwner && !isPrivileged) {
      return { success: false, error: "Vous n'êtes pas autorisé à clôturer cette session" };
    }

    const ventes = session.ventes as Array<{
      statut: string;
      total_final: string | number;
      sous_total: string | number;
      total_tva: string | number;
      paiements: Array<{ mode_paiement: string; montant: string | number }>;
      lignes_vente: Array<{ quantite: number }>;
    }>;

    const ventesPayees = ventes.filter((v) => v.statut === "PAYEE");
    const ventesAnnulees = ventes.filter((v) => v.statut === "ANNULEE");

    let totalVentes = 0,
      totalHT = 0,
      totalTVA = 0,
      articlesVendus = 0;
    let totalEspeces = 0,
      totalCartes = 0,
      totalMobileMoney = 0,
      totalAutres = 0;

    for (const v of ventesPayees) {
      totalVentes += Number(v.total_final);
      totalHT += Number(v.sous_total);
      totalTVA += Number(v.total_tva);
      articlesVendus += v.lignes_vente.reduce((sum, l) => sum + l.quantite, 0);
      const totals = calculatePaymentTotals(v.paiements);
      totalEspeces += totals.especes;
      totalCartes += totals.cartes;
      totalMobileMoney += totals.mobileMoney;
      totalAutres += totals.autres;
    }

    const especesAttendues = Number(session.fond_caisse) + totalEspeces;
    const ecart = validated.data.especesComptees - especesAttendues;

    // 4. UPDATE atomique : ajouter .is("date_cloture", null) pour éviter race condition
    const { data: updated, error } = await supabase
      .from("sessions_caisse")
      .update({
        date_cloture: new Date().toISOString(),
        total_ventes: totalVentes,
        total_especes: totalEspeces,
        total_cartes: totalCartes,
        total_mobile_money: totalMobileMoney,
        total_autres: totalAutres,
        nombre_ventes: ventesPayees.length,
        nombre_annulations: ventesAnnulees.length,
        especes_comptees: validated.data.especesComptees,
        ecart,
        notes_cloture: validated.data.notesCloture,
      })
      .eq("id", validated.data.sessionId)
      .eq("etablissement_id", user.etablissementId)
      .is("date_cloture", null)
      .select()
      .single();

    if (error) {
      // Si aucune ligne matchée, la session a été clôturée entre-temps (race condition)
      if (error.code === "PGRST116") {
        return { success: false, error: "Cette session a déjà été clôturée par un autre utilisateur" };
      }
      throw error;
    }

    await supabase.from("audit_logs").insert({
      action: "CAISSE_CLOTURE",
      entite: "SessionCaisse",
      entite_id: session.id,
      description: `Clôture de caisse - Écart: ${ecart} FCFA`,
      ancienne_valeur: JSON.stringify({ fondCaisse: Number(session.fond_caisse) }),
      nouvelle_valeur: JSON.stringify({
        totalVentes,
        totalEspeces,
        especesComptees: validated.data.especesComptees,
        ecart,
        dateCloture: updated.date_cloture,
      }),
      utilisateur_id: user.userId,
      etablissement_id: user.etablissementId,
    });

    revalidatePath("/caisse");
    return {
      success: true,
      data: {
        id: updated.id,
        dateCloture: new Date(updated.date_cloture!),
        totalVentes,
        totalEspeces,
        totalCartes,
        totalMobileMoney,
        totalAutres,
        nombreVentes: ventesPayees.length,
        nombreAnnulations: ventesAnnulees.length,
        fondCaisse: Number(session.fond_caisse),
        especesComptees: validated.data.especesComptees,
        especesAttendues,
        ecart,
        articlesVendus,
        tva: { totalHT, totalTVA, totalTTC: totalVentes },
      },
    };
  } catch (error) {
    console.error("Erreur closeSession:", error);
    return { success: false, error: "Impossible de clôturer la session" };
  }
}

export async function getSessionStats(sessionId: string): Promise<SessionStats | null> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) return null;

    // Utiliser le service client pour bypasser les RLS
    const supabase = createServiceClient();
    const { data: session } = await supabase
      .from("sessions_caisse")
      .select(
        `
        *, utilisateurs(nom, prenom),
        ventes(id, numero_ticket, type, total_final, created_at, statut, paiements(mode_paiement, montant), lignes_vente(quantite, total, produit_id, produits(nom)))
      `
      )
      .eq("id", sessionId)
      .eq("etablissement_id", user.etablissementId)
      .single();

    if (!session) return null;

    const ventes = (
      session.ventes as Array<{
        id: string;
        numero_ticket: string;
        type: string;
        total_final: string | number;
        created_at: string;
        statut: string;
        paiements: Array<{ mode_paiement: string; montant: string | number }>;
        lignes_vente: Array<{
          quantite: number;
          total: string | number;
          produit_id: string;
          produits: { nom: string };
        }>;
      }>
    ).filter((v) => v.statut === "PAYEE");

    let totalVentes = 0,
      articlesVendus = 0;
    let totalEspeces = 0,
      totalCartes = 0,
      totalMobileMoney = 0,
      totalAutres = 0;
    const ventesParType: Record<string, { count: number; total: number }> = {
      DIRECT: { count: 0, total: 0 },
      TABLE: { count: 0, total: 0 },
      LIVRAISON: { count: 0, total: 0 },
      EMPORTER: { count: 0, total: 0 },
    };
    const produitsVendus: Record<string, { nom: string; quantite: number; total: number }> = {};

    for (const v of ventes) {
      const total = Number(v.total_final);
      totalVentes += total;
      if (ventesParType[v.type]) {
        ventesParType[v.type].count++;
        ventesParType[v.type].total += total;
      }
      const pTotals = calculatePaymentTotals(v.paiements);
      totalEspeces += pTotals.especes;
      totalCartes += pTotals.cartes;
      totalMobileMoney += pTotals.mobileMoney;
      totalAutres += pTotals.autres;
      for (const l of v.lignes_vente) {
        articlesVendus += l.quantite;
        if (!produitsVendus[l.produit_id])
          produitsVendus[l.produit_id] = { nom: l.produits.nom, quantite: 0, total: 0 };
        produitsVendus[l.produit_id].quantite += l.quantite;
        produitsVendus[l.produit_id].total += Number(l.total);
      }
    }

    return {
      session: {
        id: session.id,
        dateOuverture: new Date(session.date_ouverture),
        dateCloture: session.date_cloture ? new Date(session.date_cloture) : null,
        fondCaisse: Number(session.fond_caisse),
        especesComptees: session.especes_comptees ? Number(session.especes_comptees) : null,
        ecart: session.ecart ? Number(session.ecart) : null,
        notesCloture: session.notes_cloture,
        utilisateur: session.utilisateurs as { nom: string; prenom: string | null },
      },
      stats: {
        totalVentes,
        nombreVentes: ventes.length,
        articlesVendus,
        panierMoyen: ventes.length > 0 ? Math.round(totalVentes / ventes.length) : 0,
        paiements: {
          especes: totalEspeces,
          cartes: totalCartes,
          mobileMoney: totalMobileMoney,
          autres: totalAutres,
        },
        especesAttendues: Number(session.fond_caisse) + totalEspeces,
        ventesParType,
        topProduits: Object.values(produitsVendus)
          .sort((a, b) => b.quantite - a.quantite)
          .slice(0, 10),
      },
      ventes: ventes.map((v) => ({
        id: v.id,
        numeroTicket: v.numero_ticket,
        type: v.type,
        totalFinal: Number(v.total_final),
        createdAt: new Date(v.created_at),
        nombreArticles: v.lignes_vente.reduce((sum, l) => sum + l.quantite, 0),
      })),
    };
  } catch (error) {
    console.error("Erreur getSessionStats:", error);
    throw new Error("Impossible de récupérer les statistiques");
  }
}

export async function getSessionsHistory(limit = 20): Promise<SessionHistoryItem[]> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) return [];

    // Utiliser le service client pour bypasser les RLS
    const supabase = createServiceClient();
    const { data: sessions } = await supabase
      .from("sessions_caisse")
      .select("*, utilisateurs(nom, prenom)")
      .eq("etablissement_id", user.etablissementId)
      .not("date_cloture", "is", null)
      .order("date_cloture", { ascending: false })
      .limit(limit);

    return (sessions || []).map((s) => ({
      id: s.id,
      dateOuverture: new Date(s.date_ouverture),
      dateCloture: new Date(s.date_cloture!),
      fondCaisse: Number(s.fond_caisse),
      totalVentes: Number(s.total_ventes),
      totalEspeces: Number(s.total_especes),
      totalCartes: Number(s.total_cartes),
      totalMobileMoney: Number(s.total_mobile_money),
      totalAutres: Number(s.total_autres),
      nombreVentes: s.nombre_ventes,
      nombreAnnulations: s.nombre_annulations,
      especesComptees: s.especes_comptees ? Number(s.especes_comptees) : null,
      ecart: s.ecart ? Number(s.ecart) : null,
      notesCloture: s.notes_cloture,
      utilisateur: s.utilisateurs as { nom: string; prenom: string | null },
    }));
  } catch (error) {
    console.error("Erreur getSessionsHistory:", error);
    throw new Error("Impossible de récupérer l'historique");
  }
}

export async function generateRapportZ(sessionId: string): Promise<RapportZ | null> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) return null;

    // Utiliser le service client pour bypasser les RLS
    const supabase = createServiceClient();
    const { data: session } = await supabase
      .from("sessions_caisse")
      .select(
        `
        *, utilisateurs(nom, prenom),
        ventes(statut, type, total_final, sous_total, total_tva, paiements(mode_paiement, montant), lignes_vente(quantite, total, produit_id, produits(nom)))
      `
      )
      .eq("id", sessionId)
      .eq("etablissement_id", user.etablissementId)
      .single();

    if (!session || !session.date_cloture) return null;

    const ventes = session.ventes as Array<{
      statut: string;
      type: string;
      total_final: string | number;
      sous_total: string | number;
      total_tva: string | number;
      paiements: Array<{ mode_paiement: string; montant: string | number }>;
      lignes_vente: Array<{
        quantite: number;
        total: string | number;
        produit_id: string;
        produits: { nom: string };
      }>;
    }>;

    const ventesPayees = ventes.filter((v) => v.statut === "PAYEE");
    const ventesAnnulees = ventes.filter((v) => v.statut === "ANNULEE");

    let totalVentes = 0,
      totalHT = 0,
      totalTVA = 0,
      articlesVendus = 0;
    let totalEspeces = 0,
      totalCartes = 0,
      totalMobileMoney = 0,
      totalAutres = 0;
    const ventesParType: Record<string, { count: number; total: number }> = {
      DIRECT: { count: 0, total: 0 },
      TABLE: { count: 0, total: 0 },
      LIVRAISON: { count: 0, total: 0 },
      EMPORTER: { count: 0, total: 0 },
    };
    const produitsVendus: Record<string, { nom: string; quantite: number; total: number }> = {};

    for (const v of ventesPayees) {
      const total = Number(v.total_final);
      totalVentes += total;
      totalHT += Number(v.sous_total);
      totalTVA += Number(v.total_tva);
      if (ventesParType[v.type]) {
        ventesParType[v.type].count++;
        ventesParType[v.type].total += total;
      }
      const pTotals = calculatePaymentTotals(v.paiements);
      totalEspeces += pTotals.especes;
      totalCartes += pTotals.cartes;
      totalMobileMoney += pTotals.mobileMoney;
      totalAutres += pTotals.autres;
      for (const l of v.lignes_vente) {
        articlesVendus += l.quantite;
        if (!produitsVendus[l.produit_id])
          produitsVendus[l.produit_id] = { nom: l.produits.nom, quantite: 0, total: 0 };
        produitsVendus[l.produit_id].quantite += l.quantite;
        produitsVendus[l.produit_id].total += Number(l.total);
      }
    }

    const especesAttendues = Number(session.fond_caisse) + totalEspeces;

    return {
      session: {
        id: session.id,
        dateOuverture: new Date(session.date_ouverture),
        dateCloture: new Date(session.date_cloture),
        utilisateur: session.utilisateurs as { nom: string; prenom: string | null },
      },
      caisse: {
        fondCaisse: Number(session.fond_caisse),
        especesComptees: Number(session.especes_comptees) || 0,
        especesAttendues,
        ecart: Number(session.ecart) || 0,
      },
      ventes: {
        totalVentes,
        nombreVentes: ventesPayees.length,
        nombreAnnulations: ventesAnnulees.length,
        articlesVendus,
        panierMoyen: ventesPayees.length > 0 ? Math.round(totalVentes / ventesPayees.length) : 0,
      },
      paiements: {
        especes: totalEspeces,
        cartes: totalCartes,
        mobileMoney: totalMobileMoney,
        autres: totalAutres,
      },
      ventesParType,
      topProduits: Object.values(produitsVendus)
        .sort((a, b) => b.quantite - a.quantite)
        .slice(0, 10),
      tva: { totalHT, totalTVA, totalTTC: totalVentes },
    };
  } catch (error) {
    console.error("Erreur generateRapportZ:", error);
    throw new Error("Impossible de générer le rapport Z");
  }
}
