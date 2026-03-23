"use client";

/**
 * OpenSessionDialog - Dialog pour ouvrir une nouvelle session de caisse
 * Utilise Radix UI Themes pour le styling
 */

import { useState } from "react";
import {
  Dialog,
  Flex,
  Box,
  Text,
  Button,
  TextField,
  Callout,
  SegmentedControl,
  Grid,
  IconButton,
  Separator,
} from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import { Door, Money, Info } from "@phosphor-icons/react";
import { toast } from "sonner";
import { openSession } from "@/actions/sessions";
import { formatCurrency, COUPURES_FCFA } from "@/lib/utils";

interface OpenSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Coupures simplifiees pour le comptage
const COUPURES = COUPURES_FCFA.filter((c) => c.valeur >= 5);

export function OpenSessionDialog({ open, onOpenChange, onSuccess }: OpenSessionDialogProps) {
  const [mode, setMode] = useState<"simple" | "detailed">("simple");
  const [fondCaisse, setFondCaisse] = useState("");
  const [coupures, setCoupures] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculer le total des coupures
  const totalCoupures = Object.entries(coupures).reduce(
    (sum, [valeur, quantite]) => sum + Number(valeur) * quantite,
    0
  );

  const handleSubmit = async () => {
    const montant = mode === "simple" ? Number(fondCaisse) : totalCoupures;

    if (isNaN(montant) || montant < 0) {
      toast.error("Le montant du fond de caisse est invalide");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await openSession({ fondCaisse: montant });

      if (result.success) {
        toast.success("Session de caisse ouverte avec succes");
        resetForm();
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Erreur lors de l'ouverture");
      }
    } catch {
      toast.error("Erreur lors de l'ouverture de la session");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFondCaisse("");
    setCoupures({});
    setMode("simple");
  };

  const updateCoupure = (valeur: number, delta: number) => {
    setCoupures((prev) => {
      const current = prev[valeur] || 0;
      const newValue = Math.max(0, current + delta);
      if (newValue === 0) {
        const { [valeur]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [valeur]: newValue };
    });
  };

  const setCoupureValue = (valeur: number, quantite: number) => {
    setCoupures((prev) => {
      if (quantite <= 0) {
        const { [valeur]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [valeur]: quantite };
    });
  };

  // Raccourcis montants predefinis
  const QUICK_AMOUNTS = [50000, 100000, 150000, 200000];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="520px">
        {/* Header */}
        <Flex align="center" gap="3" mb="4">
          <Box
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-3)",
              backgroundColor: "var(--green-9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <Door size={24} />
          </Box>
          <Box>
            <Dialog.Title size="5" mb="1">
              Ouvrir la caisse
            </Dialog.Title>
            <Dialog.Description size="2" color="gray">
              Saisissez le fond de caisse pour demarrer la session
            </Dialog.Description>
          </Box>
        </Flex>

        {/* Mode selector */}
        <SegmentedControl.Root
          value={mode}
          onValueChange={(v) => setMode(v as "simple" | "detailed")}
          style={{ width: "100%", marginBottom: 16 }}
        >
          <SegmentedControl.Item value="simple">Montant simple</SegmentedControl.Item>
          <SegmentedControl.Item value="detailed">Compter les coupures</SegmentedControl.Item>
        </SegmentedControl.Root>

        {/* Content */}
        <ScrollArea style={{ maxHeight: "50vh" }}>
          {mode === "simple" ? (
            <Flex direction="column" gap="4">
              <Box>
                <Text as="label" size="2" weight="medium" mb="2">
                  <Flex align="center" gap="2" mb="2">
                    <Money size={14} />
                    Fond de caisse (FCFA)
                  </Flex>
                </Text>
                <TextField.Root
                  type="number"
                  size="3"
                  value={fondCaisse}
                  onChange={(e) => setFondCaisse(e.target.value)}
                  placeholder="0"
                  autoFocus
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    textAlign: "center",
                    fontFamily: "var(--font-google-sans-code), monospace",
                  }}
                />
              </Box>

              {/* Raccourcis montants */}
              <Box>
                <Text size="2" color="gray" mb="2">
                  Montants rapides
                </Text>
                <Grid columns="4" gap="2">
                  {QUICK_AMOUNTS.map((montant) => (
                    <Button
                      key={montant}
                      variant="soft"
                      color="gray"
                      onClick={() => setFondCaisse(montant.toString())}
                      style={{
                        fontFamily: "var(--font-google-sans-code), monospace",
                      }}
                    >
                      {(montant / 1000).toFixed(0)}k
                    </Button>
                  ))}
                </Grid>
              </Box>
            </Flex>
          ) : (
            <Flex direction="column" gap="3">
              <Callout.Root color="blue" size="1">
                <Callout.Icon>
                  <Info size={16} />
                </Callout.Icon>
                <Callout.Text>
                  Comptez chaque type de coupure et piece dans votre caisse
                </Callout.Text>
              </Callout.Root>

              <Flex direction="column" gap="2">
                {COUPURES.map((c) => (
                  <Flex
                    key={c.valeur}
                    align="center"
                    gap="3"
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "var(--gray-a2)",
                      borderRadius: "var(--radius-2)",
                      border: "1px solid var(--gray-a4)",
                    }}
                  >
                    <Flex align="center" gap="2" style={{ minWidth: 80 }}>
                      {c.type === "billet" ? (
                        <Money size={14} color="var(--green-10)" />
                      ) : (
                        <Box
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            backgroundColor: "var(--purple-9)",
                          }}
                        />
                      )}
                      <Text
                        size="2"
                        weight="bold"
                        style={{
                          fontFamily: "var(--font-google-sans-code), monospace",
                        }}
                      >
                        {c.label}
                      </Text>
                    </Flex>

                    <Flex align="center" gap="2" style={{ marginLeft: "auto" }}>
                      <IconButton
                        variant="soft"
                        color="gray"
                        size="1"
                        onClick={() => updateCoupure(c.valeur, -1)}
                        disabled={(coupures[c.valeur] || 0) === 0}
                      >
                        -
                      </IconButton>

                      <TextField.Root
                        type="number"
                        size="1"
                        value={coupures[c.valeur] || ""}
                        onChange={(e) => setCoupureValue(c.valeur, parseInt(e.target.value) || 0)}
                        style={{
                          width: 60,
                          textAlign: "center",
                          fontFamily: "var(--font-google-sans-code), monospace",
                        }}
                        placeholder="0"
                      />

                      <IconButton
                        variant="soft"
                        color="green"
                        size="1"
                        onClick={() => updateCoupure(c.valeur, 1)}
                      >
                        +
                      </IconButton>
                    </Flex>

                    <Text
                      size="2"
                      color="gray"
                      style={{
                        minWidth: 90,
                        textAlign: "right",
                        fontFamily: "var(--font-google-sans-code), monospace",
                      }}
                    >
                      {formatCurrency((coupures[c.valeur] || 0) * c.valeur)}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Flex>
          )}
        </ScrollArea>

        <Separator size="4" my="4" />

        {/* Total */}
        <Flex
          justify="between"
          align="center"
          p="3"
          style={{
            backgroundColor: "var(--green-a2)",
            borderRadius: "var(--radius-2)",
            border: "1px solid var(--green-a5)",
          }}
        >
          <Text size="3" weight="medium">
            Fond de caisse
          </Text>
          <Text
            size="6"
            weight="bold"
            style={{
              color: "var(--green-11)",
              fontFamily: "var(--font-google-sans-code), monospace",
            }}
          >
            {formatCurrency(mode === "simple" ? Number(fondCaisse) || 0 : totalCoupures)}
          </Text>
        </Flex>

        {/* Actions */}
        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Annuler
            </Button>
          </Dialog.Close>
          <Button color="green" onClick={handleSubmit} disabled={isSubmitting}>
            <Door size={16} />
            {isSubmitting ? "Ouverture..." : "Ouvrir la caisse"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
