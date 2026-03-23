"use client";

/**
 * FiscalSettings - Parametres fiscaux (TVA Gabon)
 */

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Flex, Text, TextField, Switch, Button, Callout, Badge } from "@radix-ui/themes";
import {
  Calculator,
  Percent,
  Receipt,
  FloppyDisk,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  Info,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { updateFiscalSettings } from "@/actions/parametres";
import { fiscalSchema, type FiscalFormData } from "@/schemas/parametres.schema";

interface FiscalSettingsProps {
  initialData: {
    tauxTvaStandard: number;
    tauxTvaReduit: number;
    afficherTvaSurTicket: boolean;
  };
}

export function FiscalSettings({ initialData }: FiscalSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    watch,
  } = useForm<FiscalFormData>({
    resolver: zodResolver(fiscalSchema) as any,
    defaultValues: {
      tauxTvaStandard: initialData.tauxTvaStandard,
      tauxTvaReduit: initialData.tauxTvaReduit,
      afficherTvaSurTicket: initialData.afficherTvaSurTicket,
    },
  });

  const tauxStandard = watch("tauxTvaStandard");
  const tauxReduit = watch("tauxTvaReduit");
  const afficherTva = watch("afficherTvaSurTicket");

  const onSubmit = async (data: FiscalFormData) => {
    setIsLoading(true);
    setSaveStatus("idle");

    try {
      const result = await updateFiscalSettings(data);

      if (result.success) {
        setSaveStatus("success");
        toast.success("Paramètres fiscaux enregistrés");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        toast.error(result.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      setSaveStatus("error");
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap="5">
        {/* Information sur la TVA au Gabon */}
        <Callout.Root color="blue" size="2">
          <Callout.Icon>
            <Info size={18} weight="regular" />
          </Callout.Icon>
          <Callout.Text>
            <Text weight="bold">TVA au Gabon</Text>
            <br />
            Le taux standard est de 18%. Un taux reduit de 10% s'applique a certains produits de
            premiere necessite. Certains produits sont exoneres (0%).
          </Callout.Text>
        </Callout.Root>

        {/* Taux de TVA */}
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Calculator size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Taux de TVA
              </Text>
            </Flex>

            <Flex gap="4" wrap="wrap">
              <Box style={{ flex: "1 1 200px" }}>
                <Flex align="center" gap="2" mb="2">
                  <Text as="label" size="2" weight="medium">
                    Taux standard
                  </Text>
                  <Badge size="1">Par defaut</Badge>
                </Flex>
                <TextField.Root
                  {...register("tauxTvaStandard")}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  size="3"
                >
                  <TextField.Slot side="right">
                    <Percent size={16} />
                  </TextField.Slot>
                </TextField.Root>
                {errors.tauxTvaStandard ? (
                  <Text size="1" color="red" mt="1">
                    {errors.tauxTvaStandard.message}
                  </Text>
                ) : null}
                <Text size="1" color="gray" mt="1">
                  Applique a la majorite des produits et services
                </Text>
              </Box>

              <Box style={{ flex: "1 1 200px" }}>
                <Text as="label" size="2" weight="medium" mb="2">
                  Taux reduit
                </Text>
                <TextField.Root
                  {...register("tauxTvaReduit")}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  size="3"
                >
                  <TextField.Slot side="right">
                    <Percent size={16} />
                  </TextField.Slot>
                </TextField.Root>
                {errors.tauxTvaReduit ? (
                  <Text size="1" color="red" mt="1">
                    {errors.tauxTvaReduit.message}
                  </Text>
                ) : null}
                <Text size="1" color="gray" mt="1">
                  Pour les produits de premiere necessite
                </Text>
              </Box>
            </Flex>

            {/* Apercu des taux */}
            <Box
              style={{
                backgroundColor: "var(--gray-a2)",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <Text size="2" weight="medium" mb="2">
                Apercu des taux configures :
              </Text>
              <Flex gap="4" wrap="wrap">
                <Flex align="center" gap="2">
                  <Box
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: "var(--accent-9)",
                    }}
                  />
                  <Text size="2">Standard : {tauxStandard}%</Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Box
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: "var(--blue-9)",
                    }}
                  />
                  <Text size="2">Reduit : {tauxReduit}%</Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Box
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: "var(--green-9)",
                    }}
                  />
                  <Text size="2">Exonere : 0%</Text>
                </Flex>
              </Flex>
            </Box>
          </Flex>
        </Box>

        {/* Options d'affichage */}
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Receipt size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Affichage sur les tickets
              </Text>
            </Flex>

            <Flex align="center" justify="between">
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">
                  Afficher le detail de la TVA
                </Text>
                <Text size="1" color="gray">
                  Affiche le montant HT, la TVA et le TTC sur chaque ticket
                </Text>
              </Flex>
              <Controller
                name="afficherTvaSurTicket"
                control={control}
                render={({ field }) => (
                  <Switch
                    size="3"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                )}
              />
            </Flex>

            {/* Exemple de ticket */}
            <Box
              style={{
                backgroundColor: "var(--gray-1)",
                border: "1px dashed var(--gray-6)",
                padding: "16px",
                borderRadius: "8px",
                fontFamily: "monospace",
              }}
            >
              <Text size="1" color="gray" mb="2">
                Apercu du ticket :
              </Text>
              <Flex direction="column" gap="1">
                <Flex justify="between">
                  <Text size="1">Sous-total HT</Text>
                  <Text size="1">10 000 FCFA</Text>
                </Flex>
                {afficherTva ? (
                  <Flex justify="between">
                    <Text size="1">TVA ({tauxStandard}%)</Text>
                    <Text size="1">{Math.round((10000 * tauxStandard) / 100)} FCFA</Text>
                  </Flex>
                ) : null}
                <Box
                  style={{
                    borderTop: "1px dashed var(--gray-6)",
                    marginTop: "4px",
                    paddingTop: "4px",
                  }}
                >
                  <Flex justify="between">
                    <Text size="2" weight="bold">
                      TOTAL
                    </Text>
                    <Text size="2" weight="bold">
                      {afficherTva
                        ? `${10000 + Math.round((10000 * tauxStandard) / 100)} FCFA`
                        : "11 800 FCFA"}
                    </Text>
                  </Flex>
                </Box>
              </Flex>
            </Box>
          </Flex>
        </Box>

        {/* Bouton de sauvegarde */}
        <Flex justify="end" gap="3" align="center">
          {saveStatus === "success" && (
            <Flex align="center" gap="2">
              <CheckCircle size={16} className="text-green-500" />
              <Text size="2" color="green">
                Enregistre
              </Text>
            </Flex>
          )}
          {saveStatus === "error" && (
            <Flex align="center" gap="2">
              <WarningCircle size={16} className="text-red-500" />
              <Text size="2" color="red">
                Erreur d'enregistrement
              </Text>
            </Flex>
          )}
          <Button type="submit" size="3" disabled={isLoading}>
            {isLoading ? <CircleNotch size={16} className="animate-spin" /> : <FloppyDisk size={16} />}
            Enregistrer les parametres fiscaux
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
