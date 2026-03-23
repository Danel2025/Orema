"use client";

/**
 * Module Web Serial API pour imprimantes thermiques ESC/POS
 *
 * Permet la communication directe navigateur → imprimante USB/Serie
 * via la Web Serial API (Chrome 89+).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API
 */

import type { PrintResult } from "./types";

// Vendor IDs courants pour imprimantes thermiques ESC/POS et adaptateurs serie
const THERMAL_PRINTER_FILTERS: SerialPortFilter[] = [
  // --- Adaptateurs USB-Serie (utilisés par beaucoup d'imprimantes thermiques) ---
  { usbVendorId: 0x0416 }, // WinChipHead (CH340/CH341)
  { usbVendorId: 0x1a86 }, // QinHeng Electronics (CH340)
  { usbVendorId: 0x067b }, // Prolific (PL2303)
  { usbVendorId: 0x0403 }, // FTDI (FT232R)
  { usbVendorId: 0x10c4 }, // Silicon Labs (CP210x)
  { usbVendorId: 0x0483 }, // STMicroelectronics
  { usbVendorId: 0x1fc9 }, // NXP Semiconductors
  { usbVendorId: 0x0fe6 }, // ICS Electronics (Kontron)
  { usbVendorId: 0x20d1 }, // DIGI International
  // --- Fabricants d'imprimantes POS/thermiques ---
  { usbVendorId: 0x04b8 }, // Epson
  { usbVendorId: 0x0519 }, // Star Micronics
  { usbVendorId: 0x0dd4 }, // Custom (imprimantes thermiques)
  { usbVendorId: 0x0b00 }, // SEWOO (imprimantes POS)
  { usbVendorId: 0x154f }, // SNBC (imprimantes POS)
  { usbVendorId: 0x2730 }, // Citizen Systems
  { usbVendorId: 0x0471 }, // Philips
  { usbVendorId: 0x0485 }, // Nokia Display Products
  // --- Fabricants courants (imprimantes multifonction/jet d'encre avec port serie) ---
  { usbVendorId: 0x04a9 }, // Canon
  { usbVendorId: 0x03f0 }, // HP (Hewlett-Packard)
  { usbVendorId: 0x04f9 }, // Brother
  { usbVendorId: 0x04e8 }, // Samsung
  { usbVendorId: 0x1504 }, // BIXOLON
  { usbVendorId: 0x0dd4 }, // Custom Engineering
  { usbVendorId: 0x20b0 }, // Xprinter
  { usbVendorId: 0x0fe6 }, // Kontron
  { usbVendorId: 0x0456 }, // Analog Devices
  { usbVendorId: 0x28e9 }, // GoDEX International
];

/**
 * Informations sur un port serie detecte
 */
export interface WebSerialPortInfo {
  port: SerialPort;
  info: SerialPortInfo;
  label: string;
  connected: boolean;
}

/**
 * Options de connexion pour un port serie
 */
export interface WebSerialConnectOptions {
  /** Baud rate (defaut: 9600 pour la plupart des imprimantes thermiques) */
  baudRate?: number;
  /** Data bits (defaut: 8) */
  dataBits?: 7 | 8;
  /** Stop bits (defaut: 1) */
  stopBits?: 1 | 2;
  /** Parite (defaut: "none") */
  parity?: ParityType;
  /** Taille du buffer (defaut: 255) */
  bufferSize?: number;
  /** Flow control (defaut: "none") */
  flowControl?: FlowControlType;
}

const DEFAULT_SERIAL_OPTIONS: Required<WebSerialConnectOptions> = {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  bufferSize: 255,
  flowControl: "none",
};

/**
 * Verifie si le navigateur supporte la Web Serial API
 */
