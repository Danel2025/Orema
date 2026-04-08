"use client";

/**
 * Hooks React pour l'impression
 *
 * Ces hooks facilitent l'integration de l'impression dans les composants React.
 * Inclut un fallback automatique vers l'impression systeme (window.print)
 * quand l'imprimante configuree est de type SYSTEME.
 */

import { useState, useCallback } from "react";
import type { PrintResult } from "./types";
import {
  printViaSystem,
  generateTicketHTML,
  generateBonPreparationHTML,
  generateRapportZHTML,
} from "@/lib/print/system-print";

/**
 * Options pour le hook d'impression
 */
interface UsePrintOptions {
  /** Callback apres impression reussie */
  onSuccess?: (result: PrintResult) => void;
  /** Callback apres erreur */
  onError?: (error: string) => void;
}

/**
 * Types de documents imprimables
 */
type PrintDocType = "ticket" | "cuisine" | "bar" | "rapport-z" | "test";

/**
 * Reponse etendue de l'API d'impression
 * Peut inclure useSystemPrint + htmlContent quand l'imprimante est de type SYSTEME
 */
interface PrintApiResponse extends PrintResult {
  useSystemPrint?: boolean;
  htmlContent?: string;
}

/**
 * Detecte si une erreur indique une imprimante de type SYSTEME
 */
function isSystemPrintError(error?: string): boolean {
  if (!error) return false;
  const lower = error.toLowerCase();
  return (
    lower.includes("systeme") ||
    lower.includes("système") ||
    lower.includes("printviasystem") ||
    lower.includes("window.print")
  );
}

/**
 * Hook pour imprimer un document
 * Inclut un fallback automatique vers window.print() pour les imprimantes SYSTEME
 */
export function usePrint(options: UsePrintOptions = {}) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastResult, setLastResult] = useState<PrintResult | null>(null);

  const print = useCallback(
    async (
      type: PrintDocType,
      data: {
        venteId?: string;
        sessionId?: string;
        printerId?: string;
      } = {}
    ) => {
      setIsPrinting(true);
      setLastResult(null);

      try {
        const response = await fetch("/api/print", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,
            venteId: data.venteId,
            sessionId: data.sessionId,
            printerId: data.printerId,
          }),
        });

        const result: PrintApiResponse = await response.json();

        // Fallback vers impression systeme si l'API indique useSystemPrint
        if (result.useSystemPrint && result.htmlContent) {
          const systemResult = await printViaSystem(result.htmlContent);
          setLastResult(systemResult);

          if (systemResult.success) {
            options.onSuccess?.(systemResult);
          } else {
            options.onError?.(systemResult.error || "Erreur d'impression systeme");
          }

          return systemResult;
        }

        // Fallback vers impression systeme si l'erreur indique une imprimante SYSTEME
        if (!result.success && isSystemPrintError(result.error)) {
          // L'imprimante est de type SYSTEME mais l'API ne peut pas la gerer.
          // On retourne un resultat indiquant que le client doit utiliser
          // printViaSystem() avec le HTML genere manuellement.
          const systemFallbackResult: PrintResult = {
            success: false,
            error:
              "Imprimante systeme detectee. Utilisez useSystemPrint() ou " +
              "fournissez les données HTML pour l'impression via le navigateur.",
          };
          setLastResult(systemFallbackResult);
          options.onError?.(systemFallbackResult.error!);
          return systemFallbackResult;
        }

        setLastResult(result);

        if (result.success) {
          options.onSuccess?.(result);
        } else {
          options.onError?.(result.error || "Erreur d'impression");
        }

        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erreur de communication";
        const result: PrintResult = {
          success: false,
          error: errorMsg,
        };
        setLastResult(result);
        options.onError?.(errorMsg);
        return result;
      } finally {
        setIsPrinting(false);
      }
    },
    [options]
  );

  const printTicket = useCallback(
    (venteId: string, printerId?: string) => {
      return print("ticket", { venteId, printerId });
    },
    [print]
  );

  const printKitchen = useCallback(
    (venteId: string, printerId?: string) => {
      return print("cuisine", { venteId, printerId });
    },
    [print]
  );

  const printBar = useCallback(
    (venteId: string, printerId?: string) => {
      return print("bar", { venteId, printerId });
    },
    [print]
  );

  const printRapportZ = useCallback(
    (sessionId: string, printerId?: string) => {
      return print("rapport-z", { sessionId, printerId });
    },
    [print]
  );

  const printTest = useCallback(
    (printerId?: string) => {
      return print("test", { printerId });
    },
    [print]
  );

  return {
    isPrinting,
    lastResult,
    print,
    printTicket,
    printKitchen,
    printBar,
    printRapportZ,
    printTest,
  };
}

/**
 * Options pour le routage automatique
 */
interface UseAutoPrintOptions {
  /** Imprimer le ticket client (defaut: true) */
  printTicket?: boolean;
  /** Imprimer le bon cuisine (defaut: true) */
  printKitchen?: boolean;
  /** Imprimer le bon bar (defaut: true) */
  printBar?: boolean;
  /** Callback apres impression reussie */
  onSuccess?: () => void;
  /** Callback apres erreur */
  onError?: (errors: string[]) => void;
}

