/**
 * Tests unitaires pour lib/design-system/currency.ts
 *
 * Teste les fonctions de formatage monetaire du design system:
 * - formatCurrency() - Formatage FCFA avec/sans symbole
 * - parseCurrency() - Parsing de chaines FCFA en nombre
 * - formatCurrencyShort() - Formatage court pour graphiques (K, M, Md)
 * - calculateTax() - Calcul TVA gabonaise
 */

import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  parseCurrency,
  formatCurrencyShort,
  calculateTax,
} from "@/lib/design-system/currency";

// Helper pour normaliser les espaces insecables de Intl.NumberFormat
const normalize = (s: string) => s.replace(/\s/g, " ");

// ============================================================================
// Tests de formatCurrency (design-system version)
// ============================================================================

describe("formatCurrency (design-system)", () => {
  it("formate avec le symbole FCFA par defaut", () => {
    expect(normalize(formatCurrency(15000))).toBe("15 000 FCFA");
  });

  it("formate sans symbole si showSymbol=false", () => {
    expect(normalize(formatCurrency(15000, false))).toBe("15 000");
  });

  it("formate zero correctement", () => {
    expect(normalize(formatCurrency(0))).toBe("0 FCFA");
  });

  it("formate zero sans symbole", () => {
    expect(normalize(formatCurrency(0, false))).toBe("0");
  });

  it("formate les grands montants", () => {
    expect(normalize(formatCurrency(1500000))).toBe("1 500 000 FCFA");
    expect(normalize(formatCurrency(999999999))).toBe("999 999 999 FCFA");
  });

  it("formate les petits montants", () => {
    expect(normalize(formatCurrency(1))).toBe("1 FCFA");
    expect(normalize(formatCurrency(50))).toBe("50 FCFA");
    expect(normalize(formatCurrency(999))).toBe("999 FCFA");
  });

  it("formate les montants negatifs", () => {
    const result = normalize(formatCurrency(-5000));
    expect(result).toContain("5 000");
    expect(result).toContain("FCFA");
  });

  it("formate les coupures FCFA standard", () => {
    expect(normalize(formatCurrency(1000))).toBe("1 000 FCFA");
    expect(normalize(formatCurrency(2000))).toBe("2 000 FCFA");
    expect(normalize(formatCurrency(5000))).toBe("5 000 FCFA");
    expect(normalize(formatCurrency(10000))).toBe("10 000 FCFA");
  });
});

// ============================================================================
// Tests de parseCurrency
// ============================================================================

describe("parseCurrency", () => {
  it("parse une chaine avec symbole FCFA", () => {
    expect(parseCurrency("15 000 FCFA")).toBe(15000);
  });

  it("parse une chaine avec espaces", () => {
    expect(parseCurrency("1 500 000")).toBe(1500000);
  });

  it("parse une chaine sans espaces", () => {
    expect(parseCurrency("15000")).toBe(15000);
  });

  it("retourne 0 pour une chaine vide", () => {
    expect(parseCurrency("")).toBe(0);
  });

  it("retourne 0 pour une chaine non numerique pure", () => {
    expect(parseCurrency("abc")).toBe(0);
  });

  it("extrait les chiffres d'une chaine mixte", () => {
    expect(parseCurrency("Prix: 5000 FCFA")).toBe(5000);
  });

  it("parse les grands montants", () => {
    expect(parseCurrency("999 999 999 FCFA")).toBe(999999999);
  });

  it("parse les petits montants", () => {
    expect(parseCurrency("1")).toBe(1);
    expect(parseCurrency("50 FCFA")).toBe(50);
  });

  it("gere la chaine 'FCFA' seule (contient des chiffres implicites? non)", () => {
    // 'FCFA' ne contient aucun chiffre, parseInt("") retourne NaN -> 0
    expect(parseCurrency("FCFA")).toBe(0);
  });
});

// ============================================================================
// Tests de formatCurrencyShort
// ============================================================================

