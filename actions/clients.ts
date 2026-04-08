"use server";

/**
 * Server Actions pour la gestion des clients
 * CRUD complet + compte prepaye + fidelite
 * Migré de Prisma vers Supabase
 */

import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  clientSchema,
  rechargeCompteSchema,
  type ClientFormData,
  type RechargeCompteData,
} from "@/schemas/client.schema";

// ============================================================================
// Types
// ============================================================================

export interface ClientWithStats {
  id: string;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  pointsFidelite: number;
  soldePrepaye: number;
  creditAutorise: boolean;
  limitCredit: number | null;
  soldeCredit: number;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    ventes: number;
  };
  totalDepense?: number;
}

export interface ClientPurchaseHistory {
  id: string;
  numeroTicket: string;
  type: string;
  totalFinal: number;
  createdAt: Date;
  lignes: {
    produit: {
      nom: string;
    };
    quantite: number;
    total: number;
  }[];
}

export interface PrepaidTransaction {
  id: string;
  type: "RECHARGE" | "DEBIT";
  montant: number;
  soldeApres: number;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface LoyaltyTransaction {
  id: string;
  venteId: string;
  numeroTicket: string;
  montantVente: number;
  pointsGagnes: number;
  createdAt: Date;
}

// ============================================================================
// CRUD Clients
// ============================================================================

/**
 * Recupere tous les clients de l'etablissement avec pagination
 */
export async function getClients(options?: {
  search?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId)
    return { clients: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId,
    role: user.role,
  });
  const page = options?.page || 1;
  const limit = options?.limit || 20;

  const result = await db.getClientsPaginated(supabase, etablissementId, {
    page,
    pageSize: limit,
    actif: options?.includeInactive ? undefined : true,
    search: options?.search,
  });

  // Récupérer le count de ventes par client en une seule requête
  const clientIds = result.data.map((c) => c.id);
  const ventesCountMap = new Map<string, number>();

  if (clientIds.length > 0) {
    const { data: ventesData } = await supabase
      .from("ventes")
      .select("client_id")
      .in("client_id", clientIds)
      .eq("statut", "PAYEE");

    for (const v of ventesData || []) {
      if (v.client_id) {
        ventesCountMap.set(v.client_id, (ventesCountMap.get(v.client_id) || 0) + 1);
      }
    }
  }

  // Transformer pour correspondre au format attendu
  const clientsFormatted = result.data.map((c) => ({
    id: c.id,
    nom: c.nom,
    prenom: c.prenom,
    telephone: c.telephone,
    email: c.email,
    adresse: c.adresse,
    pointsFidelite: c.points_fidelite,
    soldePrepaye: c.solde_prepaye,
    creditAutorise: c.credit_autorise,
    limitCredit: c.limit_credit,
    soldeCredit: c.solde_credit,
    actif: c.actif,
    createdAt: new Date(c.created_at),
    updatedAt: new Date(c.updated_at),
    _count: { ventes: ventesCountMap.get(c.id) || 0 },
  }));

  return {
    clients: clientsFormatted,
    pagination: {
      page: result.page,
      limit: result.pageSize,
      total: result.count,
      totalPages: result.totalPages,
    },
  };
}

/**
 * Recupere un client par son ID avec ses statistiques
 */
export async function getClientById(id: string): Promise<ClientWithStats | null> {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return null;
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId,
    role: user.role,
  });

  const client = await db.getClientById(supabase, id);

  if (!client) {
    return null;
  }

  // Compter les ventes du client et calculer le total dépensé
  const { count: ventesCount } = await supabase
    .from("ventes")
    .select("*", { count: "exact", head: true })
    .eq("client_id", id)
    .eq("statut", "PAYEE");

  const { data: ventesTotaux } = await supabase
    .from("ventes")
    .select("total_final")
    .eq("client_id", id)
    .eq("statut", "PAYEE");

  const totalDepense = (ventesTotaux || []).reduce((sum, v) => sum + Number(v.total_final), 0);

  return {
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    telephone: client.telephone,
    email: client.email,
    adresse: client.adresse,
    pointsFidelite: client.points_fidelite,
    soldePrepaye: client.solde_prepaye,
    creditAutorise: client.credit_autorise,
    limitCredit: client.limit_credit,
    soldeCredit: client.solde_credit,
    actif: client.actif,
    createdAt: new Date(client.created_at),
    updatedAt: new Date(client.updated_at),
    _count: { ventes: ventesCount ?? 0 },
    totalDepense,
  };
}

