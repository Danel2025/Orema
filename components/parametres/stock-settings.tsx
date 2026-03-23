"use client";

/**
 * StockSettings - Parametres de gestion des stocks
 */

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Flex,
  Text,
  TextField,
  Switch,
  Button,
  Callout,
  Select,
} from "@radix-ui/themes";
import {
  Package,
  Warning,
  EnvelopeSimple,
  Calculator,
  FloppyDisk,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  Info,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { updateStockSettings } from "@/actions/parametres";
import {
  stockSettingsSchema,
  methodeValuationOptions,
  type StockSettingsFormData,
} from "@/schemas/parametres.schema";

interface StockSettingsProps {
  initialData: StockSettingsFormData;
}

export function StockSettings({ initialData }: StockSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<StockSettingsFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(stockSettingsSchema) as any,
    defaultValues: initialData,
  });

  const alerteEmail = watch("alerteStockEmail");
  const seuilAlerte = watch("seuilAlerteStockBas");
  const seuilCritique = watch("seuilCritiqueStock");

  const onSubmit = async (data: StockSettingsFormData) => {
    setIsLoading(true);
    setSaveStatus("idle");

    try {
      const result = await updateStockSettings(data);

      if (result.success) {
        setSaveStatus("success");
        toast.success("Paramètres de stock enregistrés");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        toast.error(result.error || "Erreur lors de l'enregistrement");
      }
    } catch {
      setSaveStatus("error");
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap="5">
        {/* Information */}
        <Callout.Root color="blue" size="2">
          <Callout.Icon>
            <Info size={18} weight="duotone" />
          </Callout.Icon>
          <Callout.Text>
            <Text weight="bold">Gestion des stocks</Text>
            <br />
            Configurez les seuils d'alerte et les notifications pour la gestion de vos stocks.
          </Callout.Text>
        </Callout.Root>

        {/* Seuils d'alerte */}
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Warning size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Seuils d'alerte
              </Text>
            </Flex>

            <Flex gap="4" wrap="wrap">
              <Box style={{ flex: "1 1 200px" }}>
                <Text as="label" size="2" weight="medium" mb="2">
                  Seuil d'alerte (stock bas)
                </Text>
                <TextField.Root
                  {...register("seuilAlerteStockBas")}
                  type="number"
                  min="0"
                  size="3"
                  placeholder="10"
                />
                {errors.seuilAlerteStockBas ? (
                  <Text size="1" color="red" mt="1">
                    {errors.seuilAlerteStockBas.message}
                  </Text>
                ) : null}
                <Text size="1" color="gray" mt="1">
                  Alerte quand le stock passe sous ce niveau
                </Text>
              </Box>

              <Box style={{ flex: "1 1 200px" }}>
                <Text as="label" size="2" weight="medium" mb="2">
                  Seuil critique (urgent)
                </Text>
                <TextField.Root
                  {...register("seuilCritiqueStock")}
                  type="number"
                  min="0"
                  size="3"
                  placeholder="5"
                />
                {errors.seuilCritiqueStock ? (
                  <Text size="1" color="red" mt="1">
                    {errors.seuilCritiqueStock.message}
                  </Text>
                ) : null}
                <Text size="1" color="gray" mt="1">
                  Alerte critique quand le stock est tres bas
                </Text>
              </Box>
            </Flex>

            {/* Visualisation des seuils */}
            <Box
              style={{
                backgroundColor: "var(--gray-a2)",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <Text size="2" weight="medium" mb="3">
                Visualisation des niveaux :
              </Text>
              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  <Box
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: "var(--green-9)",
                    }}
                  />
                  <Text size="2">Normal : stock &gt; {seuilAlerte}</Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Box
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: "var(--purple-9)",
                    }}
                  />
                  <Text size="2">
                    Bas : {seuilCritique} &lt; stock ≤ {seuilAlerte}
                  </Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Box
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: "var(--red-9)",
                    }}
                  />
                  <Text size="2">Critique : stock ≤ {seuilCritique}</Text>
                </Flex>
              </Flex>
            </Box>
          </Flex>
        </Box>

        {/* Notifications par email */}
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <EnvelopeSimple size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Notifications par email
              </Text>
            </Flex>

            <Controller
              name="alerteStockEmail"
              control={control}
              render={({ field }) => (
                <Flex align="center" justify="between">
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">
                      Recevoir des alertes par email
                    </Text>
                    <Text size="1" color="gray">
                      Envoyer un email quand le stock passe sous les seuils configures
                    </Text>
                  </Flex>
                  <Switch size="3" checked={field.value} onCheckedChange={field.onChange} />
                </Flex>
              )}
            />

            {alerteEmail ? (
              <Box>
                <Text as="label" size="2" weight="medium" mb="2">
                  Email de notification
                </Text>
                <TextField.Root
                  {...register("emailAlerteStock")}
                  type="email"
                  size="3"
                  placeholder="gestionnaire@example.com"
                >
                  <TextField.Slot side="left">
                    <EnvelopeSimple size={16} />
                  </TextField.Slot>
                </TextField.Root>
                {errors.emailAlerteStock ? (
                  <Text size="1" color="red" mt="1">
                    {errors.emailAlerteStock.message}
                  </Text>
                ) : null}
              </Box>
            ) : null}
          </Flex>
        </Box>

        {/* Methode de valuation */}
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Calculator size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Methode de valuation
              </Text>
            </Flex>

            <Controller
              name="methodeValuationStock"
              control={control}
              render={({ field }) => (
                <Box>
                  <Text as="label" size="2" weight="medium" mb="2">
                    Methode de calcul du cout des stocks
                  </Text>
                  <Select.Root value={field.value} onValueChange={field.onChange}>
                    <Select.Trigger style={{ width: "100%" }} />
                    <Select.Content position="popper">
                      {methodeValuationOptions.map((option) => (
                        <Select.Item key={option.value} value={option.value}>
                          {option.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>
              )}
            />

            <Box
              style={{
                backgroundColor: "var(--gray-a2)",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <Text size="2" weight="medium" mb="2">
                Explication :
              </Text>
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">
                  <strong>FIFO</strong> (Premier entre, premier sorti) : Les premiers articles
                  achetes sont les premiers vendus. Recommande pour les produits perissables.
                </Text>
                <Text size="1" color="gray">
                  <strong>LIFO</strong> (Dernier entre, premier sorti) : Les derniers articles
                  achetes sont les premiers vendus. Peut etre utile en periode d'inflation.
                </Text>
              </Flex>
            </Box>
          </Flex>
        </Box>

        {/* Bouton de sauvegarde */}
        <Flex justify="end" gap="3" align="center">
          {saveStatus === "success" && (
            <Flex align="center" gap="2">
              <CheckCircle size={16} weight="fill" className="text-green-500" />
              <Text size="2" color="green">
                Enregistre
              </Text>
            </Flex>
          )}
          {saveStatus === "error" && (
            <Flex align="center" gap="2">
              <WarningCircle size={16} weight="fill" className="text-red-500" />
              <Text size="2" color="red">
                Erreur d'enregistrement
              </Text>
            </Flex>
          )}
          <Button type="submit" size="3" disabled={isLoading}>
            {isLoading ? <CircleNotch size={16} className="animate-spin" /> : <FloppyDisk size={16} />}
            Enregistrer les parametres de stock
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
