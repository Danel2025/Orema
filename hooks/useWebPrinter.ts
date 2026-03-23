"use client";

/**
 * Hook React pour la gestion des imprimantes via Web APIs
 *
 * Fournit une interface simple pour :
 * - Detecter les imprimantes USB/Bluetooth
 * - Appairer un peripherique a une imprimante de la base
 * - Tester les connexions
 * - Envoyer des impressions
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getWebPrinterManager,
  type ManagedPrinter,
  type WebConnectionType,
} from "@/lib/print/web-printer-manager";
import type { WebSerialPortInfo, WebSerialConnectOptions } from "@/lib/print/web-serial";
import type { WebBluetoothDeviceInfo } from "@/lib/print/web-bluetooth";
import type { PrintResult } from "@/lib/print/types";

/**
 * Capacites du navigateur pour l'impression
 */
export interface PrinterCapabilities {
  webSerial: boolean;
  webBluetooth: boolean;
  network: boolean;
}

/**
 * Etat du hook
 */
interface UseWebPrinterState {
  /** Capacites du navigateur */
  capabilities: PrinterCapabilities;
  /** Imprimantes gerees (associees) */
  managedPrinters: ManagedPrinter[];
  /** Ports serie detectes (autorises precedemment) */
  detectedSerialPorts: WebSerialPortInfo[];
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur courante */
  error: string | null;
}

/**
 * Hook de gestion des imprimantes Web
 */
export function useWebPrinter() {
  const managerRef = useRef(getWebPrinterManager());
  const [state, setState] = useState<UseWebPrinterState>({
    capabilities: { webSerial: false, webBluetooth: false, network: true },
    managedPrinters: [],
    detectedSerialPorts: [],
    isLoading: true,
    error: null,
  });

  // Initialiser le manager au montage
  useEffect(() => {
    const manager = managerRef.current;

    async function init() {
      await manager.initialize();

      const capabilities = manager.getCapabilities();
      const managedPrinters = manager.getAllPrinters();
      const detectedSerialPorts = await manager.detectSerialPrinters();

      setState((prev) => ({
        ...prev,
        capabilities,
        managedPrinters,
        detectedSerialPorts,
        isLoading: false,
      }));
    }

    init();

    return () => {
      // Ne pas detruire le manager singleton au demontage
    };
  }, []);

  const refreshPrinters = useCallback(async () => {
    const manager = managerRef.current;
    const managedPrinters = manager.getAllPrinters();
    const detectedSerialPorts = await manager.detectSerialPrinters();

    setState((prev) => ({
      ...prev,
      managedPrinters,
      detectedSerialPorts,
      error: null,
    }));
  }, []);

  // ==========================================
  // Detection et appairage
  // ==========================================

  /**
   * Ouvre le selecteur de port USB/Serie du navigateur
   * @param useFilter true pour filtrer les imprimantes connues
   */
  const requestUSBPrinter = useCallback(
    async (useFilter: boolean = true): Promise<WebSerialPortInfo | null> => {
      const manager = managerRef.current;

      try {
        setState((prev) => ({ ...prev, error: null }));
        const port = await manager.requestSerialPrinter(useFilter);

        if (port) {
          // Mettre a jour la liste des ports detectes
          await refreshPrinters();
        }

        return port;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erreur de detection USB";
        setState((prev) => ({ ...prev, error: msg }));
        return null;
      }
    },
    [refreshPrinters]
  );

  /**
   * Ouvre le selecteur Bluetooth du navigateur
   */
  const requestBTDevice = useCallback(async (): Promise<WebBluetoothDeviceInfo | null> => {
    const manager = managerRef.current;

    try {
      setState((prev) => ({ ...prev, error: null }));
      return await manager.requestBluetoothPrinter();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur de detection Bluetooth";
      setState((prev) => ({ ...prev, error: msg }));
      return null;
    }
  }, []);

  /**
   * Associe un port serie a une imprimante de la base
   */
  const pairUSBPrinter = useCallback(
    async (
      printerId: string,
      portInfo: WebSerialPortInfo,
      options?: WebSerialConnectOptions
    ): Promise<ManagedPrinter> => {
      const manager = managerRef.current;
      const managed = await manager.pairSerialPrinter(printerId, portInfo, options);
      await refreshPrinters();
      return managed;
    },
    [refreshPrinters]
  );

  /**
   * Associe un peripherique Bluetooth a une imprimante de la base
   */
  const pairBTPrinter = useCallback(
    async (printerId: string, deviceInfo: WebBluetoothDeviceInfo): Promise<ManagedPrinter> => {
      const manager = managerRef.current;
      const managed = await manager.pairBluetoothPrinter(printerId, deviceInfo);
      await refreshPrinters();
      return managed;
    },
    [refreshPrinters]
  );

  /**
   * Dissocie une imprimante
   */
  const unpairPrinter = useCallback(
    (printerId: string) => {
      const manager = managerRef.current;
      manager.unpairPrinter(printerId);
      refreshPrinters();
    },
    [refreshPrinters]
  );

  // ==========================================
  // Connexion
  // ==========================================

  /**
   * Connecte une imprimante selon son type
   */
  const connect = useCallback(
    async (printerId: string): Promise<PrintResult> => {
      const manager = managerRef.current;
      const managed = manager.getPrinter(printerId);

      if (!managed) {
        return { success: false, error: "Imprimante non associee", printerId };
      }

      let result: PrintResult;

      if (managed.connectionType === "web-serial") {
        result = await manager.connectSerialPrinter(printerId);
      } else if (managed.connectionType === "web-bluetooth") {
        result = await manager.connectBluetoothPrinter(printerId);
      } else {
        result = {
          success: true,
          message: "Connexion reseau geree par le serveur",
          printerId,
        };
      }

      await refreshPrinters();
      return result;
    },
    [refreshPrinters]
  );

  /**
   * Deconnecte une imprimante
   */
  const disconnect = useCallback(
    async (printerId: string): Promise<void> => {
      const manager = managerRef.current;
      const managed = manager.getPrinter(printerId);

      if (managed?.connectionType === "web-serial") {
        await manager.disconnectSerialPrinter(printerId);
      } else if (managed?.connectionType === "web-bluetooth") {
        manager.disconnectBluetoothPrinter(printerId);
      }

      await refreshPrinters();
    },
    [refreshPrinters]
  );

  // ==========================================
  // Impression et test
  // ==========================================

  /**
   * Envoie des donnees ESC/POS a une imprimante
   */
  const send = useCallback(
    async (printerId: string, data: string | Uint8Array): Promise<PrintResult> => {
      const manager = managerRef.current;
      return manager.sendToPrinter(printerId, data);
    },
    []
  );

  /**
   * Teste la connexion a une imprimante
   */
  const test = useCallback(async (printerId: string): Promise<PrintResult> => {
    const manager = managerRef.current;
    return manager.testConnection(printerId);
  }, []);

  return {
    // Etat
    ...state,

    // Detection
    requestUSBPrinter,
    requestBTDevice,

    // Appairage
    pairUSBPrinter,
    pairBTPrinter,
    unpairPrinter,

    // Connexion
    connect,
    disconnect,

    // Impression
    send,
    test,

    // Rafraichissement
    refreshPrinters,
  };
}
