/**
 * Tests unitaires pour lib/utils.ts
 *
 * Teste les fonctions utilitaires du projet Orema N+ POS:
 * - cn() - Fusion de classes CSS Tailwind
 * - formatCurrency() - Formatage FCFA
 * - formatTicketNumber() - Numeros de tickets
 * - TVA_RATES, getTvaRate, getTvaLabel - Constantes et conversion TVA
 * - calculerTVA, calculerTTC, calculerHT - Calculs fiscaux
 * - calculerLigneVente - Calcul complet d'une ligne de vente
 * - formatTime, formatDate - Formatage dates/heures
 * - slugify, truncate - Manipulation de texte
 * - COUPURES_FCFA, calculerRenduMonnaie - Rendu de monnaie
 * - suggererMontantsArrondis - Suggestions de paiement
 */

import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatTicketNumber,
  getTvaRate,
  getTvaLabel,
  calculerTVA,
  calculerTTC,
  calculerHT,
  calculerLigneVente,
  formatTime,
  formatDate,
  slugify,
  truncate,
  calculerRenduMonnaie,
  suggererMontantsArrondis,
  TVA_RATES,
  COUPURES_FCFA,
} from "@/lib/utils";

// Helper pour normaliser les espaces insecables de Intl.NumberFormat
const normalize = (s: string) => s.replace(/\s/g, " ");

// ============================================================================
// Tests de cn() - Fusion de classes CSS
// ============================================================================

