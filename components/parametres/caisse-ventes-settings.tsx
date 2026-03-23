"use client";

/**
 * CaisseVentesSettings - Parametres de caisse et ventes
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
  RadioCards,
  Checkbox,
} from "@radix-ui/themes";
import {
  ShoppingCart,
  CreditCard,
  Percent,
  Receipt,
  FloppyDisk,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  Info,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { updateCaisseVentesSettings } from "@/actions/parametres";
import {
  caisseVentesSchema,
  modeVenteOptions,
  modePaiementOptions,
  type CaisseVentesFormData,
} from "@/schemas/parametres.schema";

interface CaisseVentesSettingsProps {
  initialData: CaisseVentesFormData;
}

export function CaisseVentesSettings({ initialData }: CaisseVentesSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    watch,
  } = useForm<CaisseVentesFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(caisseVentesSchema) as any,
    defaultValues: initialData,
  });

  const confirmationVente = watch("confirmationVente");
  const impressionAuto = watch("impressionAutoTicket");

  const onSubmit = async (data: CaisseVentesFormData) => {
    setIsLoading(true);
    setSaveStatus("idle");

    try {
      const result = await updateCaisseVentesSettings(data);

      if (result.success) {
        setSaveStatus("success");
        toast.success("Paramètres de caisse enregistrés");
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
            <Text weight="bold">Configuration de la caisse</Text>
            <br />
            Configurez le comportement par defaut de votre caisse et les modes de paiement acceptes.
          </Callout.Text>
        </Callout.Root>

        {/* Mode de vente par defaut */}
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <ShoppingCart size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Mode de vente par defaut
              </Text>
            </Flex>

            <Controller
              name="modeVenteDefaut"
              control={control}
              render={({ field }) => (
                <RadioCards.Root
                  value={field.value}
                  onValueChange={field.onChange}
                  columns={{ initial: "1", sm: "2", md: "4" }}
                >
                  {modeVenteOptions.map((option) => (
                    <RadioCards.Item key={option.value} value={option.value}>
                      <Text weight="medium">{option.label}</Text>
                    </RadioCards.Item>
                  ))}
                </RadioCards.Root>
              )}
            />
            {errors.modeVenteDefaut ? (
              <Text size="1" color="red">
                {errors.modeVenteDefaut.message}
              </Text>
            ) : null}
          </Flex>
        </Box>

        {/* Options de vente */}
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Receipt size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Options de vente
              </Text>
            </Flex>

            <Flex gap="4" wrap="wrap">
              <Box style={{ flex: "1 1 200px" }}>
                <Text as="label" size="2" weight="medium" mb="2">
                  Montant minimum de vente (FCFA)
                </Text>
                <TextField.Root
                  {...register("montantMinimumVente")}
                  type="number"
                  min="0"
                  size="3"
                  placeholder="0"
                />
                {errors.montantMinimumVente ? (
                  <Text size="1" color="red" mt="1">
                    {errors.montantMinimumVente.message}
                  </Text>
                ) : null}
                <Text size="1" color="gray" mt="1">
                  0 = pas de minimum
                </Text>
              </Box>

              <Box style={{ flex: "1 1 200px" }}>
                <Text as="label" size="2" weight="medium" mb="2">
                  Remise maximale autorisee
                </Text>
                <TextField.Root
                  {...register("remiseMaxAutorisee")}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  size="3"
                >
                  <TextField.Slot side="right">
                    <Percent size={16} weight="bold" />
                  </TextField.Slot>
                </TextField.Root>
                {errors.remiseMaxAutorisee ? (
                  <Text size="1" color="red" mt="1">
                    {errors.remiseMaxAutorisee.message}
                  </Text>
                ) : null}
                <Text size="1" color="gray" mt="1">
                  Limite les remises que peuvent appliquer les caissiers
                </Text>
              </Box>
            </Flex>

            <Box
              style={{
                borderTop: "1px solid var(--gray-5)",
                paddingTop: "16px",
              }}
            >
              <Flex direction="column" gap="3">
                <Controller
                  name="confirmationVente"
                  control={control}
                  render={({ field }) => (
                    <Flex align="center" justify="between">
                      <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">
                          Confirmation avant validation
                        </Text>
                        <Text size="1" color="gray">
                          Demander confirmation avant de finaliser chaque vente
                        </Text>
                      </Flex>
                      <Switch size="3" checked={field.value} onCheckedChange={field.onChange} />
                    </Flex>
                  )}
                />

                <Controller
                  name="impressionAutoTicket"
                  control={control}
                  render={({ field }) => (
                    <Flex align="center" justify="between">
                      <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">
                          Impression automatique du ticket
                        </Text>
                        <Text size="1" color="gray">
                          Imprimer automatiquement le ticket apres chaque vente
                        </Text>
                      </Flex>
                      <Switch size="3" checked={field.value} onCheckedChange={field.onChange} />
                    </Flex>
                  )}
                />
              </Flex>
            </Box>

            {/* Apercu des options */}
            <Box
              style={{
                backgroundColor: "var(--gray-a2)",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <Text size="2" weight="medium" mb="2">
                Comportement actuel :
              </Text>
              <Flex direction="column" gap="1">
                <Text size="2">
                  {confirmationVente
                    ? "Une confirmation sera demandee avant chaque vente"
                    : "Les ventes seront validees directement"}
                </Text>
                <Text size="2">
                  {impressionAuto
                    ? "Le ticket sera imprime automatiquement"
                    : "L'impression du ticket sera manuelle"}
                </Text>
              </Flex>
            </Box>
          </Flex>
        </Box>

        {/* Modes de paiement actifs */}
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <CreditCard size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Modes de paiement actifs
              </Text>
            </Flex>

            <Text size="2" color="gray">
              Selectionnez les modes de paiement disponibles sur votre caisse
            </Text>

            <Controller
              name="modesPaiementActifs"
              control={control}
              render={({ field }) => (
                <Flex direction="column" gap="2">
                  {modePaiementOptions.map((option) => (
                    <Flex key={option.value} align="center" gap="2">
                      <Checkbox
                        checked={field.value.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...field.value, option.value]);
                          } else {
                            field.onChange(field.value.filter((v) => v !== option.value));
                          }
                        }}
                      />
                      <Text size="2">{option.label}</Text>
                    </Flex>
                  ))}
                </Flex>
              )}
            />
            {errors.modesPaiementActifs ? (
              <Text size="1" color="red">
                {errors.modesPaiementActifs.message}
              </Text>
            ) : null}
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
            Enregistrer les parametres de caisse
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
