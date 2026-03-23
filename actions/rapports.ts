"use server";

/**
 * Server Actions pour le module de rapports et statistiques
 * Migré de Prisma vers Supabase - Version optimisée
 */

import { createAuthenticatedClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { ModePaiement, TypeVente } from "@/lib/db";
import { sanitizeSearchTerm } from "@/lib/utils/sanitize";

// ============================================================================
// TYPES
// ============================================================================

export type PeriodeType = "jour" | "semaine" | "mois" | "annee" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface KPIs {
  caJour: number;
  caSemaine: number;
  caMois: number;
  nombreVentes: number;
  panierMoyen: number;
  margeBrute: number | null;
  comparaisonJour: number | null;
  comparaisonSemaine: number | null;
  comparaisonMois: number | null;
}

export interface CAByPeriodItem {
  periode: string;
  label: string;
  ca: number;
  nombreVentes: number;
}

export interface TopProduct {
  id: string;
  nom: string;
  quantite: number;
  ca: number;
  categorieNom: string;
}

export interface PeakHourData {
  heure: number;
  label: string;
  nombreVentes: number;
  ca: number;
}

export interface PaymentModeData {
  mode: ModePaiement;
  label: string;
  montant: number;
  count: number;
  pourcentage: number;
}

export interface SalesByTypeData {
  type: TypeVente;
  label: string;
  count: number;
  montant: number;
  pourcentage: number;
}

export interface SalesByEmployeeData {
  id: string;
  nom: string;
  prenom: string | null;
  nombreVentes: number;
  ca: number;
  panierMoyen: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PAYMENT_MODE_LABELS: Record<string, string> = {
  ESPECES: "Especes",
  CARTE_BANCAIRE: "Carte bancaire",
  AIRTEL_MONEY: "Airtel Money",
  MOOV_MONEY: "Moov Money",
  CHEQUE: "Cheque",
  VIREMENT: "Virement",
  COMPTE_CLIENT: "Compte client",
  MIXTE: "Mixte",
};

const SALE_TYPE_LABELS: Record<string, string> = {
  DIRECT: "Vente directe",
  TABLE: "Service en salle",
  LIVRAISON: "Livraison",
  EMPORTER: "A emporter",
};

// ============================================================================
// HELPERS - Timezone Africa/Libreville (UTC+1, no DST)
// ============================================================================

const LIBREVILLE_OFFSET_HOURS = 1;
const LIBREVILLE_OFFSET_MS = LIBREVILLE_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Get the start of day in Africa/Libreville timezone, returned as a UTC Date.
 * Midnight in Libreville (UTC+1) = 23:00 previous day in UTC.
 */
function getStartOfDayLibreville(date: Date): Date {
  const lbv = new Date(date.getTime() + LIBREVILLE_OFFSET_MS);
  lbv.setUTCHours(0, 0, 0, 0);
  return new Date(lbv.getTime() - LIBREVILLE_OFFSET_MS);
}

/**
 * Get the end of day in Africa/Libreville timezone, returned as a UTC Date.
 */
function getEndOfDayLibreville(date: Date): Date {
  const lbv = new Date(date.getTime() + LIBREVILLE_OFFSET_MS);
  lbv.setUTCHours(23, 59, 59, 999);
  return new Date(lbv.getTime() - LIBREVILLE_OFFSET_MS);
}

/**
 * Get the hour (0-23) in Africa/Libreville for a given UTC date.
 */
function getLibrevilleHour(date: Date): number {
  return (date.getUTCHours() + LIBREVILLE_OFFSET_HOURS) % 24;
}

/**
 * Get the day of week in Africa/Libreville (0=Sun, 6=Sat).
 */
function getLibrevilleDayOfWeek(date: Date): number {
  return new Date(date.getTime() + LIBREVILLE_OFFSET_MS).getUTCDay();
}

/**
 * Get the date string (YYYY-MM-DD) in Africa/Libreville timezone.
 */
function getLibrevilleDateString(date: Date): string {
  const lbv = new Date(date.getTime() + LIBREVILLE_OFFSET_MS);
  return lbv.toISOString().split("T")[0];
}

function getDateRangeForPeriode(periode: PeriodeType, baseDate?: Date): DateRange {
  const now = baseDate || new Date();

  switch (periode) {
    case "jour":
      return { from: getStartOfDayLibreville(now), to: getEndOfDayLibreville(now) };
    case "semaine": {
      const dayOfWeek = getLibrevilleDayOfWeek(now);
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now.getTime() - diffToMonday * 24 * 60 * 60 * 1000);
      return { from: getStartOfDayLibreville(monday), to: getEndOfDayLibreville(now) };
    }
    case "mois": {
      const lbv = new Date(now.getTime() + LIBREVILLE_OFFSET_MS);
      const firstOfMonth = new Date(Date.UTC(lbv.getUTCFullYear(), lbv.getUTCMonth(), 1));
      const firstUtc = new Date(firstOfMonth.getTime() - LIBREVILLE_OFFSET_MS);
      return { from: getStartOfDayLibreville(firstUtc), to: getEndOfDayLibreville(now) };
    }
    case "annee": {
      const lbv = new Date(now.getTime() + LIBREVILLE_OFFSET_MS);
      const firstOfYear = new Date(Date.UTC(lbv.getUTCFullYear(), 0, 1));
      const firstUtc = new Date(firstOfYear.getTime() - LIBREVILLE_OFFSET_MS);
      return { from: getStartOfDayLibreville(firstUtc), to: getEndOfDayLibreville(now) };
    }
    default:
      return { from: getStartOfDayLibreville(now), to: getEndOfDayLibreville(now) };
  }
}

function getPreviousPeriodRange(periode: PeriodeType, baseDate?: Date): DateRange {
  const now = baseDate || new Date();
  const prev = new Date(now);

  switch (periode) {
    case "jour":
      prev.setDate(prev.getDate() - 1);
      break;
    case "semaine":
      prev.setDate(prev.getDate() - 7);
      break;
    case "mois":
      prev.setMonth(prev.getMonth() - 1);
      break;
    case "annee":
      prev.setFullYear(prev.getFullYear() - 1);
      break;
  }

  return getDateRangeForPeriode(periode, prev);
}

function calculateVariation(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function sumTotalFinal(items: Array<{ total_final: number }>): number {
  return items.reduce((sum, item) => sum + (item.total_final || 0), 0);
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Crée un client authentifié pour les actions rapports.
 * Lève une erreur si l'utilisateur n'est pas connecté ou n'a pas d'établissement.
 */
async function getAuthClient() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  if (!user.etablissementId) throw new Error("Aucun établissement associé");
  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });
  return { supabase, user: { ...user, etablissementId: user.etablissementId as string } };
}