export function isWebSerialSupported(): boolean {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

/**
 * Obtient la liste des ports serie deja autorises par l'utilisateur
 */
export async function getAuthorizedPorts(): Promise<WebSerialPortInfo[]> {
  if (!isWebSerialSupported()) return [];

  try {
    const ports = await navigator.serial.getPorts();
    return ports.map((port) => {
      const info = port.getInfo();
      return {
        port,
        info,
        label: formatPortLabel(info),
        connected: port.readable !== null,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Demande a l'utilisateur de selectionner un port serie (imprimante)
 * Requiert un geste utilisateur (clic)
 */
export async function requestSerialPort(): Promise<WebSerialPortInfo | null> {
  if (!isWebSerialSupported()) {
    throw new Error("Web Serial API non supportee. Utilisez Chrome 89+ ou Edge 89+.");
  }

  try {
    // Ouvre le selecteur de port avec filtre sur les imprimantes connues
    const port = await navigator.serial.requestPort({
      filters: THERMAL_PRINTER_FILTERS,
    });

    const info = port.getInfo();
    return {
      port,
      info,
      label: formatPortLabel(info),
      connected: false,
    };
  } catch (error) {
    // L'utilisateur a annule la selection
    if (error instanceof DOMException && error.name === "NotFoundError") {
      return null;
    }
    throw error;
  }
}

/**
 * Demande un port serie sans filtre (toutes les imprimantes)
 * Utile si l'imprimante n'est pas dans la liste des Vendor IDs connus
 */
export async function requestAnySerialPort(): Promise<WebSerialPortInfo | null> {
  if (!isWebSerialSupported()) {
    throw new Error("Web Serial API non supportee. Utilisez Chrome 89+ ou Edge 89+.");
  }

  try {
    const port = await navigator.serial.requestPort();
    const info = port.getInfo();
    return {
      port,
      info,
      label: formatPortLabel(info),
      connected: false,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") {
      return null;
    }
    throw error;
  }
}

/**
 * Ouvre une connexion avec un port serie
 */
export async function openSerialPort(
  port: SerialPort,
  options: WebSerialConnectOptions = {}
): Promise<void> {
  if (port.readable) {
    // Deja ouvert
    return;
  }

  const serialOptions = { ...DEFAULT_SERIAL_OPTIONS, ...options };

  await port.open({
    baudRate: serialOptions.baudRate,
    dataBits: serialOptions.dataBits,
    stopBits: serialOptions.stopBits,
    parity: serialOptions.parity,
    bufferSize: serialOptions.bufferSize,
    flowControl: serialOptions.flowControl,
  });
}

/**
 * Ferme la connexion avec un port serie
 */
export async function closeSerialPort(port: SerialPort): Promise<void> {
  try {
    if (port.readable) {
      const reader = port.readable.getReader();
      await reader.cancel();
      reader.releaseLock();
    }
    if (port.writable) {
      const writer = port.writable.getWriter();
      await writer.close();
      writer.releaseLock();
    }
    await port.close();
  } catch {
    // Port deja ferme ou erreur lors de la fermeture
  }
}

/**
 * Envoie des donnees ESC/POS a un port serie
 */
export async function writeToSerialPort(
  port: SerialPort,
  data: Uint8Array | string
): Promise<void> {
  if (!port.writable) {
    throw new Error("Le port serie n'est pas ouvert en ecriture");
  }

  const writer = port.writable.getWriter();
  try {
    const buffer = typeof data === "string" ? new TextEncoder().encode(data) : data;
    await writer.write(buffer);
  } finally {
    writer.releaseLock();
  }
}

/**
 * Envoie des commandes ESC/POS a une imprimante via Web Serial
 * Gere l'ouverture, l'envoi et la gestion d'erreurs
 */
export async function sendViaWebSerial(
  port: SerialPort,
  data: Uint8Array | string,
  options: WebSerialConnectOptions = {}
): Promise<PrintResult> {
  try {
    // Ouvrir si necessaire
    if (!port.readable) {
      await openSerialPort(port, options);
    }

    // Envoyer les donnees
    await writeToSerialPort(port, data);

    return {
      success: true,
      message: "Impression envoyee via USB/Serie (Web Serial)",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur Web Serial inconnue";
    return {
      success: false,
      error: `Erreur d'impression USB/Serie: ${errorMsg}`,
    };
  }
}

/**
 * Teste la connexion a un port serie en envoyant un ping ESC/POS
 */
export async function testSerialConnection(
  port: SerialPort,
  options: WebSerialConnectOptions = {}
): Promise<PrintResult> {
  try {
    const wasOpen = port.readable !== null;

    if (!wasOpen) {
      await openSerialPort(port, options);
    }

    // Envoyer la commande INIT (ESC @) qui reset l'imprimante
    const INIT_COMMAND = new Uint8Array([0x1b, 0x40]);
    await writeToSerialPort(port, INIT_COMMAND);

    if (!wasOpen) {
      await closeSerialPort(port);
    }

    return {
      success: true,
      message: "Connexion USB/Serie reussie",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    return {
      success: false,
      error: `Test echoue: ${errorMsg}`,
    };
  }
}

/**
 * Ecoute les evenements de connexion/deconnexion de ports serie
 */
export function onSerialPortChange(
  onConnect: (event: Event) => void,
  onDisconnect: (event: Event) => void
): () => void {
  if (!isWebSerialSupported()) return () => {};

  navigator.serial.addEventListener("connect", onConnect);
  navigator.serial.addEventListener("disconnect", onDisconnect);

  return () => {
    navigator.serial.removeEventListener("connect", onConnect);
    navigator.serial.removeEventListener("disconnect", onDisconnect);
  };
}

/**
 * Convertit une chaine ESC/POS (binary string) en Uint8Array
 * Necessaire car les templates ESC/POS utilisent des chaines binaires
 */
export function escposStringToUint8Array(data: string): Uint8Array {
  const bytes = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    bytes[i] = data.charCodeAt(i) & 0xff;
  }
  return bytes;
}

/**
 * Formate un label lisible pour un port serie
 */
function formatPortLabel(info: SerialPortInfo): string {
  const vendorId = info.usbVendorId;
  const productId = info.usbProductId;

  if (vendorId) {
    const vendorName = getVendorName(vendorId);
    if (vendorName) {
      return productId
        ? `${vendorName} (${hex(vendorId)}:${hex(productId)})`
        : `${vendorName} (${hex(vendorId)})`;
    }
    return productId ? `USB ${hex(vendorId)}:${hex(productId)}` : `USB ${hex(vendorId)}`;
  }

  return "Port serie";
}

function hex(value: number): string {
  return `0x${value.toString(16).padStart(4, "0")}`;
}

/**
 * Noms de fabricants connus pour les imprimantes thermiques
 */
function getVendorName(vendorId: number): string | null {
  const vendors: Record<number, string> = {
    0x0416: "WinChipHead",
    0x1a86: "QinHeng (CH340)",
    0x067b: "Prolific (PL2303)",
    0x0403: "FTDI",
    0x10c4: "Silicon Labs",
    0x0483: "STMicroelectronics",
    0x1fc9: "NXP",
    0x04b8: "Epson",
    0x0519: "Star Micronics",
    0x0dd4: "Custom",
    0x0b00: "SEWOO",
    0x154f: "SNBC",
    0x2730: "Citizen Systems",
    0x04a9: "Canon",
    0x03f0: "HP",
    0x04f9: "Brother",
    0x04e8: "Samsung",
    0x1504: "BIXOLON",
    0x20b0: "Xprinter",
    0x28e9: "GoDEX",
  };
  return vendors[vendorId] ?? null;
}
