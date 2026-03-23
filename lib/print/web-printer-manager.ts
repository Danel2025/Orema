"use client";

/**
 * Gestionnaire unifie d'imprimantes Web
 *
 * Centralise la gestion de toutes les connexions imprimantes :
 * - Web Serial API (USB/Serie)
 * - Web Bluetooth API (Bluetooth)
 * - Reseau (via API server-side)
 *
 * Stocke les associations port/device ↔ imprimante en memoire
 * pour permettre l'impression directe sans re-selectionner le port.
 */

import type { PrintResult, PrinterConfig } from "./types";
import {
  isWebSerialSupported,
  getAuthorizedPorts,
  requestSerialPort,
  requestAnySerialPort,
  openSerialPort,
  closeSerialPort,
  sendViaWebSerial,
  testSerialConnection,
  onSerialPortChange,
  escposStringToUint8Array,
  type WebSerialPortInfo,
  type WebSerialConnectOptions,
} from "./web-serial";
import {
  isWebBluetoothSupported,
  requestBluetoothPrinter,
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  sendViaWebBluetooth,
  testBluetoothConnection,
  onBluetoothDisconnect,
  type WebBluetoothDeviceInfo,
} from "./web-bluetooth";

/**
 * Types de connexion browser-side
 */
export type WebConnectionType = "web-serial" | "web-bluetooth" | "network";

/**
 * Un peripherique d'impression gere par le manager
 */
export interface ManagedPrinter {
  /** ID de l'imprimante dans la base (ou genere localement) */
  printerId: string;
  /** Type de connexion web */
  connectionType: WebConnectionType;
  /** Label lisible */
  label: string;
  /** Connecte ou non */
  connected: boolean;
  /** Port serie (si web-serial) */
  serialPort?: WebSerialPortInfo;
  /** Options de connexion serie */
  serialOptions?: WebSerialConnectOptions;
  /** Device Bluetooth (si web-bluetooth) */
  bluetoothDevice?: WebBluetoothDeviceInfo;
  /** Config reseau (si network) */
  networkConfig?: { adresseIP: string; port: number };
}

/**
 * Cle de stockage localStorage pour les associations imprimante ↔ port
 */
const STORAGE_KEY = "orema-printer-associations";

/**
 * Associations stockees en localStorage
 */
interface PrinterAssociation {
  printerId: string;
  connectionType: WebConnectionType;
  /** Pour web-serial: vendorId + productId pour reconnaitre le port */
  usbVendorId?: number;
  usbProductId?: number;
  /** Pour web-bluetooth: device id */
  bluetoothDeviceId?: string;
  /** Options serie sauvegardees */
  serialOptions?: WebSerialConnectOptions;
}

/**
 * Gestionnaire d'imprimantes Web
 */
class WebPrinterManager {
  private printers: Map<string, ManagedPrinter> = new Map();
  private cleanupFns: (() => void)[] = [];
  private initialized = false;

  /**
   * Initialise le manager : restaure les associations et ecoute les evenements
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    // Ecouter les connexions/deconnexions de ports serie
    if (isWebSerialSupported()) {
      const cleanup = onSerialPortChange(
        () => this.refreshSerialPorts(),
        () => this.refreshSerialPorts()
      );
      this.cleanupFns.push(cleanup);

      // Restaurer les ports deja autorises
      await this.refreshSerialPorts();
    }
  }

  /**
   * Nettoie les ecouteurs d'evenements
   */
  destroy(): void {
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
    this.printers.clear();
    this.initialized = false;
  }

  /**
   * Retourne les capacites du navigateur
   */
  getCapabilities(): {
    webSerial: boolean;
    webBluetooth: boolean;
    network: boolean;
  } {
    return {
      webSerial: isWebSerialSupported(),
      webBluetooth: isWebBluetoothSupported(),
      network: true, // Toujours disponible via API server-side
    };
  }

  /**
   * Retourne toutes les imprimantes gerees
   */
  getAllPrinters(): ManagedPrinter[] {
    return Array.from(this.printers.values());
  }

  /**
   * Retourne une imprimante par son ID
   */
  getPrinter(printerId: string): ManagedPrinter | undefined {
    return this.printers.get(printerId);
  }

  // ==========================================
  // Web Serial (USB/Serie)
  // ==========================================

  /**
   * Detecte les ports serie USB deja autorises
   */
  async detectSerialPrinters(): Promise<WebSerialPortInfo[]> {
    if (!isWebSerialSupported()) return [];
    return getAuthorizedPorts();
  }

  /**
   * Demande a l'utilisateur de selectionner une imprimante USB/Serie
   * @param useFilter true pour filtrer les imprimantes connues, false pour tout afficher
   */
  async requestSerialPrinter(useFilter: boolean = true): Promise<WebSerialPortInfo | null> {
    return useFilter ? requestSerialPort() : requestAnySerialPort();
  }

