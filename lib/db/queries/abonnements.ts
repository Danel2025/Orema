/**
 * Requetes Supabase pour les abonnements, quotas, paiements et factures
 *
 * Importe la configuration des plans depuis lib/config/plans.ts (source de verite).
 */

import type { DbClient } from "../client";
import { getErrorMessage } from "../utils";
import {
  type PlanSlug,
  type BillingCycle,
  getPlanQuotas,
  resolvePlanSlug,
  PLANS,
} from "@/lib/config/plans";

// ============================================================================
// TYPES
// ============================================================================

export interface AbonnementInfo {
  etablissement_id: string;
  plan: PlanSlug;
  billing_cycle: BillingCycle;
  max_utilisateurs: number;
  max_produits: number;
  max_ventes_mois: number;
  max_etablissements: number;
  stripe_customer_id: string | null;
  monetbil_service_key: string | null;
}

export interface QuotaUsage {
  plan: PlanSlug;
  utilisateurs: { actuel: number; max: number; pourcentage: number };
  produits: { actuel: number; max: number; pourcentage: number };
  ventes_mois: { actuel: number; max: number; pourcentage: number };
}

export interface AbonnementHistoryEntry {
  id: string;
  etablissement_id: string;
  ancien_plan: string;
  nouveau_plan: string;
  modifie_par: string | null;
  created_at: string;
}

export interface PaiementAbonnement {
  id: string;
  etablissement_id: string;
  montant: number;
  devise: string;
  methode: string;
  statut: string;
  reference_externe: string | null;
  provider_payload: Record<string, unknown> | null;
  periode_debut: string;
  periode_fin: string;
  created_at: string;
}

export interface FactureAbonnement {
  id: string;
  etablissement_id: string;
  numero: string;
  periode_debut: string;
  periode_fin: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  statut: string;
  pdf_url: string | null;
  date_echeance: string;
  date_paiement: string | null;
  created_at: string;
}

// ============================================================================
// QUERIES ABONNEMENT
// ============================================================================

/**
 * Donnees enrichies de l'abonnement (provenant de la table abonnements si disponible)
 */
export interface AbonnementFullInfo extends AbonnementInfo {
  /** Statut reel de l'abonnement (actif, expire, annule, en_essai) */
  abonnement_statut: string | null;
  /** Date de debut de l'abonnement */
  date_debut: string | null;
  /** Date de fin de l'abonnement */
  date_fin: string | null;
  /** Date de fin de la periode d'essai */
  date_essai_fin: string | null;
  /** Prix mensuel reel (depuis la table abonnements) */
  prix_mensuel: number | null;
}

/**
 * Recupere l'abonnement actif d'un etablissement
 * Lit les colonnes plan/quotas directement depuis la table etablissements.
 */