/**
 * Cree un nouveau client
 */
export async function createClient(data: ClientFormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId)
      return { success: false, error: "Vous devez être connecté" };
    const etablissementId = user.etablissementId;
    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId,
      role: user.role,
    });

    // Validation Zod
    const validated = clientSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Données invalides",
      };
    }

    const { nom, prenom, telephone, email, adresse, creditAutorise, limitCredit, actif } =
      validated.data;

    // Verifier si un client avec ce telephone existe deja
    if (telephone) {
      const existing = await db.getClientByTelephone(supabase, etablissementId, telephone);

      if (existing) {
        return {
          success: false,
          error: "Un client avec ce numéro de téléphone existe deja",
          existingClient: existing,
        };
      }
    }

    // Verifier si un client avec cet email existe deja
    if (email) {
      const clients = await db.getClients(supabase, etablissementId, { search: email });
      const existingEmail = clients.find((c) => c.email === email);

      if (existingEmail) {
        return {
          success: false,
          error: "Un client avec cet email existe deja",
          existingClient: existingEmail,
        };
      }
    }

    // Creer le client
    const client = await db.createClient(supabase, {
      nom,
      prenom: prenom || null,
      telephone: telephone || null,
      email: email || null,
      adresse: adresse || null,
      credit_autorise: creditAutorise || false,
      limit_credit: limitCredit || null,
      actif: actif ?? true,
      etablissement_id: etablissementId,
    });

    revalidatePath("/clients");

    return {
      success: true,
      data: {
        id: client.id,
        nom: client.nom,
        prenom: client.prenom,
        telephone: client.telephone,
        email: client.email,
        adresse: client.adresse,
        pointsFidelite: client.points_fidelite,
        soldePrepaye: client.solde_prepaye,
        creditAutorise: client.credit_autorise,
        limitCredit: client.limit_credit,
        soldeCredit: client.solde_credit,
        actif: client.actif,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la création du client:", error);
    return {
      success: false,
      error: "Erreur lors de la création du client",
    };
  }
}

/**
 * Met a jour un client existant
 */
export async function updateClient(id: string, data: ClientFormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId)
      return { success: false, error: "Vous devez être connecté" };
    const etablissementId = user.etablissementId;
    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId,
      role: user.role,
    });

    // Validation Zod
    const validated = clientSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Données invalides",
      };
    }

    const { nom, prenom, telephone, email, adresse, creditAutorise, limitCredit, actif } =
      validated.data;

    // Verifier que le client existe (RLS filtre par établissement)
    const existing = await db.getClientById(supabase, id);

    if (!existing) {
      return {
        success: false,
        error: "Client non trouve",
      };
    }

    // Verifier l'unicite du telephone (sauf pour ce client)
    if (telephone && telephone !== existing.telephone) {
      const duplicatePhone = await db.getClientByTelephone(supabase, etablissementId, telephone);

      if (duplicatePhone && duplicatePhone.id !== id) {
        return {
          success: false,
          error: "Un autre client utilise déjà ce numéro de téléphone",
        };
      }
    }

    // Verifier l'unicite de l'email (sauf pour ce client)
    if (email && email !== existing.email) {
      const clients = await db.getClients(supabase, etablissementId, { search: email });
      const duplicateEmail = clients.find((c) => c.email === email && c.id !== id);

      if (duplicateEmail) {
        return {
          success: false,
          error: "Un autre client utilise déjà cet email",
        };
      }
    }

    // Mettre a jour
    const client = await db.updateClient(supabase, id, {
      nom,
      prenom: prenom || null,
      telephone: telephone || null,
      email: email || null,
      adresse: adresse || null,
      credit_autorise: creditAutorise || false,
      limit_credit: limitCredit || null,
      actif: actif ?? true,
    });

    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);

    return {
      success: true,
      data: {
        id: client.id,
        nom: client.nom,
        prenom: client.prenom,
        telephone: client.telephone,
        email: client.email,
        adresse: client.adresse,
        pointsFidelite: client.points_fidelite,
        soldePrepaye: client.solde_prepaye,
        creditAutorise: client.credit_autorise,
        limitCredit: client.limit_credit,
        soldeCredit: client.solde_credit,
        actif: client.actif,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du client:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour du client",
    };
  }
}

/**
 * Supprime (desactive) un client
 */
