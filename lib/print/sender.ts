/**
 * Module d'envoi des commandes d'impression
 *
 * Gere l'envoi des commandes ESC/POS aux imprimantes via:
 * - Reseau (TCP/IP)
 * - USB (non supporte directement dans le navigateur)
 * - Serie (non supporte directement dans le navigateur)
 *
 * Note: L'impression USB et serie necessite une API locale ou
 * un service d'impression cote serveur.
 */

import type { PrinterConfig, PrintResult } from "./types";
import { TYPE_CONNEXION, type TypeConnexion } from "@/lib/db/types";

/**
 * Options d'envoi d'impression
 */
export interface PrintSendOptions {
  /** Timeout en millisecondes (defaut: 5000) */
  timeout?: number;
  /** Nombre de tentatives en cas d'echec (defaut: 3) */
  retries?: number;
}

/**
 * Envoie les commandes ESC/POS a une imprimante
 */
export async function sendToPrinter(
  printer: PrinterConfig,
  data: string | Buffer,
  options: PrintSendOptions = {}
): Promise<PrintResult> {
  const { timeout = 5000, retries = 3 } = options;

  // Convertir en Buffer si necessaire
  const buffer = typeof data === "string" ? Buffer.from(data, "binary") : data;

  switch (printer.typeConnexion) {
    case TYPE_CONNEXION.RESEAU:
      return sendToNetworkPrinter(printer, buffer, timeout, retries);

    case TYPE_CONNEXION.USB:
      return sendToUSBPrinter(printer, buffer);

    case TYPE_CONNEXION.SERIE:
      return sendToSerialPrinter(printer, buffer);

    case TYPE_CONNEXION.BLUETOOTH:
      return sendToBluetoothPrinter(printer, buffer);

    case TYPE_CONNEXION.SYSTEME:
      // L'impression systeme est geree cote client via window.print()
      // Le serveur ne peut pas utiliser window.print(), il faut passer
      // par le client (voir lib/print/system-print.ts)
      return {
        success: false,
        error:
          "L'impression systeme doit etre lancee depuis le navigateur. " +
          "Utilisez printViaSystem() cote client.",
        printerId: printer.id,
      };

    default:
      return {
        success: false,
        error: `Type de connexion non supporte: ${printer.typeConnexion}`,
        printerId: printer.id,
      };
  }
}

/**
 * Envoie a une imprimante reseau via TCP/IP
 */
async function sendToNetworkPrinter(
  printer: PrinterConfig,
  data: Buffer,
  timeout: number,
  retries: number
): Promise<PrintResult> {
  if (!printer.adresseIP) {
    return {
      success: false,
      error: "Adresse IP non configuree",
      printerId: printer.id,
    };
  }

  const port = printer.port || 9100;
  const address = printer.adresseIP;

  // Dans un environnement Node.js (API Route), on peut utiliser net
  // Ceci est execute cote serveur via l'API Route
  let lastError: string = "";

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Import dynamique de 'net' pour eviter les erreurs cote client
      const net = await import("net");

      const result = await new Promise<PrintResult>((resolve) => {
        const client = new net.Socket();

        const timeoutId = setTimeout(() => {
          client.destroy();
          resolve({
            success: false,
            error: `Timeout de connexion (${timeout}ms)`,
            printerId: printer.id,
          });
        }, timeout);

        client.connect(port, address, () => {
          client.write(data, () => {
            clearTimeout(timeoutId);
            client.end();
            resolve({
              success: true,
              message: `Impression envoyee a ${printer.nom}`,
              printerId: printer.id,
            });
          });
        });

        client.on("error", (err) => {
          clearTimeout(timeoutId);
          client.destroy();
          resolve({
            success: false,
            error: `Erreur de connexion: ${err.message}`,
            printerId: printer.id,
          });
        });
      });

      if (result.success) {
        return result;
      }

      lastError = result.error || "Erreur inconnue";
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Erreur inconnue";
    }

    // Attendre avant de reessayer
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return {
    success: false,
    error: `Echec apres ${retries} tentatives: ${lastError}`,
    printerId: printer.id,
  };
}

/**
 * Envoie a une imprimante USB
 * Note: Necessite un service local ou l'API Web Serial
 */