export async function getAbonnement(
  client: DbClient,
  etablissementId: string
): Promise<AbonnementInfo | null> {
  const { data, error } = await client
    .from("etablissements")
    .select("id, nom, plan, billing_cycle, max_utilisateurs, max_produits, max_ventes_mois, max_etablissements, stripe_customer_id, monetbil_service_key")
    .eq("id", etablissementId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  const row = data as Record<string, unknown>;
  const planSlug = resolvePlanSlug((row.plan as string) ?? "essentiel");
  const defaultQuotas = getPlanQuotas(planSlug);

  return {
    etablissement_id: row.id as string,
    plan: planSlug,
    billing_cycle: ((row.billing_cycle as string) ?? "mensuel") as BillingCycle,
    max_utilisateurs:
      (row.max_utilisateurs as number) ?? defaultQuotas.max_utilisateurs,
    max_produits: (row.max_produits as number) ?? defaultQuotas.max_produits,
    max_ventes_mois:
      (row.max_ventes_mois as number) ?? defaultQuotas.max_ventes_mois,
    max_etablissements:
      (row.max_etablissements as number) ?? defaultQuotas.max_etablissements,
    stripe_customer_id: (row.stripe_customer_id as string) ?? null,
    monetbil_service_key: (row.monetbil_service_key as string) ?? null,
  };
}

/**
 * Recupere l'abonnement enrichi d'un etablissement.
 * Lit d'abord la table etablissements (fallback), puis enrichit avec la table
 * abonnements si un enregistrement existe pour cet etablissement.
 */
export async function getAbonnementFull(
  client: DbClient,
  etablissementId: string
): Promise<AbonnementFullInfo | null> {
  // 1. Recuperer les donnees de base depuis etablissements
  const base = await getAbonnement(client, etablissementId);
  if (!base) return null;

  // 2. Chercher un abonnement dans la table abonnements
  const { data: abonnementRow, error: abError } = await client
    .from("abonnements")
    .select("id, etablissement_id, plan, statut, billing_cycle, date_debut, date_fin, date_essai_fin, prix_mensuel, stripe_subscription_id, created_at, updated_at")
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (abError) {
    // Si la table n'existe pas ou erreur, on retourne les donnees de base
    console.error("[getAbonnementFull] Erreur table abonnements:", abError.message);
    return {
      ...base,
      abonnement_statut: null,
      date_debut: null,
      date_fin: null,
      date_essai_fin: null,
      prix_mensuel: null,
    };
  }

  if (!abonnementRow) {
    // Pas d'abonnement dans la table, fallback sur etablissements
    return {
      ...base,
      abonnement_statut: null,
      date_debut: null,
      date_fin: null,
      date_essai_fin: null,
      prix_mensuel: null,
    };
  }

  // 3. Enrichir avec les donnees reelles de la table abonnements
  const ab = abonnementRow as Record<string, unknown>;
  const abPlan = resolvePlanSlug((ab.plan as string) ?? base.plan);
  const abQuotas = getPlanQuotas(abPlan);

  return {
    ...base,
    // Ecraser avec les donnees de la table abonnements si presentes
    plan: abPlan,
    billing_cycle: ((ab.billing_cycle as string) ?? base.billing_cycle) as BillingCycle,
    max_utilisateurs: base.max_utilisateurs ?? abQuotas.max_utilisateurs,
    max_produits: base.max_produits ?? abQuotas.max_produits,
    max_ventes_mois: base.max_ventes_mois ?? abQuotas.max_ventes_mois,
    max_etablissements: base.max_etablissements ?? abQuotas.max_etablissements,
    // Champs enrichis
    abonnement_statut: (ab.statut as string) ?? null,
    date_debut: (ab.date_debut as string) ?? null,
    date_fin: (ab.date_fin as string) ?? null,
    date_essai_fin: (ab.date_essai_fin as string) ?? null,
    prix_mensuel: (ab.prix_mensuel as number) ?? null,
  };
}

/**
 * Met a jour l'abonnement d'un etablissement
 */
export async function updateAbonnement(
  client: DbClient,
  etablissementId: string,
  data: {
    plan: PlanSlug;
    billing_cycle?: BillingCycle;
    max_utilisateurs: number;
    max_produits: number;
    max_ventes_mois: number;
    max_etablissements?: number;
  }
): Promise<AbonnementInfo> {
  const defaultQuotas = getPlanQuotas(data.plan);

  const updatePayload: Record<string, unknown> = {
    plan: data.plan,
    billing_cycle: data.billing_cycle ?? "mensuel",
    max_utilisateurs: data.max_utilisateurs,
    max_produits: data.max_produits,
    max_ventes_mois: data.max_ventes_mois,
    max_etablissements:
      data.max_etablissements ?? defaultQuotas.max_etablissements,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await client
    .from("etablissements")
    .update(updatePayload as never)
    .eq("id", etablissementId)
    .select("*")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const row = updated as Record<string, unknown>;
  return {
    etablissement_id: row.id as string,
    plan: resolvePlanSlug((row.plan as string) ?? data.plan),
    billing_cycle: ((row.billing_cycle as string) ?? "mensuel") as BillingCycle,
    max_utilisateurs:
      (row.max_utilisateurs as number) ?? data.max_utilisateurs,
    max_produits: (row.max_produits as number) ?? data.max_produits,
    max_ventes_mois:
      (row.max_ventes_mois as number) ?? data.max_ventes_mois,
    max_etablissements:
      (row.max_etablissements as number) ??
      data.max_etablissements ??
      defaultQuotas.max_etablissements,
    stripe_customer_id: (row.stripe_customer_id as string) ?? null,
    monetbil_service_key: (row.monetbil_service_key as string) ?? null,
  };
}

/**
 * Change le plan d'un etablissement avec les quotas par defaut du nouveau plan
 */
export async function changePlan(
  client: DbClient,
  etablissementId: string,
  nouveauPlan: PlanSlug,
  billingCycle: BillingCycle = "mensuel"
): Promise<AbonnementInfo> {
  const quotas = getPlanQuotas(nouveauPlan);
  return updateAbonnement(client, etablissementId, {
    plan: nouveauPlan,
    billing_cycle: billingCycle,
    max_utilisateurs: quotas.max_utilisateurs,
    max_produits: quotas.max_produits,
    max_ventes_mois: quotas.max_ventes_mois,
    max_etablissements: quotas.max_etablissements,
  });
}

/**
 * Verifie l'utilisation des quotas d'un etablissement
 */
export async function checkQuotas(
  client: DbClient,
  etablissementId: string
): Promise<QuotaUsage> {
  const abonnement = await getAbonnement(client, etablissementId);
  if (!abonnement) {
    throw new Error("Établissement non trouvé");
  }

  const [utilisateurs, produits, ventesMois] = await Promise.all([
    client
      .from("utilisateurs")
      .select("id", { count: "exact", head: true })
      .eq("etablissement_id", etablissementId)
      .eq("actif", true),
    client
      .from("produits")
      .select("id", { count: "exact", head: true })
      .eq("etablissement_id", etablissementId),
    (() => {
      const now = new Date();
      const debutMois = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();
      return client
        .from("ventes")
        .select("id", { count: "exact", head: true })
        .eq("etablissement_id", etablissementId)
        .gte("created_at", debutMois);
    })(),
  ]);

  const nbUtilisateurs = utilisateurs.count ?? 0;
  const nbProduits = produits.count ?? 0;
  const nbVentesMois = ventesMois.count ?? 0;

  return {
    plan: abonnement.plan,
    utilisateurs: {
      actuel: nbUtilisateurs,
      max: abonnement.max_utilisateurs,
      pourcentage:
        abonnement.max_utilisateurs > 0
          ? Math.round((nbUtilisateurs / abonnement.max_utilisateurs) * 100)
          : 0,
    },
    produits: {
      actuel: nbProduits,
      max: abonnement.max_produits,
      pourcentage:
        abonnement.max_produits > 0
          ? Math.round((nbProduits / abonnement.max_produits) * 100)
          : 0,
    },
    ventes_mois: {
      actuel: nbVentesMois,
      max: abonnement.max_ventes_mois,
      pourcentage:
        abonnement.max_ventes_mois > 0
          ? Math.round((nbVentesMois / abonnement.max_ventes_mois) * 100)
          : 0,
    },
  };
}

/**
 * Historique des changements de plan (via audit_logs)
 */
export async function getAbonnementHistory(
  client: DbClient,
  etablissementId: string
): Promise<AbonnementHistoryEntry[]> {
  const { data, error } = await client
    .from("audit_logs")
    .select(
      "id, etablissement_id, utilisateur_id, description, ancienne_valeur, nouvelle_valeur, created_at"
    )
    .eq("etablissement_id", etablissementId)
    .eq("entite", "abonnement")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []).map((log) => {
    const ancienneValeur = log.ancienne_valeur
      ? JSON.parse(log.ancienne_valeur)
      : {};
    const nouvelleValeur = log.nouvelle_valeur
      ? JSON.parse(log.nouvelle_valeur)
      : {};

    return {
      id: log.id,
      etablissement_id: log.etablissement_id,
      ancien_plan: ancienneValeur.plan ?? "inconnu",
      nouveau_plan: nouvelleValeur.plan ?? "inconnu",
      modifie_par: log.utilisateur_id,
      created_at: log.created_at,
    };
  });
}

// ============================================================================
// QUERIES PAIEMENTS ABONNEMENT
// ============================================================================

/**
 * Recupere les paiements d'abonnement d'un etablissement, formates pour le frontend.
 * Retourne les champs necessaires pour mapper vers le type PaymentInfo.
 */
export async function getEtablissementPayments(
  client: DbClient,
  etablissementId: string,
  limit: number = 10
): Promise<{
  id: string;
  methode: string;
  montant: number;
  devise: string;
  statut: string;
  reference_externe: string | null;
  created_at: string;
  updated_at: string | null;
}[]> {
  const { data, error } = await client
    .from("paiements_abonnement")
    .select("id, methode, montant, devise, statut, reference_externe, created_at, updated_at")
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []) as {
    id: string;
    methode: string;
    montant: number;
    devise: string;
    statut: string;
    reference_externe: string | null;
    created_at: string;
    updated_at: string | null;
  }[];
}

