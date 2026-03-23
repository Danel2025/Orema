"use client";

/**
 * CompositeProductSection - Section dans le formulaire produit
 * pour definir un produit comme "composite" (menu/formule).
 * Permet d'ajouter des sous-produits avec quantites et calcul automatique du prix.
 */

import { useState, useCallback, useMemo } from "react";
import { Box, Flex, Text, Button, TextField, Checkbox } from "@radix-ui/themes";
import {
  Plus as PlusIcon,
  Trash as TrashIcon,
  MagnifyingGlass as MagnifyingGlassIcon,
  Package as PackageIcon,
  Stack as StackIcon,
} from "@phosphor-icons/react";
import { formatCurrency } from "@/lib/utils";

export interface CompositeComponent {
  produitId: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
}

interface Produit {
  id: string;
  nom: string;
  prixVente: number;
  categorieId: string;
}

interface Categorie {
  id: string;
  nom: string;
  couleur: string;
}

interface CompositeProductSectionProps {
  /** Whether this product is composite */
  isComposite: boolean;
  /** Toggle composite mode */
  onCompositeChange: (isComposite: boolean) => void;
  /** Current components of the composite product */
  composants: CompositeComponent[];
  /** Called when components change */
  onComposantsChange: (composants: CompositeComponent[]) => void;
  /** Available products to choose from */
  produits: Produit[];
  /** Categories for filtering */
  categories: Categorie[];
  /** The current product ID (to exclude from selection) */
  currentProductId?: string;
}

