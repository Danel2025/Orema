"use client";

/**
 * SupplementSelector - Composant reutilisable de selection de supplements
 * Utilise dans la caisse pour permettre au client de choisir des supplements
 * lors de l'ajout d'un produit au panier.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Plus, SpinnerGap } from "@phosphor-icons/react";
import { Dialog, Flex, Text, Checkbox, Button, Badge } from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { getSupplements } from "@/actions/supplements";

export interface SupplementOption {
  id: string;
  nom: string;
  prix: number;
}

export interface SelectedSupplement {
  id: string;
  nom: string;
  prix: number;
}

interface SupplementSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produitId: string;
  produitNom: string;
  produitPrix: number;
  /** Pre-loaded supplements. If not provided, fetches from server. */
  supplements?: SupplementOption[];
  onConfirm: (supplements: SelectedSupplement[]) => void;
}

export function SupplementSelector({
  open,
  onOpenChange,
  produitId,
  produitNom,
  produitPrix,
  supplements: externalSupplements,
  onConfirm,
}: SupplementSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [supplements, setSupplements] = useState<SupplementOption[]>(externalSupplements ?? []);

  // Track open transitions (derived-state pattern)
  const prevOpenRef = useRef(false);
  const needsFetchRef = useRef(false);

  if (open && !prevOpenRef.current) {
    // Reset selections when dialog opens
    setSelectedIds(new Set());
    if (!externalSupplements) {
      needsFetchRef.current = true;
    } else {
      setSupplements(externalSupplements);
    }
  }
  prevOpenRef.current = open;

  // Sync external supplements when they change
  const prevExternalRef = useRef(externalSupplements);
  if (open && externalSupplements && externalSupplements !== prevExternalRef.current) {
    setSupplements(externalSupplements);
  }
  prevExternalRef.current = externalSupplements;

  // Fetch supplements from server if not provided externally (async side effect)
  useEffect(() => {
    if (!needsFetchRef.current || !open) return;
    needsFetchRef.current = false;
    let cancelled = false;
    setIsLoading(true);
    getSupplements(produitId).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        setSupplements(
          result.data.map((s: { id: string; nom: string; prix: number }) => ({
            id: s.id,
            nom: s.nom,
            prix: Number(s.prix),
          }))
        );
      }
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [open, produitId]);

  const toggleSupplement = useCallback((supplementId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(supplementId)) {
        next.delete(supplementId);
      } else {
        next.add(supplementId);
      }
      return next;
    });
  }, []);

  const totalSupplements = supplements
    .filter((s) => selectedIds.has(s.id))
    .reduce((acc, s) => acc + s.prix, 0);

  const totalFinal = produitPrix + totalSupplements;

  const handleConfirm = useCallback(() => {
    setIsSubmitting(true);
    const selected = supplements.filter((s) => selectedIds.has(s.id));
    onConfirm(selected);
    setIsSubmitting(false);
    onOpenChange(false);
  }, [supplements, selectedIds, onConfirm, onOpenChange]);

  const handleSkip = useCallback(() => {
    onConfirm([]);
    onOpenChange(false);
  }, [onConfirm, onOpenChange]);

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
              {produitNom}
            </Text>
          </Flex>
          <Dialog.Close>
            <Button variant="ghost" color="gray" size="1">
              <X size={18} aria-hidden="true" />
            </Button>
          </Dialog.Close>
        </Flex>

        {/* Content */}
        <ScrollArea style={{ maxHeight: "50vh" }}>
          <Flex direction="column" gap="2" p="4">
            {isLoading ? (
              <Flex justify="center" align="center" style={{ padding: 40 }}>
                <SpinnerGap
                  size={24}
                  className="animate-spin"
                  style={{ color: "var(--gray-10)" }}
                  aria-hidden="true"
                />
              </Flex>
            ) : supplements.length === 0 ? (
              <Text size="2" color="gray" align="center" style={{ padding: 24 }}>
                Aucun supplement disponible pour ce produit.
              </Text>
            ) : (
              supplements.map((supplement) => {
                const isSelected = selectedIds.has(supplement.id);
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
                {formatCurrency(produitPrix)}
              </Text>
            </Flex>
            {totalSupplements > 0 && (
              <Flex justify="between" align="center">
                <Text size="2">Supplements ({selectedIds.size})</Text>
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
                {formatCurrency(totalFinal)}
              </Text>
            </Flex>
          </Flex>

          {/* Actions */}
          <Flex gap="3">
            <Button variant="soft" color="gray" style={{ flex: 1 }} onClick={handleSkip}>
              Sans supplement
            </Button>
            <Button
              style={{ flex: 1 }}
              onClick={handleConfirm}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? <SpinnerGap size={16} className="animate-spin" aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
              Ajouter au panier
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
