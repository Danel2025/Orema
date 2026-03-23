"use client";

import { useEffect, useRef, useCallback } from "react";

export interface BarcodeScanOptions {
  /** Callback appelé quand un code-barres est détecté */
  onScan: (barcode: string) => void;
  /**
   * Délai moyen entre touches du scanner (ms)
   * Honeywell: ~10ms, Zebra: ~80ms, Défaut: 40ms
   */
  averageKeyPressTime?: number;
  /**
   * Timeout avant de considérer fin de scan (ms)
   * Défaut: 100ms
   */
  scanTimeout?: number;
  /**
   * Longueur minimale pour valider un scan
   * Défaut: 8 (EAN-8 minimum)
   */
  minLength?: number;
  /**
   * Caractère de terminaison (généralement Enter)
   * Défaut: "Enter"
   */
  suffix?: string;
  /** Désactiver le hook (utile quand un input a le focus) */
  enabled?: boolean;
}

/**
 * Hook pour détecter les scans de code-barres via un scanner USB HID.
 *
 * Les scanners USB agissent comme un clavier : ils envoient les caractères
 * du code-barres très rapidement (~10-80ms entre chaque touche) puis
 * appuient sur Enter. Ce hook détecte cette saisie ultra-rapide par
 * timing pour la distinguer de la saisie humaine (~100-300ms entre touches).
 *
 * @example
 * ```tsx
 * useBarcodeScan({
 *   onScan: (barcode) => {
 *     console.log("Code-barres scanné:", barcode);
 *   },
 * });
 * ```
 */
export function useBarcodeScan({
  onScan,
  averageKeyPressTime = 40,
  scanTimeout = 100,
  minLength = 8,
  suffix = "Enter",
  enabled = true,
}: BarcodeScanOptions) {
  const bufferRef = useRef<string>("");
  const timingsRef = useRef<number[]>([]);
  const lastKeyTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScanRef = useRef(onScan);

  // Garder la ref du callback à jour sans re-créer le listener
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const resetBuffer = useCallback(() => {
    bufferRef.current = "";
    timingsRef.current = [];
    lastKeyTimeRef.current = 0;
  }, []);

  const emitScan = useCallback(
    (barcode: string) => {
      if (barcode.length >= minLength) {
        onScanRef.current(barcode);
      }
      resetBuffer();
    },
    [minLength, resetBuffer]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ne pas capturer si un input/textarea/select a le focus
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Sauf si c'est le champ code-barres lui-même
      const isBarcodeFiel = target.id === "produit-codeBarre";

      if (isInputFocused && !isBarcodeFiel) {
        return;
      }

      const now = performance.now();
      const timeSinceLast = now - lastKeyTimeRef.current;

      // Caractère de terminaison détecté (Enter)
      if (suffix && e.key === suffix) {
        if (bufferRef.current.length >= minLength) {
          e.preventDefault();
          emitScan(bufferRef.current);
        } else {
          resetBuffer();
        }
        return;
      }

      // Ignorer les touches spéciales (Shift, Ctrl, etc.)
      if (e.key.length !== 1) {
        return;
      }

      // Accumuler le caractère
      if (lastKeyTimeRef.current === 0) {
        // Première touche de la séquence
        bufferRef.current = e.key;
      } else if (timeSinceLast < averageKeyPressTime * 2) {
        // Continue la séquence (timing rapide = scanner)
        bufferRef.current += e.key;
        timingsRef.current.push(timeSinceLast);
      } else {
        // Nouvelle séquence (délai trop long = humain)
        bufferRef.current = e.key;
        timingsRef.current = [];
      }

      lastKeyTimeRef.current = now;

      // Reset du timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (bufferRef.current.length < minLength) {
          resetBuffer();
          return;
        }

        // Vérifier le timing moyen pour confirmer que c'est un scan
        if (timingsRef.current.length > 0) {
          const avgTiming =
            timingsRef.current.reduce((a, b) => a + b, 0) /
            timingsRef.current.length;

          if (avgTiming < averageKeyPressTime * 2) {
            emitScan(bufferRef.current);
            return;
          }
        }

        resetBuffer();
      }, scanTimeout);
    },
    [averageKeyPressTime, scanTimeout, minLength, suffix, emitScan, resetBuffer]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleKeyDown, enabled]);
}