/**
 * Récupère les KPIs principaux
 */
export async function getKPIs(): Promise<KPIs> {
  const { supabase } = await getAuthClient();
  const now = new Date();

  // Calculer toutes les plages de dates
  const ranges = {
    jour: getDateRangeForPeriode("jour", now),
    semaine: getDateRangeForPeriode("semaine", now),
    mois: getDateRangeForPeriode("mois", now),
    jourPrev: getPreviousPeriodRange("jour", now),
    semainePrev: getPreviousPeriodRange("semaine", now),
    moisPrev: getPreviousPeriodRange("mois", now),
  };

  // Fonction pour récupérer les ventes d'une période (simple)
  // RLS filtre automatiquement par etablissement_id
  const fetchVentesSimple = async (range: DateRange) => {
    const { data } = await supabase
      .from("ventes")
      .select("total_final")
      .eq("statut", "PAYEE")
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString());
    return (data || []) as Array<{ total_final: number }>;
  };

  // Fonction pour récupérer les ventes avec lignes (pour marge)
  const fetchVentesWithLignes = async (range: DateRange) => {
    const { data } = await supabase
      .from("ventes")
      .select("total_final, lignes_vente(quantite, prix_unitaire, produits(prix_achat))")
      .eq("statut", "PAYEE")
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString());
    return (data || []) as unknown as Array<{
      total_final: number;
      lignes_vente: Array<{
        quantite: number;
        prix_unitaire: number;
        produits: { prix_achat: number | null };
      }>;
    }>;
  };

  // Exécuter toutes les requêtes en parallèle
  const [ventesJour, ventesSemaine, ventesMois, ventesJourPrev, ventesSemainePrev, ventesMoisPrev] =
    await Promise.all([
      fetchVentesWithLignes(ranges.jour),
      fetchVentesSimple(ranges.semaine),
      fetchVentesSimple(ranges.mois),
      fetchVentesSimple(ranges.jourPrev),
      fetchVentesSimple(ranges.semainePrev),
      fetchVentesSimple(ranges.moisPrev),
    ]);

  // Calculs
  const caJour = sumTotalFinal(ventesJour);
  const caSemaine = sumTotalFinal(ventesSemaine);
  const caMois = sumTotalFinal(ventesMois);
  const caJourPrev = sumTotalFinal(ventesJourPrev);
  const caSemainePrev = sumTotalFinal(ventesSemainePrev);
  const caMoisPrev = sumTotalFinal(ventesMoisPrev);

  const nombreVentes = ventesJour.length;
  const panierMoyen = nombreVentes > 0 ? Math.round(caJour / nombreVentes) : 0;

  // Calcul de la marge brute (uniquement sur les lignes ayant un prix_achat)
  let margeBrute: number | null = null;
  let totalPrixAchat = 0;
  let totalPrixVente = 0;

  for (const vente of ventesJour) {
    const lignes =
      (
        vente as {
          lignes_vente?: Array<{
            quantite: number;
            prix_unitaire: string | number;
            produits: { prix_achat: string | number | null };
          }>;
        }
      ).lignes_vente || [];
    for (const ligne of lignes) {
      // Ne calculer la marge que sur les lignes ayant un prix_achat
      if (ligne.produits?.prix_achat != null && Number(ligne.produits.prix_achat) > 0) {
        const prixVente = Number(ligne.prix_unitaire) * ligne.quantite;
        totalPrixVente += prixVente;
        totalPrixAchat += Number(ligne.produits.prix_achat) * ligne.quantite;
      }
    }
  }

  if (totalPrixVente > 0) {
    margeBrute = Math.round(((totalPrixVente - totalPrixAchat) / totalPrixVente) * 100);
  }

  return {
    caJour,
    caSemaine,
    caMois,
    nombreVentes,
    panierMoyen,
    margeBrute,
    comparaisonJour: calculateVariation(caJour, caJourPrev),
    comparaisonSemaine: calculateVariation(caSemaine, caSemainePrev),
    comparaisonMois: calculateVariation(caMois, caMoisPrev),
  };
}

