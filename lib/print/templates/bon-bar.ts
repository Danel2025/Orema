/**
 * Template de generation de bon bar ESC/POS
 * Utilise l'API node-thermal-printer pour generer les commandes
 *
 * Reutilise le template bon-cuisine avec destination "BAR"
 */

import type { BonCuisineData } from "../types";
import { generateBonCuisineCommands } from "./bon-cuisine";

 
export function generateBonBarCommands(
  printer: any,
  data: BonCuisineData,
  width: number
): void {
  generateBonCuisineCommands(printer, data, width, "BAR");
}
