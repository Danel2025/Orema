/**
 * Utilitaires pour les opérations de base de données
 * Gestion des décimaux, pagination, et helpers
 */

import type { PaginationOptions, PaginatedResult, SortOptions } from "./types";

/**
 * Convertit une valeur décimale (string ou number) en number
 * Supabase retourne les DECIMAL comme strings
 */
export function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Convertit un number en string pour les montants FCFA (sans décimales)
 */
export function toDecimal(value: number): number {
  return Math.round(value);
}

/**
 * Sérialise les champs de prix d'un objet
 * Convertit les strings en numbers pour les champs spécifiés
 */
export function serializePrices<T extends Record<string, unknown>>(
  row: T,
  priceFields: (keyof T)[]
): T {
  const result = { ...row };
  for (const field of priceFields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = parseDecimal(result[field] as string | number) as T[typeof field];
    }
  }
  return result;
}

/**
 * Sérialise les prix pour un tableau d'objets
 */
export function serializePricesArray<T extends Record<string, unknown>>(
  rows: T[],
  priceFields: (keyof T)[]
): T[] {
  return rows.map((row) => serializePrices(row, priceFields));
}

/**
 * Champs de prix par table
 */
export const PRICE_FIELDS = {
  produits: ["prix_vente", "prix_achat", "stock_actuel", "stock_min", "stock_max"] as const,
  clients: ["solde_prepaye", "solde_credit", "limit_credit", "points_fidelite"] as const,
  ventes: [
    "sous_total",
    "total_tva",
    "total_remise",
    "total_final",
    "frais_livraison",
    "valeur_remise",
  ] as const,
  lignes_vente: [
    "prix_unitaire",
    "quantite",
    "sous_total",
    "montant_tva",
    "total",
    "taux_tva",
  ] as const,
  paiements: ["montant", "montant_recu", "monnaie_rendue"] as const,
  sessions_caisse: [
    "fond_caisse",
    "total_ventes",
    "total_especes",
    "total_cartes",
    "total_mobile_money",
    "total_autres",
    "especes_comptees",
    "ecart",
  ] as const,
  mouvements_stock: ["quantite", "quantite_avant", "quantite_apres", "prix_unitaire"] as const,
  supplements_produits: ["prix"] as const,
  lignes_vente_supplements: ["prix"] as const,
  etablissements: ["taux_tva_standard", "taux_tva_reduit", "dernier_numero_ticket"] as const,
};

/**
 * Calcule les paramètres de pagination
 */
export function getPaginationParams(options: PaginationOptions = {}) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? options.limit ?? 50;
  const offset = options.offset ?? (page - 1) * pageSize;
  const limit = pageSize;

  return { offset, limit, page, pageSize };
}

/**
 * Crée un résultat paginé
 */
export function createPaginatedResult<T>(
  data: T[],
  count: number,
  options: PaginationOptions = {}
): PaginatedResult<T> {
  const { page, pageSize } = getPaginationParams(options);
  return {
    data,
    count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  };
}

/**
 * Applique le tri par défaut si non spécifié
 */
export function getDefaultSort(sort?: SortOptions, defaultColumn = "created_at"): SortOptions {
  return sort ?? { column: defaultColumn, ascending: false };
}

/**
 * Génère un numéro de ticket unique
 * Format: YYYYMMDD00001
 */
export function generateTicketNumber(lastNumber: number, date: Date = new Date()): string {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const nextNumber = (lastNumber + 1).toString().padStart(5, "0");
  return `${dateStr}${nextNumber}`;
}

/**
 * Vérifie si la date du ticket est aujourd'hui
 */
export function isTicketDateToday(ticketDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return ticketDate === today;
}

/**
 * Formatte un montant en FCFA
 */
export function formatFCFA(amount: number): string {
  return (
    new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " FCFA"
  );
}

/**
 * Calcule le montant de TVA
 */
export function calculateTVA(amount: number, tauxTva: "STANDARD" | "REDUIT" | "EXONERE"): number {
  const rates = { STANDARD: 0.18, REDUIT: 0.1, EXONERE: 0 };
  return Math.round(amount * rates[tauxTva]);
}

/**
 * Calcule le prix HT à partir du TTC
 */
export function calculateHT(ttc: number, tauxTva: "STANDARD" | "REDUIT" | "EXONERE"): number {
  const rates = { STANDARD: 1.18, REDUIT: 1.1, EXONERE: 1 };
  return Math.round(ttc / rates[tauxTva]);
}

/**
 * Type guard pour vérifier si une erreur Supabase
 */
export function isSupabaseError(error: unknown): error is { message: string; code: string } {
  return typeof error === "object" && error !== null && "message" in error && "code" in error;
}

/**
 * Extrait le message d'erreur d'une réponse Supabase
 */
export function getErrorMessage(error: unknown): string {
  if (isSupabaseError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Une erreur inattendue est survenue";
}

/**
 * Crée un objet de filtre pour Supabase à partir d'un objet de recherche
 */
export function buildFilters(filters: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Retourne la date du jour formatée pour les requêtes
 */
export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Retourne le début et la fin de la journée en ISO
 */
export function getDayBounds(date: Date = new Date()): { start: string; end: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Retourne le début et la fin du mois en ISO
 */
export function getMonthBounds(date: Date = new Date()): { start: string; end: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}