export async function deleteClient(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId)
      return { success: false, error: "Vous devez être connecté" };
    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });

    // Verifier que le client existe (RLS filtre par établissement)
    const existing = await db.getClientById(supabase, id);

    if (!existing) {
      return {
        success: false,
        error: "Client non trouve",
      };
    }

    // On désactive simplement le client (soft delete)
    await db.deleteClient(supabase, id);

    revalidatePath("/clients");
    return {
      success: true,
      message: "Client desactive",
    };
  } catch (error) {
    console.error("Erreur lors de la suppression du client:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression du client",
    };
  }
}

// ============================================================================
// Compte Prepaye
// ============================================================================

/**
 * Recharge le compte prepaye d'un client
 */
export async function rechargerComptePrepaye(data: RechargeCompteData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId)
      return { success: false, error: "Vous devez être connecté" };
    const etablissementId = user.etablissementId;
    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId,
      role: user.role,
    });

    // Validation Zod
    const validated = rechargeCompteSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Données invalides",
      };
    }

    const { clientId, montant, reference, notes } = validated.data;

    // Verifier que le client existe (RLS filtre par établissement)
    const client = await db.getClientById(supabase, clientId);

    if (!client) {
      return {
        success: false,
        error: "Client non trouve",
      };
    }

    // Calculer le nouveau solde et mettre à jour
    const ancienSolde = client.solde_prepaye;
    await db.updateClientSoldePrepaye(supabase, clientId, montant);

    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);

    return {
      success: true,
      data: {
        ancienSolde,
        nouveauSolde: ancienSolde + montant,
        montant,
        reference: reference || null,
        notes: notes || null,
      },
    };
  } catch (error) {
    console.error("Erreur lors du rechargement:", error);
    return {
      success: false,
      error: "Erreur lors du rechargement du compte",
    };
  }
}

/**
 * Recupere l'historique du compte prepaye (simule via les ventes payees par COMPTE_CLIENT)
 */
export async function getHistoriqueComptePrepaye(clientId: string) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return [];
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId,
    role: user.role,
  });

  // Recuperer les ventes payees par compte client
  const ventes = await db.getVentes(supabase, etablissementId, {
    clientId,
    statut: "PAYEE",
  });

  // Transformer en transactions
  const transactions = ventes.map((v) => ({
    id: v.id,
    type: "DEBIT" as const,
    montant: v.total_final,
    venteId: v.id,
    numeroTicket: v.numero_ticket,
    createdAt: new Date(v.created_at),
  }));

  return transactions;
}

// ============================================================================
// Programme de Fidelite
// ============================================================================

/**
 * Regle de fidelite: 1 point par 1000 FCFA depenses
 */
const POINTS_PAR_FCFA = 1000;

/**
 * Calcule les points de fidelite pour un montant donne
 */
export async function calculerPointsFidelite(montant: number): Promise<number> {
  return Math.floor(montant / POINTS_PAR_FCFA);
}

// Helper synchrone pour le calcul des points (usage interne)
function calcPointsFideliteSync(montant: number): number {
  return Math.floor(montant / POINTS_PAR_FCFA);
}

/**
 * Recupere l'historique des points de fidelite d'un client
 */
export async function getHistoriqueFidelite(clientId: string) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return [];
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId,
    role: user.role,
  });

  // Recuperer les ventes payees du client
  const ventes = await db.getVentes(supabase, etablissementId, {
    clientId,
    statut: "PAYEE",
  });

  // Calculer les points pour chaque vente
  const historique: LoyaltyTransaction[] = ventes.slice(0, 50).map((v) => ({
    id: v.id,
    venteId: v.id,
    numeroTicket: v.numero_ticket,
    montantVente: v.total_final,
    pointsGagnes: calcPointsFideliteSync(v.total_final),
    createdAt: new Date(v.created_at),
  }));

  return historique;
}

/**
 * Ajoute des points de fidelite a un client (appele apres une vente)
 */
export async function ajouterPointsFidelite(clientId: string, montantVente: number) {
  const points = calcPointsFideliteSync(montantVente);

  if (points <= 0) return { success: true, pointsAjoutes: 0 };

  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) return { success: false, error: "Non authentifié" };
    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });
    await db.updateClientPoints(supabase, clientId, points);

    return { success: true, pointsAjoutes: points };
  } catch (error) {
    console.error("Erreur lors de l'ajout des points:", error);
    return { success: false, error: "Erreur lors de l'ajout des points" };
  }
}

// ============================================================================
// Historique des achats
// ============================================================================

