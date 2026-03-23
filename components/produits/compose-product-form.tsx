"use client";

/**
 * ComposeProductForm - Formulaire de creation de produit compose (menu/formule)
 * Permet de selectionner plusieurs produits inclus dans un menu avec un prix forfaitaire
 */

import { useState, useEffect, useCallback } from "react";
import { X, Plus, Trash, Package, SpinnerGap, Check, MagnifyingGlass, Stack } from "@phosphor-icons/react";
import { Dialog, Flex, Text, Button, Badge, TextField, Separator } from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

interface Produit {
  id: string;
  nom: string;
  prixVente: number;
  categorie: {
    id: string;
    nom: string;
    couleur: string;
  };
}

interface SelectedProduit {
  produitId: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
  estChoixClient: boolean; // Le client peut choisir une alternative
  categorieChoix?: string; // Si choix, quelle categorie
}

interface ComposeProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produits: Produit[];
  categories: { id: string; nom: string; couleur: string }[];
  onSubmit: (data: ComposeProductData) => Promise<void>;
  editData?: ComposeProductData | null;
}

export interface ComposeProductData {
  nom: string;
  description: string;
  prixVente: number;
  composants: SelectedProduit[];
}

export function ComposeProductForm({
  open,
  onOpenChange,
  produits,
  categories,
  onSubmit,
  editData,
}: ComposeProductFormProps) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prixVente, setPrixVente] = useState<number>(0);
  const [composants, setComposants] = useState<SelectedProduit[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Reset form when opening
  useEffect(() => {
    if (open) {
      if (editData) {
        setNom(editData.nom);
        setDescription(editData.description);
        setPrixVente(editData.prixVente);
        setComposants(editData.composants);
      } else {
        setNom("");
        setDescription("");
        setPrixVente(0);
        setComposants([]);
      }
      setSearchQuery("");
      setSelectedCategoryFilter(null);
    }
  }, [open, editData]);

  // Filter produits
  const filteredProduits = produits.filter((p) => {
    const matchesSearch = !searchQuery || p.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategoryFilter || p.categorie.id === selectedCategoryFilter;
    const notAlreadyAdded = !composants.some((c) => c.produitId === p.id && !c.estChoixClient);
    return matchesSearch && matchesCategory && notAlreadyAdded;
  });

  // Calculate sum of composants prices
  const prixComposantsTotal = composants.reduce((acc, c) => acc + c.prixUnitaire * c.quantite, 0);

  // Calculate economy
  const economie = prixComposantsTotal - prixVente;

  // Add product to composants
  const handleAddProduct = useCallback((produit: Produit) => {
    setComposants((prev) => [
      ...prev,
      {
        produitId: produit.id,
        nom: produit.nom,
        prixUnitaire: produit.prixVente,
        quantite: 1,
        estChoixClient: false,
      },
    ]);
  }, []);

  // Remove product from composants
  const handleRemoveProduct = useCallback((index: number) => {
    setComposants((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Update quantity
  const handleUpdateQuantity = useCallback((index: number, quantite: number) => {
    if (quantite < 1) return;
    setComposants((prev) => prev.map((c, i) => (i === index ? { ...c, quantite } : c)));
  }, []);

  // Toggle choice option
  const handleToggleChoice = useCallback((index: number) => {
    setComposants((prev) =>
      prev.map((c, i) => (i === index ? { ...c, estChoixClient: !c.estChoixClient } : c))
    );
  }, []);

  // Submit form
  const handleSubmit = async () => {
    if (!nom.trim() || composants.length === 0 || prixVente <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        nom: nom.trim(),
        description: description.trim(),
        prixVente,
        composants,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="700px" style={{ padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <Flex
          justify="between"
          align="center"
          p="4"
          style={{ borderBottom: "1px solid var(--gray-a6)" }}
        >
          <Flex align="center" gap="3">
            <Stack size={24} style={{ color: "var(--accent-9)" }} aria-hidden="true" />
            <Flex direction="column">
              <Dialog.Title size="4" weight="bold" style={{ margin: 0 }}>
                {editData ? "Modifier le menu" : "Créer un menu / formule"}
              </Dialog.Title>
              <Dialog.Description size="2" color="gray" style={{ margin: 0 }}>
                Combinez plusieurs produits en une offre
              </Dialog.Description>
            </Flex>
          </Flex>
          <Dialog.Close>
            <Button variant="ghost" color="gray" size="1">
              <X size={18} aria-hidden="true" />
            </Button>
          </Dialog.Close>
        </Flex>

        <Flex style={{ height: "60vh" }}>
          {/* Left: Product list */}
          <Flex
            direction="column"
            style={{
              width: "50%",
              borderRight: "1px solid var(--gray-a6)",
            }}
          >
            {/* Search */}
            <Flex
              direction="column"
              gap="2"
              p="3"
              style={{ borderBottom: "1px solid var(--gray-a6)" }}
            >
              <TextField.Root
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              >
                <TextField.Slot>
                  <MagnifyingGlass size={16} aria-hidden="true" />
                </TextField.Slot>
              </TextField.Root>

              {/* Category filter */}
              <Flex gap="2" style={{ overflowX: "auto", paddingBottom: 4 }}>
                <Button
                  variant={selectedCategoryFilter === null ? "solid" : "soft"}
                  color={selectedCategoryFilter === null ? "violet" : "gray"}
                  size="1"
                  onClick={() => setSelectedCategoryFilter(null)}
                >
                  Tout
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategoryFilter === cat.id ? "solid" : "soft"}
                    size="1"
                    style={{
                      backgroundColor: selectedCategoryFilter === cat.id ? cat.couleur : undefined,
                      color: selectedCategoryFilter === cat.id ? "white" : undefined,
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                  >
                    {cat.nom}
                  </Button>
                ))}
              </Flex>
            </Flex>

            {/* Product list */}
            <ScrollArea style={{ flex: 1 }}>
              <Flex direction="column" gap="1" p="2">
                {filteredProduits.length === 0 ? (
                  <Text size="2" color="gray" align="center" style={{ padding: 24 }}>
                    Aucun produit trouve
                  </Text>
                ) : (
                  filteredProduits.map((produit) => (
                    <Flex
                      key={produit.id}
                      align="center"
                      justify="between"
                      p="2"
                      style={{
                        backgroundColor: "var(--gray-a2)",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                      onClick={() => handleAddProduct(produit)}
                    >
                      <Flex align="center" gap="2">
                        <Package size={16} style={{ color: produit.categorie.couleur }} aria-hidden="true" />
                        <Flex direction="column">
                          <Text size="2" weight="medium">
                            {produit.nom}
                          </Text>
                          <Text size="1" color="gray">
                            {produit.categorie.nom}
                          </Text>
                        </Flex>
                      </Flex>
                      <Flex align="center" gap="2">
                        <Text
                          size="2"
                          style={{
                            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                          }}
                        >
                          {formatCurrency(produit.prixVente)}
                        </Text>
                        <Plus size={16} style={{ color: "var(--accent-9)" }} aria-hidden="true" />
                      </Flex>
                    </Flex>
                  ))
                )}
              </Flex>
            </ScrollArea>
          </Flex>

          {/* Right: Menu composition */}
          <Flex direction="column" style={{ width: "50%" }}>
            {/* Menu info */}
            <Flex
              direction="column"
              gap="3"
              p="3"
              style={{ borderBottom: "1px solid var(--gray-a6)" }}
            >
              <TextField.Root
                placeholder="Nom du menu / formule *"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                size="2"
              />
              <TextField.Root
                placeholder="Description (optionnel)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                size="2"
              />
              <Flex align="center" gap="2">
                <Text size="2" weight="medium" style={{ whiteSpace: "nowrap" }}>
                  Prix du menu:
                </Text>
                <TextField.Root
                  type="number"
                  placeholder="Prix"
                  value={prixVente || ""}
                  onChange={(e) => setPrixVente(Number(e.target.value) || 0)}
                  min={0}
                  step={100}
                  style={{
                    fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                    width: 120,
                  }}
                />
                <Text size="2" color="gray">
                  FCFA
                </Text>
              </Flex>
            </Flex>

            {/* Selected components */}
            <ScrollArea style={{ flex: 1 }}>
              <Flex direction="column" gap="2" p="3">
                <Text size="2" weight="bold" color="gray">
                  Composants du menu ({composants.length})
                </Text>

                {composants.length === 0 ? (
                  <Text size="2" color="gray" align="center" style={{ padding: 24 }}>
                    Cliquez sur un produit pour l'ajouter
                  </Text>
                ) : (
                  composants.map((composant, index) => (
                    <Flex
                      key={`${composant.produitId}-${index}`}
                      direction="column"
                      gap="2"
                      p="3"
                      style={{
                        backgroundColor: composant.estChoixClient
                          ? "var(--blue-a2)"
                          : "var(--gray-a2)",
                        borderRadius: 8,
                        border: composant.estChoixClient
                          ? "1px solid var(--blue-a6)"
                          : "1px solid var(--gray-a4)",
                      }}
                    >
                      <Flex justify="between" align="start">
                        <Flex direction="column" gap="1">
                          <Text size="2" weight="medium">
                            {composant.nom}
                          </Text>
                          <Text
                            size="1"
                            style={{
                              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                            }}
                          >
                            {formatCurrency(composant.prixUnitaire)} x {composant.quantite}
                          </Text>
                        </Flex>
                        <Button
                          variant="ghost"
                          color="red"
                          size="1"
                          onClick={() => handleRemoveProduct(index)}
                        >
                          <Trash size={14} aria-hidden="true" />
                        </Button>
                      </Flex>

                      <Flex align="center" gap="2">
                        <Button
                          variant="soft"
                          size="1"
                          onClick={() => handleUpdateQuantity(index, composant.quantite - 1)}
                          disabled={composant.quantite <= 1}
                        >
                          -
                        </Button>
                        <Text
                          size="2"
                          weight="medium"
                          style={{
                            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                            minWidth: 20,
                            textAlign: "center",
                          }}
                        >
                          {composant.quantite}
                        </Text>
                        <Button
                          variant="soft"
                          size="1"
                          onClick={() => handleUpdateQuantity(index, composant.quantite + 1)}
                        >
                          +
                        </Button>

                        <Separator orientation="vertical" style={{ height: 20 }} />

                        <Button
                          variant={composant.estChoixClient ? "solid" : "soft"}
                          color={composant.estChoixClient ? "blue" : "gray"}
                          size="1"
                          onClick={() => handleToggleChoice(index)}
                        >
                          {composant.estChoixClient ? "Choix client" : "Fixe"}
                        </Button>
                      </Flex>
                    </Flex>
                  ))
                )}
              </Flex>
            </ScrollArea>

            {/* Summary */}
            {composants.length > 0 && (
              <Flex
                direction="column"
                gap="2"
                p="3"
                style={{
                  borderTop: "1px solid var(--gray-a6)",
                  backgroundColor: "var(--gray-a2)",
                }}
              >
                <Flex justify="between">
                  <Text size="2" color="gray">
                    Prix total des composants
                  </Text>
                  <Text
                    size="2"
                    style={{
                      fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                      textDecoration: prixVente > 0 ? "line-through" : "none",
                    }}
                  >
                    {formatCurrency(prixComposantsTotal)}
                  </Text>
                </Flex>
                {prixVente > 0 && economie > 0 && (
                  <Flex justify="between">
                    <Text size="2" color="green">
                      Economie client
                    </Text>
                    <Badge color="green" variant="soft">
                      -{formatCurrency(economie)}
                    </Badge>
                  </Flex>
                )}
                <Flex justify="between" pt="2" style={{ borderTop: "1px solid var(--gray-a6)" }}>
                  <Text size="3" weight="bold">
                    Prix du menu
                  </Text>
                  <Text
                    size="3"
                    weight="bold"
                    style={{
                      fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  >
                    {formatCurrency(prixVente)}
                  </Text>
                </Flex>
              </Flex>
            )}
          </Flex>
        </Flex>

        {/* Footer */}
        <Flex justify="end" gap="3" p="4" style={{ borderTop: "1px solid var(--gray-a6)" }}>
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Annuler
            </Button>
          </Dialog.Close>
          <Button
            onClick={handleSubmit}
            disabled={!nom.trim() || composants.length === 0 || prixVente <= 0 || isSubmitting}
          >
            {isSubmitting ? <SpinnerGap size={16} className="animate-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
            {editData ? "Modifier" : "Créer le menu"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