/**
 * Liste les paiements d'abonnement d'un etablissement
 */
export async function getPaiementsAbonnement(
  client: DbClient,
  etablissementId: string,
  options?: { limit?: number; offset?: number }
): Promise<PaiementAbonnement[]> {
  let query = client
    .from("paiements_abonnement")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options?.limit ?? 20) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []) as PaiementAbonnement[];
}

/**
 * Cree un paiement d'abonnement
 */
export async function createPaiementAbonnement(
  client: DbClient,
  paiement: {
    etablissement_id: string;
    montant: number;
    methode: string;
    statut?: string;
    reference_externe?: string;
    provider_payload?: Record<string, unknown>;
    periode_debut: string;
    periode_fin: string;
  }
): Promise<PaiementAbonnement> {
  const { data, error } = await client
    .from("paiements_abonnement")
    .insert({
      etablissement_id: paiement.etablissement_id,
      montant: paiement.montant,
      devise: "XAF",
      methode: paiement.methode,
      statut: paiement.statut ?? "en_attente",
      reference_externe: paiement.reference_externe ?? null,
      provider_payload: paiement.provider_payload ?? null,
      periode_debut: paiement.periode_debut,
      periode_fin: paiement.periode_fin,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data as PaiementAbonnement;
}

/**
 * Met a jour le statut d'un paiement
 */
export async function updatePaiementStatut(
  client: DbClient,
  paiementId: string,
  statut: string,
  referenceExterne?: string
): Promise<PaiementAbonnement> {
  const updateData: Record<string, unknown> = { statut };
  if (referenceExterne) {
    updateData.reference_externe = referenceExterne;
  }

  const { data, error } = await client
    .from("paiements_abonnement")
    .update(updateData)
    .eq("id", paiementId)
    .select("*")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data as PaiementAbonnement;
}

// ============================================================================
// QUERIES FACTURES ABONNEMENT
// ============================================================================

/**
 * Liste les factures d'abonnement d'un etablissement
 */
export async function getFacturesAbonnement(
  client: DbClient,
  etablissementId: string,
  options?: {
    statut?: string;
    limit?: number;
    offset?: number;
  }
): Promise<FactureAbonnement[]> {
  let query = client
    .from("factures_abonnement")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false });

  if (options?.statut && options.statut !== "all") {
    query = query.eq("statut", options.statut);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options?.limit ?? 20) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []) as FactureAbonnement[];
}