/**
 * Récupère le CA par période
 */
export async function getCAByPeriod(
  from: Date,
  to: Date,
  groupBy: "jour" | "semaine" | "mois"
): Promise<CAByPeriodItem[]> {
  const { supabase } = await getAuthClient();

  const { data: ventes } = await supabase
    .from("ventes")
    .select("total_final, created_at")
    .eq("statut", "PAYEE")
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .order("created_at", { ascending: true });

  if (!ventes?.length) return [];

  // Grouper les ventes
  const grouped: Record<string, { ca: number; count: number; date: Date }> = {};

  for (const vente of ventes) {
    const date = new Date(vente.created_at);
    const lbvDate = new Date(date.getTime() + LIBREVILLE_OFFSET_MS);
    let key: string;

    switch (groupBy) {
      case "jour":
        key = getLibrevilleDateString(date);
        break;
      case "semaine": {
        const dayOfWeek = lbvDate.getUTCDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(lbvDate.getTime() - diffToMonday * 24 * 60 * 60 * 1000);
        key = monday.toISOString().split("T")[0];
        break;
      }
      case "mois":
        key = `${lbvDate.getUTCFullYear()}-${String(lbvDate.getUTCMonth() + 1).padStart(2, "0")}`;
        break;
      default:
        key = getLibrevilleDateString(date);
    }

    if (!grouped[key]) grouped[key] = { ca: 0, count: 0, date };
    grouped[key].ca += Number(vente.total_final);
    grouped[key].count++;
  }

  // Convertir et trier
  return Object.entries(grouped)
    .map(([periode, data]) => ({
      periode,
      label:
        groupBy === "jour"
          ? data.date.toLocaleDateString("fr-GA", { day: "2-digit", month: "short" })
          : groupBy === "semaine"
            ? `Sem. ${data.date.toLocaleDateString("fr-GA", { day: "2-digit", month: "short" })}`
            : data.date.toLocaleDateString("fr-GA", { month: "short", year: "2-digit" }),
      ca: data.ca,
      nombreVentes: data.count,
    }))
    .sort((a, b) => a.periode.localeCompare(b.periode));
}

