import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type TauxTva, TAUX_TVA } from "@/lib/db/types";

/**
 * Fusionne des classes CSS avec Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// CONSTANTES TVA GABON
// ============================================================================

/**
 * Taux de TVA en vigueur au Gabon
 */
export const TVA_RATES = {
  STANDARD: 18, // Taux normal
  REDUIT: 10, // Taux reduit (alimentation de base, etc.)
  EXONERE: 0, // Exonere de TVA
} as const;

/**
 * Convertit un TauxTva string en pourcentage numerique
 */
export function getTvaRate(tauxTva: TauxTva | string): number {
  const value = tauxTva.toUpperCase();

  switch (value) {
    case TAUX_TVA.STANDARD:
      return TVA_RATES.STANDARD;
    case TAUX_TVA.REDUIT:
      return TVA_RATES.REDUIT;
    case TAUX_TVA.EXONERE:
      return TVA_RATES.EXONERE;
    default:
      return TVA_RATES.STANDARD;
  }
}

/**
 * Libelle du taux de TVA pour affichage
 */
export function getTvaLabel(tauxTva: TauxTva): string {
  switch (tauxTva) {
    case TAUX_TVA.STANDARD:
      return `TVA ${TVA_RATES.STANDARD}%`;
    case TAUX_TVA.REDUIT:
      return `TVA ${TVA_RATES.REDUIT}%`;
    case TAUX_TVA.EXONERE:
      return "Exonere";
    default:
      return `TVA ${TVA_RATES.STANDARD}%`;
  }
}

/**
 * Formate un montant en FCFA (sans décimales)
 * @param amount - Montant à formater
 * @returns Montant formaté avec "FCFA"
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return "0 FCFA";
  }

  return (
    new Intl.NumberFormat("fr-GA", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num) + " FCFA"
  );
}

/**
 * Formate un numéro de ticket: YYYYMMDD00001
 * @param date - Date du ticket
 * @param sequence - Numéro séquentiel du jour
 * @returns Numéro de ticket formaté
 */
export function formatTicketNumber(date: Date, sequence: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const seq = String(sequence).padStart(5, "0");

  return `${year}${month}${day}${seq}`;
}

/**
 * Calcule la TVA pour un montant donne
 * @param montantHT - Montant hors taxe
 * @param tauxTva - Taux de TVA (en pourcentage, ex: 18) ou enum TauxTva ou string
 * @returns Montant de la TVA (arrondi sans decimales pour XAF)
 */
export function calculerTVA(montantHT: number, tauxTva: number | TauxTva | string): number {
  const taux = typeof tauxTva === "number" ? tauxTva : getTvaRate(tauxTva);
  return Math.round((montantHT * taux) / 100);
}

/**
 * Calcule le montant TTC a partir d'un montant HT
 * @param montantHT - Montant hors taxe
 * @param tauxTva - Taux de TVA (en pourcentage) ou enum TauxTva ou string
 * @returns Montant TTC (arrondi sans decimales pour XAF)
 */
export function calculerTTC(montantHT: number, tauxTva: number | TauxTva | string): number {
  return montantHT + calculerTVA(montantHT, tauxTva);
}

/**
 * Calcule le montant HT a partir d'un montant TTC
 * @param montantTTC - Montant TTC
 * @param tauxTva - Taux de TVA (en pourcentage) ou enum TauxTva ou string
 * @returns Montant HT (arrondi sans decimales pour XAF)
 */
export function calculerHT(montantTTC: number, tauxTva: number | TauxTva | string): number {
  const taux = typeof tauxTva === "number" ? tauxTva : getTvaRate(tauxTva);
  return Math.round(montantTTC / (1 + taux / 100));
}

/**
 * Calcule les details TVA d'une ligne de vente
 * @param prixUnitaire - Prix unitaire HT
 * @param quantite - Quantite
 * @param tauxTva - Taux de TVA
 * @returns Objet avec sousTotal, montantTva, total
 */
export function calculerLigneVente(
  prixUnitaire: number,
  quantite: number,
  tauxTva: number | TauxTva | string
): {
  sousTotal: number;
  montantTva: number;
  total: number;
  tauxTvaNum: number;
} {
  const tauxTvaNum = typeof tauxTva === "number" ? tauxTva : getTvaRate(tauxTva);
  const sousTotal = prixUnitaire * quantite;
  const montantTva = calculerTVA(sousTotal, tauxTvaNum);
  const total = sousTotal + montantTva;

  return { sousTotal, montantTva, total, tauxTvaNum };
}