export function CompositeProductSection({
  isComposite,
  onCompositeChange,
  composants,
  onComposantsChange,
  produits,
  categories,
  currentProductId,
}: CompositeProductSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSelector, setShowSelector] = useState(false);

  // Filter available products (exclude current product and already added)
  const availableProduits = useMemo(() => {
    const addedIds = new Set(composants.map((c) => c.produitId));
    return produits.filter((p) => {
      if (currentProductId && p.id === currentProductId) return false;
      if (addedIds.has(p.id)) return false;
      if (!searchQuery) return true;
      return p.nom.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [produits, composants, currentProductId, searchQuery]);

  // Calculate total price of components
  const prixComposantsTotal = useMemo(
    () => composants.reduce((acc, c) => acc + c.prixUnitaire * c.quantite, 0),
    [composants]
  );

  const handleAddProduct = useCallback(
    (produit: Produit) => {
      onComposantsChange([
        ...composants,
        {
          produitId: produit.id,
          nom: produit.nom,
          prixUnitaire: produit.prixVente,
          quantite: 1,
        },
      ]);
      setSearchQuery("");
      setShowSelector(false);
    },
    [composants, onComposantsChange]
  );

  const handleRemoveProduct = useCallback(
    (index: number) => {
      onComposantsChange(composants.filter((_, i) => i !== index));
    },
    [composants, onComposantsChange]
  );

  const handleUpdateQuantity = useCallback(
    (index: number, quantite: number) => {
      if (quantite < 1) return;
      onComposantsChange(composants.map((c, i) => (i === index ? { ...c, quantite } : c)));
    },
    [composants, onComposantsChange]
  );

  return (
    <Box>
      <Text
        size="2"
        weight="bold"
        style={{
          display: "block",
          marginBottom: 16,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: "var(--gray-11)",
        }}
      >
        <Flex align="center" gap="2">
          <StackIcon size={16} />
          Produit composite (menu/formule)
        </Flex>
      </Text>

      {/* Toggle composite */}
      <Flex align="center" gap="3" mb="4">
        <Checkbox
          id="isComposite"
          checked={isComposite}
          onCheckedChange={(checked) => onCompositeChange(checked === true)}
        />
        <Text as="label" htmlFor="isComposite" size="2" style={{ cursor: "pointer" }}>
          Ce produit est un menu / formule composee
        </Text>
      </Flex>

      {isComposite ? (
        <Flex direction="column" gap="3">
          {/* Components list */}
          {composants.length > 0 && (
            <Flex direction="column" gap="2">
              {composants.map((composant, index) => (
                <Flex
                  key={`${composant.produitId}-${index}`}
                  align="center"
                  justify="between"
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "var(--gray-a2)",
                    borderRadius: 10,
                    border: "1px solid var(--gray-a4)",
                  }}
                >
                  <Box style={{ flex: 1 }}>
                    <Text size="2" weight="medium">
                      {composant.nom}
                    </Text>
                    <Text
                      size="2"
                      color="gray"
                      ml="3"
                      style={{
                        fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                      }}
                    >
                      {formatCurrency(composant.prixUnitaire)}
                    </Text>
                  </Box>

                  {/* Quantity controls */}
                  <Flex align="center" gap="2">
                    <Button
                      type="button"
                      variant="outline"
                      size="1"
                      onClick={() => handleUpdateQuantity(index, composant.quantite - 1)}
                      disabled={composant.quantite <= 1}
                      style={{ width: 28, height: 28 }}
                    >
                      -
                    </Button>
                    <Text
                      size="2"
                      weight="bold"
                      style={{
                        fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                        minWidth: 20,
                        textAlign: "center",
                      }}
                    >
                      {composant.quantite}
                    </Text>
                    <Button
                      type="button"
                      variant="outline"
                      size="1"
                      onClick={() => handleUpdateQuantity(index, composant.quantite + 1)}
                      style={{ width: 28, height: 28 }}
                    >
                      +
                    </Button>

                    {/* Remove button */}
                    <Button
                      type="button"
                      variant="ghost"
                      color="red"
                      size="1"
                      onClick={() => handleRemoveProduct(index)}
                      style={{ marginLeft: 4 }}
                    >
                      <TrashIcon size={16} />
                    </Button>
                  </Flex>
                </Flex>
              ))}

              {/* Total */}
              <Flex
                justify="between"
                align="center"
                style={{
                  padding: "12px 16px",
                  backgroundColor: "var(--accent-a2)",
                  borderRadius: 10,
                  border: "1px solid var(--accent-a4)",
                }}
              >
                <Text size="2" weight="bold">
                  Total composants ({composants.length})
                </Text>
                <Text
                  size="3"
                  weight="bold"
                  style={{
                    fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                    color: "var(--accent-11)",
                  }}
                >
                  {formatCurrency(prixComposantsTotal)}
                </Text>
              </Flex>

              <Text size="1" color="gray" style={{ fontStyle: "italic" }}>
                Definissez le prix de vente ci-dessus. Il peut etre inferieur au total des
                composants pour offrir une remise menu.
              </Text>
            </Flex>
          )}

          {/* Product selector */}
          {showSelector ? (
            <Box
              style={{
                border: "1px solid var(--gray-a6)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {/* Search input */}
              <Box p="3" style={{ borderBottom: "1px solid var(--gray-a4)" }}>
                <TextField.Root
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  autoFocus
                >
                  <TextField.Slot>
                    <MagnifyingGlassIcon size={16} />
                  </TextField.Slot>
                </TextField.Root>
              </Box>

              {/* Product list */}
              <Flex direction="column" gap="1" p="2" style={{ maxHeight: 200, overflowY: "auto" }}>
                {availableProduits.length === 0 ? (
                  <Flex align="center" justify="center" py="5">
                    <Text size="2" color="gray">
                      Aucun produit disponible
                    </Text>
                  </Flex>
                ) : (
                  availableProduits.slice(0, 20).map((produit) => {
                    const categorie = categories.find((c) => c.id === produit.categorieId);
                    return (
                      <Flex
                        key={produit.id}
                        asChild
                        align="center"
                        justify="between"
                        style={{
                          padding: "10px 12px",
                          backgroundColor: "var(--gray-a2)",
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          width: "100%",
                        }}
                      >
                        <button type="button" onClick={() => handleAddProduct(produit)}>
                          <Flex align="center" gap="2">
                            <PackageIcon size={16} color={categorie?.couleur ?? "var(--gray-9)"} />
                            <Box>
                              <Text size="2" weight="medium">
                                {produit.nom}
                              </Text>
                              {categorie ? (
                                <Text size="1" color="gray" style={{ display: "block" }}>
                                  {categorie.nom}
                                </Text>
                              ) : null}
                            </Box>
                          </Flex>
                          <Flex align="center" gap="2">
                            <Text
                              size="2"
                              style={{
                                fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                                color: "var(--gray-11)",
                              }}
                            >
                              {formatCurrency(produit.prixVente)}
                            </Text>
                            <PlusIcon size={16} color="var(--accent-9)" />
                          </Flex>
                        </button>
                      </Flex>
                    );
                  })
                )}
              </Flex>

              {/* Cancel */}
              <Flex justify="center" p="2" style={{ borderTop: "1px solid var(--gray-a4)" }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="1"
                  onClick={() => {
                    setShowSelector(false);
                    setSearchQuery("");
                  }}
                >
                  Fermer
                </Button>
              </Flex>
            </Box>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="2"
              onClick={() => setShowSelector(true)}
              style={{
                width: "100%",
                borderStyle: "dashed",
              }}
            >
              <PlusIcon size={18} />
              Ajouter un produit au menu
            </Button>
          )}
        </Flex>
      ) : null}
    </Box>
  );
}