/**
 * Récupère les top produits
 */
export async function getTopProducts(
  periode: PeriodeType,
  limit: number = 10
): Promise<TopProduct[]> {
  const { supabase } = await getAuthClient();
  const dateRange = getDateRangeForPeriode(periode);

  const { data: lignes } = await supabase
    .from("lignes_vente")
    .select(
      `
      quantite, total,
      produits!inner(id, nom, categories(nom)),
      ventes!inner(statut, created_at)
    `
    )
    .eq("ventes.statut", "PAYEE")
    .gte("ventes.created_at", dateRange.from.toISOString())
    .lte("ventes.created_at", dateRange.to.toISOString());

  if (!lignes?.length) return [];

  // Agréger par produit
  const produits: Record<string, TopProduct> = {};

  for (const ligne of lignes) {
    const produit = ligne.produits as unknown as { id: string; nom: string; categories: { nom: string } };
    const id = produit.id;

    if (!produits[id]) {
      produits[id] = {
        id,
        nom: produit.nom,
        quantite: 0,
        ca: 0,
        categorieNom: produit.categories?.nom || "Sans catégorie",
      };
    }
    produits[id].quantite += ligne.quantite;
    produits[id].ca += Number(ligne.total);
  }

  return Object.values(produits)
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, limit);
}

/**
 * Récupère les heures de pointe
 */
export async function getPeakHours(date?: Date): Promise<PeakHourData[]> {
  const { supabase } = await getAuthClient();
  const dateRange = getDateRangeForPeriode("jour", date || new Date());

  const { data: ventes } = await supabase
    .from("ventes")
    .select("total_final, created_at")
    .eq("statut", "PAYEE")
    .gte("created_at", dateRange.from.toISOString())
    .lte("created_at", dateRange.to.toISOString());

  // Initialiser toutes les heures
  const heures: PeakHourData[] = Array.from({ length: 24 }, (_, h) => ({
    heure: h,
    label: `${String(h).padStart(2, "0")}h`,
    nombreVentes: 0,
    ca: 0,
  }));

  // Agréger par heure (Africa/Libreville = UTC+1)
  for (const vente of ventes || []) {
    const heure = getLibrevilleHour(new Date(vente.created_at));
    heures[heure].nombreVentes++;
    heures[heure].ca += Number(vente.total_final);
  }

  return heures;
}

/**
 * Récupère les ventes par mode de paiement
 */
export async function getSalesByPaymentMode(periode: PeriodeType): Promise<PaymentModeData[]> {
  const { supabase } = await getAuthClient();
  const dateRange = getDateRangeForPeriode(periode);

  const { data: paiements } = await supabase
    .from("paiements")
    .select(
      `
      mode_paiement, montant,
      ventes!inner(statut, created_at)
    `
    )
    .eq("ventes.statut", "PAYEE")
    .gte("ventes.created_at", dateRange.from.toISOString())
    .lte("ventes.created_at", dateRange.to.toISOString());

  if (!paiements?.length) return [];

  // Agréger par mode
  const modes: Record<string, { montant: number; count: number }> = {};
  let totalMontant = 0;

  for (const p of paiements) {
    const mode = p.mode_paiement;
    if (!modes[mode]) modes[mode] = { montant: 0, count: 0 };
    modes[mode].montant += Number(p.montant);
    modes[mode].count++;
    totalMontant += Number(p.montant);
  }

  return Object.entries(modes)
    .map(([mode, data]) => ({
      mode: mode as ModePaiement,
      label: PAYMENT_MODE_LABELS[mode] || mode,
      montant: data.montant,
      count: data.count,
      pourcentage: totalMontant > 0 ? Math.round((data.montant / totalMontant) * 100) : 0,
    }))
    .sort((a, b) => b.montant - a.montant);
}

/**
 * Récupère les ventes par type
 */
