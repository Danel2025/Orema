"use client";

/**
 * StockMovementModal - Modal pour créer un mouvement de stock
 * Types: ENTREE, SORTIE, AJUSTEMENT, PERTE, INVENTAIRE
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  Flex,
  Text,
  TextField,
  Select,
  TextArea,
  Button,
  Box,
  Callout,
} from "@radix-ui/themes";
import {
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  Trash2,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { createMovement } from "@/actions/stocks";
import type { TypeMouvementType } from "@/schemas/stock.schema";
import { toast } from "sonner";

interface StockMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produit?: {
    id: string;
    nom: string;
    stockActuel?: number | null;
    unite?: string | null;
  };
  produits?: {
    id: string;
    nom: string;
    stockActuel: number;
    unite: string | null;
  }[];
  onSuccess?: () => void;
}

const mouvementTypes: {
  value: TypeMouvementType;
  label: string;
  icon: React.ReactNode;
  color: "green" | "red" | "blue" | "violet";
  description: string;
}[] = [
  {
    value: "ENTREE",
    label: "Entrée",
    icon: <ArrowDownCircle size={16} />,
    color: "green",
    description: "Réception de marchandise (approvisionnement)",
  },
  {
    value: "SORTIE",
    label: "Sortie",
    icon: <ArrowUpCircle size={16} />,
    color: "red",
    description: "Sortie manuelle (hors vente)",
  },
  {
    value: "AJUSTEMENT",
    label: "Ajustement",
    icon: <RotateCcw size={16} />,
    color: "blue",
    description: "Correction du stock (définir une nouvelle valeur)",
  },
  {
    value: "PERTE",
    label: "Perte",
    icon: <Trash2 size={16} />,
    color: "violet",
    description: "Casse, péremption, vol",
  },
];

export function StockMovementModal({
  open,
  onOpenChange,
  produit,
  produits,
  onSuccess,
}: StockMovementModalProps) {
  const [selectedProduitId, setSelectedProduitId] = useState<string>(produit?.id || "");
  const [type, setType] = useState<TypeMouvementType>("ENTREE");
  const [quantite, setQuantite] = useState<string>("");
  const [motif, setMotif] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [prixUnitaire, setPrixUnitaire] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setSelectedProduitId(produit?.id || "");
      setType("ENTREE");
      setQuantite("");
      setMotif("");
      setReference("");
      setPrixUnitaire("");
      setError(null);
    }
  }, [open, produit?.id]);

  const selectedProduct = produit || produits?.find((p) => p.id === selectedProduitId);
  const currentStock = selectedProduct?.stockActuel ?? 0;
  const unite = selectedProduct?.unite || "unité(s)";

  // Calculer le nouveau stock prévu
  const getNewStock = (): number | null => {
    const qty = parseInt(quantite, 10);
    if (isNaN(qty) || qty < 0) return null;

    switch (type) {
      case "ENTREE":
        return currentStock + qty;
      case "SORTIE":
      case "PERTE":
        return currentStock - qty;
      case "AJUSTEMENT":
        return qty;
      default:
        return null;
    }
  };

  const newStock = getNewStock();
  const isStockNegative = newStock !== null && newStock < 0;

  const handleSubmit = async () => {
    setError(null);

    if (!selectedProduitId) {
      setError("Veuillez sélectionner un produit");
      return;
    }

    const qty = parseInt(quantite, 10);
    if (isNaN(qty) || qty <= 0) {
      setError("La quantité doit être un nombre positif");
      return;
    }

    if (!motif.trim()) {
      setError("Le motif est requis");
      return;
    }

    if (isStockNegative) {
      setError("Le stock ne peut pas être négatif");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createMovement({
        produitId: selectedProduitId,
        type,
        quantite: qty,
        motif: motif.trim(),
        reference: reference.trim() || undefined,
        prixUnitaire: prixUnitaire ? parseInt(prixUnitaire, 10) : undefined,
      });

      if (result.success) {
        toast.success(
          `Mouvement enregistré: ${result.data.stockAvant} → ${result.data.stockApres} ${unite}`
        );
        onOpenChange(false);
        onSuccess?.();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Une erreur est survenue");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const typeConfig = mouvementTypes.find((t) => t.value === type);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="500px">
        <Dialog.Title>
          <Flex align="center" gap="2">
            <Package size={20} />
            Mouvement de stock
          </Flex>
        </Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Enregistrer une entrée, sortie ou ajustement de stock
        </Dialog.Description>

        <Flex direction="column" gap="4">
          {/* Sélection du produit (si pas pré-sélectionné) */}
          {!produit && produits ? <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Produit *
              </Text>
              <Select.Root value={selectedProduitId} onValueChange={setSelectedProduitId}>
                <Select.Trigger placeholder="Sélectionner un produit" style={{ width: "100%" }} />
                <Select.Content>
                  {produits.map((p) => (
                    <Select.Item key={p.id} value={p.id}>
                      {p.nom} (Stock: {p.stockActuel} {p.unite || ""})
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box> : null}

          {/* Produit sélectionné */}
          {selectedProduct ? <Box
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: "var(--gray-a3)",
              }}
            >
              <Flex justify="between" align="center">
                <Text weight="medium">{selectedProduct.nom}</Text>
                <Flex align="center" gap="2">
                  <Text size="2" color="gray">
                    Stock actuel:
                  </Text>
                  <Text
                    weight="bold"
                    style={{
                      fontVariantNumeric: "tabular-nums",
                      fontFamily: "var(--font-google-sans-code), monospace",
                    }}
                  >
                    {currentStock} {unite}
                  </Text>
                </Flex>
              </Flex>
            </Box> : null}

          {/* Type de mouvement */}
          <Box>
            <Text as="label" size="2" weight="medium" mb="1">
              Type de mouvement *
            </Text>
            <Select.Root value={type} onValueChange={(v) => setType(v as TypeMouvementType)}>
              <Select.Trigger style={{ width: "100%" }} />
              <Select.Content>
                {mouvementTypes.map((t) => (
                  <Select.Item key={t.value} value={t.value}>
                    <Flex align="center" gap="2">
                      <Box style={{ color: `var(--${t.color}-9)` }}>{t.icon}</Box>
                      {t.label}
                    </Flex>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            {typeConfig ? <Text size="1" color="gray" mt="1">
                {typeConfig.description}
              </Text> : null}
          </Box>

          {/* Quantité */}
          <Box>
            <Text as="label" size="2" weight="medium" mb="1">
              {type === "AJUSTEMENT"
                ? "Nouvelle quantité *"
                : "Quantité *"}
            </Text>
            <TextField.Root
              type="number"
              min="0"
              placeholder={
                type === "AJUSTEMENT"
                  ? "Nouveau stock"
                  : "Quantité à ajouter/retirer"
              }
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
            >
              <TextField.Slot side="right">
                <Text size="2" color="gray">
                  {unite}
                </Text>
              </TextField.Slot>
            </TextField.Root>
          </Box>

          {/* Aperçu du nouveau stock */}
          {newStock !== null && (
            <Box
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: isStockNegative ? "var(--red-a3)" : "var(--green-a3)",
              }}
            >
              <Flex justify="between" align="center">
                <Text size="2">Nouveau stock prévu:</Text>
                <Text
                  weight="bold"
                  color={isStockNegative ? "red" : "green"}
                  style={{
                    fontVariantNumeric: "tabular-nums",
                    fontFamily: "var(--font-google-sans-code), monospace",
                  }}
                >
                  {newStock} {unite}
                </Text>
              </Flex>
            </Box>
          )}

          {/* Prix unitaire (pour les entrées) */}
          {type === "ENTREE" && (
            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Prix d'achat unitaire (optionnel)
              </Text>
              <TextField.Root
                type="number"
                min="0"
                placeholder="Prix unitaire"
                value={prixUnitaire}
                onChange={(e) => setPrixUnitaire(e.target.value)}
              >
                <TextField.Slot side="right">
                  <Text size="2" color="gray">
                    FCFA
                  </Text>
                </TextField.Slot>
              </TextField.Root>
            </Box>
          )}

          {/* Référence */}
          <Box>
            <Text as="label" size="2" weight="medium" mb="1">
              Référence (optionnel)
            </Text>
            <TextField.Root
              placeholder="N° bon de livraison, facture..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </Box>

          {/* Motif */}
          <Box>
            <Text as="label" size="2" weight="medium" mb="1">
              Motif *
            </Text>
            <TextArea
              placeholder="Raison du mouvement..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
            />
          </Box>

          {/* Erreur */}
          {error ? <Callout.Root color="red" size="1">
              <Callout.Icon>
                <AlertCircle size={16} />
              </Callout.Icon>
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root> : null}
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray" disabled={isLoading}>
              Annuler
            </Button>
          </Dialog.Close>
          <Button
            color={typeConfig?.color || "violet"}
            onClick={handleSubmit}
            disabled={isLoading || !selectedProduitId || isStockNegative}
          >
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
