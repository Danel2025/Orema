/**
 * Module d'export CSV
 * Orema N+ - Système POS
 */

import Papa from "papaparse";
import type { CSVExportOptions } from "./types";

const DEFAULT_OPTIONS: CSVExportOptions = {
  delimiter: ";",
  includeBOM: true,
};

/**
 * Génère un fichier CSV à partir de données
 */
export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  options: CSVExportOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Construire les headers
  const headers = columns.map((col) => col.header);

  // Construire les lignes
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      if (value === null || value === undefined) return "";
      if (typeof value === "boolean") return value ? "Oui" : "Non";
      if (value instanceof Date) return formatDate(value);
      return String(value);
    })
  );

  // Générer le CSV avec PapaParse
  const csv = Papa.unparse(
    {
      fields: headers,
      data: rows,
    },
    {
      delimiter: opts.delimiter,
      quotes: true,
    }
  );

  // Ajouter le BOM UTF-8 si demandé
  if (opts.includeBOM) {
    return "\uFEFF" + csv;
  }

  return csv;
}

/**
 * Formate une date pour l'export
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formate une date avec heure
 */
function formatDateTime(date: Date): string {
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formate un montant FCFA
 */
function formatAmount(amount: number | bigint | null | undefined): string {
  if (amount === null || amount === undefined) return "";
  return Number(amount).toLocaleString("fr-FR");
}

// ============================================================================
// Export Produits
// ============================================================================

interface ProductForExport {
  nom: string;
  description?: string | null;
  codeBarre?: string | null;
  prixVente: number | bigint;
  prixAchat?: number | bigint | null;
  tauxTva: string;
  categorie: { nom: string };
  gererStock: boolean;
  stockActuel?: number | null;
  stockMin?: number | null;
  stockMax?: number | null;
  unite?: string | null;
  disponibleDirect: boolean;
  disponibleTable: boolean;
  disponibleLivraison: boolean;
  disponibleEmporter: boolean;
  actif: boolean;
}

/**
 * Exporte les produits en CSV
 */
export function exportProductsToCSV(
  products: ProductForExport[],
  options?: CSVExportOptions
): string {
  const columns: { key: keyof ProductForExport | string; header: string }[] = [
    { key: "nom", header: "Nom" },
    { key: "description", header: "Description" },
    { key: "codeBarre", header: "Code-barres" },
    { key: "prixVente", header: "Prix Vente (FCFA)" },
    { key: "prixAchat", header: "Prix Achat (FCFA)" },
    { key: "tauxTva", header: "Taux TVA" },
    { key: "categorie", header: "Catégorie" },
    { key: "gererStock", header: "Gérer Stock" },
    { key: "stockActuel", header: "Stock Actuel" },
    { key: "stockMin", header: "Stock Minimum" },
    { key: "stockMax", header: "Stock Maximum" },
    { key: "unite", header: "Unité" },
    { key: "disponibleDirect", header: "Dispo Direct" },
    { key: "disponibleTable", header: "Dispo Table" },
    { key: "disponibleLivraison", header: "Dispo Livraison" },
    { key: "disponibleEmporter", header: "Dispo Emporter" },
    { key: "actif", header: "Actif" },
  ];

  // Transformer les données
  const data = products.map((p) => ({
    nom: p.nom,
    description: p.description || "",
    codeBarre: p.codeBarre || "",
    prixVente: formatAmount(p.prixVente),
    prixAchat: formatAmount(p.prixAchat),
    tauxTva: p.tauxTva,
    categorie: p.categorie.nom,
    gererStock: p.gererStock,
    stockActuel: p.stockActuel ?? "",
    stockMin: p.stockMin ?? "",
    stockMax: p.stockMax ?? "",
    unite: p.unite || "",
    disponibleDirect: p.disponibleDirect,
    disponibleTable: p.disponibleTable,
    disponibleLivraison: p.disponibleLivraison,
    disponibleEmporter: p.disponibleEmporter,
    actif: p.actif,
  }));

  return generateCSV(
    data as Record<string, unknown>[],
    columns as { key: string; header: string }[],
    options
  );
}

// ============================================================================
// Export Ventes
// ============================================================================

interface VenteForExport {
  numeroTicket: string;
  createdAt: Date;
  type: string;
  statut: string;
  sousTotal: number | bigint;
  totalTva: number | bigint;
  totalRemise: number | bigint;
  totalFinal: number | bigint;
  utilisateur: { nom: string; prenom?: string | null };
  client?: { nom: string; prenom?: string | null } | null;
  table?: { numero: string } | null;
  paiements: { modePaiement: string; montant: number | bigint }[];
}

/**
 * Exporte les ventes en CSV
 */
export function exportVentesToCSV(ventes: VenteForExport[], options?: CSVExportOptions): string {
  const columns = [
    { key: "numeroTicket", header: "Numéro Ticket" },
    { key: "date", header: "Date" },
    { key: "heure", header: "Heure" },
    { key: "type", header: "Type" },
    { key: "statut", header: "Statut" },
    { key: "caissier", header: "Caissier" },
    { key: "client", header: "Client" },
    { key: "table", header: "Table" },
    { key: "sousTotal", header: "Sous-total HT" },
    { key: "totalTva", header: "TVA" },
    { key: "totalRemise", header: "Remise" },
    { key: "totalFinal", header: "Total TTC" },
    { key: "modePaiement", header: "Mode Paiement" },
  ];

  const data = ventes.map((v) => ({
    numeroTicket: v.numeroTicket,
    date: formatDate(v.createdAt),
    heure: v.createdAt.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    type: v.type,
    statut: v.statut,
    caissier: `${v.utilisateur.nom} ${v.utilisateur.prenom || ""}`.trim(),
    client: v.client ? `${v.client.nom} ${v.client.prenom || ""}`.trim() : "",
    table: v.table?.numero || "",
    sousTotal: formatAmount(v.sousTotal),
    totalTva: formatAmount(v.totalTva),
    totalRemise: formatAmount(v.totalRemise),
    totalFinal: formatAmount(v.totalFinal),
    modePaiement: v.paiements.map((p) => p.modePaiement).join(", "),
  }));

  return generateCSV(
    data as Record<string, unknown>[],
    columns as { key: string; header: string }[],
    options
  );
}

// ============================================================================
// Export Clients
// ============================================================================

interface ClientForExport {
  nom: string;
  prenom?: string | null;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  pointsFidelite: number;
  soldePrepaye: number | bigint;
  creditAutorise: boolean;
  limitCredit?: number | bigint | null;
  soldeCredit: number | bigint;
  actif: boolean;
  createdAt: Date;
}

/**
 * Exporte les clients en CSV
 */
export function exportClientsToCSV(clients: ClientForExport[], options?: CSVExportOptions): string {
  const columns = [
    { key: "nom", header: "Nom" },
    { key: "prenom", header: "Prénom" },
    { key: "telephone", header: "Téléphone" },
    { key: "email", header: "Email" },
    { key: "adresse", header: "Adresse" },
    { key: "pointsFidelite", header: "Points Fidélité" },
    { key: "soldePrepaye", header: "Solde Prépayé (FCFA)" },
    { key: "creditAutorise", header: "Crédit Autorisé" },
    { key: "limitCredit", header: "Limite Crédit (FCFA)" },
    { key: "soldeCredit", header: "Solde Crédit (FCFA)" },
    { key: "actif", header: "Actif" },
    { key: "dateCreation", header: "Date Création" },
  ];

  const data = clients.map((c) => ({
    nom: c.nom,
    prenom: c.prenom || "",
    telephone: c.telephone || "",
    email: c.email || "",
    adresse: c.adresse || "",
    pointsFidelite: c.pointsFidelite,
    soldePrepaye: formatAmount(c.soldePrepaye),
    creditAutorise: c.creditAutorise,
    limitCredit: formatAmount(c.limitCredit),
    soldeCredit: formatAmount(c.soldeCredit),
    actif: c.actif,
    dateCreation: formatDate(c.createdAt),
  }));

  return generateCSV(
    data as Record<string, unknown>[],
    columns as { key: string; header: string }[],
    options
  );
}

// ============================================================================
// Téléchargement
// ============================================================================

/**
 * Déclenche le téléchargement d'un fichier CSV
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Génère un nom de fichier avec date
 */
export function generateFilename(prefix: string): string {
  const date = new Date().toISOString().split("T")[0];
  return `${prefix}_${date}.csv`;
}