  /**
   * Associe un port serie a une imprimante de la base
   */
  async pairSerialPrinter(
    printerId: string,
    portInfo: WebSerialPortInfo,
    options: WebSerialConnectOptions = {}
  ): Promise<ManagedPrinter> {
    const managed: ManagedPrinter = {
      printerId,
      connectionType: "web-serial",
      label: portInfo.label,
      connected: false,
      serialPort: portInfo,
      serialOptions: options,
    };

    this.printers.set(printerId, managed);
    this.saveAssociation(printerId, "web-serial", portInfo.info, options);

    return managed;
  }

  /**
   * Connecte une imprimante serie
   */
  async connectSerialPrinter(
    printerId: string,
    options?: WebSerialConnectOptions
  ): Promise<PrintResult> {
    const managed = this.printers.get(printerId);
    if (!managed?.serialPort) {
      return { success: false, error: "Imprimante non associee", printerId };
    }

    try {
      const opts = options || managed.serialOptions || {};
      await openSerialPort(managed.serialPort.port, opts);
      managed.connected = true;
      managed.serialPort.connected = true;
      return {
        success: true,
        message: `Connecte a ${managed.label}`,
        printerId,
      };
    } catch (error) {
      return {
        success: false,
        error: `Connexion echouee: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        printerId,
      };
    }
  }

  /**
   * Deconnecte une imprimante serie
   */
  async disconnectSerialPrinter(printerId: string): Promise<void> {
    const managed = this.printers.get(printerId);
    if (managed?.serialPort) {
      await closeSerialPort(managed.serialPort.port);
      managed.connected = false;
      managed.serialPort.connected = false;
    }
  }

  // ==========================================
  // Web Bluetooth
  // ==========================================

  /**
   * Demande a l'utilisateur de selectionner une imprimante Bluetooth
   */
  async requestBluetoothPrinter(): Promise<WebBluetoothDeviceInfo | null> {
    return requestBluetoothPrinter();
  }

  /**
   * Associe un peripherique Bluetooth a une imprimante de la base
   */
  async pairBluetoothPrinter(
    printerId: string,
    deviceInfo: WebBluetoothDeviceInfo
  ): Promise<ManagedPrinter> {
    const managed: ManagedPrinter = {
      printerId,
      connectionType: "web-bluetooth",
      label: deviceInfo.name,
      connected: false,
      bluetoothDevice: deviceInfo,
    };

    this.printers.set(printerId, managed);
    this.saveAssociation(printerId, "web-bluetooth", undefined, undefined, deviceInfo.id);

    // Ecouter la deconnexion
    const cleanup = onBluetoothDisconnect(deviceInfo.device, () => {
      managed.connected = false;
      if (managed.bluetoothDevice) {
        managed.bluetoothDevice.connected = false;
      }
    });
    this.cleanupFns.push(cleanup);

    return managed;
  }

  /**
   * Connecte une imprimante Bluetooth
   */
  async connectBluetoothPrinter(printerId: string): Promise<PrintResult> {
    const managed = this.printers.get(printerId);
    if (!managed?.bluetoothDevice) {
      return { success: false, error: "Imprimante Bluetooth non associee", printerId };
    }

    try {
      const connected = await connectBluetoothPrinter(managed.bluetoothDevice);
      managed.bluetoothDevice = connected;
      managed.connected = true;
      return {
        success: true,
        message: `Connecte a ${managed.label}`,
        printerId,
      };
    } catch (error) {
      return {
        success: false,
        error: `Connexion Bluetooth echouee: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        printerId,
      };
    }
  }

  /**
   * Deconnecte une imprimante Bluetooth
   */
  disconnectBluetoothPrinter(printerId: string): void {
    const managed = this.printers.get(printerId);
    if (managed?.bluetoothDevice) {
      disconnectBluetoothPrinter(managed.bluetoothDevice);
      managed.connected = false;
      managed.bluetoothDevice.connected = false;
    }
  }

  // ==========================================
  // Impression unifiee
  // ==========================================

  /**
   * Envoie des donnees ESC/POS a une imprimante geree
   * Choisit automatiquement le canal (Web Serial, Bluetooth, ou API reseau)
   */
  async sendToPrinter(printerId: string, data: string | Uint8Array): Promise<PrintResult> {
    const managed = this.printers.get(printerId);

    if (!managed) {
      // Pas d'association locale → fallback sur l'API serveur
      return this.sendViaServerAPI(printerId, data);
    }

    // Convertir si necessaire
    const bytes = typeof data === "string" ? escposStringToUint8Array(data) : data;

    switch (managed.connectionType) {
      case "web-serial":
        if (!managed.serialPort) {
          return {
            success: false,
            error: "Port serie non configure",
            printerId,
          };
        }
        return sendViaWebSerial(managed.serialPort.port, bytes, managed.serialOptions);

      case "web-bluetooth":
        if (!managed.bluetoothDevice) {
          return {
            success: false,
            error: "Peripherique Bluetooth non configure",
            printerId,
          };
        }
        return sendViaWebBluetooth(managed.bluetoothDevice, bytes);

      case "network":
        return this.sendViaServerAPI(printerId, data);

      default:
        return {
          success: false,
          error: "Type de connexion non gere",
          printerId,
        };
    }
  }

