"use client";

/**
 * InventoryModal - Modal pour réaliser un inventaire
 * Saisie des quantités réelles et comparaison avec le stock théorique
 */

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  Flex,
  Text,
  TextField,
  Select,
  Button,
  Box,
  Table,
  Badge,
  Callout,
  Checkbox,
} from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import { ClipboardText, WarningCircle, CheckCircle, ArrowRight, DownloadSimple, FloppyDisk } from "@phosphor-icons/react";
import { getInventoryProducts, submitInventory, getStockCategories } from "@/actions/stocks";
import { toast } from "sonner";

interface InventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface InventoryLine {
  produitId: string;
  produitNom: string;
  stockTheorique: number;
  quantiteReelle: string;
  unite: string | null;
  categorie: { id: string; nom: string; couleur: string };
  hasChanged: boolean;
}

export function InventoryModal({ open, onOpenChange, onSuccess }: InventoryModalProps) {
  const [step, setStep] = useState<"setup" | "count" | "review">("setup");
  const [categories, setCategories] = useState<{ id: string; nom: string; couleur: string }[]>([]);
  const [selectedCategorie, setSelectedCategorie] = useState<string>("all");
  const [lines, setLines] = useState<InventoryLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyChanged, setShowOnlyChanged] = useState(false);

  // Charger les catégories
  const loadCategories = useCallback(async () => {
    const result = await getStockCategories();
    if (result.success) {
      setCategories(result.data);
    }
  }, []);

  // Charger les produits pour l'inventaire
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getInventoryProducts(
        selectedCategorie !== "all" ? selectedCategorie : undefined
      );

      if (result.success) {
        setLines(
          result.data.map((p) => ({
            produitId: p.id,
            produitNom: p.nom,
            stockTheorique: p.stockActuel,
            quantiteReelle: "",
            unite: p.unite,
            categorie: p.categorie,
            hasChanged: false,
          }))
        );
        setStep("count");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Erreur lors du chargement des produits");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategorie]);

  useEffect(() => {
    if (open) {
      setStep("setup");
      setSelectedCategorie("all");
      setLines([]);
      setError(null);
      setShowOnlyChanged(false);
      loadCategories();
    }
  }, [open, loadCategories]);

  // Mettre à jour la quantité réelle
  const updateQuantite = (produitId: string, value: string) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.produitId === produitId) {
          const qty = parseInt(value, 10);
          const hasChanged = !isNaN(qty) && qty !== line.stockTheorique;
          return { ...line, quantiteReelle: value, hasChanged };
        }
        return line;
      })
    );
  };

  // Pré-remplir avec le stock théorique
  const prefillTheorique = () => {
    setLines((prev) =>
      prev.map((line) => ({
        ...line,
        quantiteReelle: line.stockTheorique.toString(),
        hasChanged: false,
      }))
    );
  };

  // Calculer les écarts
  const getEcart = (line: InventoryLine): number | null => {
    const qty = parseInt(line.quantiteReelle, 10);
    if (isNaN(qty)) return null;
    return qty - line.stockTheorique;
  };

  // Valider et passer en revue
  const goToReview = () => {
    const incompletLines = lines.filter((l) => l.quantiteReelle === "");
    if (incompletLines.length > 0) {
      setError(
        `${incompletLines.length} produit(s) n'ont pas de quantité saisie. Voulez-vous continuer ?`
      );
    }
    setStep("review");
    setShowOnlyChanged(true);
  };

  // Soumettre l'inventaire
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Filtrer les lignes avec des changements
      const lignesToSubmit = lines
        .filter((l) => l.quantiteReelle !== "" && l.hasChanged)
        .map((l) => ({
          produitId: l.produitId,
          quantiteReelle: parseInt(l.quantiteReelle, 10),
        }));

      if (lignesToSubmit.length === 0) {
        toast.info("Aucun écart à enregistrer");
        onOpenChange(false);
        return;
      }

      const result = await submitInventory(lignesToSubmit);

      if (result.success) {
        toast.success(
          `Inventaire terminé: ${result.data.details.length} produit(s) ajusté(s), écart total: ${result.data.ecartTotal}`
        );
        onOpenChange(false);
        onSuccess?.();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Erreur lors de l'enregistrement de l'inventaire");
    } finally {
      setIsLoading(false);
    }
  };

  // Lignes avec écarts
  const changedLines = lines.filter((l) => l.hasChanged);
  const totalEcart = changedLines.reduce((acc, l) => {
    const ecart = getEcart(l);
    return acc + (ecart || 0);
  }, 0);

  // Lignes à afficher
  const displayLines = showOnlyChanged ? changedLines : lines;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="900px" style={{ maxHeight: "85vh" }}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <ClipboardText size={20} />
            Inventaire
          </Flex>
        </Dialog.Title>

        {/* Étape 1: Configuration */}
        {step === "setup" && (
          <>
            <Dialog.Description size="2" mb="4">
              Sélectionnez la catégorie de produits à inventorier
            </Dialog.Description>

            <Flex direction="column" gap="4">
              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Catégorie
                </Text>
                <Select.Root value={selectedCategorie} onValueChange={setSelectedCategorie}>
                  <Select.Trigger placeholder="Toutes les catégories" style={{ width: "100%" }} />
                  <Select.Content position="popper">
                    <Select.Item value="all">Toutes les catégories</Select.Item>
                    <Select.Separator />
                    {categories.map((cat) => (
                      <Select.Item key={cat.id} value={cat.id}>
                        <Flex align="center" gap="2">
                          <Box
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: cat.couleur,
                            }}
                          />
                          {cat.nom}
                        </Flex>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>

              {error ? (
                <Callout.Root color="red" size="1">
                  <Callout.Icon>
                    <WarningCircle size={16} />
                  </Callout.Icon>
                  <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
              ) : null}
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Annuler
                </Button>
              </Dialog.Close>
              <Button onClick={loadProducts} disabled={isLoading}>
                {isLoading ? "Chargement..." : "Commencer l'inventaire"}
              </Button>
            </Flex>
          </>
        )}

        {/* Étape 2: Comptage */}
        {step === "count" && (
          <>
            <Dialog.Description size="2" mb="4">
              Saisissez les quantités réelles pour chaque produit
            </Dialog.Description>

            <Flex direction="column" gap="4">
              {/* Actions */}
              <Flex gap="3" wrap="wrap" justify="between" align="center">
                <Flex gap="2">
                  <Button variant="soft" color="gray" onClick={prefillTheorique}>
                    Pré-remplir avec le stock théorique
                  </Button>
                </Flex>
                <Text size="2" color="gray">
                  {lines.length} produit(s) - {changedLines.length} écart(s) détecté(s)
                </Text>
              </Flex>

              {/* Tableau de saisie */}
              <ScrollArea style={{ maxHeight: "400px" }}>
                <Box
                  style={{
                    border: "1px solid var(--gray-a6)",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <Table.Root>
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell>Produit</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Catégorie</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Stock théorique</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Quantité réelle</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Écart</Table.ColumnHeaderCell>
                      </Table.Row>
                    </Table.Header>

                    <Table.Body>
                      {lines.map((line) => {
                        const ecart = getEcart(line);

                        return (
                          <Table.Row
                            key={line.produitId}
                            style={{
                              backgroundColor: line.hasChanged
                                ? ecart! > 0
                                  ? "var(--green-a2)"
                                  : "var(--red-a2)"
                                : undefined,
                            }}
                          >
                            <Table.RowHeaderCell>
                              <Text weight="medium">{line.produitNom}</Text>
                            </Table.RowHeaderCell>
                            <Table.Cell>
                              <Flex align="center" gap="2">
                                <Box
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    backgroundColor: line.categorie.couleur,
                                  }}
                                />
                                <Text size="2">{line.categorie.nom}</Text>
                              </Flex>
                            </Table.Cell>
                            <Table.Cell>
                              <Text style={{ fontVariantNumeric: "tabular-nums" }}>
                                {line.stockTheorique} {line.unite || ""}
                              </Text>
                            </Table.Cell>
                            <Table.Cell>
                              <TextField.Root
                                type="number"
                                min="0"
                                placeholder="Quantité"
                                value={line.quantiteReelle}
                                onChange={(e) => updateQuantite(line.produitId, e.target.value)}
                                style={{ width: 100 }}
                              />
                            </Table.Cell>
                            <Table.Cell>
                              {ecart !== null && (
                                <Badge
                                  color={ecart === 0 ? "gray" : ecart > 0 ? "green" : "red"}
                                  variant="soft"
                                >
                                  {ecart >= 0 ? "+" : ""}
                                  {ecart}
                                </Badge>
                              )}
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Root>
                </Box>
              </ScrollArea>

              {error ? (
                <Callout.Root color="violet" size="1">
                  <Callout.Icon>
                    <WarningCircle size={16} />
                  </Callout.Icon>
                  <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
              ) : null}
            </Flex>

            <Flex gap="3" mt="4" justify="between">
              <Button variant="soft" color="gray" onClick={() => setStep("setup")}>
                Retour
              </Button>
              <Flex gap="2">
                <Button variant="soft" onClick={goToReview}>
                  Vérifier les écarts
                  <ArrowRight size={14} />
                </Button>
              </Flex>
            </Flex>
          </>
        )}

        {/* Étape 3: Validation */}
        {step === "review" && (
          <>
            <Dialog.Description size="2" mb="4">
              Vérifiez les écarts avant de valider l'inventaire
            </Dialog.Description>

            <Flex direction="column" gap="4">
              {/* Résumé */}
              <Flex gap="4" wrap="wrap">
                <Box
                  style={{
                    flex: "1 1 200px",
                    padding: 16,
                    borderRadius: 8,
                    backgroundColor: "var(--gray-a3)",
                  }}
                >
                  <Text size="2" color="gray">
                    Produits comptés
                  </Text>
                  <Text size="5" weight="bold" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {lines.filter((l) => l.quantiteReelle !== "").length} / {lines.length}
                  </Text>
                </Box>
                <Box
                  style={{
                    flex: "1 1 200px",
                    padding: 16,
                    borderRadius: 8,
                    backgroundColor:
                      changedLines.length > 0 ? "var(--accent-a3)" : "var(--green-a3)",
                  }}
                >
                  <Text size="2" color={changedLines.length > 0 ? "violet" : "green"}>
                    Écarts détectés
                  </Text>
                  <Text
                    size="5"
                    weight="bold"
                    color={changedLines.length > 0 ? "violet" : "green"}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {changedLines.length}
                  </Text>
                </Box>
                <Box
                  style={{
                    flex: "1 1 200px",
                    padding: 16,
                    borderRadius: 8,
                    backgroundColor:
                      totalEcart === 0
                        ? "var(--gray-a3)"
                        : totalEcart > 0
                          ? "var(--green-a3)"
                          : "var(--red-a3)",
                  }}
                >
                  <Text
                    size="2"
                    color={totalEcart === 0 ? "gray" : totalEcart > 0 ? "green" : "red"}
                  >
                    Écart total
                  </Text>
                  <Text
                    size="5"
                    weight="bold"
                    color={totalEcart === 0 ? "gray" : totalEcart > 0 ? "green" : "red"}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {totalEcart >= 0 ? "+" : ""}
                    {totalEcart}
                  </Text>
                </Box>
              </Flex>

              {/* Option pour afficher uniquement les écarts */}
              <Flex align="center" gap="2">
                <Checkbox
                  checked={showOnlyChanged}
                  onCheckedChange={(checked) => setShowOnlyChanged(checked === true)}
                />
                <Text size="2">Afficher uniquement les écarts</Text>
              </Flex>

              {/* Liste des écarts */}
              {displayLines.length > 0 ? (
                <ScrollArea style={{ maxHeight: "300px" }}>
                  <Box
                    style={{
                      border: "1px solid var(--gray-a6)",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    <Table.Root>
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeaderCell>Produit</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Stock théorique</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Quantité réelle</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Écart</Table.ColumnHeaderCell>
                        </Table.Row>
                      </Table.Header>

                      <Table.Body>
                        {displayLines.map((line) => {
                          const ecart = getEcart(line);

                          return (
                            <Table.Row key={line.produitId}>
                              <Table.RowHeaderCell>
                                <Text weight="medium">{line.produitNom}</Text>
                              </Table.RowHeaderCell>
                              <Table.Cell>
                                <Text style={{ fontVariantNumeric: "tabular-nums" }}>
                                  {line.stockTheorique}
                                </Text>
                              </Table.Cell>
                              <Table.Cell>
                                <Text
                                  weight="medium"
                                  style={{ fontVariantNumeric: "tabular-nums" }}
                                >
                                  {line.quantiteReelle || "-"}
                                </Text>
                              </Table.Cell>
                              <Table.Cell>
                                {ecart !== null && (
                                  <Badge
                                    color={ecart === 0 ? "gray" : ecart > 0 ? "green" : "red"}
                                    variant="solid"
                                  >
                                    {ecart >= 0 ? "+" : ""}
                                    {ecart}
                                  </Badge>
                                )}
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                </ScrollArea>
              ) : (
                <Flex direction="column" align="center" justify="center" py="6" gap="2">
                  <CheckCircle size={32} style={{ color: "var(--green-9)" }} />
                  <Text color="green" weight="medium">
                    Aucun écart détecté
                  </Text>
                </Flex>
              )}

              {error ? (
                <Callout.Root color="red" size="1">
                  <Callout.Icon>
                    <WarningCircle size={16} />
                  </Callout.Icon>
                  <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
              ) : null}
            </Flex>

            <Flex gap="3" mt="4" justify="between">
              <Button variant="soft" color="gray" onClick={() => setStep("count")}>
                Retour au comptage
              </Button>
              <Flex gap="2">
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    Annuler
                  </Button>
                </Dialog.Close>
                <Button onClick={handleSubmit} disabled={isLoading} color="green">
                  <FloppyDisk size={14} />
                  {isLoading ? "Enregistrement..." : "Valider l'inventaire"}
                </Button>
              </Flex>
            </Flex>
          </>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
