/**
 * Requêtes Supabase pour l'administration des établissements (SUPER_ADMIN)
 * Stats enrichies, recherche, détail complet
 */

import type { DbClient } from "../client";
import type { PaginationOptions, PaginatedResult } from "../types";
import { getPaginationParams, createPaginatedResult, getErrorMessage } from "../utils";

// ============================================================================
// TYPES
// ============================================================================

export interface AdminEtablissementRow {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  nif: string | null;
  rccm: string | null;
  logo: string | null;
  statut: string;
  motif_suspension: string | null;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface AdminEtablissementWithStats extends AdminEtablissementRow {
  nb_utilisateurs: number;
  nb_produits: number;
  nb_ventes: number;
  nb_clients: number;
  ca_total: number;
}

export interface EtablissementDetailStats {
  ca_total: number;
  nb_ventes: number;
  nb_produits: number;
  nb_utilisateurs: number;
  nb_clients: number;
  ca_dernier_mois: number;
  nb_ventes_dernier_mois: number;
}

export interface EtablissementStatsDetaillees {
  ca_par_jour: Array<{ date: string; total: number }>;
  panier_moyen: number;
  top_produits: Array<{ nom: string; quantite: number; total: number }>;
  heures_pointe: Array<{ heure: number; nb_ventes: number }>;
}

export interface EtablissementUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  actif: boolean;
  created_at: string;
  derniere_connexion: string | null;
}

// ============================================================================
// RECHERCHE & LISTE
// ============================================================================

/**
 * Recherche d'établissements avec filtres, tri et pagination
 */