describe("formatCurrencyShort", () => {
  it("formate les petits montants sans suffixe", () => {
    expect(formatCurrencyShort(0)).toBe("0");
    expect(formatCurrencyShort(500)).toBe("500");
    expect(formatCurrencyShort(999)).toBe("999");
  });

  it("formate les milliers avec K", () => {
    expect(formatCurrencyShort(1000)).toBe("1.0K");
    expect(formatCurrencyShort(15000)).toBe("15.0K");
    expect(formatCurrencyShort(500000)).toBe("500.0K");
  });

  it("formate les millions avec M", () => {
    expect(formatCurrencyShort(1000000)).toBe("1.0M");
    expect(formatCurrencyShort(1500000)).toBe("1.5M");
    expect(formatCurrencyShort(25000000)).toBe("25.0M");
  });

  it("formate les milliards avec Md", () => {
    expect(formatCurrencyShort(1000000000)).toBe("1.0Md");
    expect(formatCurrencyShort(2500000000)).toBe("2.5Md");
  });

  it("arrondit a une decimale", () => {
    expect(formatCurrencyShort(15750)).toBe("15.8K");
    expect(formatCurrencyShort(15250)).toBe("15.3K");
  });

  it("gere les valeurs limites entre categories", () => {
    expect(formatCurrencyShort(999)).toBe("999");
    expect(formatCurrencyShort(1000)).toBe("1.0K");
    expect(formatCurrencyShort(999999)).toBe("1000.0K");
    expect(formatCurrencyShort(1000000)).toBe("1.0M");
  });

  it("formate un chiffre d'affaires typique", () => {
    expect(formatCurrencyShort(45300000)).toBe("45.3M");
  });
});

// ============================================================================
// Tests de calculateTax (TVA Gabon)
// ============================================================================

describe("calculateTax", () => {
  it("calcule avec le taux par defaut (18% Gabon)", () => {
    const result = calculateTax(10000);

    expect(result.ht).toBe(10000);
    expect(result.tva).toBe(1800);
    expect(result.ttc).toBe(11800);
  });

  it("calcule avec un taux personnalise (10%)", () => {
    const result = calculateTax(10000, 0.1);

    expect(result.ht).toBe(10000);
    expect(result.tva).toBe(1000);
    expect(result.ttc).toBe(11000);
  });

  it("gere le taux zero (exonere)", () => {
    const result = calculateTax(10000, 0);

    expect(result.ht).toBe(10000);
    expect(result.tva).toBe(0);
    expect(result.ttc).toBe(10000);
  });

  it("arrondit la TVA au FCFA (entier)", () => {
    const result = calculateTax(123, 0.18);

    // 123 * 0.18 = 22.14 -> Math.round = 22
    expect(result.tva).toBe(22);
    expect(result.ttc).toBe(145);
  });

  it("gere un montant HT de zero", () => {
    const result = calculateTax(0);

    expect(result.ht).toBe(0);
    expect(result.tva).toBe(0);
    expect(result.ttc).toBe(0);
  });

  it("verifie la coherence HT + TVA = TTC pour plusieurs combinaisons", () => {
    const testAmounts = [100, 1234, 5678, 10000, 99999, 500000];
    const testRates = [0, 0.1, 0.18];

    for (const amount of testAmounts) {
      for (const rate of testRates) {
        const result = calculateTax(amount, rate);
        expect(result.ht + result.tva).toBe(result.ttc);
      }
    }
  });

  it("retourne toujours les trois champs ht, tva, ttc", () => {
    const result = calculateTax(5000);
    expect(result).toHaveProperty("ht");
    expect(result).toHaveProperty("tva");
    expect(result).toHaveProperty("ttc");
  });

  it("gere les grands montants", () => {
    const result = calculateTax(999999999, 0.18);
    expect(result.ht).toBe(999999999);
    expect(result.tva).toBe(Math.round(999999999 * 0.18));
    expect(result.ttc).toBe(999999999 + Math.round(999999999 * 0.18));
  });

  it("calcule correctement pour des prix typiques au Gabon", () => {
    // Biere: 1500 FCFA HT
    const biere = calculateTax(1500);
    expect(biere.tva).toBe(270);
    expect(biere.ttc).toBe(1770);

    // Poulet braise: 5000 FCFA HT
    const poulet = calculateTax(5000);
    expect(poulet.tva).toBe(900);
    expect(poulet.ttc).toBe(5900);
  });
});