/**
 * Cree une facture d'abonnement
 */
export async function createFactureAbonnement(
  client: DbClient,
  facture: {
    etablissement_id: string;
    numero: string;
    periode_debut: string;
    periode_fin: string;
    montant_ht: number;
    tva: number;
    montant_ttc: number;
    date_echeance: string;
    statut?: string;
  }
): Promise<FactureAbonnement> {
  const { data, error } = await client
    .from("factures_abonnement")
    .insert({
      etablissement_id: facture.etablissement_id,
      numero: facture.numero,
      periode_debut: facture.periode_debut,
      periode_fin: facture.periode_fin,
      montant_ht: facture.montant_ht,
      tva: facture.tva,
      montant_ttc: facture.montant_ttc,
      date_echeance: facture.date_echeance,
      statut: facture.statut ?? "brouillon",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data as FactureAbonnement;
}

/**
 * Met a jour le statut d'une facture
 */
export async function updateFactureStatut(
  client: DbClient,
  factureId: string,
  statut: string,
  datePaiement?: string
): Promise<FactureAbonnement> {
  const updateData: Record<string, unknown> = { statut };
  if (datePaiement) {
    updateData.date_paiement = datePaiement;
  }

  const { data, error } = await client
    .from("factures_abonnement")
    .update(updateData)
    .eq("id", factureId)
    .select("*")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data as FactureAbonnement;
}

/**
 * Genere le prochain numero de facture
 * Format: FAC-YYYY-NNNNN
 */
export async function getNextFactureNumber(
  client: DbClient
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;

  const { data, error } = await client
    .from("factures_abonnement")
    .select("numero")
    .like("numero", `${prefix}%`)
    .order("numero", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  if (!data || data.length === 0) {
    return `${prefix}00001`;
  }

  const lastNumero = data[0].numero as string;
  const lastSeq = parseInt(lastNumero.replace(prefix, ""), 10);
  const nextSeq = (lastSeq + 1).toString().padStart(5, "0");

  return `${prefix}${nextSeq}`;
}

/**
 * Cree une facture d'abonnement avec retry automatique en cas de conflit
 * sur le numero de facture (race condition entre webhooks concurrents).
 *
 * La contrainte UNIQUE idx_factures_abo_numero protege cote DB.
 * En cas de conflit (code 23505), on regenere le numero et retente.
 */
export async function createFactureAbonnementSafe(
  client: DbClient,
  facture: {
    etablissement_id: string;
    periode_debut: string;
    periode_fin: string;
    montant_ht: number;
    tva: number;
    montant_ttc: number;
    date_echeance: string;
    statut?: string;
  },
  maxRetries: number = 3
): Promise<FactureAbonnement> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const numero = await getNextFactureNumber(client);

    const { data, error } = await client
      .from("factures_abonnement")
      .insert({
        etablissement_id: facture.etablissement_id,
        numero,
        periode_debut: facture.periode_debut,
        periode_fin: facture.periode_fin,
        montant_ht: facture.montant_ht,
        tva: facture.tva,
        montant_ttc: facture.montant_ttc,
        date_echeance: facture.date_echeance,
        statut: facture.statut ?? "brouillon",
      })
      .select("*")
      .single();

    if (!error) {
      return data as FactureAbonnement;
    }

    // Code 23505 = unique_violation (PostgreSQL)
    const isUniqueViolation =
      error.code === "23505" || error.message?.includes("unique");

    if (!isUniqueViolation || attempt >= maxRetries - 1) {
      throw new Error(getErrorMessage(error));
    }

    console.warn(
      `[createFactureAbonnementSafe] Conflit numero ${numero}, tentative ${attempt + 2}/${maxRetries}`
    );
  }

  // Ne devrait jamais arriver grace au throw ci-dessus
  throw new Error("Impossible de creer la facture apres plusieurs tentatives");
}
