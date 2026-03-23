"use client";

/**
 * PrintButton - Bouton d'impression pour la caisse
 *
 * Permet d'imprimer:
 * - Le ticket client apres une vente
 * - Un duplicata de ticket
 * - Un rapport Z
 *
 * Raccourci clavier: F8
 */

import { useState, useEffect, useCallback } from "react";
import { Button, DropdownMenu, IconButton, Tooltip, Spinner } from "@radix-ui/themes";
import {
  Printer,
  Receipt,
  FileText,
  CookingPot,
  Wine,
  TestTube,
  CaretDown,
  SpinnerGap,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { printViaSystem } from "@/lib/print/system-print";

/**
 * Types de documents imprimables
 */
type PrintDocType = "ticket" | "cuisine" | "bar" | "rapport-z" | "test";

interface PrintButtonProps {
  /** ID de la vente pour imprimer le ticket */
  venteId?: string;
  /** ID de la session pour imprimer le rapport Z */
  sessionId?: string;
  /** Afficher comme bouton compact (icone seule) */
  compact?: boolean;
  /** Variante du bouton */
  variant?: "solid" | "soft" | "outline" | "ghost" | "surface";
  /** Couleur du bouton */
  color?: "violet" | "gray" | "blue" | "green";
  /** Taille du bouton */
  size?: "1" | "2" | "3" | "4";
  /** Desactiver le bouton */
  disabled?: boolean;
  /** Callback apres impression reussie */
  onPrintSuccess?: () => void;
  /** Callback apres erreur d'impression */
  onPrintError?: (error: string) => void;
}

/**
 * Envoie une requete d'impression a l'API
 * Gere automatiquement le fallback vers impression systeme (window.print)
 * quand l'imprimante est de type SYSTEME
 */
async function sendPrintRequest(
  type: PrintDocType,
  options: { venteId?: string; sessionId?: string; printerId?: string } = {}
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch("/api/print", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type,
      venteId: options.venteId,
      sessionId: options.sessionId,
      printerId: options.printerId,
    }),
  });

  const result = await response.json();

  // Fallback impression systeme : l'API a detecte une imprimante SYSTEME
  // et renvoie le HTML a imprimer via window.print()
  if (result.useSystemPrint && result.htmlContent) {
    return printViaSystem(result.htmlContent);
  }

  return result;
}

export function PrintButton({
  venteId,
  sessionId,
  compact = false,
  variant = "soft",
  color = "violet",
  size = "2",
  disabled = false,
  onPrintSuccess,
  onPrintError,
}: PrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastPrintType, setLastPrintType] = useState<PrintDocType | null>(null);

  /**
   * Gere l'impression d'un document
   */
  const handlePrint = useCallback(
    async (type: PrintDocType) => {
      if (isPrinting) return;

      // Verifier les prerequis
      if (type === "ticket" && !venteId) {
        toast.error("Aucune vente a imprimer");
        return;
      }

      if (type === "rapport-z" && !sessionId) {
        toast.error("Aucune session a imprimer");
        return;
      }

      setIsPrinting(true);
      setLastPrintType(type);

      try {
        const result = await sendPrintRequest(type, {
          venteId,
          sessionId,
        });

        if (result.success) {
          toast.success(result.message || "Impression envoyee");
          onPrintSuccess?.();
        } else {
          toast.error(result.error || "Erreur d'impression");
          onPrintError?.(result.error || "Erreur inconnue");
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erreur de communication";
        toast.error(errorMsg);
        onPrintError?.(errorMsg);
      } finally {
        setIsPrinting(false);
      }
    },
    [isPrinting, venteId, sessionId, onPrintSuccess, onPrintError]
  );

  /**
   * Raccourci clavier F8 pour imprimer le ticket
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F8" && !disabled && venteId) {
        event.preventDefault();
        handlePrint("ticket");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrint, disabled, venteId]);

  // Mode compact: bouton avec menu dropdown
  if (compact) {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <IconButton variant={variant} color={color} size={size} disabled={disabled || isPrinting}>
            {isPrinting ? <SpinnerGap size={16} className="animate-spin" /> : <Printer size={16} />}
          </IconButton>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content>
          {/* Ticket client */}
          <DropdownMenu.Item onClick={() => handlePrint("ticket")} disabled={!venteId}>
            <Receipt size={14} />
            Ticket client (F8)
          </DropdownMenu.Item>

          {/* Bon cuisine */}
          <DropdownMenu.Item onClick={() => handlePrint("cuisine")} disabled={!venteId}>
            <CookingPot size={14} />
            Bon cuisine
          </DropdownMenu.Item>

          {/* Bon bar */}
          <DropdownMenu.Item onClick={() => handlePrint("bar")} disabled={!venteId}>
            <Wine size={14} />
            Bon bar
          </DropdownMenu.Item>

          <DropdownMenu.Separator />

          {/* Rapport Z */}
          <DropdownMenu.Item onClick={() => handlePrint("rapport-z")} disabled={!sessionId}>
            <FileText size={14} />
            Rapport Z
          </DropdownMenu.Item>

          <DropdownMenu.Separator />

          {/* Test d'impression */}
          <DropdownMenu.Item onClick={() => handlePrint("test")}>
            <TestTube size={14} />
            Test d'impression
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    );
  }

  // Mode normal: bouton avec texte et dropdown
  return (
    <Tooltip content="Imprimer (F8)">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Button variant={variant} color={color} size={size} disabled={disabled || isPrinting}>
            {isPrinting ? <SpinnerGap size={16} className="animate-spin" /> : <Printer size={16} />}
            Imprimer
            <CaretDown size={14} />
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content align="end">
          {/* Ticket client */}
          <DropdownMenu.Item onClick={() => handlePrint("ticket")} disabled={!venteId}>
            <Receipt size={14} />
            Ticket client (F8)
          </DropdownMenu.Item>

          {/* Bon cuisine */}
          <DropdownMenu.Item onClick={() => handlePrint("cuisine")} disabled={!venteId}>
            <CookingPot size={14} />
            Bon cuisine
          </DropdownMenu.Item>

          {/* Bon bar */}
          <DropdownMenu.Item onClick={() => handlePrint("bar")} disabled={!venteId}>
            <Wine size={14} />
            Bon bar
          </DropdownMenu.Item>

          <DropdownMenu.Separator />

          {/* Rapport Z */}
          <DropdownMenu.Item onClick={() => handlePrint("rapport-z")} disabled={!sessionId}>
            <FileText size={14} />
            Rapport Z
          </DropdownMenu.Item>

          <DropdownMenu.Separator />

          {/* Test d'impression */}
          <DropdownMenu.Item onClick={() => handlePrint("test")}>
            <TestTube size={14} />
            Test d'impression
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Tooltip>
  );
}

