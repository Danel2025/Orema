/**
 * Requetes Supabase pour les statistiques billing admin (SUPER_ADMIN)
 *
 * Agrege les donnees d'abonnements, paiements et quotas pour le dashboard billing.
 * Importe la configuration des plans depuis lib/config/plans.ts (source de verite).
 */

import type { DbClient } from "../client";
import { getErrorMessage } from "../utils";
import {
  type PlanSlug,
  type BillingCycle,
  getPlanMonthlyPrice,
  PLAN_LABELS,
  PLANS,
  resolvePlanSlug,
} from "@/lib/config/plans";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

// ============================================================================
// TYPES
// ============================================================================

export interface BillingOverview {
  mrr: number;
  arr: number;
  totalAbonnesPayants: number;
  totalEtablissements: number;
  totalEssaisActifs: number;
  tauxConversion: number;
  churnRate: number;
  mrrVariation: number;
}

export interface PlanDistribution {
  plan: string;
  label: string;
  count: number;
  pourcentage: number;
  revenuMensuel: number;
}

export interface RevenueMonth {
  mois: string;
  label: string;
  revenus: number;
  nbPaiements: number;
}

export interface RecentPayment {
  id: string;
  etablissementId: string;
  etablissementNom: string;
  plan: string;
  montant: number;
  methode: string;
  statut: string;
  date: string;
}

export interface ExpiringTrial {
  etablissementId: string;
  nom: string;
  plan: string;
  dateExpiration: string;
  joursRestants: number;
}

export interface FailedPayment {
  id: string;
  etablissementId: string;
  etablissementNom: string;
  montant: number;
  methode: string;
  dateEchec: string;
}

