"use client";

/**
 * InventaireForm - Workflow complet d'inventaire en 3 etapes
 * Etape 1: Selection de la categorie
 * Etape 2: Comptage (saisie des quantites)
 * Etape 3: Validation (resume des ecarts)
 */

import { useState, useCallback, useEffect } from "react";
import {
  Flex,
  Text,
  Select,
  Button,
  Box,
  Heading,
  Callout,
  Badge,
} from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import {
  ClipboardList,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ListChecks,
  RotateCcw,
} from "lucide-react";
import {
  getInventoryProducts,
  getStockCategories,
  submitInventory,
} from "@/actions/stocks";
import { toast } from "sonner";
import { InventaireTable, type InventaireLigne } from "./inventaire-table";
import { InventaireRecap } from "./inventaire-recap";

type Step = "selection" | "comptage" | "validation";

const STEPS: { key: Step; label: string; numero: number }[] = [
  { key: "selection", label: "Selection", numero: 1 },
  { key: "comptage", label: "Comptage", numero: 2 },
  { key: "validation", label: "Validation", numero: 3 },
];

export function InventaireForm() {
  const [step, setStep] = useState<Step>("selection");
  const [categories, setCategories] = useState<
    { id: string; nom: string; couleur: string }[]
  >([]);
  const [selectedCategorie, setSelectedCategorie] = useState("all");
  const [lignes, setLignes] = useState<InventaireLigne[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les categories
  useEffect(() => {
    (async () => {
      const result = await getStockCategories();
      if (result.success) {
        setCategories(result.data);
      }
    })();
  }, []);

  // Charger les produits et passer au comptage
  const startComptage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getInventoryProducts(
        selectedCategorie !== "all" ? selectedCategorie : undefined
      );

      if (result.success) {
        setLignes(
          result.data.map((p) => ({
            produitId: p.id,
            produitNom: p.nom,
            stockTheorique: p.stockActuel,
            quantiteComptee: "",
            unite: p.unite,
            categorie: p.categorie,
            prixAchat: null,
            prixVente: 0,
          }))
        );
        // Charger aussi les infos de prix
        const statusResult = await import("@/actions/stocks").then((m) =>
          m.getStockStatus({
            categorieId:
              selectedCategorie !== "all" ? selectedCategorie : undefined,
          })
        );
        if (statusResult.success) {
          setLignes((prev) =>
            prev.map((l) => {
              const produit = statusResult.data.find((p) => p.id === l.produitId);
              if (produit) {
                return {
                  ...l,
                  prixAchat: produit.prixAchat,
                  prixVente: produit.prixVente,
                };
              }
              return l;
            })
          );
        }
        setStep("comptage");
      } else {
        setError(result.error);
      }
    } catch {
      setError("Erreur lors du chargement des produits");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategorie]);

  // Mise a jour d'une quantite
  const handleQuantiteChange = useCallback(
    (produitId: string, value: string) => {
      setLignes((prev) =>
        prev.map((l) =>
          l.produitId === produitId ? { ...l, quantiteComptee: value } : l
        )
      );
    },
    []
  );

  // Pre-remplir avec le stock theorique
  const prefillTheorique = useCallback(() => {
    setLignes((prev) =>
      prev.map((l) => ({
        ...l,
        quantiteComptee: l.stockTheorique.toString(),
      }))
    );
  }, []);

  // Passer a la validation
  const goToValidation = () => {
    setError(null);
    setStep("validation");
  };

  // Retour au comptage
  const backToComptage = () => {
    setError(null);
    setStep("comptage");
  };

  // Soumettre l'inventaire
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const lignesToSubmit = lignes
        .filter((l) => {
          const qty = parseInt(l.quantiteComptee, 10);
          return !isNaN(qty) && qty !== l.stockTheorique;
        })
        .map((l) => ({
          produitId: l.produitId,
          quantiteReelle: parseInt(l.quantiteComptee, 10),
        }));

      if (lignesToSubmit.length === 0) {
        toast.info("Aucun ecart a enregistrer");
        return;
      }

      const result = await submitInventory(lignesToSubmit);

      if (result.success) {
        toast.success(
          `Inventaire valide : ${result.data.details.length} produit(s) ajuste(s)`
        );
        // Reset
        setStep("selection");
        setLignes([]);
        setSelectedCategorie("all");
      } else {
        setError(result.error);
      }
    } catch {
      setError("Erreur lors de l'enregistrement de l'inventaire");
    } finally {
      setIsSubmitting(false);
    }
  }, [lignes]);

  // Nombre de produits avec ecart
  const nbEcarts = lignes.filter((l) => {
    const qty = parseInt(l.quantiteComptee, 10);
    return !isNaN(qty) && qty !== l.stockTheorique;
  }).length;

  const nbComptes = lignes.filter((l) => l.quantiteComptee !== "").length;

  return (
    <Flex direction="column" gap="5">
      {/* Indicateur d'etapes */}
      <Flex
        gap="2"
        align="center"
        style={{
          padding: "16px 20px",
          borderRadius: 8,
          backgroundColor: "var(--gray-a2)",
          border: "1px solid var(--gray-a4)",
        }}
      >
        {STEPS.map((s, i) => {
          const isCurrent = s.key === step;
          const isPast =
            STEPS.findIndex((x) => x.key === step) >
            STEPS.findIndex((x) => x.key === s.key);

          return (
            <Flex key={s.key} align="center" gap="2">
              {i > 0 && (
                <Box
                  style={{
                    width: 32,
                    height: 2,
                    backgroundColor: isPast
                      ? "var(--accent-9)"
                      : "var(--gray-a6)",
                    borderRadius: 1,
                  }}
                />
              )}
              <Flex align="center" gap="2">
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    fontSize: 13,
                    fontWeight: 600,
                    backgroundColor: isCurrent
                      ? "var(--accent-9)"
                      : isPast
                      ? "var(--accent-9)"
                      : "var(--gray-a4)",
                    color: isCurrent || isPast ? "white" : "var(--gray-11)",
                  }}
                >
                  {isPast ? "\u2713" : s.numero}
                </Flex>
                <Text
                  size="2"
                  weight={isCurrent ? "bold" : "regular"}
                  color={isCurrent ? undefined : "gray"}
                >
                  {s.label}
                </Text>
              </Flex>
            </Flex>
          );
        })}

        {/* Compteur */}
        {step !== "selection" && (
          <Box style={{ marginLeft: "auto" }}>
            <Flex gap="3">
              <Badge variant="soft" color="gray" size="2">
                {nbComptes}/{lignes.length} comptes
              </Badge>
              {nbEcarts > 0 && (
                <Badge variant="soft" color="violet" size="2">
                  {nbEcarts} ecart(s)
                </Badge>
              )}
            </Flex>
          </Box>
        )}
      </Flex>

      {/* Etape 1: Selection */}
      {step === "selection" && (
        <Flex direction="column" gap="4">
          <Box>
            <Heading size="4" mb="2">
              Demarrer un inventaire
            </Heading>
            <Text size="2" color="gray">
              Selectionnez la categorie de produits a inventorier, ou choisissez
              "Toutes les categories" pour un inventaire complet.
            </Text>
          </Box>

          <Box
            style={{
              maxWidth: 400,
              padding: 24,
              borderRadius: 12,
              border: "1px solid var(--gray-a6)",
              backgroundColor: "var(--color-panel-solid)",
            }}
          >
            <Flex direction="column" gap="4">
              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Categorie
                </Text>
                <Select.Root
                  value={selectedCategorie}
                  onValueChange={setSelectedCategorie}
                >
                  <Select.Trigger
                    placeholder="Toutes les categories"
                    style={{ width: "100%" }}
                  />
                  <Select.Content>
                    <Select.Item value="all">
                      Toutes les categories
                    </Select.Item>
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

              {error ? <Callout.Root color="red" size="1">
                  <Callout.Icon>
                    <AlertCircle size={16} />
                  </Callout.Icon>
                  <Callout.Text>{error}</Callout.Text>
                </Callout.Root> : null}

              <Button
                onClick={startComptage}
                disabled={isLoading}
                style={{ minHeight: 44 }}
              >
                <ClipboardList size={16} />
                {isLoading
                  ? "Chargement des produits..."
                  : "Commencer l'inventaire"}
              </Button>
            </Flex>
          </Box>
        </Flex>
      )}

      {/* Etape 2: Comptage */}
      {step === "comptage" && (
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center" wrap="wrap" gap="3">
            <Box>
              <Heading size="4" mb="1">
                Saisie des quantites
              </Heading>
              <Text size="2" color="gray">
                Comptez chaque produit et saisissez la quantite reelle.
              </Text>
            </Box>

            <Flex gap="2">
              <Button
                variant="soft"
                color="gray"
                onClick={prefillTheorique}
                style={{ minHeight: 44 }}
              >
                <RotateCcw size={14} />
                Pre-remplir (stock theorique)
              </Button>
            </Flex>
          </Flex>

          <ScrollArea style={{ maxHeight: "calc(100vh - 380px)" }}>
            <InventaireTable
              lignes={lignes}
              categories={categories}
              onQuantiteChange={handleQuantiteChange}
            />
          </ScrollArea>

          {/* Navigation */}
          <Flex gap="3" justify="between" pt="2">
            <Button
              variant="soft"
              color="gray"
              onClick={() => setStep("selection")}
              style={{ minHeight: 44 }}
            >
              <ArrowLeft size={16} />
              Retour
            </Button>
            <Button
              onClick={goToValidation}
              style={{ minHeight: 44 }}
            >
              <ListChecks size={16} />
              Verifier les ecarts
              <ArrowRight size={16} />
            </Button>
          </Flex>
        </Flex>
      )}

      {/* Etape 3: Validation */}
      {step === "validation" && (
        <Flex direction="column" gap="4">
          <Box>
            <Heading size="4" mb="1">
              Resume de l'inventaire
            </Heading>
            <Text size="2" color="gray">
              Verifiez les ecarts avant de valider. Les stocks seront ajustes
              automatiquement.
            </Text>
          </Box>

          <InventaireRecap
            lignes={lignes}
            isSubmitting={isSubmitting}
            error={error}
            onSubmit={handleSubmit}
            onBack={backToComptage}
          />
        </Flex>
      )}
    </Flex>
  );
}
