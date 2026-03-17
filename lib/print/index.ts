/**
 * Module d'impression Orema N+ POS
 *
 * Ce module gere toute l'impression pour le systeme POS:
 * - Generation de commandes ESC/POS
 * - Tickets clients
 * - Bons cuisine et bar
 * - Rapports Z
 * - Routage vers les imprimantes
 *
 * @example
 * ```ts
 * import { generateTicketClient, sendToPrinter, findTicketPrinter } from '@/lib/print';
 *
 * // Generer et imprimer un ticket
 * const ticketData = createTicketDataFromVente(vente, etablissement);
 * const commands = generateTicketClient(ticketData);
 * const printer = await findTicketPrinter(etablissementId);
 * if (printer) {
 *   await sendToPrinter(printer, commands);
 * }
 * ```
 */

// Types
export * from "./types";

// Generateur ESC/POS
export {
  ESCPOS,
  ESCPOSBuilder,
  createESCPOSBuilder,
  formatPrintAmount,
  formatPrintDate,
  formatPrintTime,
  formatPrintDateTime,
} from "./escpos";

// Ticket client
export {
  generateTicketClient,
  generateTestTicket,
  createTicketDataFromVente,
} from "./ticket-client";

// Addition (pre-note)
export {
  generateAddition,
  createAdditionDataFromCart,
} from "./addition";

// Bon cuisine
export {
  generateBonCuisine,
  filterLignesCuisine,
  createBonCuisineDataFromVente,
} from "./bon-cuisine";

// Bon bar
export {
  generateBonBar,
  filterLignesBar,
  createBonBarDataFromVente,
  isBarCategory,
  isCuisineCategory,
} from "./bon-bar";

// Rapport Z
export {
  generateRapportZ,
  createRapportZDataFromSession,
} from "./rapport-z";

// Router
export {
  getActivePrinters,
  getPrinterById,
  findPrinterByType,
  findTicketPrinter,
  findKitchenPrinter,
  findBarPrinter,
  routeLinesToPrinters,
  isPrinterAvailable,
  getCategoriesForPrinter,
  assignCategoryToPrinter,
  type PrinterWithCategories,
  type PrintRouteResult,
} from "./router";

// Sender
export {
  sendToPrinter,
  testPrinterConnection,
  openCashDrawer,
  type PrintSendOptions,
} from "./sender";

// Hooks (client-side only)
// Note: Ces hooks doivent etre importes separement avec "use client"
// import { usePrint, useAutoPrint, usePrinterTest } from "@/lib/print/hooks";

// Web APIs (client-side only)
// Ces modules utilisent les Web APIs du navigateur pour communiquer
// directement avec les imprimantes USB/Serie/Bluetooth.
// import { isWebSerialSupported, requestSerialPort, sendViaWebSerial } from "@/lib/print/web-serial";
// import { isWebBluetoothSupported, requestBluetoothPrinter, sendViaWebBluetooth } from "@/lib/print/web-bluetooth";
// import { getWebPrinterManager } from "@/lib/print/web-printer-manager";
// import { useWebPrinter } from "@/hooks/useWebPrinter";
