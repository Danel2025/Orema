/**
 * Tests unitaires pour le module CSV (parser et exporter)
 *
 * Teste le parsing de valeurs, la validation de lignes produit,
 * la detection d'encodage et le mapping vers Supabase.
 */

import { describe, it, expect } from "vitest";
import {
  validateProductRow,
  mapCSVToProduct,
  detectEncoding,
} from "@/lib/csv/parser";
import { generateCSV, generateFilename } from "@/lib/csv/exporter";

// ============================================================================
// Parsing de valeurs CSV
// ============================================================================

describe("Parsing de valeurs booleennes CSV", () => {
  // Replique la logique interne de parseBooleanValue
  function parseBooleanValue(value: unknown): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const lower = value.toLowerCase().trim();
      return (
        lower === "oui" ||
        lower === "true" ||
        lower === "1" ||
        lower === "yes"
      );
    }
    return false;
  }

  it("parse 'Oui' comme true", () => {
    expect(parseBooleanValue("Oui")).toBe(true);
  });

  it("parse 'Non' comme false", () => {
    expect(parseBooleanValue("Non")).toBe(false);
  });

  it("parse 'true' comme true", () => {
    expect(parseBooleanValue("true")).toBe(true);
  });

  it("parse 'false' comme false", () => {
    expect(parseBooleanValue("false")).toBe(false);
  });

  it("parse '1' comme true", () => {
    expect(parseBooleanValue("1")).toBe(true);
  });

  it("parse '0' comme false", () => {
    expect(parseBooleanValue("0")).toBe(false);
  });

  it("parse boolean true comme true", () => {
    expect(parseBooleanValue(true)).toBe(true);
  });

  it("parse boolean false comme false", () => {
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("parse number 1 comme true", () => {
    expect(parseBooleanValue(1)).toBe(true);
  });

  it("parse undefined comme false", () => {
    expect(parseBooleanValue(undefined)).toBe(false);
  });
});

describe("Parsing de valeurs numeriques CSV", () => {
  // Replique parseIntValue
  function parseIntValue(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") return Math.round(value);

    const str = String(value)
      .replace(/\s/g, "")
      .replace(/,/g, "")
      .replace(/FCFA/gi, "")
      .trim();

    const num = parseInt(str, 10);
    return isNaN(num) ? null : num;
  }

  it("parse un nombre simple", () => {
    expect(parseIntValue("5000")).toBe(5000);
  });

  it("parse un nombre avec separateur de milliers (espace)", () => {
    expect(parseIntValue("15 000")).toBe(15000);
  });

  it("parse un nombre avec separateur de milliers (virgule)", () => {
    expect(parseIntValue("15,000")).toBe(15000);
  });

  it("supprime le suffixe FCFA", () => {
    expect(parseIntValue("5000 FCFA")).toBe(5000);
    expect(parseIntValue("5000FCFA")).toBe(5000);
  });

  it("retourne null pour une chaine vide", () => {
    expect(parseIntValue("")).toBeNull();
  });

  it("retourne null pour null/undefined", () => {
    expect(parseIntValue(null)).toBeNull();
    expect(parseIntValue(undefined)).toBeNull();
  });

  it("retourne null pour une chaine non numerique", () => {
    expect(parseIntValue("abc")).toBeNull();
  });

  it("arrondit les nombres decimaux", () => {
    expect(parseIntValue(5.7)).toBe(6);
    expect(parseIntValue(5.3)).toBe(5);
  });
});

