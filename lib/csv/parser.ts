/**
 * Module de parsing CSV avec PapaParse
 * Orema N+ - Systeme POS
 */

import Papa from "papaparse";
import type {
  CSVProductRow,
  ValidatedProduct,
  CSVImportResult,
  CSVValidationError,
  CSVValidationWarning,
  CSVParseConfig,
  TAUX_TVA_MAP,
} from "./types";
import { type TauxTva, TAUX_TVA } from "@/lib/db/types";

// ============================================================================
// Configuration par defaut
// ============================================================================

const DEFAULT_PARSE_CONFIG: CSVParseConfig = {
  header: true,
  dynamicTyping: false, // On gere nous-memes la conversion pour plus de controle
  skipEmptyLines: "greedy",
  comments: "#",
  encoding: "UTF-8",
  transformHeader: (header: string) => header.trim().toLowerCase(),
};

// ============================================================================
// Helpers pour la validation
// ============================================================================

/**
 * Convertit une valeur booleenne depuis un CSV (Oui/Non, true/false, 1/0)
 */
function parseBooleanValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return lower === "oui" || lower === "true" || lower === "1" || lower === "yes";
  }
  return false;
}

/**
 * Parse un nombre entier depuis une valeur CSV
 * Accepte les formats francais (1 000) et internationaux (1,000 ou 1000)
 */
function parseIntValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Math.round(value);

  const str = String(value)
    .replace(/\s/g, "") // Supprime les espaces (separateurs de milliers FR)
    .replace(/,/g, "") // Supprime les virgules (separateurs de milliers EN)
    .replace(/FCFA/gi, "") // Supprime le symbole FCFA
    .trim();

  const num = parseInt(str, 10);
  return isNaN(num) ? null : num;
}

/**
 * Convertit un taux TVA vers le type TauxTva
 */
function parseTauxTva(value: unknown): TauxTva {
  const num = parseIntValue(value);

  // Mapping direct des valeurs connues
  if (num === 0) return TAUX_TVA.EXONERE;
  if (num === 10) return TAUX_TVA.REDUIT;
  if (num === 18) return TAUX_TVA.STANDARD;

  // Gestion des chaines
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (lower === "exonere" || lower === "exonéré") return TAUX_TVA.EXONERE;
    if (lower === "reduit" || lower === "réduit") return TAUX_TVA.REDUIT;
    if (lower === "standard") return TAUX_TVA.STANDARD;
  }

  // Valeur par defaut: STANDARD (18%)
  return TAUX_TVA.STANDARD;
}

/**
 * Nettoie une chaine de caracteres
 */
function cleanString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

// ============================================================================
// Parsing du fichier CSV
// ============================================================================

/**
 * Parse un fichier CSV de produits
 * @param file - Fichier ou contenu CSV
 * @returns Promesse avec le resultat du parsing
 */
export function parseProductsCSV(file: File | string): Promise<CSVImportResult> {
  return new Promise((resolve) => {
    const errors: CSVValidationError[] = [];
    const warnings: CSVValidationWarning[] = [];
    const produits: ValidatedProduct[] = [];

    Papa.parse(file, {
      ...DEFAULT_PARSE_CONFIG,
      complete: (results) => {
        const { data, errors: parseErrors } = results;

        // Ajouter les erreurs de parsing
        parseErrors.forEach((err) => {
          errors.push({
            ligne: (err.row ?? 0) + 2, // +2 car header + index 0
            champ: "parsing",
            message: err.message,
          });
        });

        // Valider chaque ligne
        let ligneIndex = 2; // Commence a 2 (header = ligne 1)

        for (const row of data as Record<string, unknown>[]) {
          // Ignorer les lignes vides
          if (!row || Object.keys(row).length === 0) {
            ligneIndex++;
            continue;
          }

          // Verifier si la ligne a au moins le nom
          const nom = cleanString(row.nom);
          if (!nom) {
            errors.push({
              ligne: ligneIndex,
              champ: "nom",
              message: "Le nom du produit est requis",
            });
            ligneIndex++;
            continue;
          }

          const validationResult = validateProductRow(
            row as CSVProductRow & { [key: string]: unknown },
            ligneIndex
          );

          if (validationResult.errors.length > 0) {
            errors.push(...validationResult.errors);
          }

          if (validationResult.warnings.length > 0) {
            warnings.push(...validationResult.warnings);
          }

          if (validationResult.product) {
            produits.push(validationResult.product);
          }

          ligneIndex++;
        }

        resolve({
          success: errors.length === 0,
          totalLignes: (data as unknown[]).length,
          lignesValides: produits.length,
          lignesEnErreur: errors.filter(
            (e, i, arr) => arr.findIndex((x) => x.ligne === e.ligne) === i
          ).length,
          produits,
          errors,
          warnings,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          totalLignes: 0,
          lignesValides: 0,
          lignesEnErreur: 1,
          produits: [],
          errors: [
            {
              ligne: 0,
              champ: "fichier",
              message: `Erreur de lecture du fichier: ${error.message}`,
            },
          ],
          warnings: [],
        });
      },
    });
  });
}