/**
 * Formate une heure en français (Gabon timezone)
 * @param date - Date dont extraire l'heure
 * @returns Heure formatée (HH:mm)
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat("fr-GA", {
    timeZone: "Africa/Libreville",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Formate une date en français (Gabon timezone)
 * @param date - Date à formater
 * @param format - Format de sortie ('short' | 'long' | 'datetime')
 * @returns Date formatée
 */
export function formatDate(
  date: Date | string,
  format: "short" | "long" | "datetime" = "short"
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  let options: Intl.DateTimeFormatOptions;

  switch (format) {
    case "long":
      options = {
        timeZone: "Africa/Libreville",
        day: "numeric",
        month: "long",
        year: "numeric",
      };
      break;
    case "datetime":
      options = {
        timeZone: "Africa/Libreville",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      break;
    default:
      options = {
        timeZone: "Africa/Libreville",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      };
  }

  return new Intl.DateTimeFormat("fr-GA", options).format(d);
}

/**
 * Génère un slug à partir d'un texte
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/\s+/g, "-") // Remplace les espaces par des tirets
    .replace(/[^\w-]+/g, "") // Supprime les caractères spéciaux
    .replace(/--+/g, "-") // Remplace les tirets multiples par un seul
    .replace(/^-+/, "") // Supprime les tirets au début
    .replace(/-+$/, ""); // Supprime les tirets à la fin
}

/**
 * Tronque un texte à une longueur donnée
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

// ============================================================================
// COUPURES FCFA
// ============================================================================

/**
 * Coupures et pièces FCFA disponibles (du plus grand au plus petit)
 */
export const COUPURES_FCFA = [
  { valeur: 10000, type: "billet" as const, label: "10 000" },
  { valeur: 5000, type: "billet" as const, label: "5 000" },
  { valeur: 2000, type: "billet" as const, label: "2 000" },
  { valeur: 1000, type: "billet" as const, label: "1 000" },
  { valeur: 500, type: "piece" as const, label: "500" },
  { valeur: 200, type: "piece" as const, label: "200" },
  { valeur: 100, type: "piece" as const, label: "100" },
  { valeur: 50, type: "piece" as const, label: "50" },
  { valeur: 25, type: "piece" as const, label: "25" },
  { valeur: 10, type: "piece" as const, label: "10" },
  { valeur: 5, type: "piece" as const, label: "5" },
  { valeur: 1, type: "piece" as const, label: "1" },
] as const;

/**
 * Calcule le rendu optimal en coupures FCFA
 * Utilise un algorithme glouton (optimal pour le système monétaire FCFA)
 */
export function calculerRenduMonnaie(montant: number): {
  valeur: number;
  type: "billet" | "piece";
  label: string;
  quantite: number;
}[] {
  if (montant <= 0) return [];

  let reste = Math.round(montant);
  const resultat: {
    valeur: number;
    type: "billet" | "piece";
    label: string;
    quantite: number;
  }[] = [];

  for (const coupure of COUPURES_FCFA) {
    if (reste >= coupure.valeur) {
      const quantite = Math.floor(reste / coupure.valeur);
      reste = reste % coupure.valeur;
      resultat.push({
        valeur: coupure.valeur,
        type: coupure.type,
        label: coupure.label,
        quantite,
      });
    }
  }

  return resultat;
}

/**
 * Suggère des montants arrondis pour faciliter le paiement
 */
export function suggererMontantsArrondis(total: number): number[] {
  const suggestions: number[] = [];

  // Montant exact
  suggestions.push(total);

  // Arrondis au-dessus
  const arrondis = [500, 1000, 2000, 5000, 10000];

  for (const arrondi of arrondis) {
    const montantArrondi = Math.ceil(total / arrondi) * arrondi;
    if (montantArrondi > total && !suggestions.includes(montantArrondi)) {
      suggestions.push(montantArrondi);
    }
    if (suggestions.length >= 6) break;
  }

  return suggestions.sort((a, b) => a - b);
}