describe("cn - Fusion de classes CSS", () => {
  it("fusionne des classes simples", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("gere les classes conditionnelles", () => {
    expect(cn("base", true && "active", false && "hidden")).toBe("base active");
  });

  it("fusionne les classes Tailwind conflictuelles", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("gere les tableaux de classes", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });

  it("gere les valeurs nulles et undefined", () => {
    expect(cn("foo", null, undefined, "bar")).toBe("foo bar");
  });

  it("retourne une chaine vide sans arguments", () => {
    expect(cn()).toBe("");
  });

  it("gere les objets de classes conditionnelles", () => {
    expect(cn({ "bg-red-500": true, "text-white": true, hidden: false })).toBe(
      "bg-red-500 text-white"
    );
  });

  it("gere les classes mixtes avec espaces", () => {
    expect(cn("mt-2 mb-4", "mt-6")).toBe("mb-4 mt-6");
  });
});

// ============================================================================
// Tests de formatCurrency() - Formatage FCFA
// ============================================================================

describe("formatCurrency - Formatage FCFA", () => {
  it("formate un montant simple correctement", () => {
    expect(normalize(formatCurrency(1000))).toBe("1 000 FCFA");
  });

  it("formate zero correctement", () => {
    expect(normalize(formatCurrency(0))).toBe("0 FCFA");
  });

  it("formate les grands montants avec separateurs", () => {
    expect(normalize(formatCurrency(1500000))).toBe("1 500 000 FCFA");
    expect(normalize(formatCurrency(25000))).toBe("25 000 FCFA");
    expect(normalize(formatCurrency(999999999))).toBe("999 999 999 FCFA");
  });

  it("gere les strings numeriques", () => {
    expect(normalize(formatCurrency("5000"))).toBe("5 000 FCFA");
    expect(normalize(formatCurrency("0"))).toBe("0 FCFA");
    expect(normalize(formatCurrency("1500000"))).toBe("1 500 000 FCFA");
  });

  it('retourne "0 FCFA" pour les valeurs invalides', () => {
    expect(normalize(formatCurrency("invalid"))).toBe("0 FCFA");
    expect(normalize(formatCurrency(NaN))).toBe("0 FCFA");
    expect(normalize(formatCurrency(""))).toBe("0 FCFA");
  });

  it("arrondit les decimales (FCFA sans centimes)", () => {
    expect(normalize(formatCurrency(1500.75))).toBe("1 501 FCFA");
    expect(normalize(formatCurrency(1500.25))).toBe("1 500 FCFA");
    // Intl.NumberFormat arrondit 1500.5 vers le haut
    expect(normalize(formatCurrency(1500.5))).toBe("1 501 FCFA");
  });

  it("gere les montants negatifs", () => {
    const result = normalize(formatCurrency(-5000));
    expect(result).toContain("5 000");
    expect(result).toContain("FCFA");
  });

  it("formate les petits montants", () => {
    expect(normalize(formatCurrency(1))).toBe("1 FCFA");
    expect(normalize(formatCurrency(50))).toBe("50 FCFA");
    expect(normalize(formatCurrency(999))).toBe("999 FCFA");
  });
});

// ============================================================================
// Tests de formatTicketNumber() - Numéro de ticket
// ============================================================================

describe("formatTicketNumber - Numéro de ticket", () => {
  it("genere le format YYYYMMDD00001", () => {
    const date = new Date(2025, 0, 15); // 15 janvier 2025
    expect(formatTicketNumber(date, 1)).toBe("2025011500001");
  });

  it("gere les numeros a plusieurs chiffres", () => {
    const date = new Date(2025, 11, 31); // 31 decembre 2025
    expect(formatTicketNumber(date, 123)).toBe("2025123100123");
    expect(formatTicketNumber(date, 99999)).toBe("2025123199999");
  });

  it("pad le mois et le jour sur 2 chiffres", () => {
    const date = new Date(2025, 5, 5); // 5 juin 2025
    expect(formatTicketNumber(date, 1)).toBe("2025060500001");
  });

  it("pad le numero de sequence sur 5 chiffres", () => {
    const date = new Date(2025, 0, 1);
    expect(formatTicketNumber(date, 5)).toBe("2025010100005");
    expect(formatTicketNumber(date, 50)).toBe("2025010100050");
    expect(formatTicketNumber(date, 500)).toBe("2025010100500");
  });

  it("genere un ticket avec le premier mois de l'annee", () => {
    const date = new Date(2026, 0, 1);
    expect(formatTicketNumber(date, 1)).toBe("2026010100001");
  });

  it("gere les sequences au-dela de 5 chiffres", () => {
    const date = new Date(2025, 0, 1);
    expect(formatTicketNumber(date, 100000)).toBe("20250101100000");
  });

  it("genere le format correct pour le dernier jour de l'annee", () => {
    const date = new Date(2025, 11, 31);
    expect(formatTicketNumber(date, 1)).toBe("2025123100001");
  });
});

// ============================================================================
// Tests de TVA - Constantes TVA Gabon
// ============================================================================

describe("TVA_RATES - Constantes TVA Gabon", () => {
  it("definit le taux standard a 18%", () => {
    expect(TVA_RATES.STANDARD).toBe(18);
  });

  it("definit le taux reduit a 10%", () => {
    expect(TVA_RATES.REDUIT).toBe(10);
  });

  it("definit le taux exonere a 0%", () => {
    expect(TVA_RATES.EXONERE).toBe(0);
  });

  it("est un objet immutable (as const)", () => {
    expect(Object.keys(TVA_RATES)).toHaveLength(3);
    expect(Object.keys(TVA_RATES)).toEqual(["STANDARD", "REDUIT", "EXONERE"]);
  });
});

describe("getTvaRate - Conversion taux TVA", () => {
  it("retourne 18 pour STANDARD", () => {
    expect(getTvaRate("STANDARD")).toBe(18);
  });

  it("retourne 10 pour REDUIT", () => {
    expect(getTvaRate("REDUIT")).toBe(10);
  });

  it("retourne 0 pour EXONERE", () => {
    expect(getTvaRate("EXONERE")).toBe(0);
  });

  it("est insensible a la casse", () => {
    expect(getTvaRate("standard")).toBe(18);
    expect(getTvaRate("reduit")).toBe(10);
    expect(getTvaRate("exonere")).toBe(0);
  });

  it("retourne STANDARD par defaut pour valeur inconnue", () => {
    expect(getTvaRate("UNKNOWN")).toBe(18);
    expect(getTvaRate("")).toBe(18);
    expect(getTvaRate("abc")).toBe(18);
  });
});

describe("getTvaLabel - Libelle TVA", () => {
  it("est une fonction exportee", () => {
    expect(typeof getTvaLabel).toBe("function");
  });
});

// ============================================================================
// Tests de calculerTVA - Calcul du montant TVA
// ============================================================================

describe("calculerTVA - Calcul du montant TVA", () => {
  it("calcule la TVA standard (18%) avec nombre", () => {
    expect(calculerTVA(10000, 18)).toBe(1800);
  });

  it("calcule la TVA standard (18%) avec string enum", () => {
    expect(calculerTVA(10000, "STANDARD")).toBe(1800);
  });

  it("calcule la TVA reduite (10%) avec nombre", () => {
    expect(calculerTVA(10000, 10)).toBe(1000);
  });

  it("calcule la TVA reduite (10%) avec string enum", () => {
    expect(calculerTVA(10000, "REDUIT")).toBe(1000);
  });

  it("retourne 0 pour taux exonere (nombre)", () => {
    expect(calculerTVA(10000, 0)).toBe(0);
  });

  it("retourne 0 pour taux exonere (string)", () => {
    expect(calculerTVA(10000, "EXONERE")).toBe(0);
  });

  it("arrondit au FCFA le plus proche (Math.round)", () => {
    // 123 * 0.18 = 22.14 -> arrondi a 22
    expect(calculerTVA(123, 18)).toBe(22);
    // 127 * 0.18 = 22.86 -> arrondi a 23
    expect(calculerTVA(127, 18)).toBe(23);
    // 125 * 0.18 = 22.5 -> arrondi a 23 (Math.round arrondit .5 vers le haut)
    expect(calculerTVA(125, 18)).toBe(Math.round(125 * 18 / 100));
  });

  it("gere les montants nuls", () => {
    expect(calculerTVA(0, 18)).toBe(0);
    expect(calculerTVA(0, 0)).toBe(0);
  });

  it("gere les grands montants", () => {
    expect(calculerTVA(1000000, 18)).toBe(180000);
    expect(calculerTVA(999999999, 18)).toBe(Math.round(999999999 * 18 / 100));
  });

  it("gere les petits montants", () => {
    expect(calculerTVA(1, 18)).toBe(0); // 1 * 0.18 = 0.18 -> arrondi a 0
    expect(calculerTVA(6, 18)).toBe(1); // 6 * 0.18 = 1.08 -> arrondi a 1
  });
});

// ============================================================================
// Tests de calculerTTC - Calcul TTC
// ============================================================================

describe("calculerTTC - Calcul TTC", () => {
  it("calcule le TTC correctement avec nombre", () => {
    expect(calculerTTC(10000, 18)).toBe(11800);
  });

  it("calcule le TTC correctement avec string enum", () => {
    expect(calculerTTC(10000, "STANDARD")).toBe(11800);
  });

  it("retourne le HT pour taux exonere (nombre)", () => {
    expect(calculerTTC(10000, 0)).toBe(10000);
  });

  it("retourne le HT pour taux exonere (string)", () => {
    expect(calculerTTC(10000, "EXONERE")).toBe(10000);
  });

  it("calcule avec taux reduit", () => {
    expect(calculerTTC(10000, 10)).toBe(11000);
    expect(calculerTTC(10000, "REDUIT")).toBe(11000);
  });

  it("gere un montant HT de zero", () => {
    expect(calculerTTC(0, 18)).toBe(0);
  });

  it("verifie que TTC = HT + TVA", () => {
    const ht = 7500;
    const tva = calculerTVA(ht, 18);
    expect(calculerTTC(ht, 18)).toBe(ht + tva);
  });
});

// ============================================================================
// Tests de calculerHT - Calcul HT depuis TTC
// ============================================================================

describe("calculerHT - Calcul HT depuis TTC", () => {
  it("calcule le HT correctement", () => {
    expect(calculerHT(11800, 18)).toBe(10000);
  });

  it("retourne le TTC pour taux exonere", () => {
    expect(calculerHT(10000, 0)).toBe(10000);
    expect(calculerHT(10000, "EXONERE")).toBe(10000);
  });

  it("arrondit au FCFA le plus proche", () => {
    // 11799 / 1.18 = 9999.15... -> 9999
    expect(calculerHT(11799, 18)).toBe(9999);
  });

  it("gere le taux reduit", () => {
    expect(calculerHT(11000, 10)).toBe(10000);
  });

  it("gere un montant TTC de zero", () => {
    expect(calculerHT(0, 18)).toBe(0);
  });

  it("accepte les string enum", () => {
    expect(calculerHT(11800, "STANDARD")).toBe(10000);
    expect(calculerHT(11000, "REDUIT")).toBe(10000);
  });

  it("est coherent avec calculerTTC pour des montants ronds", () => {
    // Pour un montant qui donne un TTC exact, le retour doit etre le HT original
    const ht = 10000;
    const ttc = calculerTTC(ht, 18);
    expect(calculerHT(ttc, 18)).toBe(ht);
  });
});

// ============================================================================
// Tests de calculerLigneVente - Calcul ligne de vente
// ============================================================================

describe("calculerLigneVente - Calcul ligne de vente", () => {
  it("calcule tous les champs correctement", () => {
    const result = calculerLigneVente(5000, 2, 18);

    expect(result.sousTotal).toBe(10000); // 5000 * 2
    expect(result.montantTva).toBe(1800); // 10000 * 18%
    expect(result.total).toBe(11800); // 10000 + 1800
    expect(result.tauxTvaNum).toBe(18);
  });

  it("gere les quantites decimales", () => {
    const result = calculerLigneVente(1000, 1.5, 18);

    expect(result.sousTotal).toBe(1500);
    expect(result.montantTva).toBe(270);
    expect(result.total).toBe(1770);
  });

  it("accepte le taux TVA en string", () => {
    const result = calculerLigneVente(5000, 2, "STANDARD");

    expect(result.sousTotal).toBe(10000);
    expect(result.tauxTvaNum).toBe(18);
    expect(result.montantTva).toBe(1800);
    expect(result.total).toBe(11800);
  });

  it("gere le taux exonere", () => {
    const result = calculerLigneVente(5000, 3, 0);

    expect(result.sousTotal).toBe(15000);
    expect(result.montantTva).toBe(0);
    expect(result.total).toBe(15000);
    expect(result.tauxTvaNum).toBe(0);
  });

  it("gere le taux reduit", () => {
    const result = calculerLigneVente(5000, 2, "REDUIT");

    expect(result.sousTotal).toBe(10000);
    expect(result.montantTva).toBe(1000);
    expect(result.total).toBe(11000);
    expect(result.tauxTvaNum).toBe(10);
  });

  it("verifie que total = sousTotal + montantTva", () => {
    const result = calculerLigneVente(3750, 4, 18);
    expect(result.total).toBe(result.sousTotal + result.montantTva);
  });

  it("gere un prix unitaire de zero", () => {
    const result = calculerLigneVente(0, 5, 18);
    expect(result.sousTotal).toBe(0);
    expect(result.montantTva).toBe(0);
    expect(result.total).toBe(0);
  });

  it("gere une quantite de 1", () => {
    const result = calculerLigneVente(5000, 1, 18);
    expect(result.sousTotal).toBe(5000);
    expect(result.montantTva).toBe(900);
    expect(result.total).toBe(5900);
  });
});

// ============================================================================
// Tests de formatage de dates
// ============================================================================

describe("formatTime - Formatage heure", () => {
  it("formate une heure correctement (format HH:mm)", () => {
    const date = new Date("2025-01-15T14:30:00Z");
    const formatted = formatTime(date);
    expect(formatted).toMatch(/^\d{2}:\d{2}$/);
  });

  it("accepte une string ISO", () => {
    const formatted = formatTime("2025-01-15T14:30:00Z");
    expect(formatted).toMatch(/^\d{2}:\d{2}$/);
  });

  it("utilise le timezone Africa/Libreville (UTC+1)", () => {
    // 14:30 UTC = 15:30 Africa/Libreville
    const date = new Date("2025-01-15T14:30:00Z");
    const formatted = formatTime(date);
    expect(formatted).toBe("15:30");
  });
});

describe("formatDate - Formatage date", () => {
  const testDate = new Date("2025-01-15T14:30:00Z");

  it("formate en format court par defaut (DD/MM/YYYY)", () => {
    const formatted = formatDate(testDate, "short");
    expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(formatted).toContain("2025");
  });

  it("formate en format long", () => {
    const formatted = formatDate(testDate, "long");
    expect(formatted).toContain("2025");
    // Le format long inclut le mois en lettres
    expect(formatted).toMatch(/\d+/);
  });

  it("formate en datetime", () => {
    const formatted = formatDate(testDate, "datetime");
    expect(formatted).toContain("/");
    expect(formatted).toContain(":");
  });

  it("utilise short comme format par defaut", () => {
    const formatted = formatDate(testDate);
    expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("accepte une string ISO", () => {
    const formatted = formatDate("2025-01-15T14:30:00Z", "short");
    expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});

// ============================================================================
// Tests de slugify et truncate
// ============================================================================

describe("slugify - Generation de slug", () => {
  it("convertit en minuscules", () => {
    expect(slugify("HELLO")).toBe("hello");
  });

  it("remplace les espaces par des tirets", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  it("supprime les accents", () => {
    expect(slugify("cafe francais")).toBe("cafe-francais");
    expect(slugify("Cremerie")).toBe("cremerie");
    expect(slugify("Resume")).toBe("resume");
  });

  it("supprime les caracteres speciaux", () => {
    expect(slugify("hello@world!")).toBe("helloworld");
  });

  it("supprime les tirets multiples", () => {
    expect(slugify("hello--world")).toBe("hello-world");
    expect(slugify("hello---world")).toBe("hello-world");
  });

  it("supprime les tirets en debut et fin", () => {
    expect(slugify("-hello-")).toBe("hello");
    expect(slugify("--hello--")).toBe("hello");
  });

  it("gere les chaines avec espaces multiples", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("gere une chaine vide", () => {
    expect(slugify("")).toBe("");
  });

  it("gere un texte complexe", () => {
    expect(slugify("Poulet Braise - Plat du Jour!")).toBe("poulet-braise-plat-du-jour");
  });
});

describe("truncate - Troncature de texte", () => {
  it("ne modifie pas les textes courts", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("tronque avec ... pour les textes longs", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
  });

  it("gere la longueur exacte", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("gere une longueur de 0", () => {
    expect(truncate("hello", 0)).toBe("...");
  });

  it("gere une chaine vide", () => {
    expect(truncate("", 5)).toBe("");
  });

  it("tronque un texte long correctement", () => {
    const long = "Poulet braise avec frites et salade";
    const result = truncate(long, 15);
    expect(result).toBe("Poulet braise a...");
    expect(result.length).toBe(18); // 15 + 3 pour "..."
  });
});

// ============================================================================
// Tests du rendu de monnaie FCFA
// ============================================================================

describe("COUPURES_FCFA - Denominations", () => {
  it("contient toutes les coupures FCFA (12)", () => {
    expect(COUPURES_FCFA).toHaveLength(12);
  });

  it("commence par le plus grand billet", () => {
    expect(COUPURES_FCFA[0].valeur).toBe(10000);
  });

  it("termine par la plus petite piece", () => {
    expect(COUPURES_FCFA[11].valeur).toBe(1);
  });

  it("distingue billets et pieces", () => {
    const billets = COUPURES_FCFA.filter((c) => c.type === "billet");
    const pieces = COUPURES_FCFA.filter((c) => c.type === "piece");

    expect(billets).toHaveLength(4); // 10000, 5000, 2000, 1000
    expect(pieces).toHaveLength(8); // 500, 200, 100, 50, 25, 10, 5, 1
  });

  it("est ordonne du plus grand au plus petit", () => {
    for (let i = 0; i < COUPURES_FCFA.length - 1; i++) {
      expect(COUPURES_FCFA[i].valeur).toBeGreaterThan(COUPURES_FCFA[i + 1].valeur);
    }
  });

  it("a un label pour chaque coupure", () => {
    for (const coupure of COUPURES_FCFA) {
      expect(coupure.label).toBeTruthy();
      expect(typeof coupure.label).toBe("string");
    }
  });
});

describe("calculerRenduMonnaie - Rendu optimal", () => {
  it("retourne un tableau vide pour montant nul", () => {
    expect(calculerRenduMonnaie(0)).toEqual([]);
  });

  it("retourne un tableau vide pour montant negatif", () => {
    expect(calculerRenduMonnaie(-100)).toEqual([]);
    expect(calculerRenduMonnaie(-1)).toEqual([]);
  });

  it("calcule le rendu optimal pour un billet simple", () => {
    const rendu = calculerRenduMonnaie(10000);
    expect(rendu).toHaveLength(1);
    expect(rendu[0]).toEqual({
      valeur: 10000,
      type: "billet",
      label: "10 000",
      quantite: 1,
    });
  });

  it("calcule le rendu pour un montant compose", () => {
    const rendu = calculerRenduMonnaie(15750);
    // 15750 = 10000 + 5000 + 500 + 200 + 50
    const valeurs = rendu.map((r) => ({ v: r.valeur, q: r.quantite }));

    expect(valeurs).toContainEqual({ v: 10000, q: 1 });
    expect(valeurs).toContainEqual({ v: 5000, q: 1 });
    expect(valeurs).toContainEqual({ v: 500, q: 1 });
    expect(valeurs).toContainEqual({ v: 200, q: 1 });
    expect(valeurs).toContainEqual({ v: 50, q: 1 });
  });

  it("utilise plusieurs billets de meme valeur", () => {
    const rendu = calculerRenduMonnaie(20000);
    expect(rendu).toHaveLength(1);
    expect(rendu[0]).toEqual({
      valeur: 10000,
      type: "billet",
      label: "10 000",
      quantite: 2,
    });
  });

  it("gere les petites pieces", () => {
    const rendu = calculerRenduMonnaie(36);
    // 36 = 25 + 10 + 1
    const valeurs = rendu.map((r) => r.valeur);
    expect(valeurs).toContain(25);
    expect(valeurs).toContain(10);
    expect(valeurs).toContain(1);
  });

  it("arrondit les decimales", () => {
    const rendu = calculerRenduMonnaie(100.7);
    const total = rendu.reduce((sum, r) => sum + r.valeur * r.quantite, 0);
    expect(total).toBe(101); // Math.round(100.7) = 101
  });

  it("verifie que le total des coupures egale le montant arrondi", () => {
    const montants = [1, 5, 25, 50, 100, 500, 1000, 2000, 5000, 10000, 37825, 99999];
    for (const montant of montants) {
      const rendu = calculerRenduMonnaie(montant);
      const total = rendu.reduce((sum, r) => sum + r.valeur * r.quantite, 0);
      expect(total).toBe(Math.round(montant));
    }
  });

  it("gere un montant de 1 FCFA", () => {
    const rendu = calculerRenduMonnaie(1);
    expect(rendu).toHaveLength(1);
    expect(rendu[0].valeur).toBe(1);
    expect(rendu[0].quantite).toBe(1);
  });

  it("chaque element du rendu a les bons types", () => {
    const rendu = calculerRenduMonnaie(18765);
    for (const item of rendu) {
      expect(item).toHaveProperty("valeur");
      expect(item).toHaveProperty("type");
      expect(item).toHaveProperty("label");
      expect(item).toHaveProperty("quantite");
      expect(["billet", "piece"]).toContain(item.type);
      expect(item.quantite).toBeGreaterThan(0);
    }
  });
});

describe("suggererMontantsArrondis - Suggestions paiement", () => {
  it("inclut toujours le montant exact en premier", () => {
    const suggestions = suggererMontantsArrondis(7850);
    expect(suggestions[0]).toBe(7850);
  });

  it("suggere des arrondis superieurs", () => {
    const suggestions = suggererMontantsArrondis(7850);
    expect(suggestions).toContain(8000);
    expect(suggestions).toContain(10000);
  });

  it("ne suggere pas de doublons", () => {
    const suggestions = suggererMontantsArrondis(10000);
    const unique = [...new Set(suggestions)];
    expect(suggestions).toEqual(unique);
  });

  it("retourne les suggestions triees par ordre croissant", () => {
    const suggestions = suggererMontantsArrondis(3200);
    for (let i = 0; i < suggestions.length - 1; i++) {
      expect(suggestions[i]).toBeLessThanOrEqual(suggestions[i + 1]);
    }
  });

  it("limite le nombre de suggestions a 6 max", () => {
    const suggestions = suggererMontantsArrondis(100);
    expect(suggestions.length).toBeLessThanOrEqual(6);
  });

  it("tous les arrondis sont superieurs ou egaux au montant", () => {
    const suggestions = suggererMontantsArrondis(4750);
    for (const s of suggestions) {
      expect(s).toBeGreaterThanOrEqual(4750);
    }
  });

  it("fonctionne avec un montant deja arrondi", () => {
    const suggestions = suggererMontantsArrondis(5000);
    expect(suggestions[0]).toBe(5000);
  });
});
