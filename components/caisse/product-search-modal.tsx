"use client";

/**
 * ProductSearchModal - Modal de recherche de produits (F2)
 * Permet de rechercher des produits par nom, code-barre ou reference
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, TextField, Flex, Text, Kbd, Box, IconButton } from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import { MagnifyingGlass, X, Package, Barcode } from "@phosphor-icons/react";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";

interface Produit {
  id: string;
  nom: string;
  prixVente: number | { toNumber?(): number };
  tauxTva: string;
  image?: string | null;
  gererStock: boolean;
  stockActuel?: number | null;
  categorieId: string;
  codeBarre?: string | null;
  reference?: string | null;
}

interface Categorie {
  id: string;
  nom: string;
  couleur: string;
}

interface ProductSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produits: Produit[];
  categories: Categorie[];
}

// Helper pour convertir Decimal en number
function toNumber(value: number | { toNumber?(): number } | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value.toNumber === "function") return value.toNumber();
  return Number(value);
}

export function ProductSearchModal({
  open,
  onOpenChange,
  produits,
  categories,
}: ProductSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const addItem = useCartStore((state) => state.addItem);

  // Filtrer les produits selon la recherche
  const filteredProduits = produits.filter((prod) => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase().trim();
    return (
      prod.nom.toLowerCase().includes(query) ||
      prod.codeBarre?.toLowerCase().includes(query) ||
      prod.reference?.toLowerCase().includes(query)
    );
  });

  // Reset search when modal opens (derived-state pattern)
  const prevOpenRef = useRef(false);
  if (open && !prevOpenRef.current) {
    setSearchQuery("");
    setSelectedIndex(0);
  }
  prevOpenRef.current = open;

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Reset selected index when results change (derived-state pattern)
  const prevFilteredLengthRef = useRef(filteredProduits.length);
  if (prevFilteredLengthRef.current !== filteredProduits.length) {
    prevFilteredLengthRef.current = filteredProduits.length;
    setSelectedIndex(0);
  }

  // Ajouter un produit au panier
  const handleAddProduct = useCallback(
    (prod: Produit) => {
      const prix = toNumber(prod.prixVente);
      const cat = categories.find((c) => c.id === prod.categorieId);
      addItem({
        produitId: prod.id,
        prixUnitaire: prix,
        categorieNom: cat?.nom,
        produit: {
          nom: prod.nom,
          tauxTva: prod.tauxTva,
        },
      });
      onOpenChange(false);
    },
    [addItem, onOpenChange, categories]
  );

  // Gestion du clavier
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (filteredProduits.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < filteredProduits.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredProduits[selectedIndex]) {
            handleAddProduct(filteredProduits[selectedIndex]);
          }
          break;
      }
    },
    [filteredProduits, selectedIndex, handleAddProduct]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="500px" aria-describedby={undefined} onKeyDown={handleKeyDown}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <MagnifyingGlass size={20} />
            Rechercher un produit
            <Kbd size="1" style={{ marginLeft: "auto" }}>
              F2
            </Kbd>
          </Flex>
        </Dialog.Title>

        <Box mt="4">
          <TextField.Root
            ref={inputRef}
            size="3"
            placeholder="Nom, code-barre ou reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          >
            <TextField.Slot>
              <MagnifyingGlass size={16} />
            </TextField.Slot>
            {searchQuery ? (
              <TextField.Slot>
                <IconButton
                  size="1"
                  variant="ghost"
                  color="gray"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={14} />
                </IconButton>
              </TextField.Slot>
            ) : null}
          </TextField.Root>
        </Box>

        {/* Resultats */}
        <Box mt="4">
          {searchQuery.trim() === "" ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              py="6"
              style={{ color: "var(--gray-10)" }}
            >
              <MagnifyingGlass size={32} style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text size="2">Commencez a taper pour rechercher</Text>
            </Flex>
          ) : filteredProduits.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              py="6"
              style={{ color: "var(--gray-10)" }}
            >
              <Package size={32} style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text size="2">Aucun produit trouve</Text>
            </Flex>
          ) : (
            <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: 300 }}>
              <Flex direction="column" gap="1">
                {filteredProduits.slice(0, 20).map((prod, index) => {
                  const prix = toNumber(prod.prixVente);
                  const cat = categories.find((c) => c.id === prod.categorieId);
                  const rupture =
                    prod.gererStock && prod.stockActuel != null && prod.stockActuel <= 0;
                  const isSelected = index === selectedIndex;

                  return (
                    <Box
                      key={prod.id}
                      onClick={() => !rupture && handleAddProduct(prod)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 8,
                        cursor: rupture ? "not-allowed" : "pointer",
                        opacity: rupture ? 0.5 : 1,
                        backgroundColor: isSelected ? "var(--accent-a3)" : "var(--gray-a2)",
                        border: isSelected ? "1px solid var(--accent-7)" : "1px solid transparent",
                        transition: "all 0.1s ease",
                      }}
                    >
                      <Flex justify="between" align="start">
                        <Flex direction="column" gap="1">
                          <Text size="2" weight="medium">
                            {prod.nom}
                          </Text>
                          <Flex align="center" gap="3">
                            {cat ? (
                              <Flex align="center" gap="1">
                                <Box
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    backgroundColor: cat.couleur,
                                  }}
                                />
                                <Text size="1" color="gray">
                                  {cat.nom}
                                </Text>
                              </Flex>
                            ) : null}
                            {prod.codeBarre ? (
                              <Flex align="center" gap="1">
                                <Barcode size={12} style={{ color: "var(--gray-9)" }} />
                                <Text size="1" color="gray">
                                  {prod.codeBarre}
                                </Text>
                              </Flex>
                            ) : null}
                            {prod.reference ? (
                              <Text size="1" color="gray">
                                Ref: {prod.reference}
                              </Text>
                            ) : null}
                          </Flex>
                        </Flex>
                        <Flex direction="column" align="end" gap="1">
                          <Text
                            size="2"
                            weight="bold"
                            style={{
                              color: "var(--accent-11)",
                              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                            }}
                          >
                            {formatCurrency(prix)}
                          </Text>
                          {rupture ? (
                            <Text size="1" color="red">
                              Rupture
                            </Text>
                          ) : null}
                          {prod.gererStock && prod.stockActuel != null && prod.stockActuel > 0 ? (
                            <Text size="1" color="gray">
                              Stock: {prod.stockActuel}
                            </Text>
                          ) : null}
                        </Flex>
                      </Flex>
                    </Box>
                  );
                })}
              </Flex>
            </ScrollArea>
          )}
        </Box>

        {/* Instructions */}
        {filteredProduits.length > 0 && (
          <Flex gap="4" mt="3" justify="center">
            <Flex align="center" gap="1">
              <Kbd size="1">↑↓</Kbd>
              <Text size="1" color="gray">
                Naviguer
              </Text>
            </Flex>
            <Flex align="center" gap="1">
              <Kbd size="1">Entree</Kbd>
              <Text size="1" color="gray">
                Ajouter
              </Text>
            </Flex>
            <Flex align="center" gap="1">
              <Kbd size="1">Echap</Kbd>
              <Text size="1" color="gray">
                Fermer
              </Text>
            </Flex>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