describe("Parsing du taux TVA", () => {
  // Replique parseTauxTva
  function parseTauxTva(value: unknown): string {
    const parseIntValue = (v: unknown) => {
      if (v === null || v === undefined || v === "") return null;
      if (typeof v === "number") return Math.round(v);
      const str = String(v).trim();
      const num = parseInt(str, 10);
      return isNaN(num) ? null : num;
    };

    const num = parseIntValue(value);
    if (num === 0) return "EXONERE";
    if (num === 10) return "REDUIT";
    if (num === 18) return "STANDARD";

    if (typeof value === "string") {
      const lower = value.toLowerCase().trim();
      if (lower === "exonere" || lower === "exonéré") return "EXONERE";
      if (lower === "reduit" || lower === "réduit") return "REDUIT";
      if (lower === "standard") return "STANDARD";
    }

    return "STANDARD";
  }

  it("mappe 0 vers EXONERE", () => {
    expect(parseTauxTva(0)).toBe("EXONERE");
    expect(parseTauxTva("0")).toBe("EXONERE");
  });

  it("mappe 10 vers REDUIT", () => {
    expect(parseTauxTva(10)).toBe("REDUIT");
    expect(parseTauxTva("10")).toBe("REDUIT");
  });

  it("mappe 18 vers STANDARD", () => {
    expect(parseTauxTva(18)).toBe("STANDARD");
    expect(parseTauxTva("18")).toBe("STANDARD");
  });

  it("accepte les chaines en francais", () => {
    expect(parseTauxTva("exonere")).toBe("EXONERE");
    expect(parseTauxTva("exonéré")).toBe("EXONERE");
    expect(parseTauxTva("reduit")).toBe("REDUIT");
    expect(parseTauxTva("réduit")).toBe("REDUIT");
    expect(parseTauxTva("standard")).toBe("STANDARD");
  });

  it("retourne STANDARD par defaut pour une valeur inconnue", () => {
    expect(parseTauxTva(15)).toBe("STANDARD");
    expect(parseTauxTva("inconnu")).toBe("STANDARD");
  });
});

// ============================================================================
// Validation de lignes produit CSV
// ============================================================================

describe("validateProductRow", () => {
  it("valide une ligne produit correcte", () => {
    const row = {
      nom: "Poulet braise",
      prixvente: "5000",
      categorie: "Plats",
      tauxtva: "18",
      gererstock: "Oui",
      stockactuel: "20",
    };

    const result = validateProductRow(row, 2);

    expect(result.errors).toHaveLength(0);
    expect(result.product).not.toBeNull();
    expect(result.product?.nom).toBe("Poulet braise");
    expect(result.product?.prixVente).toBe(5000);
    expect(result.product?.tauxTva).toBe("STANDARD");
    expect(result.product?.gererStock).toBe(true);
  });

  it("rejette une ligne sans nom", () => {
    const row = {
      nom: "",
      prixvente: "5000",
      categorie: "Plats",
    };

    const result = validateProductRow(row, 2);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].champ).toBe("nom");
  });

  it("rejette un nom trop court", () => {
    const row = {
      nom: "A",
      prixvente: "5000",
      categorie: "Plats",
    };

    const result = validateProductRow(row, 2);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejette une ligne sans prix de vente", () => {
    const row = {
      nom: "Poulet",
      prixvente: "",
      categorie: "Plats",
    };

    const result = validateProductRow(row, 2);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.champ === "prixVente")).toBe(true);
  });

  it("rejette une ligne sans categorie", () => {
    const row = {
      nom: "Poulet",
      prixvente: "5000",
      categorie: "",
    };

    const result = validateProductRow(row, 2);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.champ === "categorie")).toBe(true);
  });

  it("genere un warning pour un prix d'achat invalide", () => {
    const row = {
      nom: "Poulet braise",
      prixvente: "5000",
      categorie: "Plats",
      prixachat: "-500",
    };

    const result = validateProductRow(row, 2);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("genere un warning pour stock actuel inférieur au minimum", () => {
    const row = {
      nom: "Biere",
      prixvente: "2000",
      categorie: "Boissons",
      stockactuel: "3",
      stockmin: "10",
    };

    const result = validateProductRow(row, 2);
    expect(result.warnings.some((w) => w.champ === "stockActuel")).toBe(true);
  });

  it("accepte les noms de colonnes en camelCase", () => {
    const row = {
      nom: "Test Produit",
      prixVente: "3000",
      categorie: "Test",
      tauxTva: "18",
      gererStock: "true",
      stockActuel: "10",
      stockMin: "2",
      stockMax: "50",
      codeBarre: "1234567890",
    };

    const result = validateProductRow(row, 2);
    expect(result.errors).toHaveLength(0);
    expect(result.product?.codeBarre).toBe("1234567890");
  });

  it("rejette un stock negatif", () => {
    const row = {
      nom: "Test",
      prixvente: "5000",
      categorie: "Test",
      stockactuel: "-5",
    };

    const result = validateProductRow(row, 2);
    expect(result.errors.some((e) => e.champ === "stockActuel")).toBe(true);
  });
});

