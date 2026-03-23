"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Flex,
  Text,
  Switch,
  TextField,
  Button,
  Callout,
  Separator,
} from "@radix-ui/themes";
import {
  ShieldCheck,
  Percent,
  Clock,
  FloppyDisk,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  Info,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { updateConfigTarificationAction } from "@/actions/tarification";
import {
  configTarificationSchema,
  type ConfigTarification,
} from "@/schemas/tarification.schema";

interface MargeProtectionCardProps {
  initialConfig: ConfigTarification;
}

export function MargeProtectionCard({ initialConfig }: MargeProtectionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ConfigTarification>({
    resolver: zodResolver(configTarificationSchema) as any,
    defaultValues: initialConfig,
  });

  const protectionActive = watch("protectionMargeActive");
  const approbationActive = watch("approbationRemiseActive");
  const tarifsHorairesActifs = watch("tarifsHorairesActifs");

  const onSubmit = async (data: ConfigTarification) => {
    setIsLoading(true);
    setSaveStatus("idle");

    try {
      const result = await updateConfigTarificationAction(data);

      if (result.success) {
        setSaveStatus("success");
        toast.success("Configuration de tarification enregistree");
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
        {/* Protection des marges */}
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <ShieldCheck size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Protection des marges
              </Text>
            </Flex>

            <Flex align="center" justify="between">
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">
                  Activer la protection des marges
                </Text>
                <Text size="1" color="gray">
                  Empeche les ventes en dessous du seuil de marge minimum
                </Text>
              </Flex>
              <Controller
                name="protectionMargeActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    size="3"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </Flex>

            {protectionActive ? <Box
                style={{
                  backgroundColor: "var(--gray-a2)",
                  padding: "16px",
                  borderRadius: "8px",
                }}
              >
                <Flex direction="column" gap="3">
                  <Flex align="center" gap="2">
                    <Percent size={16} style={{ color: "var(--accent-9)" }} />
                    <Text size="2" weight="medium">
                      Marge minimum globale
                    </Text>
                  </Flex>
                  <Controller
                    name="margeMinimumGlobale"
                    control={control}
                    render={({ field }) => (
                      <TextField.Root
                        type="number"
                        min="0"
                        max="100"
                        size="3"
                        style={{ maxWidth: 200 }}
                        value={String(field.value)}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      >
                        <TextField.Slot side="right">
                          <Percent size={16} />
                        </TextField.Slot>
                      </TextField.Root>
                    )}
                  />
                  {errors.margeMinimumGlobale ? <Text size="1" color="red">
                      {errors.margeMinimumGlobale.message}
                    </Text> : null}
                  <Text size="1" color="gray">
                    Les remises ne pourront pas reduire la marge en dessous de ce pourcentage
                  </Text>
                </Flex>
              </Box> : null}
          </Flex>
        </Box>

        {/* Approbation des remises */}
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <ShieldCheck size={20} weight="duotone" style={{ color: "var(--green-9)" }} />
              <Text size="4" weight="bold">
                Approbation des remises
              </Text>
            </Flex>

            <Flex align="center" justify="between">
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">
                  Activer les approbations de remise
                </Text>
                <Text size="1" color="gray">
                  Les remises au-dela du seuil defini par role necessiteront une approbation manageriale
                </Text>
              </Flex>
              <Controller
                name="approbationRemiseActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    size="3"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </Flex>

            {approbationActive ? <Callout.Root color="orange" size="1">
                <Callout.Icon>
                  <Info size={16} />
                </Callout.Icon>
                <Callout.Text size="1">
                  Configurez les seuils d&apos;approbation dans l&apos;onglet &quot;Regles par role&quot;
                  (colonne &quot;Approbation au-dela de&quot;).
                </Callout.Text>
              </Callout.Root> : null}
          </Flex>
        </Box>

        {/* Tarifs horaires */}
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Clock size={20} weight="duotone" style={{ color: "var(--blue-9)" }} />
              <Text size="4" weight="bold">
                Tarifs horaires
              </Text>
            </Flex>

            <Flex align="center" justify="between">
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">
                  Activer les tarifs horaires
                </Text>
                <Text size="1" color="gray">
                  Permet d&apos;appliquer des majorations ou reductions automatiques selon les heures et jours
                </Text>
              </Flex>
              <Controller
                name="tarifsHorairesActifs"
                control={control}
                render={({ field }) => (
                  <Switch
                    size="3"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </Flex>

            {tarifsHorairesActifs ? <Callout.Root color="blue" size="1">
                <Callout.Icon>
                  <Info size={16} />
                </Callout.Icon>
                <Callout.Text size="1">
                  Gerez les plages horaires dans l&apos;onglet &quot;Tarifs horaires&quot;.
                </Callout.Text>
              </Callout.Root> : null}
          </Flex>
        </Box>

        {/* Bouton de sauvegarde */}
        <Flex justify="end" gap="3" align="center">
          {saveStatus === "success" && (
            <Flex align="center" gap="2">
              <CheckCircle size={16} style={{ color: "var(--green-9)" }} />
              <Text size="2" color="green">
                Enregistre
              </Text>
            </Flex>
          )}
          {saveStatus === "error" && (
            <Flex align="center" gap="2">
              <WarningCircle size={16} style={{ color: "var(--red-9)" }} />
              <Text size="2" color="red">
                Erreur
              </Text>
            </Flex>
          )}
          <Button type="submit" size="3" disabled={isLoading}>
            {isLoading ? (
              <CircleNotch size={16} className="animate-spin" />
            ) : (
              <FloppyDisk size={16} />
            )}
            Sauvegarder la configuration
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