export async function getSalesByType(periode: PeriodeType): Promise<SalesByTypeData[]> {
  const { supabase } = await getAuthClient();
  const dateRange = getDateRangeForPeriode(periode);

  const { data: ventes } = await supabase
    .from("ventes")
    .select("type, total_final")
    .eq("statut", "PAYEE")
    .gte("created_at", dateRange.from.toISOString())
    .lte("created_at", dateRange.to.toISOString());

  if (!ventes?.length) return [];

  // Agréger par type
  const types: Record<string, { count: number; montant: number }> = {};
  let totalMontant = 0;

  for (const v of ventes) {
    if (!types[v.type]) types[v.type] = { count: 0, montant: 0 };
    types[v.type].count++;
    types[v.type].montant += Number(v.total_final);
    totalMontant += Number(v.total_final);
  }

  return Object.entries(types)
    .map(([type, data]) => ({
      type: type as TypeVente,
      label: SALE_TYPE_LABELS[type] || type,
      count: data.count,
      montant: data.montant,
      pourcentage: totalMontant > 0 ? Math.round((data.montant / totalMontant) * 100) : 0,
    }))
    .sort((a, b) => b.montant - a.montant);
}

/**
 * Récupère les ventes par employé
 */
export async function getSalesByEmployee(periode: PeriodeType): Promise<SalesByEmployeeData[]> {
  const { supabase } = await getAuthClient();
  const dateRange = getDateRangeForPeriode(periode);

  const { data: ventes } = await supabase
    .from("ventes")
    .select("total_final, utilisateurs(id, nom, prenom)")
    .eq("statut", "PAYEE")
    .gte("created_at", dateRange.from.toISOString())
    .lte("created_at", dateRange.to.toISOString());

  if (!ventes?.length) return [];

  // Agréger par employé
  const employes: Record<
    string,
    { id: string; nom: string; prenom: string | null; count: number; ca: number }
  > = {};

  for (const v of ventes) {
    const user = v.utilisateurs as unknown as { id: string; nom: string; prenom: string | null };
    if (!user) continue;

    if (!employes[user.id]) {
      employes[user.id] = { id: user.id, nom: user.nom, prenom: user.prenom, count: 0, ca: 0 };
    }
    employes[user.id].count++;
    employes[user.id].ca += Number(v.total_final);
  }

  return Object.values(employes)
    .map((e) => ({
      id: e.id,
      nom: e.nom,
      prenom: e.prenom,
      nombreVentes: e.count,
      ca: e.ca,
      panierMoyen: e.count > 0 ? Math.round(e.ca / e.count) : 0,
    }))
    .sort((a, b) => b.ca - a.ca);
}

/**
 * Récupère les sessions clôturées pour le rapport Z
 */
export async function getClosedSessions(limit: number = 10) {
  const { supabase } = await getAuthClient();

  const { data: sessions } = await supabase
    .from("sessions_caisse")
    .select(
      `
      id, date_ouverture, date_cloture, fond_caisse,
      total_ventes, total_especes, total_cartes, total_mobile_money,
      nombre_ventes, nombre_annulations, especes_comptees, ecart, notes_cloture,
      utilisateurs(nom, prenom)
    `
    )
    .not("date_cloture", "is", null)
    .order("date_cloture", { ascending: false })
    .limit(limit);

  return (sessions || []).map((s) => ({
    id: s.id,
    dateOuverture: s.date_ouverture,
    dateCloture: s.date_cloture!,
    fondCaisse: Number(s.fond_caisse),
    totalVentes: Number(s.total_ventes),
    totalEspeces: Number(s.total_especes),
    totalCartes: Number(s.total_cartes),
    totalMobileMoney: Number(s.total_mobile_money),
    nombreVentes: s.nombre_ventes,
    nombreAnnulations: s.nombre_annulations,
    especesComptees: s.especes_comptees ? Number(s.especes_comptees) : null,
    ecart: s.ecart ? Number(s.ecart) : null,
    notesCloture: s.notes_cloture,
    utilisateur: s.utilisateurs as unknown as { nom: string; prenom: string | null },
  }));
}

// ============================================================================
// HISTORIQUE DES FACTURES
// ============================================================================

export interface FactureHistorique {
  id: string;
  numeroTicket: string;
  type: TypeVente;
  statut: "EN_COURS" | "PAYEE" | "ANNULEE";
  sousTotal: number;
  totalTva: number;
  totalRemise: number;
  totalFinal: number;
  typeRemise: string | null;
  valeurRemise: number | null;
  createdAt: string;
  client: { id: string; nom: string; prenom: string | null } | null;
  utilisateur: { nom: string; prenom: string | null } | null;
  table: { numero: number; zones: { nom: string } | null } | null;
}

