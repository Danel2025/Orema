"use client";

/**
 * QuantityInput - Clavier numerique pour saisie de quantite
 * Permet de saisir une quantite avant de cliquer sur un produit
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Flex, Text, IconButton, Box, Kbd } from "@radix-ui/themes";
import { X, Backspace } from "@phosphor-icons/react";
import { useCartStore } from "@/stores/cart-store";

interface QuantityInputProps {
  /** Callback quand la quantite est confirmee */
  onConfirm?: (quantity: number) => void;
  /** Mode compact (inline) ou mode clavier complet */
  compact?: boolean;
}

export function QuantityInput({ onConfirm, compact = false }: QuantityInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const { pendingQuantity, setPendingQuantity } = useCartStore();

  // Synchroniser l'affichage avec le store (derived-state pattern)
  const prevQuantityRef = useRef(pendingQuantity);
  if (prevQuantityRef.current !== pendingQuantity) {
    prevQuantityRef.current = pendingQuantity;
    setDisplayValue(pendingQuantity !== null ? pendingQuantity.toString() : "");
  }

  // Ajouter un chiffre
  const handleDigit = useCallback(
    (digit: string) => {
      const newValue = displayValue + digit;
      const numValue = parseInt(newValue, 10);
      if (numValue <= 999) {
        setDisplayValue(newValue);
        setPendingQuantity(numValue);
      }
    },
    [displayValue, setPendingQuantity]
  );

  // Supprimer le dernier chiffre
  const handleBackspace = useCallback(() => {
    if (displayValue.length > 1) {
      const newValue = displayValue.slice(0, -1);
      setDisplayValue(newValue);
      setPendingQuantity(parseInt(newValue, 10));
    } else {
      setDisplayValue("");
      setPendingQuantity(null);
    }
  }, [displayValue, setPendingQuantity]);

  // Effacer tout
  const handleClear = useCallback(() => {
    setDisplayValue("");
    setPendingQuantity(null);
  }, [setPendingQuantity]);

  // Gestion du clavier physique
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si on est dans un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Chiffres
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      }

      // Backspace
      if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      }

      // Escape pour effacer
      if (e.key === "Escape" && displayValue) {
        e.preventDefault();
        handleClear();
      }

      // * pour multiplier (clear et commencer)
      if (e.key === "*" || e.key === "x" || e.key === "X") {
        e.preventDefault();
        // Le prochain chiffre tape commencera une nouvelle quantite
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [displayValue, handleDigit, handleBackspace, handleClear]);

  // Mode compact: juste l'affichage et quelques controles
  if (compact) {
    return (
      <Flex align="center" gap="2">
        <Text size="2" color="gray">
          Qte:
        </Text>
        <Text
          size="3"
          weight="bold"
          style={{
            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            color: pendingQuantity ? "var(--accent-11)" : "var(--gray-10)",
            minWidth: 32,
          }}
        >
          {displayValue || "1"}
        </Text>
        {pendingQuantity ? (
          <IconButton size="1" variant="ghost" color="gray" onClick={handleClear}>
            <X size={14} />
          </IconButton>
        ) : null}
      </Flex>
    );
  }

  // Mode clavier complet
  return (
    <Box
      p="3"
      style={{
        backgroundColor: "var(--color-panel-solid)",
        borderRadius: 12,
        border: "1px solid var(--gray-a6)",
      }}
    >
      {/* Affichage de la quantite */}
      <Box
        mb="3"
        p="3"
        style={{
          backgroundColor: pendingQuantity ? "var(--accent-a2)" : "var(--gray-a2)",
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        <Text size="1" color="gray" mb="1" style={{ display: "block" }}>
          Quantite
        </Text>
        <Text
          size="6"
          weight="bold"
          style={{
            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            color: pendingQuantity ? "var(--accent-11)" : "var(--gray-10)",
          }}
        >
          {displayValue || "1"}
        </Text>
      </Box>

      {/* Clavier numerique */}
      <Flex direction="column" gap="2">
        {/* Ligne 1: 7 8 9 */}
        <Flex gap="2">
          {["7", "8", "9"].map((digit) => (
            <NumPadButton key={digit} onClick={() => handleDigit(digit)}>
              {digit}
            </NumPadButton>
          ))}
        </Flex>

        {/* Ligne 2: 4 5 6 */}
        <Flex gap="2">
          {["4", "5", "6"].map((digit) => (
            <NumPadButton key={digit} onClick={() => handleDigit(digit)}>
              {digit}
            </NumPadButton>
          ))}
        </Flex>

        {/* Ligne 3: 1 2 3 */}
        <Flex gap="2">
          {["1", "2", "3"].map((digit) => (
            <NumPadButton key={digit} onClick={() => handleDigit(digit)}>
              {digit}
            </NumPadButton>
          ))}
        </Flex>

        {/* Ligne 4: Clear 0 Backspace */}
        <Flex gap="2">
          <NumPadButton onClick={handleClear} variant="danger">
            <X size={18} />
          </NumPadButton>
          <NumPadButton onClick={() => handleDigit("0")}>0</NumPadButton>
          <NumPadButton onClick={handleBackspace} variant="secondary">
            <Backspace size={18} />
          </NumPadButton>
        </Flex>
      </Flex>

      {/* Aide clavier */}
      <Flex justify="center" mt="3" gap="2">
        <Text size="1" color="gray">
          Tapez les chiffres sur votre clavier
        </Text>
      </Flex>
    </Box>
  );
}

// Bouton du clavier numerique
function NumPadButton({
  children,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "secondary" | "danger";
}) {
  const getStyles = () => {
    switch (variant) {
      case "danger":
        return {
          backgroundColor: "var(--red-a3)",
          color: "var(--red-11)",
          borderColor: "var(--red-a6)",
        };
      case "secondary":
        return {
          backgroundColor: "var(--gray-a3)",
          color: "var(--gray-11)",
          borderColor: "var(--gray-a6)",
        };
      default:
        return {
          backgroundColor: "var(--gray-a2)",
          color: "var(--gray-12)",
          borderColor: "var(--gray-a6)",
        };
    }
  };

  const styles = getStyles();

  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        height: 48,
        borderRadius: 8,
        border: `1px solid ${styles.borderColor}`,
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontSize: 18,
        fontWeight: 600,
        fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.1s ease",
      }}
    >
      {children}
    </button>
  );
}
