"use client";

/**
 * DataSettings - Gestion des donnees (import/export, remise a zero)
 */

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Flex,
  Text,
  TextField,
  Button,
  Callout,
  Checkbox,
  AlertDialog,
  Badge,
  Separator,
} from "@radix-ui/themes";
import {
  Database,
  Warning,
  Trash,
  Table as TableIcon,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  DownloadSimple,
  UploadSimple,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { resetData, getDataStatistics } from "@/actions/parametres";
import {
  resetDataOptionsSchema,
  resetDataCategories,
  type ResetDataOptions,
} from "@/schemas/parametres.schema";
import { CSVImportExport } from "./csv-import-export";
import { BackupSettings } from "./backup-settings";
import type { BackupRecord } from "@/schemas/backup.schema";

interface DataSettingsProps {
  initialStats?: Record<string, number>;
  initialBackups?: BackupRecord[];
  initialBackupStats?: Record<string, number>;
}

export function DataSettings({
  initialStats,
  initialBackups,
  initialBackupStats,
}: DataSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>(initialStats || {});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetStatus, setResetStatus] = useState<"idle" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm<ResetDataOptions>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(resetDataOptionsSchema) as any,
    defaultValues: {
      ventes: false,
      clients: false,
      produits: false,
      stocks: false,
      tables: false,
      imprimantes: false,
      utilisateurs: false,
      auditLogs: false,
      confirmationText: "" as unknown as "CONFIRMER LA SUPPRESSION",
    },
  });

  // Observer les valeurs pour activer/desactiver le bouton
  const watchedValues = watch();
  const confirmationText = watch("confirmationText");
  const hasSelectedCategory =
    watchedValues.ventes ||
    watchedValues.clients ||
    watchedValues.produits ||
    watchedValues.stocks ||
    watchedValues.tables ||
    watchedValues.imprimantes ||
    watchedValues.utilisateurs ||
    watchedValues.auditLogs;
  const isConfirmationValid = confirmationText === "CONFIRMER LA SUPPRESSION";
  const canSubmit = hasSelectedCategory && isConfirmationValid && !isLoading;

  // Charger les statistiques au montage uniquement si pas de données initiales
  useEffect(() => {
    if (!initialStats || Object.keys(initialStats).length === 0) loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const result = await getDataStatistics();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch {
      console.error("Erreur chargement stats");
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Calculer le nombre d'enregistrements pour chaque categorie
  const getCategoryCount = (key: string): number => {
    const category = resetDataCategories.find((c) => c.key === key);
    if (!category) return 0;

    return category.tables.reduce((sum, table) => {
      return sum + (stats[table] || 0);
    }, 0);
  };

  const onSubmit = async (data: ResetDataOptions) => {
    setIsLoading(true);
    setResetStatus("idle");

    try {
      const result = await resetData(data);

      if (result.success) {
        setResetStatus("success");
        toast.success("Donnees supprimees avec succes", {
          description: `Operation effectuee a ${new Date().toLocaleTimeString()}`,
        });
        setDialogOpen(false);
        reset();
        // Recharger les stats
        await loadStats();
        setTimeout(() => setResetStatus("idle"), 5000);
      } else {
        setResetStatus("error");
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch {
      setResetStatus("error");
      toast.error("Erreur lors de la suppression des donnees");
    } finally {
      setIsLoading(false);
    }
  };

  // Liste des categories selectionnees pour l'affichage dans la confirmation
  const getSelectedCategoriesText = (): string => {
    const selected: string[] = [];
    if (watchedValues.ventes) selected.push("Ventes et paiements");
    if (watchedValues.clients) selected.push("Clients");
    if (watchedValues.produits) selected.push("Produits et categories");
    if (watchedValues.stocks) selected.push("Mouvements de stock");
    if (watchedValues.tables) selected.push("Tables et zones");
    if (watchedValues.imprimantes) selected.push("Imprimantes");
    if (watchedValues.utilisateurs) selected.push("Utilisateurs");
    if (watchedValues.auditLogs) selected.push("Logs d'audit");
    return selected.join(", ");
  };

  return (
    <Flex direction="column" gap="5">
      {/* Section Sauvegardes */}
      <BackupSettings initialBackups={initialBackups} initialStats={initialBackupStats} />

      <Separator size="4" />

      {/* Section Import/Export CSV */}
      <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
        <Flex direction="column" gap="4">
          <Flex align="center" gap="2">
            <TableIcon size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
            <Text size="4" weight="bold">
              Import / Export de donnees
            </Text>
          </Flex>

          <Callout.Root color="blue" size="2">
            <Callout.Icon>
              <DownloadSimple size={16} />
            </Callout.Icon>
            <Callout.Text>
              Exportez vos donnees au format CSV pour les sauvegarder ou les utiliser dans un
              tableur. Importez des donnees depuis un fichier CSV pour mettre a jour votre base.
            </Callout.Text>
          </Callout.Root>

          <CSVImportExport />
        </Flex>
      </Box>

      <Separator size="4" />

      {/* Section Remise a zero */}
      <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
        <Flex direction="column" gap="4">
          <Flex align="center" justify="between">
            <Flex align="center" gap="2">
              <Database size={20} weight="duotone" style={{ color: "var(--red-9)" }} />
              <Text size="4" weight="bold" color="red">
                Remise a zero des donnees
              </Text>
            </Flex>
            <Button variant="ghost" size="1" onClick={loadStats} disabled={isLoadingStats}>
              {isLoadingStats ? (
                <CircleNotch size={14} className="animate-spin" />
              ) : (
                <ArrowsClockwise size={14} />
              )}
              Actualiser
            </Button>
          </Flex>

          {/* Avertissement */}
          <Callout.Root color="red" size="2">
            <Callout.Icon>
              <Warning size={18} />
            </Callout.Icon>
            <Callout.Text>
              <Text weight="bold">ATTENTION : Action irréversible !</Text>
              <br />
              Cette operation supprime definitivement les donnees selectionnees. Les parametres de
              l'etablissement (nom, adresse, TVA, etc.) seront conserves. Cette action est reservee
              aux administrateurs.
            </Callout.Text>
          </Callout.Root>

          {/* Categories de donnees */}
          <Box>
            <Text size="2" weight="medium" mb="3">
              Selectionnez les categories de donnees a supprimer :
            </Text>

            <Flex direction="column" gap="3">
              {resetDataCategories.map((category) => {
                const count = getCategoryCount(category.key);
                return (
                  <Controller
                    key={category.key}
                    name={category.key as keyof ResetDataOptions}
                    control={control}
                    render={({ field }) => (
                      <Flex
                        align="center"
                        justify="between"
                        p="3"
                        style={{
                          backgroundColor: field.value ? "var(--red-a3)" : "var(--gray-a2)",
                          borderRadius: "var(--radius-2)",
                          border: field.value ? "1px solid var(--red-6)" : "1px solid transparent",
                          transition: "all 0.2s",
                        }}
                      >
                        <Flex align="center" gap="3">
                          <Checkbox
                            checked={field.value as boolean}
                            onCheckedChange={(checked) => field.onChange(checked)}
                            color="red"
                          />
                          <Box>
                            <Text size="2" weight="medium">
                              {category.label}
                            </Text>
                            <Text size="1" color="gray">
                              {category.description}
                            </Text>
                          </Box>
                        </Flex>
                        <Badge color={count > 0 ? "amber" : "gray"} variant="soft" size="1">
                          {isLoadingStats
                            ? "..."
                            : `${count} enregistrement${count > 1 ? "s" : ""}`}
                        </Badge>
                      </Flex>
                    )}
                  />
                );
              })}
            </Flex>
          </Box>

          {/* Zone de confirmation */}
          <Box
            mt="4"
            p="4"
            style={{
              backgroundColor: "var(--gray-a2)",
              borderRadius: "var(--radius-3)",
              border: "1px solid var(--gray-6)",
            }}
          >
            <Text size="2" weight="medium" mb="2">
              Confirmation de securite
            </Text>
            <Text size="1" color="gray" mb="3">
              Pour confirmer la suppression, tapez exactement :{" "}
              <Text weight="bold" color="red">
                CONFIRMER LA SUPPRESSION
              </Text>
            </Text>
            <TextField.Root
              {...register("confirmationText")}
              placeholder="Tapez le texte de confirmation..."
              size="3"
              color={isConfirmationValid ? "green" : undefined}
            />
            {errors.confirmationText ? (
              <Text size="1" color="red" mt="1">
                {errors.confirmationText.message}
              </Text>
            ) : null}
            {isConfirmationValid ? (
              <Flex align="center" gap="1" mt="2">
                <CheckCircle size={14} style={{ color: "var(--green-9)" }} />
                <Text size="1" color="green">
                  Confirmation valide
                </Text>
              </Flex>
            ) : null}
          </Box>

          {/* Bouton de remise a zero */}
          <Flex justify="end" gap="3" align="center" mt="2">
            {resetStatus === "success" && (
              <Flex align="center" gap="2">
                <CheckCircle size={16} style={{ color: "var(--green-9)" }} />
                <Text size="2" color="green">
                  Donnees supprimees
                </Text>
              </Flex>
            )}
            {resetStatus === "error" && (
              <Flex align="center" gap="2">
                <WarningCircle size={16} style={{ color: "var(--red-9)" }} />
                <Text size="2" color="red">
                  Erreur de suppression
                </Text>
              </Flex>
            )}

            <AlertDialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
              <AlertDialog.Trigger>
                <Button color="red" size="3" disabled={!canSubmit}>
                  <Trash size={16} />
                  Remettre a zero
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Content maxWidth="500px">
                <AlertDialog.Title>
                  <Flex align="center" gap="2">
                    <Warning size={20} style={{ color: "var(--red-9)" }} />
                    Confirmer la suppression
                  </Flex>
                </AlertDialog.Title>
                <AlertDialog.Description size="2">
                  Vous etes sur le point de supprimer definitivement les donnees suivantes :
                </AlertDialog.Description>

                <Flex direction="column" gap="3" mt="3">
                  <Box
                    p="3"
                    style={{
                      backgroundColor: "var(--red-a3)",
                      borderRadius: "var(--radius-2)",
                    }}
                  >
                    <Text size="2" weight="medium" color="red">
                      {getSelectedCategoriesText()}
                    </Text>
                  </Box>
                  <Callout.Root color="red" size="1">
                    <Callout.Icon>
                      <Warning size={14} />
                    </Callout.Icon>
                    <Callout.Text size="1">
                      Cette action est IRREVERSIBLE. Les donnees supprimees ne pourront pas etre
                      recuperees.
                    </Callout.Text>
                  </Callout.Root>
                </Flex>

                <Flex gap="3" mt="4" justify="end">
                  <AlertDialog.Cancel>
                    <Button variant="soft" color="gray">
                      Annuler
                    </Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action>
                    <Button color="red" onClick={handleSubmit(onSubmit)} disabled={isLoading}>
                      {isLoading ? (
                        <CircleNotch size={16} className="animate-spin" />
                      ) : (
                        <Trash size={16} />
                      )}
                      Supprimer definitivement
                    </Button>
                  </AlertDialog.Action>
                </Flex>
              </AlertDialog.Content>
            </AlertDialog.Root>
          </Flex>
        </Flex>
      </Box>
    </Flex>
  );
}
