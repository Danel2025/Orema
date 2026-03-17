"use client";

/**
 * DiscountModal - Modal de gestion des remises
 * Permet d'appliquer une remise par ligne ou une remise globale
 */

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  TextField,
  Flex,
  Text,
  Button,
  SegmentedControl,
  Box,
} from "@radix-ui/themes";
import { Percent, DollarSign, Tag } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import type { CartItem, CartItemRemise } from "@/types";

// Types de remise
type RemiseType = "POURCENTAGE" | "MONTANT_FIXE";
type RemiseScope = "ligne" | "panier";

interface DiscountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Si un item est fourni, on applique une remise par ligne
  selectedItem?: CartItem;
}

export function DiscountModal({
  open,
  onOpenChange,
  selectedItem,
}: DiscountModalProps) {
  const [scope, setScope] = useState<RemiseScope>(selectedItem ? "ligne" : "panier");
  const [remiseType, setRemiseType] = useState<RemiseType>("POURCENTAGE");
  const [remiseValue, setRemiseValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { applyRemise, applyItemRemise, sousTotal } = useCartStore();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setScope(selectedItem ? "ligne" : "panier");
      setRemiseType("POURCENTAGE");
      setRemiseValue("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, selectedItem]);

  // Calculer l'apercu de la remise
  const calculatePreview = () => {
    const value = parseFloat(remiseValue);
    if (isNaN(value) || value <= 0) return null;

    let baseAmount = 0;
    if (scope === "ligne" && selectedItem) {
      // Inclure les supplements dans le calcul
      const prixAvecSupplements = selectedItem.prixUnitaire + (selectedItem.totalSupplements || 0);
      baseAmount = prixAvecSupplements * selectedItem.quantite;
    } else {
      baseAmount = sousTotal;
    }

    let remiseAmount = 0;
    if (remiseType === "POURCENTAGE") {
      remiseAmount = Math.round((baseAmount * value) / 100);
    } else {
      remiseAmount = value;
    }

    return {
      base: baseAmount,
      remise: remiseAmount,
      apres: baseAmount - remiseAmount,
    };
  };

  const preview = calculatePreview();

  // Appliquer la remise
  const handleApply = () => {
    const value = parseFloat(remiseValue);
    if (isNaN(value) || value <= 0) return;

    // Validation: pourcentage ne peut pas depasser 100%
    if (remiseType === "POURCENTAGE" && value > 100) {
      return;
    }

    if (scope === "ligne" && selectedItem) {
      const remise: CartItemRemise = { type: remiseType, valeur: value };
      applyItemRemise(selectedItem.lineId, remise);
    } else {
      applyRemise(remiseType, value);
    }

    onOpenChange(false);
  };

  // Supprimer la remise de ligne existante
  const handleClearLineRemise = () => {
    if (selectedItem) {
      applyItemRemise(selectedItem.lineId, undefined);
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="400px" aria-describedby={undefined}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <Tag size={20} />
            {selectedItem ? "Remise sur la ligne" : "Appliquer une remise"}
          </Flex>
        </Dialog.Title>

        <Dialog.Description size="2" color="gray" mb="4">
          {selectedItem
            ? `Remise pour: ${selectedItem.produit.nom} (x${selectedItem.quantite})`
            : "Appliquer une remise globale sur le panier"}
        </Dialog.Description>

        {/* Scope: Ligne ou Panier (uniquement si un item est selectionne) */}
        {selectedItem ? <Box mb="4">
            <Text as="label" size="2" weight="medium" mb="2" style={{ display: "block" }}>
              Appliquer sur
            </Text>
            <SegmentedControl.Root
              value={scope}
              onValueChange={(value) => setScope(value as RemiseScope)}
            >
              <SegmentedControl.Item value="ligne">Cette ligne</SegmentedControl.Item>
              <SegmentedControl.Item value="panier">Tout le panier</SegmentedControl.Item>
            </SegmentedControl.Root>
          </Box> : null}

        {/* Type de remise */}
        <Box mb="4">
          <Text as="label" size="2" weight="medium" mb="2" style={{ display: "block" }}>
            Type de remise
          </Text>
          <SegmentedControl.Root
            value={remiseType}
            onValueChange={(value) => setRemiseType(value as RemiseType)}
          >
            <SegmentedControl.Item value="POURCENTAGE">
              <Flex align="center" gap="1">
                <Percent size={14} />
                Pourcentage
              </Flex>
            </SegmentedControl.Item>
            <SegmentedControl.Item value="MONTANT_FIXE">
              <Flex align="center" gap="1">
                <DollarSign size={14} />
                Montant fixe
              </Flex>
            </SegmentedControl.Item>
          </SegmentedControl.Root>
        </Box>

        {/* Valeur de la remise */}
        <Box mb="4">
          <Text as="label" size="2" weight="medium" mb="2" style={{ display: "block" }}>
            Valeur
          </Text>
          <TextField.Root
            ref={inputRef}
            size="3"
            type="number"
            min="0"
            max={remiseType === "POURCENTAGE" ? "100" : undefined}
            placeholder={remiseType === "POURCENTAGE" ? "Ex: 10" : "Ex: 1000"}
            value={remiseValue}
            onChange={(e) => setRemiseValue(e.target.value)}
            style={{
              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            }}
          >
            <TextField.Slot side="right">
              <Text size="2" color="gray">
                {remiseType === "POURCENTAGE" ? "%" : "FCFA"}
              </Text>
            </TextField.Slot>
          </TextField.Root>
        </Box>

        {/* Apercu */}
        {preview ? <Box
            p="3"
            mb="4"
            style={{
              backgroundColor: "var(--green-a2)",
              borderRadius: 8,
              border: "1px solid var(--green-a6)",
            }}
          >
            <Text size="2" weight="medium" color="green" mb="2" style={{ display: "block" }}>
              Apercu
            </Text>
            <Flex direction="column" gap="1">
              <Flex justify="between">
                <Text size="2" color="gray">
                  {scope === "ligne" ? "Sous-total ligne" : "Sous-total panier"}
                </Text>
                <Text
                  size="2"
                  style={{
                    fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  {formatCurrency(preview.base)}
                </Text>
              </Flex>
              <Flex justify="between">
                <Text size="2" color="green">
                  Remise
                  {remiseType === "POURCENTAGE" && ` (${remiseValue}%)`}
                </Text>
                <Text
                  size="2"
                  color="green"
                  style={{
                    fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  -{formatCurrency(preview.remise)}
                </Text>
              </Flex>
              <Box
                mt="1"
                pt="1"
                style={{ borderTop: "1px solid var(--green-a6)" }}
              >
                <Flex justify="between">
                  <Text size="2" weight="medium">
                    Apres remise
                  </Text>
                  <Text
                    size="2"
                    weight="bold"
                    style={{
                      fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                      color: "var(--green-11)",
                    }}
                  >
                    {formatCurrency(preview.apres)}
                  </Text>
                </Flex>
              </Box>
            </Flex>
          </Box> : null}

        {/* Actions */}
        <Flex gap="3" mt="4" justify="end">
          {selectedItem?.remiseLigne ? <Button
              variant="soft"
              color="red"
              onClick={handleClearLineRemise}
              style={{ marginRight: "auto" }}
            >
              Supprimer remise
            </Button> : null}
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Annuler
            </Button>
          </Dialog.Close>
          <Button
            onClick={handleApply}
            disabled={!preview || preview.remise <= 0}
          >
            Appliquer
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
