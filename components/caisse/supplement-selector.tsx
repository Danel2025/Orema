"use client";

/**
 * SupplementSelector - Modal de selection des supplements lors de l'ajout au panier
 * S'ouvre quand un produit a des supplements disponibles
 */

import { useState, useCallback, useRef } from "react";
import { X, Plus, SpinnerGap } from "@phosphor-icons/react";
import { Dialog, Flex, Text, Checkbox, Button, Badge } from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

interface Supplement {
  id: string;
  nom: string;
  prix: number;
}

interface SelectedSupplement {
  id: string;
  nom: string;
  prix: number;
}

interface SupplementSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produit: {
    id: string;
    nom: string;
    prixVente: number;
    tauxTva: string;
    supplements: Supplement[];
  };
  onConfirm: (supplements: SelectedSupplement[]) => void;
}

export function SupplementSelector({
  open,
  onOpenChange,
  produit,
  onConfirm,
}: SupplementSelectorProps) {
  const [selectedSupplements, setSelectedSupplements] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset selections when dialog opens (derived-state pattern)
  const prevOpenRef = useRef(false);
  if (open && !prevOpenRef.current) {
    setSelectedSupplements(new Set());
  }
  prevOpenRef.current = open;

  // Toggle supplement selection
  const toggleSupplement = useCallback((supplementId: string) => {
    setSelectedSupplements((prev) => {
      const next = new Set(prev);
      if (next.has(supplementId)) {
        next.delete(supplementId);
      } else {
        next.add(supplementId);
      }
      return next;
    });
  }, []);

  // Calculate total with supplements
  const calculateTotal = useCallback(() => {
    let total = produit.prixVente;
    for (const supplement of produit.supplements) {
      if (selectedSupplements.has(supplement.id)) {
        total += supplement.prix;
      }
    }
    return total;
  }, [produit.prixVente, produit.supplements, selectedSupplements]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    setIsSubmitting(true);
    const supplements = produit.supplements.filter((s) => selectedSupplements.has(s.id));
    onConfirm(supplements);
    setIsSubmitting(false);
    onOpenChange(false);
  }, [produit.supplements, selectedSupplements, onConfirm, onOpenChange]);

  // Handle skip (add without supplements)
  const handleSkip = useCallback(() => {
    onConfirm([]);
    onOpenChange(false);
  }, [onConfirm, onOpenChange]);

  const totalSupplements = Array.from(selectedSupplements).reduce((acc, id) => {
    const supplement = produit.supplements.find((s) => s.id === id);
    return acc + (supplement?.prix || 0);
  }, 0);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="420px" style={{ padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <Flex
          justify="between"
          align="center"
          p="4"
          style={{ borderBottom: "1px solid var(--gray-a6)" }}
        >
          <Flex direction="column" gap="1">
            <Dialog.Title size="4" weight="bold" style={{ margin: 0 }}>
              Supplements / Options
            </Dialog.Title>
            <Text size="2" color="gray">
              {produit.nom}
            </Text>
          </Flex>
          <Dialog.Close>
            <Button variant="ghost" color="gray" size="1">
              <X size={18} />
            </Button>
          </Dialog.Close>
        </Flex>

        {/* Content */}
        <ScrollArea style={{ maxHeight: "50vh" }}>
          <Flex direction="column" gap="2" p="4">
            {produit.supplements.length === 0 ? (
              <Text size="2" color="gray" align="center" style={{ padding: 24 }}>
                Aucun supplement disponible pour ce produit.
              </Text>
            ) : (
              produit.supplements.map((supplement) => {
                const isSelected = selectedSupplements.has(supplement.id);
                return (
                  <Flex
                    key={supplement.id}
                    align="center"
                    justify="between"
                    p="3"
                    style={{
                      backgroundColor: isSelected ? "var(--accent-a3)" : "var(--gray-a2)",
                      borderRadius: 10,
                      border: isSelected
                        ? "1px solid var(--accent-a6)"
                        : "1px solid var(--gray-a4)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onClick={() => toggleSupplement(supplement.id)}
                  >
                    <Flex align="center" gap="3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSupplement(supplement.id)}
                        size="2"
                      />
                      <Text size="3" weight={isSelected ? "medium" : "regular"}>
                        {supplement.nom}
                      </Text>
                    </Flex>
                    <Badge color={isSelected ? "violet" : "gray"} variant="soft" size="2">
                      +{formatCurrency(supplement.prix)}
                    </Badge>
                  </Flex>
                );
              })
            )}
          </Flex>
        </ScrollArea>

        {/* Footer with totals */}
        <Flex
          direction="column"
          gap="3"
          p="4"
          style={{
            borderTop: "1px solid var(--gray-a6)",
            backgroundColor: "var(--gray-a2)",
          }}
        >
          {/* Price breakdown */}
          <Flex direction="column" gap="2">
            <Flex justify="between" align="center">
              <Text size="2" color="gray">
                Prix de base
              </Text>
              <Text
                size="2"
                weight="medium"
                style={{
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                }}
              >
                {formatCurrency(produit.prixVente)}
              </Text>
            </Flex>
            {totalSupplements > 0 && (
              <Flex justify="between" align="center">
                <Text size="2">Supplements ({selectedSupplements.size})</Text>
                <Text
                  size="2"
                  weight="medium"
                  style={{
                    fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  +{formatCurrency(totalSupplements)}
                </Text>
              </Flex>
            )}
            <Flex
              justify="between"
              align="center"
              pt="2"
              style={{ borderTop: "1px solid var(--gray-a6)" }}
            >
              <Text size="3" weight="bold">
                Total
              </Text>
              <Text
                size="4"
                weight="bold"
                style={{
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                }}
              >
                {formatCurrency(calculateTotal())}
              </Text>
            </Flex>
          </Flex>

          {/* Actions */}
          <Flex gap="3">
            <Button variant="soft" color="gray" style={{ flex: 1 }} onClick={handleSkip}>
              Sans supplement
            </Button>
            <Button style={{ flex: 1 }} onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? <SpinnerGap size={16} className="animate-spin" /> : <Plus size={16} />}
              Ajouter au panier
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