export interface QuotaAlert {
  etablissementId: string;
  nom: string;
  quotaType: string;
  utilisation: number;
  max: number;
  pourcentage: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function getMonthBoundsForDate(date: Date): { start: string; end: string } {
  return {
    start: startOfMonth(date).toISOString(),
    end: endOfMonth(date).toISOString(),
  };
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Vue d'ensemble billing : MRR, ARR, conversions, churn
 */
export async function getBillingOverview(
  client: DbClient
): Promise<BillingOverview> {
  const now = new Date();
  const currentMonth = getMonthBoundsForDate(now);
  const previousMonth = getMonthBoundsForDate(subMonths(now, 1));

  // Recuperer tous les abonnements
  const { data: abonnements, error: aboError } = await client
    .from("abonnements")
    .select("plan, statut, billing_cycle, prix_mensuel, date_essai_fin");

  if (aboError) {
    throw new Error(getErrorMessage(aboError));
  }

  // Recuperer tous les etablissements
  const { count: totalEtablissements, error: etabError } = await client
    .from("etablissements")
    .select("id", { count: "exact", head: true });

  if (etabError) {
    throw new Error(getErrorMessage(etabError));
  }

  const rows = abonnements ?? [];

  // Compter les abonnements actifs payants
  const actifs = rows.filter((a) => a.statut === "actif");
  const essais = rows.filter((a) => a.statut === "en_essai");

  // Calculer le MRR a partir des abonnements actifs
  // prix_mensuel est deja le prix mensuel equivalent, pas besoin de diviser par 12
  let mrr = 0;
  for (const abo of actifs) {
    const planSlug = resolvePlanSlug(abo.plan ?? "essentiel");
    const cycle = (abo.billing_cycle ?? "mensuel") as BillingCycle;
    const prixMensuel =
      abo.prix_mensuel > 0
        ? abo.prix_mensuel
        : getPlanMonthlyPrice(planSlug, cycle);
    mrr += prixMensuel;
  }

  // Taux de conversion : payants / (payants + essais)
  const totalPayantsEtEssais = actifs.length + essais.length;
  const tauxConversion =
    totalPayantsEtEssais > 0
      ? Math.round((actifs.length / totalPayantsEtEssais) * 100)
      : 0;

  // Churn : abonnements annules ce mois
  const { count: annulesCeMois, error: churnError } = await client
    .from("abonnements")
    .select("id", { count: "exact", head: true })
    .eq("statut", "annule")
    .gte("updated_at", currentMonth.start)
    .lte("updated_at", currentMonth.end);

  if (churnError) {
    throw new Error(getErrorMessage(churnError));
  }

  // Actifs au debut du mois (actifs + annules ce mois)
  const actifsDebutMois = actifs.length + (annulesCeMois ?? 0);
  const churnRate =
    actifsDebutMois > 0
      ? Math.round(((annulesCeMois ?? 0) / actifsDebutMois) * 100)
      : 0;

  // Variation MRR : comparer avec le mois precedent
  // On calcule le MRR du mois precedent via les paiements
  const { data: paiementsMoisPrec, error: prevError } = await client
    .from("paiements_abonnement")
    .select("montant")
    .eq("statut", "reussi")
    .gte("created_at", previousMonth.start)
    .lte("created_at", previousMonth.end);

  if (prevError) {
    throw new Error(getErrorMessage(prevError));
  }

  const revenuMoisPrec = (paiementsMoisPrec ?? []).reduce(
    (sum, p) => sum + (p.montant ?? 0),
    0
  );
  const mrrPrecedent =
    revenuMoisPrec > 0 ? revenuMoisPrec : mrr; // Fallback si pas de donnees precedentes
  const mrrVariation =
    mrrPrecedent > 0 ? Math.round(((mrr - mrrPrecedent) / mrrPrecedent) * 100) : 0;

  return {
    mrr,
    arr: mrr * 12,
    totalAbonnesPayants: actifs.length,
    totalEtablissements: totalEtablissements ?? 0,
    totalEssaisActifs: essais.length,
    tauxConversion,
    churnRate,
    mrrVariation,
  };
}

/**
 * Distribution des etablissements par plan
 */
export async function getPlanDistribution(
  client: DbClient
): Promise<PlanDistribution[]> {
  const { data: etablissements, error } = await client
    .from("etablissements")
    .select("plan, billing_cycle");

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const rows = etablissements ?? [];
  const total = rows.length;

  // Grouper par plan
  const planCounts: Record<string, { count: number; rows: typeof rows }> = {};
  for (const etab of rows) {
    const plan = etab.plan ?? "essentiel";
    if (!planCounts[plan]) {
      planCounts[plan] = { count: 0, rows: [] };
    }
    planCounts[plan].count++;
    planCounts[plan].rows.push(etab);
  }

  // Construire la distribution
  const distribution: PlanDistribution[] = [];
  for (const [plan, data] of Object.entries(planCounts)) {
    const planSlug = resolvePlanSlug(plan);

    // Calculer le revenu mensuel pour ce plan
    let revenuMensuel = 0;
    for (const etab of data.rows) {
      const cycle = (etab.billing_cycle ?? "mensuel") as BillingCycle;
      revenuMensuel += getPlanMonthlyPrice(planSlug, cycle);
    }

    distribution.push({
      plan,
      label: PLAN_LABELS[planSlug] ?? plan,
      count: data.count,
      pourcentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
      revenuMensuel,
    });
  }

  // Trier par ordre d'affichage du plan
  distribution.sort((a, b) => {
    const orderA = PLANS[resolvePlanSlug(a.plan)]?.metadata.ordre_affichage ?? 99;
    const orderB = PLANS[resolvePlanSlug(b.plan)]?.metadata.ordre_affichage ?? 99;
    return orderA - orderB;
  });

  return distribution;
}

/**
 * Historique des revenus par mois (paiements d'abonnement reussis)
 */
export async function getRevenueHistory(
  client: DbClient,
  nbMois: number = 12
): Promise<RevenueMonth[]> {
  const now = new Date();
  const startDate = startOfMonth(subMonths(now, nbMois - 1));

  const { data: paiements, error } = await client
    .from("paiements_abonnement")
    .select("montant, created_at")
    .eq("statut", "reussi")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  // Creer un map pour tous les mois (meme ceux sans paiement)
  const monthsMap: Record<string, { revenus: number; nbPaiements: number }> = {};
  for (let i = 0; i < nbMois; i++) {
    const monthDate = subMonths(now, nbMois - 1 - i);
    const key = format(monthDate, "yyyy-MM");
    monthsMap[key] = { revenus: 0, nbPaiements: 0 };
  }

  // Agreger les paiements par mois
  for (const p of paiements ?? []) {
    const key = p.created_at.slice(0, 7); // "2026-03"
    if (monthsMap[key]) {
      monthsMap[key].revenus += p.montant ?? 0;
      monthsMap[key].nbPaiements++;
    }
  }

  // Convertir en tableau
  return Object.entries(monthsMap).map(([mois, data]) => {
    const date = new Date(mois + "-01");
    return {
      mois,
      label: format(date, "MMM", { locale: fr }),
      revenus: data.revenus,
      nbPaiements: data.nbPaiements,
    };
  });
}

/**
 * Paiements recents avec nom de l'etablissement
 */
export async function getRecentPayments(
  client: DbClient,
  limit: number = 20
): Promise<RecentPayment[]> {
  const { data, error } = await client
    .from("paiements_abonnement")
    .select("id, etablissement_id, montant, methode, statut, created_at, etablissements(nom, plan)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []).map((row) => {
    const etab = row.etablissements as unknown as { nom: string; plan: string } | null;
    return {
      id: row.id,
      etablissementId: row.etablissement_id,
      etablissementNom: etab?.nom ?? "Inconnu",
      plan: etab?.plan ?? "essentiel",
      montant: row.montant ?? 0,
      methode: row.methode,
      statut: row.statut,
      date: row.created_at,
    };
  });
}

/**
 * Essais expirant dans les prochains jours
 */
export async function getExpiringTrials(
  client: DbClient,
  joursAvant: number = 7
): Promise<ExpiringTrial[]> {
  const now = new Date();
  const limitDate = new Date(now);
  limitDate.setDate(limitDate.getDate() + joursAvant);

  const { data, error } = await client
    .from("abonnements")
    .select("etablissement_id, plan, date_essai_fin, etablissements(nom)")
    .eq("statut", "en_essai")
    .not("date_essai_fin", "is", null)
    .lte("date_essai_fin", limitDate.toISOString())
    .gte("date_essai_fin", now.toISOString())
    .order("date_essai_fin", { ascending: true });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []).map((row) => {
    const etab = row.etablissements as unknown as { nom: string } | null;
    const dateExp = new Date(row.date_essai_fin!);
    const diffMs = dateExp.getTime() - now.getTime();
    const joursRestants = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      etablissementId: row.etablissement_id,
      nom: etab?.nom ?? "Inconnu",
      plan: row.plan ?? "essentiel",
      dateExpiration: row.date_essai_fin!,
      joursRestants,
    };
  });
}