// ============================================================================
// Mapping CSV vers format Supabase
// ============================================================================

describe("mapCSVToProduct", () => {
  it("convertit un produit CSV en format Supabase (snake_case)", () => {
    const product = {
      nom: "Poulet braise",
      description: "Delicieux poulet",
      codeBarre: "123456",
      prixVente: 5000,
      prixAchat: 2500,
      tauxTva: "STANDARD" as const,
      categorie: "Plats",
      gererStock: true,
      stockActuel: 20,
      stockMin: 5,
      stockMax: 100,
      unite: "portions",
      disponibleDirect: true,
      disponibleTable: true,
      disponibleLivraison: false,
      disponibleEmporter: true,
    };

    const result = mapCSVToProduct(product, "cat-1", "etab-1");

    expect(result.nom).toBe("Poulet braise");
    expect(result.code_barre).toBe("123456");
    expect(result.prix_vente).toBe(5000);
    expect(result.prix_achat).toBe(2500);
    expect(result.taux_tva).toBe("STANDARD");
    expect(result.categorie_id).toBe("cat-1");
    expect(result.etablissement_id).toBe("etab-1");
    expect(result.gerer_stock).toBe(true);
    expect(result.disponible_livraison).toBe(false);
    expect(result.actif).toBe(true);
  });
});

// ============================================================================
// Detection d'encodage
// ============================================================================

describe("detectEncoding", () => {
  it("detecte un fichier UTF-8 avec BOM", () => {
    const buffer = new Uint8Array([0xef, 0xbb, 0xbf, 0x41, 0x42]);
    expect(detectEncoding(buffer.buffer)).toBe("UTF-8");
  });

  it("detecte un fichier UTF-16 LE avec BOM", () => {
    const buffer = new Uint8Array([0xff, 0xfe, 0x41, 0x00]);
    expect(detectEncoding(buffer.buffer)).toBe("UTF-16LE");
  });

  it("detecte UTF-8 par defaut pour du texte ASCII pur", () => {
    const buffer = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
    expect(detectEncoding(buffer.buffer)).toBe("UTF-8");
  });
});

// ============================================================================
// Export CSV
// ============================================================================

describe("generateCSV", () => {
  it("genere un CSV avec headers et données", () => {
    const data = [
      { nom: "Poulet", prix: 5000, actif: true },
      { nom: "Poisson", prix: 8000, actif: false },
    ];

    const columns = [
      { key: "nom" as const, header: "Nom" },
      { key: "prix" as const, header: "Prix" },
      { key: "actif" as const, header: "Actif" },
    ];

    const csv = generateCSV(data, columns, { includeBOM: false });

    expect(csv).toContain("Nom");
    expect(csv).toContain("Prix");
    expect(csv).toContain("Poulet");
    expect(csv).toContain("5000");
    expect(csv).toContain("Oui"); // boolean true -> "Oui"
    expect(csv).toContain("Non"); // boolean false -> "Non"
  });

  it("ajoute le BOM UTF-8 par defaut", () => {
    const csv = generateCSV(
      [{ a: "test" }],
      [{ key: "a" as const, header: "A" }]
    );

    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("n'ajoute pas le BOM si desactive", () => {
    const csv = generateCSV(
      [{ a: "test" }],
      [{ key: "a" as const, header: "A" }],
      { includeBOM: false }
    );

    expect(csv.startsWith("\uFEFF")).toBe(false);
  });
});

describe("generateFilename", () => {
  it("genere un nom de fichier avec la date du jour", () => {
    const filename = generateFilename("produits");

    expect(filename).toMatch(/^produits_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