export interface FactureDetail extends FactureHistorique {
  lignes: {
    id: string;
    quantite: number;
    prixUnitaire: number;
    tauxTva: number;
    montantTva: number;
    sousTotal: number;
    total: number;
    notes: string | null;
    produit: { nom: string } | null;
    supplements: { nom: string; prix: number }[];
  }[];
  paiements: {
    id: string;
    modePaiement: ModePaiement;
    montant: number;
    reference: string | null;
    montantRecu: number | null;
    monnaieRendue: number | null;
  }[];
  adresseLivraison: string | null;
  notes: string | null;
}

export interface HistoriqueFacturesFilters {
  dateDebut?: string;
  dateFin?: string;
  type?: TypeVente;
  statut?: "EN_COURS" | "PAYEE" | "ANNULEE";
  numeroTicket?: string;
  clientId?: string;
}

export interface HistoriqueFacturesResult {
  factures: FactureHistorique[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Recupere l'historique des factures avec pagination et filtres
 */
export async function getHistoriqueFactures(
  filters: HistoriqueFacturesFilters = {},
  page: number = 1,
  pageSize: number = 20
): Promise<HistoriqueFacturesResult> {
  const { supabase } = await getAuthClient();

  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("ventes")
    .select(
      `
      id, numero_ticket, type, statut,
      sous_total, total_tva, total_remise, total_final,
      type_remise, valeur_remise, created_at,
      clients(id, nom, prenom),
      utilisateurs(nom, prenom),
      tables(numero, zones(nom))
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  // Appliquer les filtres
  if (filters.dateDebut) {
    query = query.gte("created_at", filters.dateDebut);
  }

  if (filters.dateFin) {
    // Ajouter 1 jour pour inclure toute la journee de fin
    const dateFin = new Date(filters.dateFin);
    dateFin.setDate(dateFin.getDate() + 1);
    query = query.lt("created_at", dateFin.toISOString());
  }

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.statut) {
    query = query.eq("statut", filters.statut);
  }

  if (filters.numeroTicket) {
    const cleanTicket = sanitizeSearchTerm(filters.numeroTicket);
    if (cleanTicket) {
      query = query.ilike("numero_ticket", `%${cleanTicket}%`);
    }
  }

  if (filters.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  // Pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Erreur getHistoriqueFactures:", error);
    throw new Error("Erreur lors de la recuperation des factures");
  }

  const factures: FactureHistorique[] = (data || []).map((v) => ({
    id: v.id,
    numeroTicket: v.numero_ticket,
    type: v.type as TypeVente,
    statut: v.statut as "EN_COURS" | "PAYEE" | "ANNULEE",
    sousTotal: Number(v.sous_total),
    totalTva: Number(v.total_tva),
    totalRemise: Number(v.total_remise),
    totalFinal: Number(v.total_final),
    typeRemise: v.type_remise,
    valeurRemise: v.valeur_remise ? Number(v.valeur_remise) : null,
    createdAt: v.created_at,
    client: v.clients as unknown as { id: string; nom: string; prenom: string | null } | null,
    utilisateur: v.utilisateurs as unknown as { nom: string; prenom: string | null } | null,
    table: v.tables as unknown as { numero: number; zones: { nom: string } | null } | null,
  }));

  const total = count ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    factures,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Recupere le detail complet d'une facture
 */
// ============================================================================
// RAPPORT Z - TYPES ET ACTION
// ============================================================================

export interface RapportZComplet {
  etablissement: {
    nom: string;
    adresse: string | null;
    telephone: string | null;
    email: string | null;
    nif: string | null;
    rccm: string | null;
  };
  session: {
    id: string;
    dateOuverture: string;
    dateCloture: string;
    caissierNom: string;
  };
  ventes: {
    totalVentes: number;
    nombreVentes: number;
    nombreAnnulations: number;
    articlesVendus: number;
    panierMoyen: number;
  };
  paiements: {
    especes: number;
    cartes: number;
    mobileMoney: number;
    cheques: number;
    virements: number;
    compteClient: number;
    autres: number;
    total: number;
  };
  tva: {
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
  };
  caisse: {
    fondCaisse: number;
    especesAttendues: number;
    especesComptees: number;
    ecart: number;
  };
  ventesParType: Record<string, { count: number; total: number }>;
  topProduits: Array<{ nom: string; quantite: number; total: number }>;
  notesCloture: string | null;
}

/**
 * Genere un Rapport Z complet pour une session de caisse cloturee
 * Collecte toutes les donnees necessaires: ventes, paiements, TVA, ecarts
 */
export async function genererRapportZAction(
  sessionId: string
): Promise<{ success: boolean; data?: RapportZComplet; error?: string }> {
  try {
    const { supabase, user } = await getAuthClient();

    // 1. Recuperer la session avec l'utilisateur
    // RLS filtre automatiquement par etablissement_id
    const { data: session, error: sessionError } = await supabase
      .from("sessions_caisse")
      .select("*, utilisateurs(nom, prenom)")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return { success: false, error: "Session introuvable" };
    }

    if (!session.date_cloture) {
      return { success: false, error: "Cette session n'est pas encore cloturee" };
    }

    // 2. Recuperer l'etablissement
    // RLS filtre par etablissement_id, on utilise user.etablissementId pour la requête single
    const { data: etab } = await supabase
      .from("etablissements")
      .select("nom, adresse, telephone, email, nif, rccm")
      .eq("id", user.etablissementId)
      .single();

    // 3. Recuperer toutes les ventes de cette session avec detail
    const { data: ventes } = await supabase
      .from("ventes")
      .select(
        `
        statut, type, total_final, sous_total, total_tva,
        paiements(mode_paiement, montant),
        lignes_vente(quantite, total, produit_id, produits(nom))
      `
      )
      .eq("session_caisse_id", sessionId);

    const allVentes = (ventes || []) as unknown as Array<{
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

    const ventesPayees = allVentes.filter((v) => v.statut === "PAYEE");
    const ventesAnnulees = allVentes.filter((v) => v.statut === "ANNULEE");

    // 4. Calculer les totaux
    let totalVentes = 0;
    let totalHT = 0;
    let totalTVA = 0;
    let articlesVendus = 0;

    // Paiements detailles
    let especes = 0;
    let cartes = 0;
    let mobileMoney = 0;
    let cheques = 0;
    let virements = 0;
    let compteClient = 0;
    let autres = 0;

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

      // Ventilation par type
      if (ventesParType[v.type]) {
        ventesParType[v.type].count++;
        ventesParType[v.type].total += total;
      }

      // Ventilation des paiements detaillee
      for (const p of v.paiements) {
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
          case "CHEQUE":
            cheques += montant;
            break;
          case "VIREMENT":
            virements += montant;
            break;
          case "COMPTE_CLIENT":
            compteClient += montant;
            break;
          default:
            autres += montant;
        }
      }

      // Articles et top produits
      for (const l of v.lignes_vente) {
        articlesVendus += l.quantite;
        const pid = l.produit_id;
        if (!produitsVendus[pid]) {
          produitsVendus[pid] = {
            nom: l.produits?.nom || "Inconnu",
            quantite: 0,
            total: 0,
          };
        }
        produitsVendus[pid].quantite += l.quantite;
        produitsVendus[pid].total += Number(l.total);
      }
    }

    // 5. Calculs caisse
    const fondCaisse = Number(session.fond_caisse);
    const especesComptees = session.especes_comptees ? Number(session.especes_comptees) : 0;
    const especesAttendues = fondCaisse + especes;
    const ecart = session.ecart ? Number(session.ecart) : especesComptees - especesAttendues;

    // 6. Caissier
    const utilisateur = session.utilisateurs as {
      nom: string;
      prenom: string | null;
    };
    const caissierNom = utilisateur
      ? `${utilisateur.prenom || ""} ${utilisateur.nom}`.trim()
      : "Inconnu";

    const totalPaiements =
      especes + cartes + mobileMoney + cheques + virements + compteClient + autres;

    const rapportZ: RapportZComplet = {
      etablissement: {
        nom: etab?.nom || "Établissement",
        adresse: etab?.adresse || null,
        telephone: etab?.telephone || null,
        email: etab?.email || null,
        nif: etab?.nif || null,
        rccm: etab?.rccm || null,
      },
      session: {
        id: session.id,
        dateOuverture: session.date_ouverture,
        dateCloture: session.date_cloture!,
        caissierNom,
      },
      ventes: {
        totalVentes,
        nombreVentes: ventesPayees.length,
        nombreAnnulations: ventesAnnulees.length,
        articlesVendus,
        panierMoyen: ventesPayees.length > 0 ? Math.round(totalVentes / ventesPayees.length) : 0,
      },
      paiements: {
        especes,
        cartes,
        mobileMoney,
        cheques,
        virements,
        compteClient,
        autres,
        total: totalPaiements,
      },
      tva: {
        totalHT,
        totalTVA,
        totalTTC: totalVentes,
      },
      caisse: {
        fondCaisse,
        especesAttendues,
        especesComptees,
        ecart,
      },
      ventesParType,
      topProduits: Object.values(produitsVendus)
        .sort((a, b) => b.quantite - a.quantite)
        .slice(0, 10),
      notesCloture: session.notes_cloture || null,
    };

    return { success: true, data: rapportZ };
  } catch (error) {
    console.error("[genererRapportZAction] Erreur:", error);
    return {
      success: false,
      error: "Impossible de generer le rapport Z",
    };
  }
}

// ============================================================================
// HISTORIQUE DES FACTURES
// ============================================================================

export async function getFactureDetail(venteId: string): Promise<FactureDetail | null> {
  const { supabase } = await getAuthClient();

  // RLS filtre automatiquement par etablissement_id
  const { data, error } = await supabase
    .from("ventes")
    .select(
      `
      id, numero_ticket, type, statut,
      sous_total, total_tva, total_remise, total_final,
      type_remise, valeur_remise, created_at,
      adresse_livraison, notes,
      clients(id, nom, prenom),
      utilisateurs(nom, prenom),
      tables(numero, zones(nom)),
      lignes_vente(
        id, quantite, prix_unitaire, taux_tva, montant_tva, sous_total, total, notes,
        produits(nom),
        lignes_vente_supplements(nom, prix)
      ),
      paiements(id, mode_paiement, montant, reference, montant_recu, monnaie_rendue)
    `
    )
    .eq("id", venteId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Erreur getFactureDetail:", error);
    throw new Error("Erreur lors de la recuperation de la facture");
  }

  if (!data) return null;

  return {
    id: data.id,
    numeroTicket: data.numero_ticket,
    type: data.type as TypeVente,
    statut: data.statut as "EN_COURS" | "PAYEE" | "ANNULEE",
    sousTotal: Number(data.sous_total),
    totalTva: Number(data.total_tva),
    totalRemise: Number(data.total_remise),
    totalFinal: Number(data.total_final),
    typeRemise: data.type_remise,
    valeurRemise: data.valeur_remise ? Number(data.valeur_remise) : null,
    createdAt: data.created_at,
    adresseLivraison: data.adresse_livraison,
    notes: data.notes,
    client: data.clients as unknown as { id: string; nom: string; prenom: string | null } | null,
    utilisateur: data.utilisateurs as unknown as { nom: string; prenom: string | null } | null,
    table: data.tables as unknown as { numero: number; zones: { nom: string } | null } | null,
    lignes: (data.lignes_vente || []).map((l: Record<string, unknown>) => ({
      id: l.id as string,
      quantite: l.quantite as number,
      prixUnitaire: Number(l.prix_unitaire),
      tauxTva: Number(l.taux_tva),
      montantTva: Number(l.montant_tva),
      sousTotal: Number(l.sous_total),
      total: Number(l.total),
      notes: l.notes as string | null,
      produit: l.produits as { nom: string } | null,
      supplements: ((l.lignes_vente_supplements as Array<{ nom: string; prix: number }>) || []).map(
        (s) => ({
          nom: s.nom,
          prix: Number(s.prix),
        })
      ),
    })),
    paiements: (data.paiements || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      modePaiement: p.mode_paiement as ModePaiement,
      montant: Number(p.montant),
      reference: p.reference as string | null,
      montantRecu: p.montant_recu ? Number(p.montant_recu) : null,
      monnaieRendue: p.monnaie_rendue ? Number(p.monnaie_rendue) : null,
    })),
  };
}
