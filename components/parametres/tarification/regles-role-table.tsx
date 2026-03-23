"use client";

import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Flex,
  Text,
  Table,
  Switch,
  TextField,
  Button,
  Badge,
  Callout,
  Tooltip,
  IconButton,
} from "@radix-ui/themes";
import {
  Shield,
  UserCircle,
  CurrencyDollar,
  FloppyDisk,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  ArrowCounterClockwise,
  Info,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { saveReglesTarification } from "@/actions/tarification";
import {
  saveReglesSchema,
  ROLES_DEFAUT_REMISE,
  ROLES,
  type RegleTarification,
} from "@/schemas/tarification.schema";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  CAISSIER: "Caissier",
  SERVEUR: "Serveur",
};

const ROLE_COLORS: Record<string, "red" | "orange" | "blue" | "green" | "gray"> = {
  SUPER_ADMIN: "red",
  ADMIN: "orange",
  MANAGER: "blue",
  CAISSIER: "green",
  SERVEUR: "gray",
};

interface ReglesRoleTableProps {
  initialRegles: RegleTarification[];
}

export function ReglesRoleTable({ initialRegles }: ReglesRoleTableProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const defaultRegles: RegleTarification[] = ROLES.map((role) => {
    const existing = initialRegles.find((r) => r.role === role);
    if (existing) return existing;
    return {
      role,
      remiseMaxPourcent: ROLES_DEFAUT_REMISE[role] ?? 0,
      peutModifierPrix: role === "SUPER_ADMIN" || role === "ADMIN",
      peutAppliquerRemise: role !== "SERVEUR",
      plafondRemiseTransaction: 0,
      necessiteApprobationAuDela: null,
    };
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(saveReglesSchema) as any,
    defaultValues: {
      regles: defaultRegles,
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "regles",
  });

  const handleReset = () => {
    const defaults: RegleTarification[] = ROLES.map((role) => ({
      role,
      remiseMaxPourcent: ROLES_DEFAUT_REMISE[role] ?? 0,
      peutModifierPrix: role === "SUPER_ADMIN" || role === "ADMIN",
      peutAppliquerRemise: role !== "SERVEUR",
      plafondRemiseTransaction: 0,
      necessiteApprobationAuDela: null,
    }));
    reset({ regles: defaults });
    toast.info("Valeurs par defaut restaurees");
  };

  const onSubmit = async (data: { regles: RegleTarification[] }) => {
    setIsLoading(true);
    setSaveStatus("idle");

    try {
      const result = await saveReglesTarification(data);

      if (result.success) {
        setSaveStatus("success");
        toast.success("Regles de tarification enregistrees");
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
      <Flex direction="column" gap="4">
        <Callout.Root color="blue" size="2">
          <Callout.Icon>
            <Info size={18} weight="regular" />
          </Callout.Icon>
          <Callout.Text>
            Configurez les permissions de remise et de modification de prix pour chaque role.
            Un plafond a 0 FCFA signifie illimite. Le champ &quot;Approbation au-dela de&quot;
            definit le seuil a partir duquel une approbation manageriale est requise.
          </Callout.Text>
        </Callout.Root>

        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Shield size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Regles par role
              </Text>
            </Flex>

            <Box style={{ overflowX: "auto" }}>
              <Table.Root variant="surface" size="2">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>
                      <Flex align="center" gap="1">
                        <UserCircle size={16} />
                        Role
                      </Flex>
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Remise max (%)</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Modifier prix</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Appliquer remise</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      <Flex align="center" gap="1">
                        <CurrencyDollar size={16} />
                        Plafond (FCFA)
                      </Flex>
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      <Tooltip content="Pourcentage de remise au-dela duquel une approbation est requise">
                        <Flex align="center" gap="1" style={{ cursor: "help" }}>
                          Approbation au-dela (%)
                          <Info size={14} />
                        </Flex>
                      </Tooltip>
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {fields.map((field, index) => (
                    <Table.Row key={field.id}>
                      <Table.RowHeaderCell>
                        <Badge color={ROLE_COLORS[field.role]} size="2" variant="soft">
                          {ROLE_LABELS[field.role] || field.role}
                        </Badge>
                      </Table.RowHeaderCell>

                      <Table.Cell>
                        <Controller
                          name={`regles.${index}.remiseMaxPourcent`}
                          control={control}
                          render={({ field: f }) => (
                            <TextField.Root
                              type="number"
                              min="0"
                              max="100"
                              size="2"
                              style={{ width: 80 }}
                              value={String(f.value)}
                              onChange={(e) => f.onChange(Number(e.target.value))}
                            />
                          )}
                        />
                      </Table.Cell>

                      <Table.Cell>
                        <Controller
                          name={`regles.${index}.peutModifierPrix`}
                          control={control}
                          render={({ field: f }) => (
                            <Switch
                              size="2"
                              checked={f.value}
                              onCheckedChange={f.onChange}
                            />
                          )}
                        />
                      </Table.Cell>

                      <Table.Cell>
                        <Controller
                          name={`regles.${index}.peutAppliquerRemise`}
                          control={control}
                          render={({ field: f }) => (
                            <Switch
                              size="2"
                              checked={f.value}
                              onCheckedChange={f.onChange}
                            />
                          )}
                        />
                      </Table.Cell>

                      <Table.Cell>
                        <Controller
                          name={`regles.${index}.plafondRemiseTransaction`}
                          control={control}
                          render={({ field: f }) => (
                            <TextField.Root
                              type="number"
                              min="0"
                              size="2"
                              style={{ width: 120 }}
                              value={String(f.value)}
                              onChange={(e) => f.onChange(Number(e.target.value))}
                              placeholder="0 = illimite"
                            />
                          )}
                        />
                      </Table.Cell>

                      <Table.Cell>
                        <Controller
                          name={`regles.${index}.necessiteApprobationAuDela`}
                          control={control}
                          render={({ field: f }) => (
                            <TextField.Root
                              type="number"
                              min="0"
                              max="100"
                              size="2"
                              style={{ width: 80 }}
                              value={f.value === null ? "" : String(f.value)}
                              onChange={(e) =>
                                f.onChange(
                                  e.target.value === "" ? null : Number(e.target.value)
                                )
                              }
                              placeholder="--"
                            />
                          )}
                        />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>

            {errors.regles ? <Text size="1" color="red">
                Veuillez verifier les valeurs saisies
              </Text> : null}
          </Flex>
        </Box>

        <Flex justify="between" align="center">
          <Button
            type="button"
            variant="soft"
            color="gray"
            size="2"
            onClick={handleReset}
          >
            <ArrowCounterClockwise size={16} />
            Reinitialiser par defaut
          </Button>

          <Flex gap="3" align="center">
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
              Enregistrer les regles
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </form>
  );
}