async function sendToUSBPrinter(printer: PrinterConfig, data: Buffer): Promise<PrintResult> {
  // L'impression USB directe n'est pas possible depuis le navigateur
  // Options:
  // 1. Utiliser un service local (electron, tauri)
  // 2. Utiliser l'API Web Serial (experimental)
  // 3. Utiliser un serveur d'impression local

  if (!printer.pathUSB) {
    return {
      success: false,
      error: "Chemin USB non configure",
      printerId: printer.id,
    };
  }

  // Tentative via le systeme de fichiers (necessite permissions)
  try {
    const fs = await import("fs/promises");

    // Sous Linux, les imprimantes USB sont accessibles via /dev/usb/lpX
    // Sous Windows, on utilise les ports COM ou le spooler
    await fs.writeFile(printer.pathUSB, data);

    return {
      success: true,
      message: `Impression envoyee a ${printer.nom} via USB`,
      printerId: printer.id,
    };
  } catch (error) {
    return {
      success: false,
      error: `Erreur USB: ${error instanceof Error ? error.message : "Accès refusé"}`,
      printerId: printer.id,
    };
  }
}

/**
 * Envoie a une imprimante serie
 * Note: Necessite l'API Web Serial ou un service local
 */
async function sendToSerialPrinter(printer: PrinterConfig, data: Buffer): Promise<PrintResult> {
  // L'impression serie necessite l'API Web Serial ou un service local
  return {
    success: false,
    error: "Impression serie non implementee. Utilisez une connexion reseau.",
    printerId: printer.id,
  };
}

/**
 * Envoie a une imprimante Bluetooth
 * Note: Necessite l'API Web Bluetooth ou un service local
 */
async function sendToBluetoothPrinter(printer: PrinterConfig, data: Buffer): Promise<PrintResult> {
  // L'impression Bluetooth necessite l'API Web Bluetooth ou un service local
  return {
    success: false,
    error: "Impression Bluetooth non implementee. Utilisez une connexion reseau.",
    printerId: printer.id,
  };
}

/**
 * Teste la connexion a une imprimante
 */
export async function testPrinterConnection(printer: PrinterConfig): Promise<PrintResult> {
  switch (printer.typeConnexion) {
    case TYPE_CONNEXION.RESEAU:
      return testNetworkConnection(printer);

    case TYPE_CONNEXION.USB:
      return testUSBConnection(printer);

    default:
      return {
        success: false,
        error: `Test non supporte pour le type: ${printer.typeConnexion}`,
        printerId: printer.id,
      };
  }
}

/**
 * Teste la connexion reseau a une imprimante
 */
async function testNetworkConnection(printer: PrinterConfig): Promise<PrintResult> {
  if (!printer.adresseIP) {
    return {
      success: false,
      error: "Adresse IP non configuree",
      printerId: printer.id,
    };
  }

  const port = printer.port || 9100;
  const address = printer.adresseIP;
  const timeout = 3000;

  try {
    const net = await import("net");

    return new Promise((resolve) => {
      const client = new net.Socket();

      const timeoutId = setTimeout(() => {
        client.destroy();
        resolve({
          success: false,
          error: "Timeout de connexion",
          printerId: printer.id,
        });
      }, timeout);

      client.connect(port, address, () => {
        clearTimeout(timeoutId);
        client.destroy();
        resolve({
          success: true,
          message: `Connexion a ${printer.nom} (${address}:${port}) reussie`,
          printerId: printer.id,
        });
      });

      client.on("error", (err) => {
        clearTimeout(timeoutId);
        client.destroy();
        resolve({
          success: false,
          error: `Connexion impossible: ${err.message}`,
          printerId: printer.id,
        });
      });
    });
  } catch (error) {
    return {
      success: false,
      error: `Erreur: ${error instanceof Error ? error.message : "Inconnue"}`,
      printerId: printer.id,
    };
  }
}

/**
 * Teste la connexion USB a une imprimante
 */
async function testUSBConnection(printer: PrinterConfig): Promise<PrintResult> {
  if (!printer.pathUSB) {
    return {
      success: false,
      error: "Chemin USB non configure",
      printerId: printer.id,
    };
  }

  try {
    const fs = await import("fs/promises");

    // Verifier si le fichier/peripherique existe
    await fs.access(printer.pathUSB);

    return {
      success: true,
      message: `Peripherique USB ${printer.pathUSB} accessible`,
      printerId: printer.id,
    };
  } catch (error) {
    return {
      success: false,
      error: `Peripherique USB non accessible: ${printer.pathUSB}`,
      printerId: printer.id,
    };
  }
}

/**
 * Ouvre le tiroir caisse via l'imprimante
 */
export async function openCashDrawer(printer: PrinterConfig): Promise<PrintResult> {
  // Commande ESC/POS pour ouvrir le tiroir caisse
  const OPEN_DRAWER = Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]);

  return sendToPrinter(printer, OPEN_DRAWER);
}