  /**
   * Teste la connexion a une imprimante
   */
  async testConnection(printerId: string): Promise<PrintResult> {
    const managed = this.printers.get(printerId);

    if (!managed) {
      // Tester via API serveur
      return this.testViaServerAPI(printerId);
    }

    switch (managed.connectionType) {
      case "web-serial":
        if (!managed.serialPort) {
          return { success: false, error: "Port serie non configure", printerId };
        }
        return testSerialConnection(managed.serialPort.port, managed.serialOptions);

      case "web-bluetooth":
        if (!managed.bluetoothDevice) {
          return {
            success: false,
            error: "Peripherique Bluetooth non configure",
            printerId,
          };
        }
        return testBluetoothConnection(managed.bluetoothDevice);

      case "network":
        return this.testViaServerAPI(printerId);

      default:
        return { success: false, error: "Type non gere", printerId };
    }
  }

  /**
   * Dissocie une imprimante
   */
  unpairPrinter(printerId: string): void {
    const managed = this.printers.get(printerId);
    if (managed) {
      if (managed.connectionType === "web-bluetooth" && managed.bluetoothDevice) {
        disconnectBluetoothPrinter(managed.bluetoothDevice);
      }
      this.printers.delete(printerId);
      this.removeAssociation(printerId);
    }
  }

  // ==========================================
  // API serveur (fallback pour reseau)
  // ==========================================

  private async sendViaServerAPI(
    printerId: string,
    data: string | Uint8Array
  ): Promise<PrintResult> {
    try {
      // Convertir en base64 pour le transport HTTP
      const base64Data = typeof data === "string" ? btoa(data) : btoa(String.fromCharCode(...data));

      const response = await fetch("/api/print/send-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printerId, data: base64Data }),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: `Erreur reseau: ${error instanceof Error ? error.message : "Inconnue"}`,
        printerId,
      };
    }
  }

  private async testViaServerAPI(printerId: string): Promise<PrintResult> {
    try {
      const response = await fetch("/api/print/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printerId }),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: `Erreur reseau: ${error instanceof Error ? error.message : "Inconnue"}`,
        printerId,
      };
    }
  }

  // ==========================================
  // Persistence (localStorage)
  // ==========================================

  private saveAssociation(
    printerId: string,
    connectionType: WebConnectionType,
    serialInfo?: SerialPortInfo,
    serialOptions?: WebSerialConnectOptions,
    bluetoothDeviceId?: string
  ): void {
    try {
      const associations = this.loadAssociations();
      const existing = associations.findIndex((a) => a.printerId === printerId);

      const association: PrinterAssociation = {
        printerId,
        connectionType,
        usbVendorId: serialInfo?.usbVendorId,
        usbProductId: serialInfo?.usbProductId,
        bluetoothDeviceId,
        serialOptions,
      };

      if (existing >= 0) {
        associations[existing] = association;
      } else {
        associations.push(association);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(associations));
    } catch {
      // localStorage non disponible
    }
  }

  private removeAssociation(printerId: string): void {
    try {
      const associations = this.loadAssociations();
      const filtered = associations.filter((a) => a.printerId !== printerId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // localStorage non disponible
    }
  }

  private loadAssociations(): PrinterAssociation[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Rafraichit les ports serie autorises et restaure les associations
   */
  private async refreshSerialPorts(): Promise<void> {
    if (!isWebSerialSupported()) return;

    const ports = await getAuthorizedPorts();
    const associations = this.loadAssociations();

    for (const assoc of associations) {
      if (assoc.connectionType !== "web-serial") continue;

      // Trouver le port correspondant par vendorId/productId
      const matchingPort = ports.find((p) => {
        if (assoc.usbVendorId && p.info.usbVendorId === assoc.usbVendorId) {
          if (assoc.usbProductId) {
            return p.info.usbProductId === assoc.usbProductId;
          }
          return true;
        }
        return false;
      });

      if (matchingPort) {
        this.printers.set(assoc.printerId, {
          printerId: assoc.printerId,
          connectionType: "web-serial",
          label: matchingPort.label,
          connected: matchingPort.connected,
          serialPort: matchingPort,
          serialOptions: assoc.serialOptions,
        });
      }
    }
  }
}

/**
 * Instance singleton du gestionnaire d'imprimantes
 */
let managerInstance: WebPrinterManager | null = null;

export function getWebPrinterManager(): WebPrinterManager {
  if (!managerInstance) {
    managerInstance = new WebPrinterManager();
  }
  return managerInstance;
}

export { WebPrinterManager };