/**
 * Job d'impression systeme retourne par l'API auto-route
 */
interface SystemPrintJob {
  type: "ticket" | "cuisine" | "bar";
  html: string;
}

/**
 * Resultat du routage automatique
 */
interface AutoPrintResult {
  success: boolean;
  partialSuccess?: boolean;
  results: {
    ticket?: PrintResult;
    kitchen?: PrintResult;
    bar?: PrintResult;
  };
  errors: string[];
  systemPrintJobs?: SystemPrintJob[];
}

/**
 * Hook pour imprimer automatiquement une vente
 * Route automatiquement vers les bonnes imprimantes
 */
export function useAutoPrint(options: UseAutoPrintOptions = {}) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastResult, setLastResult] = useState<AutoPrintResult | null>(null);

  const autoPrint = useCallback(
    async (venteId: string, urgent: boolean = false) => {
      setIsPrinting(true);
      setLastResult(null);

      try {
        const response = await fetch("/api/print/auto-route", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            venteId,
            printTicket: options.printTicket ?? true,
            printKitchen: options.printKitchen ?? true,
            printBar: options.printBar ?? true,
            urgent,
          }),
        });

        const result: AutoPrintResult = await response.json();

        // Gerer les jobs d'impression systeme (imprimantes SYSTEME)
        if (result.systemPrintJobs && result.systemPrintJobs.length > 0) {
          for (const job of result.systemPrintJobs) {
            await printViaSystem(job.html);
          }
        }

        setLastResult(result);

        if (result.success || result.partialSuccess) {
          options.onSuccess?.();
        }

        if (result.errors.length > 0) {
          options.onError?.(result.errors);
        }

        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erreur de communication";
        const result: AutoPrintResult = {
          success: false,
          results: {},
          errors: [errorMsg],
        };
        setLastResult(result);
        options.onError?.([errorMsg]);
        return result;
      } finally {
        setIsPrinting(false);
      }
    },
    [options]
  );

  return {
    isPrinting,
    lastResult,
    autoPrint,
  };
}

/**
 * Hook pour tester une imprimante
 */
export function usePrinterTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<PrintResult | null>(null);

  const testPrinter = useCallback(async (printerId?: string) => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "test",
          printerId,
        }),
      });

      const result: PrintResult = await response.json();
      setTestResult(result);
      return result;
    } catch (error) {
      const result: PrintResult = {
        success: false,
        error: error instanceof Error ? error.message : "Erreur de test",
      };
      setTestResult(result);
      return result;
    } finally {
      setIsTesting(false);
    }
  }, []);

  return {
    isTesting,
    testResult,
    testPrinter,
  };
}

/**
 * Options pour l'impression systeme
 */
interface UseSystemPrintOptions {
  /** Largeur du papier en mm (defaut: 80) */
  paperWidth?: 58 | 76 | 80;
  /** Callback apres impression reussie */
  onSuccess?: (result: PrintResult) => void;
  /** Callback apres erreur */
  onError?: (error: string) => void;
}

/**
 * Hook pour l'impression systeme via window.print()
 *
 * Permet d'imprimer du HTML directement via les imprimantes installees
 * dans le systeme d'exploitation, sans passer par ESC/POS.
 *
 * @example
 * ```tsx
 * const { isPrinting, printHTML, printTicket, printBonPreparation, printRapportZ } = useSystemPrint();
 *
 * // Imprimer du HTML brut
 * await printHTML('<div class="ticket">...</div>');
 *
 * // Imprimer un ticket a partir de donnees structurees
 * await printTicket(ticketData);
 * ```
 */
export function useSystemPrint(options: UseSystemPrintOptions = {}) {
  const [isPrinting, setIsPrinting] = useState(false);

  const printHTML = useCallback(
    async (htmlContent: string, overrideOptions?: { paperWidth?: 58 | 76 | 80 }) => {
      setIsPrinting(true);
      try {
        const result = await printViaSystem(htmlContent, {
          paperWidth: overrideOptions?.paperWidth ?? options.paperWidth,
        });

        if (result.success) {
          options.onSuccess?.(result);
        } else {
          options.onError?.(result.error || "Erreur d'impression systeme");
        }

        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erreur d'impression systeme";
        const result: PrintResult = {
          success: false,
          error: errorMsg,
        };
        options.onError?.(errorMsg);
        return result;
      } finally {
        setIsPrinting(false);
      }
    },
    [options]
  );

  const printTicket = useCallback(
    async (data: Parameters<typeof generateTicketHTML>[0]) => {
      const html = generateTicketHTML(data);
      return printHTML(html);
    },
    [printHTML]
  );

  const printBonPreparation = useCallback(
    async (
      data: Parameters<typeof generateBonPreparationHTML>[0],
      type: "cuisine" | "bar" = "cuisine"
    ) => {
      const html = generateBonPreparationHTML(data, type);
      return printHTML(html);
    },
    [printHTML]
  );

  const printRapportZ = useCallback(
    async (data: Parameters<typeof generateRapportZHTML>[0]) => {
      const html = generateRapportZHTML(data);
      return printHTML(html);
    },
    [printHTML]
  );

  return {
    isPrinting,
    printHTML,
    printTicket,
    printBonPreparation,
    printRapportZ,
  };
}
