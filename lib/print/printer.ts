/**
 * Module principal d'impression thermique ESC/POS
 * Oréma N+ - POS System
 *
 * Supporte les connexions USB, Réseau (TCP), Série et Bluetooth
 */

import ThermalPrinter from "node-thermal-printer";
import type {
  PrinterConfig,
  PrintResult,
  TicketData,
  BonCuisineData,
  RapportZData,
  EtablissementInfo,
} from "./types";
import { generateTicketCommands } from "./templates/ticket";
import { generateBonCuisineCommands } from "./templates/bon-cuisine";
import { generateRapportZCommands } from "./templates/rapport-z";

const { printer: Printer, types: PrinterTypes } = ThermalPrinter;

/**
 * Construit l'interface de connexion selon le type
 */
function buildInterface(config: PrinterConfig): string {
  switch (config.typeConnexion) {
    case "RESEAU":
      if (!config.adresseIP) {
        throw new Error("Adresse IP requise pour connexion réseau");
      }
      const port = config.port || 9100;
      return `tcp://${config.adresseIP}:${port}`;

    case "USB":
      if (!config.pathUSB) {
        throw new Error("Chemin USB requis");
      }
      // Windows: \\.\COM1 ou \\.\USB001
      // Linux: /dev/usb/lp0
      return config.pathUSB;

    case "SERIE":
      if (!config.pathUSB) {
        throw new Error("Port série requis");
      }
      return config.pathUSB;

    case "BLUETOOTH":
      // Bluetooth utilise généralement un port série virtuel
      if (!config.pathUSB) {
        throw new Error("Adresse Bluetooth requise");
      }
      return config.pathUSB;

    default:
      throw new Error(`Type de connexion non supporté: ${config.typeConnexion}`);
  }
}

/**
 * Calcule la largeur en caractères selon la largeur du papier
 */
function getCharacterWidth(largeurPapier: number): number {
  switch (largeurPapier) {
    case 58:
      return 32; // 58mm = 32 caractères
    case 76:
      return 40; // 76mm = 40 caractères
    case 80:
    default:
      return 48; // 80mm = 48 caractères
  }
}

/**
 * Crée une instance de l'imprimante
 */
export function createPrinter(config: PrinterConfig) {
  const printerInterface = buildInterface(config);
  const width = getCharacterWidth(config.largeurPapier);

  return new Printer({
    type: PrinterTypes.EPSON, // Compatible avec la plupart des imprimantes thermiques
    interface: printerInterface,
    width,
    removeSpecialCharacters: false,
    lineCharacter: "-",
    options: {
      timeout: 5000, // 5 secondes timeout
    },
  });
}

/**
 * Vérifie si l'imprimante est connectée
 */
export async function checkPrinterConnection(config: PrinterConfig): Promise<boolean> {
  try {
    const printer = createPrinter(config);
    const isConnected = await printer.isPrinterConnected();
    return isConnected;
  } catch {
    return false;
  }
}

/**
 * Imprime un ticket client
 */
export async function printTicket(
  config: PrinterConfig,
  etablissement: EtablissementInfo,
  data: TicketData
): Promise<PrintResult> {
  try {
    const printer = createPrinter(config);
    const width = getCharacterWidth(config.largeurPapier);

    // Générer les commandes d'impression
    generateTicketCommands(printer, etablissement, data, width);

    // Exécuter l'impression
    await printer.execute();

    return { success: true, message: "Ticket imprimé avec succès" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: message };
  }
}

/**
 * Imprime un bon de cuisine/bar
 */
export async function printBonCuisine(
  config: PrinterConfig,
  data: BonCuisineData,
  destination: "CUISINE" | "BAR"
): Promise<PrintResult> {
  try {
    const printer = createPrinter(config);
    const width = getCharacterWidth(config.largeurPapier);

    // Générer les commandes d'impression
    generateBonCuisineCommands(printer, data, width, destination);

    // Exécuter l'impression
    await printer.execute();

    return {
      success: true,
      message: `Bon ${destination.toLowerCase()} imprimé avec succès`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: message };
  }
}

/**
 * Imprime un rapport Z (clôture de caisse)
 */
export async function printRapportZ(
  config: PrinterConfig,
  etablissement: EtablissementInfo,
  data: RapportZData
): Promise<PrintResult> {
  try {
    const printer = createPrinter(config);
    const width = getCharacterWidth(config.largeurPapier);

    // Générer les commandes d'impression
    generateRapportZCommands(printer, etablissement, data, width);

    // Exécuter l'impression
    await printer.execute();

    return { success: true, message: "Rapport Z imprimé avec succès" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: message };
  }
}

/**
 * Ouvre le tiroir-caisse
 */
export async function openCashDrawer(config: PrinterConfig): Promise<PrintResult> {
  try {
    const printer = createPrinter(config);
    printer.openCashDrawer();
    await printer.execute();

    return { success: true, message: "Tiroir-caisse ouvert" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: message };
  }
}

/**
 * Imprime un test d'imprimante
 */
export async function printTest(
  config: PrinterConfig,
  etablissement: EtablissementInfo
): Promise<PrintResult> {
  try {
    const printer = createPrinter(config);
    const width = getCharacterWidth(config.largeurPapier);

    // En-tête
    printer.alignCenter();
    printer.setTextDoubleHeight();
    printer.bold(true);
    printer.println("TEST IMPRIMANTE");
    printer.bold(false);
    printer.setTextNormal();
    printer.drawLine();

    // Infos établissement
    printer.println(etablissement.nom);
    if (etablissement.adresse) printer.println(etablissement.adresse);
    printer.drawLine();

    // Infos imprimante
    printer.alignLeft();
    printer.println(`Imprimante: ${config.nom}`);
    printer.println(`Type: ${config.type}`);
    printer.println(`Connexion: ${config.typeConnexion}`);
    printer.println(`Largeur: ${config.largeurPapier}mm (${width} car.)`);
    printer.drawLine();

    // Test formatage
    printer.println("Test formatage:");
    printer.bold(true);
    printer.println("Texte en gras");
    printer.bold(false);
    printer.underline(true);
    printer.println("Texte souligné");
    printer.underline(false);
    printer.setTextDoubleWidth();
    printer.println("Double largeur");
    printer.setTextNormal();
    printer.drawLine();

    // Test alignement
    printer.alignLeft();
    printer.println("Aligné à gauche");
    printer.alignCenter();
    printer.println("Centré");
    printer.alignRight();
    printer.println("Aligné à droite");
    printer.alignLeft();
    printer.drawLine();

    // Test tableau
    printer.println("Test tableau:");
    printer.leftRight("Produit", "Prix");
    printer.leftRight("Poulet braisé", "5 000 F");
    printer.leftRight("Bière Flag 65cl", "1 500 F");
    printer.drawLine();

    // Test caractères spéciaux (français)
    printer.println("Caractères français:");
    printer.println("àâäéèêëïîôùûüç");
    printer.println("ÀÂÄÉÈÊËÏÎÔÙÛÜÇ");
    printer.drawLine();

    // Date et heure
    printer.alignCenter();
    printer.println(new Date().toLocaleString("fr-GA"));
    printer.println("");
    printer.println("*** TEST RÉUSSI ***");
    printer.println("");

    // Coupe
    printer.cut();

    await printer.execute();

    return { success: true, message: "Test imprimé avec succès" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: message };
  }
}