export async function searchAdminEtablissements(
  client: DbClient,
  filters?: {
    query?: string;
    statut?: string;
    plan?: string;
    dateDebut?: string;
    dateFin?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  pagination?: PaginationOptions
): Promise<PaginatedResult<AdminEtablissementWithStats>> {
  const { offset, limit, page, pageSize } = getPaginationParams(pagination);

  // Requête de base avec comptage
  // Note: les colonnes statut/plan/motif_suspension sont ajoutées par migration
  // On sélectionne toutes les colonnes pour éviter les erreurs de typage
  let query = client
    .from("etablissements")
    .select("*", { count: "exact" });

  // Filtres
  if (filters?.query) {
    query = query.or(
      `nom.ilike.%${filters.query}%,email.ilike.%${filters.query}%,telephone.ilike.%${filters.query}%`
    );
  }

  if (filters?.statut && filters.statut !== "all") {
    query = query.eq("statut", filters.statut);
  }

  if (filters?.plan && filters.plan !== "all") {
    query = query.eq("plan", filters.plan);
  }

  if (filters?.dateDebut) {
    query = query.gte("created_at", filters.dateDebut);
  }

  if (filters?.dateFin) {
    query = query.lte("created_at", filters.dateFin);
  }

  // Tri
  const sortColumn = filters?.sortBy || "created_at";
  const ascending = filters?.sortOrder === "asc";
  query = query.order(sortColumn, { ascending });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  // Enrichir avec les stats - batch au lieu de N+1
  const etablissements = (data ?? []) as Array<Record<string, unknown>>;
  const etabIds = etablissements.map((e) => e.id as string);

  const batchStats = await getEtablissementCountStatsBatch(client, etabIds);

  const enriched: AdminEtablissementWithStats[] = etablissements.map((etab) => {
    const stats = batchStats.get(etab.id as string) ?? {
      nb_utilisateurs: 0,
      nb_produits: 0,
      nb_ventes: 0,
      nb_clients: 0,
      ca_total: 0,
    };
    return {
      id: etab.id as string,
      nom: etab.nom as string,
      email: (etab.email as string) ?? null,
      telephone: (etab.telephone as string) ?? null,
      adresse: (etab.adresse as string) ?? null,
      nif: (etab.nif as string) ?? null,
      rccm: (etab.rccm as string) ?? null,
      logo: (etab.logo as string) ?? null,
      statut: (etab.statut as string) ?? "actif",
      motif_suspension: (etab.motif_suspension as string) ?? null,
      plan: (etab.plan as string) ?? "gratuit",
      created_at: etab.created_at as string,
      updated_at: etab.updated_at as string,
      ...stats,
    };
  });

  return createPaginatedResult(enriched, count ?? 0, { page, pageSize });
}

// ============================================================================
// DÉTAIL & STATS
// ============================================================================

/**
 * Compteurs de base pour un seul établissement
 * Utilise des requêtes count head (pas de chargement de données) et
 * ne charge que total_final pour le CA au lieu de toutes les lignes.
 */
async function getEtablissementCountStats(
  client: DbClient,
  etablissementId: string
): Promise<{
  nb_utilisateurs: number;
  nb_produits: number;
  nb_ventes: number;
  nb_clients: number;
  ca_total: number;
}> {
  const stats = await getEtablissementCountStatsBatch(client, [etablissementId]);
  return stats.get(etablissementId) ?? {
    nb_utilisateurs: 0,
    nb_produits: 0,
    nb_ventes: 0,
    nb_clients: 0,
    ca_total: 0,
  };
}

/**
 * Compteurs de base pour PLUSIEURS établissements en batch
 * Fait 5 requêtes au total (au lieu de N*5) puis mappe les résultats
 */
async function getEtablissementCountStatsBatch(
  client: DbClient,
  etablissementIds: string[]
): Promise<
  Map<
    string,
    {
      nb_utilisateurs: number;
      nb_produits: number;
      nb_ventes: number;
      nb_clients: number;
      ca_total: number;
    }
  >
> {
  const result = new Map<
    string,
    {
      nb_utilisateurs: number;
      nb_produits: number;
      nb_ventes: number;
      nb_clients: number;
      ca_total: number;
    }
  >();

  if (etablissementIds.length === 0) return result;

  // Initialiser les compteurs
  for (const id of etablissementIds) {
    result.set(id, {
      nb_utilisateurs: 0,
      nb_produits: 0,
      nb_ventes: 0,
      nb_clients: 0,
      ca_total: 0,
    });
  }

  // Counts par table en parallèle (head: true = pas de chargement de données)
  // Pour chaque table, on fait un count par etablissement_id
  // Supabase ne supporte pas GROUP BY via le client JS, donc on fait un count par ID
  // Mais c'est max N*4 counts légers (head only) au lieu de charger toutes les lignes
  // On regroupe par paquets pour limiter les requêtes

  // Counts légers (head: true, count: "exact") — 4 requêtes par établissement mais sans données
  const countPromises = etablissementIds.map(async (id) => {
    const [users, produits, ventes, clients] = await Promise.all([
      client
        .from("utilisateurs")
        .select("id", { count: "exact", head: true })
        .eq("etablissement_id", id),
      client
        .from("produits")
        .select("id", { count: "exact", head: true })
        .eq("etablissement_id", id),
      client
        .from("ventes")
        .select("id", { count: "exact", head: true })
        .eq("etablissement_id", id),
      client
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("etablissement_id", id),
    ]);

    const stats = result.get(id);
    if (stats) {
      stats.nb_utilisateurs = users.count ?? 0;
      stats.nb_produits = produits.count ?? 0;
      stats.nb_ventes = ventes.count ?? 0;
      stats.nb_clients = clients.count ?? 0;
    }
  });

  // CA total — charge total_final pour les ventes payées avec limite de sécurité
  // TODO: Créer une RPC PostgreSQL pour SUM(total_final) et éviter de charger les lignes
  const caPromise = client
    .from("ventes")
    .select("etablissement_id, total_final")
    .in("etablissement_id", etablissementIds)
    .eq("statut", "PAYEE")
    .limit(10000);

  const [, caResult] = await Promise.all([
    Promise.all(countPromises),
    caPromise,
  ]);

  for (const row of caResult.data ?? []) {
    const stats = result.get(row.etablissement_id);
    if (stats) stats.ca_total += parseFloat(String(row.total_final)) || 0;
  }

  // Arrondir les CA
  for (const stats of result.values()) {
    stats.ca_total = Math.round(stats.ca_total);
  }

  return result;
}

/**
 * Stats détaillées de l'établissement (avec données du dernier mois)
 * Optimisé: les counts et CA du dernier mois sont calculés en parallèle avec les stats de base
 */
export async function getAdminEtablissementDetailStats(
  client: DbClient,
  etablissementId: string
): Promise<EtablissementDetailStats> {
  // Dernier mois
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const debutMoisISO = debutMois.toISOString();

  // Exécuter les stats de base ET les stats du dernier mois en parallèle
  const [baseStats, ventesDebutMois, caDebutMois] = await Promise.all([
    getEtablissementCountStats(client, etablissementId),
    client
      .from("ventes")
      .select("id", { count: "exact", head: true })
      .eq("etablissement_id", etablissementId)
      .gte("created_at", debutMoisISO),
    client
      .from("ventes")
      .select("total_final")
      .eq("etablissement_id", etablissementId)
      .eq("statut", "PAYEE")
      .gte("created_at", debutMoisISO),
  ]);

  const caDernierMois = (caDebutMois.data ?? []).reduce(
    (sum, v) => sum + (parseFloat(String(v.total_final)) || 0),
    0
  );

  return {
    ...baseStats,
    ca_dernier_mois: Math.round(caDernierMois),
    nb_ventes_dernier_mois: ventesDebutMois.count ?? 0,
  };
}

/**
 * Stats détaillées : CA par jour, panier moyen, top produits, heures de pointe
 */
export async function getAdminEtablissementStatsDetaillees(
  client: DbClient,
  etablissementId: string,
  periode?: { dateDebut: string; dateFin: string }
): Promise<EtablissementStatsDetaillees> {
  const dateDebut =
    periode?.dateDebut ??
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const dateFin = periode?.dateFin ?? new Date().toISOString();

  // Ventes de la période
  const { data: ventes } = await client
    .from("ventes")
    .select("id, total_final, created_at")
    .eq("etablissement_id", etablissementId)
    .eq("statut", "PAYEE")
    .gte("created_at", dateDebut)
    .lte("created_at", dateFin)
    .order("created_at", { ascending: true });

  const ventesData = ventes ?? [];

  // CA par jour
  const caParJourMap = new Map<string, number>();
  for (const v of ventesData) {
    const date = v.created_at.slice(0, 10);
    caParJourMap.set(date, (caParJourMap.get(date) ?? 0) + (parseFloat(String(v.total_final)) || 0));
  }
  const ca_par_jour = Array.from(caParJourMap.entries()).map(([date, total]) => ({
    date,
    total: Math.round(total),
  }));

  // Panier moyen
  const totalCA = ventesData.reduce(
    (sum, v) => sum + (parseFloat(String(v.total_final)) || 0),
    0
  );
  const panier_moyen = ventesData.length > 0 ? Math.round(totalCA / ventesData.length) : 0;

  // Top 5 produits — via embedded resource pour éviter .in() avec des milliers d'IDs
  // Jointure vers produits pour le nom et vers ventes pour filtrer par établissement/période
  const { data: lignesVente } = await client
    .from("lignes_vente")
    .select("quantite, total, produit:produits!inner(nom), vente:ventes!inner(id)")
    .eq("vente.etablissement_id", etablissementId)
    .eq("vente.statut", "PAYEE")
    .gte("vente.created_at", dateDebut)
    .lte("vente.created_at", dateFin);

  const produitMap = new Map<string, { quantite: number; total: number }>();
  for (const l of (lignesVente ?? []) as unknown as Array<{ quantite: number; total: number; produit: { nom: string } }>) {
    const nom = l.produit?.nom ?? "Inconnu";
    const existing = produitMap.get(nom) ?? { quantite: 0, total: 0 };
    existing.quantite += parseFloat(String(l.quantite)) || 0;
    existing.total += parseFloat(String(l.total)) || 0;
    produitMap.set(nom, existing);
  }
  const top_produits = Array.from(produitMap.entries())
    .map(([nom, stats]) => ({ nom, quantite: Math.round(stats.quantite), total: Math.round(stats.total) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Heures de pointe
  const heureMap = new Map<number, number>();
  for (const v of ventesData) {
    const heure = new Date(v.created_at).getHours();
    heureMap.set(heure, (heureMap.get(heure) ?? 0) + 1);
  }
  const heures_pointe = Array.from(heureMap.entries())
    .map(([heure, nb_ventes]) => ({ heure, nb_ventes }))
    .sort((a, b) => a.heure - b.heure);

  return { ca_par_jour, panier_moyen, top_produits, heures_pointe };
}

// ============================================================================
// UTILISATEURS D'UN ÉTABLISSEMENT
// ============================================================================

/**
 * Liste les utilisateurs d'un établissement avec leur dernière connexion
 */
export async function getAdminEtablissementUsers(
  client: DbClient,
  etablissementId: string
): Promise<EtablissementUser[]> {
  const { data, error } = await client
    .from("utilisateurs")
    .select("id, nom, prenom, email, role, actif, created_at")
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  // Récupérer la dernière connexion de tous les utilisateurs en une seule requête
  const users = data ?? [];
  const userIds = users.map((u) => u.id);

  const lastLoginMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: lastLogins } = await client
      .from("audit_logs")
      .select("utilisateur_id, created_at")
      .in("utilisateur_id", userIds)
      .eq("action", "LOGIN")
      .order("created_at", { ascending: false });

    // Dédupliquer : prendre la première occurrence (la plus récente) par utilisateur
    for (const log of lastLogins ?? []) {
      if (log.utilisateur_id && !lastLoginMap.has(log.utilisateur_id)) {
        lastLoginMap.set(log.utilisateur_id, log.created_at);
      }
    }
  }

  const enriched: EtablissementUser[] = users.map((user) => ({
    ...user,
    derniere_connexion: lastLoginMap.get(user.id) ?? null,
  }));

  return enriched;
}