/**
 * Recupere l'historique des achats d'un client
 */
export async function getHistoriqueAchats(
  clientId: string,
  options?: { page?: number; limit?: number }
) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId)
    return { ventes: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId,
    role: user.role,
  });
  const page = options?.page || 1;
  const limit = options?.limit || 20;

  // Requête directe avec filtre client_id dans Supabase (pas en JS)
  const offset = (page - 1) * limit;

  const {
    data: ventes,
    count,
    error,
  } = await supabase
    .from("ventes")
    .select(
      "id, numero_ticket, type, total_final, created_at, lignes_vente(quantite, total, produits(nom))",
      { count: "exact" }
    )
    .eq("etablissement_id", etablissementId)
    .eq("client_id", clientId)
    .eq("statut", "PAYEE")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Erreur getHistoriqueAchats:", error);
    return { ventes: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }

  const total = count ?? 0;
  const ventesFormatted = (ventes || []).map((v) => ({
    id: v.id,
    numeroTicket: v.numero_ticket,
    type: v.type,
    totalFinal: Number(v.total_final),
    createdAt: new Date(v.created_at),
    lignes: (v.lignes_vente || []).map((l: Record<string, unknown>) => ({
      produit: { nom: (l.produits as { nom: string })?.nom || "Inconnu" },
      quantite: l.quantite as number,
      total: Number(l.total),
    })),
  }));

  return {
    ventes: ventesFormatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Recupere les statistiques des achats d'un client
 */
export async function getStatistiquesClient(clientId: string) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId)
    return { totalDepense: 0, nombreAchats: 0, panierMoyen: 0, produitsPreference: [] };
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId,
    role: user.role,
  });

  // Récupérer les ventes du client
  const ventes = await db.getVentes(supabase, etablissementId, {
    clientId,
    statut: "PAYEE",
  });

  const totalDepense = ventes.reduce((sum, v) => sum + v.total_final, 0);
  const nombreAchats = ventes.length;
  const panierMoyen = nombreAchats > 0 ? Math.round(totalDepense / nombreAchats) : 0;

  // Récupérer les produits les plus achetés par ce client
  const venteIds = ventes.map((v) => v.id);
  let produitsPreference: { produitId: string; nom: string; quantiteTotale: number }[] = [];

  if (venteIds.length > 0) {
    const { data: lignes } = await supabase
      .from("lignes_vente")
      .select("produit_id, quantite, produits(nom)")
      .in("vente_id", venteIds);

    // Grouper par produit et sommer les quantités
    const produitMap = new Map<string, { nom: string; quantiteTotale: number }>();
    for (const l of lignes || []) {
      const existing = produitMap.get(l.produit_id);
      const nom = (l.produits as unknown as { nom: string })?.nom || "Inconnu";
      if (existing) {
        existing.quantiteTotale += l.quantite;
      } else {
        produitMap.set(l.produit_id, { nom, quantiteTotale: l.quantite });
      }
    }

    // Trier par quantité décroissante et prendre le top 5
    produitsPreference = Array.from(produitMap.entries())
      .map(([produitId, data]) => ({ produitId, ...data }))
      .sort((a, b) => b.quantiteTotale - a.quantiteTotale)
      .slice(0, 5);
  }

  return {
    totalDepense,
    nombreAchats,
    panierMoyen,
    produitsPreference,
  };
}

// ============================================================================
// Recherche (pour autocompletion)
// ============================================================================

/**
 * Recherche de clients pour l'autocompletion
 */
export async function searchClients(query: string) {
  if (!query || query.length < 2) {
    return [];
  }

  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return [];
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId,
    role: user.role,
  });

  const clients = await db.getClients(supabase, etablissementId, {
    actif: true,
    search: query,
  });

  return clients.slice(0, 10).map((c) => ({
    id: c.id,
    nom: c.nom,
    prenom: c.prenom,
    telephone: c.telephone,
    adresse: c.adresse,
    soldePrepaye: c.solde_prepaye,
    pointsFidelite: c.points_fidelite,
  }));
}

/**
 * Cree un nouveau client (quick create pour la caisse)
 */
export async function createClientQuick(data: {
  nom: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
}) {
  return createClient({
    nom: data.nom,
    prenom: data.prenom,
    telephone: data.telephone,
    email: data.email,
    adresse: data.adresse,
    nif: undefined,
    notes: undefined,
    creditAutorise: false,
    limitCredit: undefined,
    actif: true,
  });
}