/**
 * Paiements echoues recents
 */
export async function getFailedPayments(
  client: DbClient,
  limit: number = 10
): Promise<FailedPayment[]> {
  const { data, error } = await client
    .from("paiements_abonnement")
    .select("id, etablissement_id, montant, methode, created_at, etablissements(nom)")
    .eq("statut", "echoue")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []).map((row) => {
    const etab = row.etablissements as unknown as { nom: string } | null;
    return {
      id: row.id,
      etablissementId: row.etablissement_id,
      etablissementNom: etab?.nom ?? "Inconnu",
      montant: row.montant ?? 0,
      methode: row.methode,
      dateEchec: row.created_at,
    };
  });
}

/**
 * Alertes de quotas (etablissements proches de leurs limites)
 *
 * Utilise 3 requetes groupees (GROUP BY) au lieu de 3 requetes par etablissement
 * pour eviter le probleme N+1.
 */
export async function getQuotaAlerts(
  client: DbClient,
  seuilPourcent: number = 80
): Promise<QuotaAlert[]> {
  // Recuperer tous les etablissements avec leurs limites
  const { data: etablissements, error: etabError } = await client
    .from("etablissements")
    .select("id, nom, max_utilisateurs, max_produits, max_ventes_mois");

  if (etabError) {
    throw new Error(getErrorMessage(etabError));
  }

  const etabs = etablissements ?? [];
  if (etabs.length === 0) return [];

  const debutMois = startOfMonth(new Date()).toISOString();

  // 3 requetes globales avec GROUP BY au lieu de 3N requetes
  const [usersResult, produitsResult, ventesResult] = await Promise.all([
    client.rpc("count_by_etablissement" as never, {
      table_name: "utilisateurs",
      filter_actif: true,
    }).then(
      (res) => res,
      // Fallback si la RPC n'existe pas : requete directe sans GROUP BY
      // On utilise une requete simple qui retourne tous les utilisateurs actifs
      () => null
    ),
    client.rpc("count_by_etablissement" as never, {
      table_name: "produits",
      filter_actif: false,
    }).then(
      (res) => res,
      () => null
    ),
    client.rpc("count_by_etablissement_since" as never, {
      table_name: "ventes",
      since_date: debutMois,
    }).then(
      (res) => res,
      () => null
    ),
  ]);

  // Construire les maps de comptage
  // Si les RPCs ne sont pas disponibles, fallback sur des requetes individuelles groupees
  let userCounts: Map<string, number>;
  let produitCounts: Map<string, number>;
  let venteCounts: Map<string, number>;

  if (usersResult?.data && produitsResult?.data && ventesResult?.data) {
    // RPC disponibles - utiliser les resultats groupes
    userCounts = new Map(
      (usersResult.data as Array<{ etablissement_id: string; count: number }>).map(
        (r) => [r.etablissement_id, r.count]
      )
    );
    produitCounts = new Map(
      (produitsResult.data as Array<{ etablissement_id: string; count: number }>).map(
        (r) => [r.etablissement_id, r.count]
      )
    );
    venteCounts = new Map(
      (ventesResult.data as Array<{ etablissement_id: string; count: number }>).map(
        (r) => [r.etablissement_id, r.count]
      )
    );
  } else {
    // Fallback : 3 requetes non-groupees et aggreger en memoire
    const [allUsers, allProduits, allVentes] = await Promise.all([
      client
        .from("utilisateurs")
        .select("etablissement_id")
        .eq("actif", true),
      client
        .from("produits")
        .select("etablissement_id"),
      client
        .from("ventes")
        .select("etablissement_id")
        .gte("created_at", debutMois),
    ]);

    userCounts = new Map<string, number>();
    for (const row of allUsers.data ?? []) {
      const id = row.etablissement_id as string;
      userCounts.set(id, (userCounts.get(id) ?? 0) + 1);
    }

    produitCounts = new Map<string, number>();
    for (const row of allProduits.data ?? []) {
      const id = row.etablissement_id as string;
      produitCounts.set(id, (produitCounts.get(id) ?? 0) + 1);
    }

    venteCounts = new Map<string, number>();
    for (const row of allVentes.data ?? []) {
      const id = row.etablissement_id as string;
      venteCounts.set(id, (venteCounts.get(id) ?? 0) + 1);
    }
  }

  // Comparer avec les max de chaque etablissement
  const alerts: QuotaAlert[] = [];

  for (const etab of etabs) {
    const etabId = etab.id as string;
    const nom = etab.nom as string;
    const maxUtilisateurs = (etab.max_utilisateurs as number) ?? 0;
    const maxProduits = (etab.max_produits as number) ?? 0;
    const maxVentesMois = (etab.max_ventes_mois as number) ?? 0;

    const checks = [
      { type: "utilisateurs", actuel: userCounts.get(etabId) ?? 0, max: maxUtilisateurs },
      { type: "produits", actuel: produitCounts.get(etabId) ?? 0, max: maxProduits },
      { type: "ventes", actuel: venteCounts.get(etabId) ?? 0, max: maxVentesMois },
    ];

    for (const check of checks) {
      if (check.max <= 0) continue;
      const pourcentage = Math.round((check.actuel / check.max) * 100);
      if (pourcentage >= seuilPourcent) {
        alerts.push({
          etablissementId: etabId,
          nom,
          quotaType: check.type,
          utilisation: check.actuel,
          max: check.max,
          pourcentage,
        });
      }
    }
  }

  // Trier par pourcentage decroissant
  alerts.sort((a, b) => b.pourcentage - a.pourcentage);

  return alerts;
}