/**
 * Bouton simple pour imprimer un ticket (sans dropdown)
 */
export function PrintTicketButton({
  venteId,
  variant = "soft",
  color = "violet",
  size = "2",
  disabled = false,
  onPrintSuccess,
  onPrintError,
}: Omit<PrintButtonProps, "sessionId" | "compact">) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useCallback(async () => {
    if (isPrinting || !venteId) return;

    setIsPrinting(true);

    try {
      const result = await sendPrintRequest("ticket", { venteId });

      if (result.success) {
        toast.success("Ticket imprime");
        onPrintSuccess?.();
      } else {
        toast.error(result.error || "Erreur d'impression");
        onPrintError?.(result.error || "Erreur inconnue");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erreur de communication";
      toast.error(errorMsg);
      onPrintError?.(errorMsg);
    } finally {
      setIsPrinting(false);
    }
  }, [isPrinting, venteId, onPrintSuccess, onPrintError]);

  // Raccourci F8
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F8" && !disabled && venteId) {
        event.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrint, disabled, venteId]);

  return (
    <Tooltip content="Imprimer le ticket (F8)">
      <Button
        variant={variant}
        color={color}
        size={size}
        disabled={disabled || isPrinting || !venteId}
        onClick={handlePrint}
      >
        {isPrinting ? <SpinnerGap size={16} className="animate-spin" /> : <Printer size={16} />}
        Imprimer ticket
      </Button>
    </Tooltip>
  );
}

/**
 * Bouton pour imprimer un rapport Z
 */
export function PrintRapportZButton({
  sessionId,
  variant = "soft",
  color = "gray",
  size = "2",
  disabled = false,
  onPrintSuccess,
  onPrintError,
}: Omit<PrintButtonProps, "venteId" | "compact">) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useCallback(async () => {
    if (isPrinting || !sessionId) return;

    setIsPrinting(true);

    try {
      const result = await sendPrintRequest("rapport-z", { sessionId });

      if (result.success) {
        toast.success("Rapport Z imprime");
        onPrintSuccess?.();
      } else {
        toast.error(result.error || "Erreur d'impression");
        onPrintError?.(result.error || "Erreur inconnue");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erreur de communication";
      toast.error(errorMsg);
      onPrintError?.(errorMsg);
    } finally {
      setIsPrinting(false);
    }
  }, [isPrinting, sessionId, onPrintSuccess, onPrintError]);

  return (
    <Tooltip content="Imprimer le rapport Z">
      <Button
        variant={variant}
        color={color}
        size={size}
        disabled={disabled || isPrinting || !sessionId}
        onClick={handlePrint}
      >
        {isPrinting ? <SpinnerGap size={16} className="animate-spin" /> : <FileText size={16} />}
        Imprimer rapport Z
      </Button>
    </Tooltip>
  );
}

/**
 * Bouton pour tester l'impression
 */
export function TestPrintButton({
  printerId,
  variant = "soft",
  color = "blue",
  size = "1",
  disabled = false,
}: {
  printerId?: string;
  variant?: "solid" | "soft" | "outline" | "ghost" | "surface";
  color?: "violet" | "gray" | "blue" | "green";
  size?: "1" | "2" | "3" | "4";
  disabled?: boolean;
}) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handleTest = useCallback(async () => {
    if (isPrinting) return;

    setIsPrinting(true);

    try {
      const result = await sendPrintRequest("test", { printerId });

      if (result.success) {
        toast.success("Test d'impression envoye");
      } else {
        toast.error(result.error || "Erreur de test");
      }
    } catch (error) {
      toast.error("Erreur de communication avec l'imprimante");
    } finally {
      setIsPrinting(false);
    }
  }, [isPrinting, printerId]);

  return (
    <Tooltip content="Envoyer un test d'impression">
      <IconButton
        variant={variant}
        color={color}
        size={size}
        disabled={disabled || isPrinting}
        onClick={handleTest}
      >
        {isPrinting ? <SpinnerGap size={14} className="animate-spin" /> : <TestTube size={14} />}
      </IconButton>
    </Tooltip>
  );
}
