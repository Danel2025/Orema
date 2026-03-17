"use client";

/**
 * PlanSalleSettings - Parametres du plan de salle
 */

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Card,
  Flex,
  Text,
  Switch,
  Button,
  Callout,
  Select,
} from "@radix-ui/themes";
import {
  LayoutGrid,
  Palette,
  Eye,
  Grid3X3,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { updatePlanSalleSettings } from "@/actions/parametres";
import {
  planSalleSettingsSchema,
  affichageTableOptions,
  tailleGrilleOptions,
  type PlanSalleSettingsFormData,
} from "@/schemas/parametres.schema";

interface PlanSalleSettingsProps {
  initialData: PlanSalleSettingsFormData;
}

interface ColorPickerProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function ColorPicker({ label, description, value, onChange, error }: ColorPickerProps) {
  return (
    <Flex align="center" justify="between" gap="3">
      <Flex direction="column" gap="1" style={{ flex: 1 }}>
        <Text size="2" weight="medium">
          {label}
        </Text>
        <Text size="1" color="gray">
          {description}
        </Text>
        {error ? <Text size="1" color="red">
            {error}
          </Text> : null}
      </Flex>
      <Flex align="center" gap="2">
        <Box
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            backgroundColor: value,
            border: "2px solid var(--gray-6)",
          }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 40,
            height: 32,
            padding: 0,
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        />
      </Flex>
    </Flex>
  );
}

export function PlanSalleSettings({ initialData }: PlanSalleSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const {
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<PlanSalleSettingsFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(planSalleSettingsSchema) as any,
    defaultValues: initialData,
  });

  const grilleActivee = watch("grilleActivee");
  const couleurLibre = watch("couleurTableLibre");
  const couleurOccupee = watch("couleurTableOccupee");
  const couleurPrepa = watch("couleurTablePrepa");
  const couleurAddition = watch("couleurTableAddition");
  const couleurNettoyer = watch("couleurTableNettoyer");

  const onSubmit = async (data: PlanSalleSettingsFormData) => {
    setIsLoading(true);
    setSaveStatus("idle");

    try {
      const result = await updatePlanSalleSettings(data);

      if (result.success) {
        setSaveStatus("success");
        toast.success("Parametres du plan de salle enregistres");
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
            <Info size={18} />
          </Callout.Icon>
          <Callout.Text>
            <Text weight="bold">Plan de salle</Text>
            <br />
            Personnalisez l'apparence et le comportement du plan de salle interactif.
          </Callout.Text>
        </Callout.Root>

        {/* Couleurs des tables */}
        <Card size="3">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Palette size={20} style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Couleurs des tables
              </Text>
            </Flex>

            <Flex direction="column" gap="3">
              <Controller
                name="couleurTableLibre"
                control={control}
                render={({ field }) => (
                  <ColorPicker
                    label="Table libre"
                    description="Table disponible pour les clients"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.couleurTableLibre?.message}
                  />
                )}
              />

              <Controller
                name="couleurTableOccupee"
                control={control}
                render={({ field }) => (
                  <ColorPicker
                    label="Table occupee"
                    description="Table avec des clients installes"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.couleurTableOccupee?.message}
                  />
                )}
              />

              <Controller
                name="couleurTablePrepa"
                control={control}
                render={({ field }) => (
                  <ColorPicker
                    label="En preparation"
                    description="Commande en cours de preparation"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.couleurTablePrepa?.message}
                  />
                )}
              />

              <Controller
                name="couleurTableAddition"
                control={control}
                render={({ field }) => (
                  <ColorPicker
                    label="Addition demandee"
                    description="Le client a demande l'addition"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.couleurTableAddition?.message}
                  />
                )}
              />

              <Controller
                name="couleurTableNettoyer"
                control={control}
                render={({ field }) => (
                  <ColorPicker
                    label="A nettoyer"
                    description="Table a debarrasser et nettoyer"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.couleurTableNettoyer?.message}
                  />
                )}
              />
            </Flex>

            {/* Apercu des couleurs */}
            <Box
              style={{
                backgroundColor: "var(--gray-a2)",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <Text size="2" weight="medium" mb="3">
                Apercu :
              </Text>
              <Flex gap="3" wrap="wrap">
                {[
                  { color: couleurLibre, label: "Libre" },
                  { color: couleurOccupee, label: "Occupee" },
                  { color: couleurPrepa, label: "Prepa" },
                  { color: couleurAddition, label: "Addition" },
                  { color: couleurNettoyer, label: "Nettoyer" },
                ].map((item) => (
                  <Flex key={item.label} direction="column" align="center" gap="1">
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        backgroundColor: item.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: 12,
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      T1
                    </Box>
                    <Text size="1" color="gray">
                      {item.label}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
          </Flex>
        </Card>

        {/* Affichage des tables */}
        <Card size="3">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Eye size={20} style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Affichage des tables
              </Text>
            </Flex>

            <Controller
              name="affichageTable"
              control={control}
              render={({ field }) => (
                <Box>
                  <Text as="label" size="2" weight="medium" mb="2">
                    Information affichee sur les tables
                  </Text>
                  <Select.Root value={field.value} onValueChange={field.onChange}>
                    <Select.Trigger style={{ width: "100%" }} />
                    <Select.Content>
                      {affichageTableOptions.map((option) => (
                        <Select.Item key={option.value} value={option.value}>
                          {option.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>
              )}
            />
          </Flex>
        </Card>

        {/* Grille d'alignement */}
        <Card size="3">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Grid3X3 size={20} style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Grille d'alignement
              </Text>
            </Flex>

            <Controller
              name="grilleActivee"
              control={control}
              render={({ field }) => (
                <Flex align="center" justify="between">
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">
                      Activer la grille
                    </Text>
                    <Text size="1" color="gray">
                      Aide a aligner les tables lors de l'edition du plan
                    </Text>
                  </Flex>
                  <Switch
                    size="3"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Flex>
              )}
            />

            {grilleActivee ? <Controller
                name="tailleGrille"
                control={control}
                render={({ field }) => (
                  <Box>
                    <Text as="label" size="2" weight="medium" mb="2">
                      Taille de la grille
                    </Text>
                    <Select.Root
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <Select.Trigger style={{ width: "200px" }} />
                      <Select.Content>
                        {tailleGrilleOptions.map((option) => (
                          <Select.Item key={option.value} value={String(option.value)}>
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    <Text size="1" color="gray" mt="1">
                      Espacement entre les points de la grille
                    </Text>
                  </Box>
                )}
              /> : null}
          </Flex>
        </Card>

        {/* Bouton de sauvegarde */}
        <Flex justify="end" gap="3" align="center">
          {saveStatus === "success" && (
            <Flex align="center" gap="2">
              <CheckCircle2 size={16} className="text-green-500" />
              <Text size="2" color="green">
                Enregistre
              </Text>
            </Flex>
          )}
          {saveStatus === "error" && (
            <Flex align="center" gap="2">
              <AlertCircle size={16} className="text-red-500" />
              <Text size="2" color="red">
                Erreur d'enregistrement
              </Text>
            </Flex>
          )}
          <Button type="submit" size="3" disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Enregistrer les parametres du plan
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
