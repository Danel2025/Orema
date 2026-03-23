/**
 * Router d'impression - Migré vers Supabase
 */

import { createClient } from "@/lib/db";
import type { PrinterConfig, PrintLineItem } from "./types";

export interface PrinterWithCategories extends PrinterConfig {
  categorieIds: string[];
}

export interface PrintRouteResult {
  printer: PrinterConfig | null;
  lines: PrintLineItem[];
  error?: string;
}

function mapImprimante(
  imp: Record<string, unknown>,
  categorieIds: string[] = []
): PrinterWithCategories {
  return {
    id: imp.id as string,
    nom: imp.nom as string,
    type: imp.type as "TICKET" | "CUISINE" | "BAR",
    typeConnexion: imp.type_connexion as "USB" | "RESEAU" | "SERIE" | "BLUETOOTH",
    adresseIP: imp.adresse_ip as string | null,
    port: imp.port as number | null,
    pathUSB: imp.path_usb as string | null,
    largeurPapier: imp.largeur_papier as number,
    actif: imp.actif as boolean,
    categorieIds,
  };
}

export async function getActivePrinters(etablissementId: string): Promise<PrinterWithCategories[]> {
  const supabase = await createClient();
  const { data: imprimantes } = await supabase
    .from("imprimantes")
    .select("*, categories(id)")
    .eq("etablissement_id", etablissementId)
    .eq("actif", true);

  return (imprimantes || []).map((imp) =>
    mapImprimante(
      imp,
      ((imp.categories || []) as { id: string }[]).map((c) => c.id)
    )
  );
}

export async function getPrinterById(printerId: string): Promise<PrinterConfig | null> {
  const supabase = await createClient();
  const { data: imprimante } = await supabase
    .from("imprimantes")
    .select("*")
    .eq("id", printerId)
    .single();
  if (!imprimante) return null;
  return mapImprimante(imprimante);
}

export async function findPrinterByType(
  etablissementId: string,
  type: "TICKET" | "CUISINE" | "BAR"
): Promise<PrinterConfig | null> {
  const supabase = await createClient();
  const { data: imprimante } = await supabase
    .from("imprimantes")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .eq("type", type)
    .eq("actif", true)
    .limit(1)
    .single();

  if (!imprimante) return null;
  return mapImprimante(imprimante);
}

export function findTicketPrinter(etablissementId: string) {
  return findPrinterByType(etablissementId, "TICKET");
}

export function findKitchenPrinter(etablissementId: string) {
  return findPrinterByType(etablissementId, "CUISINE");
}

export function findBarPrinter(etablissementId: string) {
  return findPrinterByType(etablissementId, "BAR");
}

export type DestinationPreparation = "CUISINE" | "BAR" | "AUCUNE" | "AUTO";

export interface PrintLineItemWithDestination extends PrintLineItem {
  destinationPreparation?: DestinationPreparation;
}

export async function routeLinesToPrinters(
  etablissementId: string,
  lines: (PrintLineItem | PrintLineItemWithDestination)[]
): Promise<PrintRouteResult[]> {
  const printers = await getActivePrinters(etablissementId);
  const results: PrintRouteResult[] = [];
  const printerLinesMap = new Map<string, PrintLineItem[]>();

  const defaultKitchenPrinter = printers.find((p) => p.type === "CUISINE");
  const defaultBarPrinter = printers.find((p) => p.type === "BAR");

  for (const line of lines) {
    const destination = (line as PrintLineItemWithDestination).destinationPreparation;

    // Si destination = AUCUNE, ne pas router cette ligne
    if (destination === "AUCUNE") continue;

    let targetPrinter: PrinterWithCategories | undefined;

    // 1. Routage explicite par destination_preparation
    if (destination === "CUISINE" && defaultKitchenPrinter) {
      targetPrinter = defaultKitchenPrinter;
    } else if (destination === "BAR" && defaultBarPrinter) {
      targetPrinter = defaultBarPrinter;
    }

    // 2. Sinon (AUTO ou absent) : comportement existant
    if (!targetPrinter) {
      if (line.categorieId)
        targetPrinter = printers.find((p) => p.categorieIds.includes(line.categorieId!));

      if (!targetPrinter) {
        const isBarItem = isBarCategory(line.categorieNom);
        if (isBarItem && defaultBarPrinter) targetPrinter = defaultBarPrinter;
        else if (defaultKitchenPrinter) targetPrinter = defaultKitchenPrinter;
      }
    }

    if (targetPrinter) {
      const existingLines = printerLinesMap.get(targetPrinter.id) || [];
      existingLines.push(line);
      printerLinesMap.set(targetPrinter.id, existingLines);
    }
  }

  for (const [printerId, printerLines] of printerLinesMap) {
    const printer = printers.find((p) => p.id === printerId);
    if (printer) results.push({ printer, lines: printerLines });
  }

  const routedLineIds = new Set(results.flatMap((r) => r.lines.map((l) => l.produitNom)));
  const unroutedLines = lines.filter((l) => {
    // Les lignes avec destination AUCUNE sont volontairement non routées
    const dest = (l as PrintLineItemWithDestination).destinationPreparation;
    if (dest === "AUCUNE") return false;
    return !routedLineIds.has(l.produitNom);
  });
  if (unroutedLines.length > 0)
    results.push({
      printer: null,
      lines: unroutedLines,
      error: "Aucune imprimante disponible pour ces produits",
    });

  return results;
}

export function isBarCategory(categoryName: string | undefined | null): boolean {
  if (!categoryName) return false;
  const nomLower = categoryName.toLowerCase();
  const barKeywords = [
    "boisson",
    "bar",
    "cocktail",
    "vin",
    "biere",
    "alcool",
    "soft",
    "jus",
    "cafe",
    "the",
    "eau",
    "soda",
    "aperitif",
    "digestif",
    "spiritueux",
  ];
  return barKeywords.some((keyword) => nomLower.includes(keyword));
}

export function isCuisineCategory(categoryName: string | undefined | null): boolean {
  return !isBarCategory(categoryName);
}

export async function isPrinterAvailable(printer: PrinterConfig): Promise<boolean> {
  return printer.actif;
}

export async function getCategoriesForPrinter(
  printerId: string
): Promise<Array<{ id: string; nom: string }>> {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, nom")
    .eq("imprimante_id", printerId);
  return categories || [];
}

export async function assignCategoryToPrinter(
  categorieId: string,
  imprimanteId: string | null
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("categories").update({ imprimante_id: imprimanteId }).eq("id", categorieId);
}