/**
 * Parse un contenu CSV brut (string)
 */
export function parseCSVString<T = Record<string, unknown>>(
  content: string,
  config?: Partial<CSVParseConfig>
): Promise<{
  data: T[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}> {
  return new Promise((resolve) => {
    const finalConfig = { ...DEFAULT_PARSE_CONFIG, ...config };

    Papa.parse(content, {
      ...finalConfig,
      complete: (results) => {
        resolve({
          data: results.data as T[],
          errors: results.errors,
          meta: results.meta,
        });
      },
    });
  });
}

// ============================================================================
// Validation d'une ligne de produit
// ============================================================================

interface ProductValidationResult {
  product: ValidatedProduct | null;
  errors: CSVValidationError[];
  warnings: CSVValidationWarning[];
}

/**
 * Valide une ligne de produit CSV
 */
export function validateProductRow(
  row: CSVProductRow & { [key: string]: unknown },
  ligne: number
): ProductValidationResult {
  const errors: CSVValidationError[] = [];
  const warnings: CSVValidationWarning[] = [];

  // 1. Validation du nom (requis)
  const nom = cleanString(row.nom);
  if (!nom) {
    errors.push({
      ligne,
      champ: "nom",
      message: "Le nom du produit est requis",
    });
    return { product: null, errors, warnings };
  }

  if (nom.length < 2) {
    errors.push({
      ligne,
      champ: "nom",
      message: "Le nom doit contenir au moins 2 caracteres",
      valeur: nom,
    });
  }

  if (nom.length > 100) {
    errors.push({
      ligne,
      champ: "nom",
      message: "Le nom ne peut pas depasser 100 caracteres",
      valeur: nom.substring(0, 50) + "...",
    });
  }

  // 2. Validation du prix de vente (requis, entier positif)
  const prixVente = parseIntValue(row.prixvente ?? row.prixVente);
  if (prixVente === null || prixVente <= 0) {
    errors.push({
      ligne,
      champ: "prixVente",
      message: "Le prix de vente doit être un entier positif",
      valeur: String(row.prixvente ?? row.prixVente ?? ""),
    });
  }

  // 3. Validation de la categorie (requis)
  const categorie = cleanString(row.categorie);
  if (!categorie) {
    errors.push({
      ligne,
      champ: "categorie",
      message: "La catégorie est requise",
    });
  }

  // Si erreurs critiques, retourner
  if (errors.length > 0) {
    return { product: null, errors, warnings };
  }

  // 4. Validation du prix d'achat (optionnel, entier positif)
  const prixAchat = parseIntValue(row.prixachat ?? row.prixAchat);
  if (prixAchat !== null && prixAchat <= 0) {
    warnings.push({
      ligne,
      champ: "prixAchat",
      message: "Le prix d'achat devrait être un entier positif",
    });
  }

  // 5. Validation du taux TVA
  const tauxTva = parseTauxTva(row.tauxtva ?? row.tauxTva);

  // 6. Validation des stocks
  const stockActuel = parseIntValue(row.stockactuel ?? row.stockActuel);
  const stockMin = parseIntValue(row.stockmin ?? row.stockMin);
  const stockMax = parseIntValue(row.stockmax ?? row.stockMax);

  if (stockActuel !== null && stockActuel < 0) {
    errors.push({
      ligne,
      champ: "stockActuel",
      message: "Le stock actuel ne peut pas être négatif",
      valeur: String(row.stockactuel ?? row.stockActuel),
    });
  }

  if (stockMin !== null && stockActuel !== null && stockActuel < stockMin) {
    warnings.push({
      ligne,
      champ: "stockActuel",
      message: `Stock actuel (${stockActuel}) inférieur au stock minimum (${stockMin})`,
    });
  }

  if (stockMax !== null && stockMin !== null && stockMax < stockMin) {
    warnings.push({
      ligne,
      champ: "stockMax",
      message: "Le stock maximum est inférieur au stock minimum",
    });
  }

  // Construire le produit valide
  const product: ValidatedProduct = {
    nom: nom!,
    description: cleanString(row.description),
    codeBarre: cleanString(row.codebarre ?? row.codeBarre),
    prixVente: prixVente!,
    prixAchat,
    tauxTva,
    categorie: categorie!,
    gererStock: parseBooleanValue(row.gererstock ?? row.gererStock),
    stockActuel,
    stockMin,
    stockMax,
    unite: cleanString(row.unite),
    disponibleDirect: parseBooleanValue(row.disponibledirect ?? row.disponibleDirect ?? true),
    disponibleTable: parseBooleanValue(row.disponibletable ?? row.disponibleTable ?? true),
    disponibleLivraison: parseBooleanValue(
      row.disponiblelivraison ?? row.disponibleLivraison ?? true
    ),
    disponibleEmporter: parseBooleanValue(row.disponibleemporter ?? row.disponibleEmporter ?? true),
  };

  return { product, errors, warnings };
}

// ============================================================================
// Mapping vers le format Supabase
// ============================================================================

/**
 * Convertit un produit valide vers le format attendu par Supabase (snake_case)
 */
export function mapCSVToProduct(
  product: ValidatedProduct,
  categorieId: string,
  etablissementId: string
) {
  return {
    nom: product.nom,
    description: product.description,
    code_barre: product.codeBarre,
    prix_vente: product.prixVente,
    prix_achat: product.prixAchat,
    taux_tva: product.tauxTva,
    categorie_id: categorieId,
    etablissement_id: etablissementId,
    gerer_stock: product.gererStock,
    stock_actuel: product.stockActuel,
    stock_min: product.stockMin,
    stock_max: product.stockMax,
    unite: product.unite,
    disponible_direct: product.disponibleDirect,
    disponible_table: product.disponibleTable,
    disponible_livraison: product.disponibleLivraison,
    disponible_emporter: product.disponibleEmporter,
    actif: true,
  };
}

// ============================================================================
// Detection de l'encodage et du delimiteur
// ============================================================================

/**
 * Detecte l'encodage d'un fichier (UTF-8, ISO-8859-1, etc.)
 * Pour le moment, on suppose UTF-8 par defaut
 */
export function detectEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // Verifier le BOM UTF-8
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return "UTF-8";
  }

  // Verifier le BOM UTF-16 LE
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return "UTF-16LE";
  }

  // Par defaut, on suppose UTF-8 ou ISO-8859-1 (Latin-1)
  // Heuristique simple: verifier si des octets > 127 forment des sequences UTF-8 valides
  let isUtf8 = true;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] > 127) {
      // Verifier si c'est une sequence UTF-8 valide
      if (bytes[i] >= 0xc0 && bytes[i] <= 0xdf) {
        if (i + 1 >= bytes.length || bytes[i + 1] < 0x80 || bytes[i + 1] > 0xbf) {
          isUtf8 = false;
          break;
        }
        i++;
      } else if (bytes[i] >= 0xe0 && bytes[i] <= 0xef) {
        if (
          i + 2 >= bytes.length ||
          bytes[i + 1] < 0x80 ||
          bytes[i + 1] > 0xbf ||
          bytes[i + 2] < 0x80 ||
          bytes[i + 2] > 0xbf
        ) {
          isUtf8 = false;
          break;
        }
        i += 2;
      } else {
        isUtf8 = false;
        break;
      }
    }
  }

  return isUtf8 ? "UTF-8" : "ISO-8859-1";
}

/**
 * Lit un fichier et detecte son encodage
 */
export async function readFileWithEncoding(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const encoding = detectEncoding(buffer);

  const decoder = new TextDecoder(encoding);
  return decoder.decode(buffer);
}
