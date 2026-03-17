"use client";

/**
 * BackupSettings - Composant pour la gestion des sauvegardes
 */

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Card,
  Flex,
  Text,
  TextField,
  Button,
  Callout,
  Checkbox,
  Select,
  Badge,
  Table,
  IconButton,
  Progress,
  Tooltip,
} from "@radix-ui/themes";
import {
  HardDrive,
  Download,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileJson,
  Archive,
  RefreshCw,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import {
  createBackup,
  listBackups,
  downloadBackup,
  deleteBackup,
  getBackupStats,
} from "@/actions/backup";
import {
  createBackupSchema,
  backupCategories,
  backupTypeOptions,
  type CreateBackupInput,
  type BackupRecord,
} from "@/schemas/backup.schema";

interface BackupSettingsProps {
  initialBackups?: BackupRecord[];
  initialStats?: Record<string, number>;
}

export function BackupSettings({ initialBackups = [], initialStats = {} }: BackupSettingsProps) {
  const [backups, setBackups] = useState<BackupRecord[]>(initialBackups);
  const [stats, setStats] = useState<Record<string, number>>(initialStats);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateBackupInput>({
    // @ts-expect-error - Type mismatch between zod input/output due to .default()
    resolver: zodResolver(createBackupSchema),
    defaultValues: {
      nom: "",
      type: "full",
      categories: [],
      format: "json",
    },
  });

  const selectedType = watch("type");
  const selectedCategories = watch("categories");

  // Charger les backups et stats au montage
  useEffect(() => {
    loadBackups();
    loadStats();
  }, []);

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const result = await listBackups();
      if (result.success && result.data) {
        setBackups(result.data);
      }
    } catch (error) {
      console.error("Erreur chargement backups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const result = await getBackupStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Calculer le nombre d'enregistrements pour une categorie
  const getCategoryCount = (categoryKey: string): number => {
    const category = backupCategories.find((c) => c.key === categoryKey);
    if (!category) return 0;
    return category.tables.reduce((sum, table) => sum + (stats[table] || 0), 0);
  };

  // Calculer le total selectionne
  const getTotalSelectedRecords = (): number => {
    if (selectedType === "full") {
      return backupCategories.reduce((sum, cat) => sum + getCategoryCount(cat.key), 0);
    }
    return selectedCategories.reduce((sum, key) => sum + getCategoryCount(key), 0);
  };

  // Creer une sauvegarde
  const onSubmit = async (data: CreateBackupInput) => {
    setIsCreating(true);
    setProgress(10);

    try {
      // Simuler progression
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const result = await createBackup(data);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.data) {
        toast.success("Sauvegarde creee avec succes", {
          description: `${result.data.recordCount} enregistrements sauvegardes`,
        });

        // Telecharger automatiquement si URL disponible
        if (result.data.downloadUrl) {
          window.open(result.data.downloadUrl, "_blank");
        }

        reset();
        await loadBackups();
      } else {
        toast.error(result.error || "Erreur lors de la creation");
      }
    } catch (error) {
      console.error("Erreur creation backup:", error);
      toast.error("Erreur lors de la creation de la sauvegarde");
    } finally {
      setIsCreating(false);
      setProgress(0);
    }
  };

  // Telecharger une sauvegarde
  const handleDownload = async (backupId: string) => {
    setDownloadingId(backupId);
    try {
      const result = await downloadBackup(backupId);
      if (result.success && result.data?.downloadUrl) {
        window.open(result.data.downloadUrl, "_blank");
        toast.success("Telechargement demarre");
      } else {
        toast.error(result.error || "Erreur lors du telechargement");
      }
    } catch (error) {
      console.error("Erreur telechargement:", error);
      toast.error("Erreur lors du telechargement");
    } finally {
      setDownloadingId(null);
    }
  };

  // Supprimer une sauvegarde
  const handleDelete = async (backupId: string) => {
    if (!confirm("Etes-vous sur de vouloir supprimer cette sauvegarde ?")) {
      return;
    }

    setDeletingId(backupId);
    try {
      const result = await deleteBackup(backupId);
      if (result.success) {
        toast.success("Sauvegarde supprimee");
        await loadBackups();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Formater la date
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Badge de statut
  const StatusBadge = ({ status }: { status: BackupRecord["status"] }) => {
    const config = {
      pending: { color: "gray" as const, label: "En attente" },
      in_progress: { color: "blue" as const, label: "En cours" },
      completed: { color: "green" as const, label: "Termine" },
      failed: { color: "red" as const, label: "Echoue" },
    };
    const { color, label } = config[status] || config.pending;
    return <Badge color={color} variant="soft">{label}</Badge>;
  };

  return (
    <Flex direction="column" gap="5">
      {/* Section: Creer une sauvegarde */}
      <Card size="3">
        {/* @ts-expect-error - Type mismatch with zod default values */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            <Flex align="center" justify="between">
              <Flex align="center" gap="2">
                <Plus size={20} style={{ color: "var(--accent-9)" }} />
                <Text size="4" weight="bold">
                  Creer une sauvegarde
                </Text>
              </Flex>
              <Button
                type="button"
                variant="ghost"
                size="1"
                onClick={loadStats}
                disabled={isLoadingStats}
              >
                {isLoadingStats ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                Actualiser
              </Button>
            </Flex>

            <Callout.Root color="blue" size="2">
              <Callout.Icon>
                <Info size={16} />
              </Callout.Icon>
              <Callout.Text>
                Creez une sauvegarde de vos donnees pour les conserver en securite.
                Les fichiers sont stockes dans un format JSON compatible avec la restauration.
              </Callout.Text>
            </Callout.Root>

            {/* Nom de la sauvegarde */}
            <Box>
              <Text as="label" size="2" weight="medium">
                Nom de la sauvegarde *
              </Text>
              <Box mt="2">
                <TextField.Root
                  {...register("nom")}
                  placeholder="Ex: Sauvegarde mensuelle janvier 2026"
                  size="3"
                />
              </Box>
              {errors.nom ? <Text size="1" color="red" mt="1">
                  {errors.nom.message}
                </Text> : null}
            </Box>

            {/* Type de sauvegarde */}
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Box>
                  <Text as="label" size="2" weight="medium">
                    Type de sauvegarde
                  </Text>
                  <Box mt="2">
                    <Select.Root value={field.value} onValueChange={field.onChange}>
                      <Select.Trigger style={{ width: "100%" }} />
                      <Select.Content>
                        {backupTypeOptions.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </Box>
                  <Text size="1" color="gray" mt="1">
                    {field.value === "full"
                      ? "Toutes les categories de donnees seront sauvegardees"
                      : "Selectionnez les categories a sauvegarder ci-dessous"}
                  </Text>
                </Box>
              )}
            />

            {/* Categories (visible seulement si partial) */}
            {selectedType === "partial" && (
              <Box>
                <Text as="label" size="2" weight="medium" mb="3">
                  Categories a sauvegarder *
                </Text>
                <Controller
                  name="categories"
                  control={control}
                  render={({ field }) => (
                    <Flex direction="column" gap="2">
                      {backupCategories.map((category) => {
                        const count = getCategoryCount(category.key);
                        const isChecked = field.value.includes(category.key);
                        return (
                          <Flex
                            key={category.key}
                            align="center"
                            justify="between"
                            p="3"
                            style={{
                              backgroundColor: isChecked ? "var(--accent-a3)" : "var(--gray-a2)",
                              borderRadius: "var(--radius-2)",
                              border: isChecked ? "1px solid var(--accent-6)" : "1px solid transparent",
                            }}
                          >
                            <Flex align="center" gap="3">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, category.key]);
                                  } else {
                                    field.onChange(field.value.filter((k) => k !== category.key));
                                  }
                                }}
                              />
                              <Box>
                                <Text size="2" weight="medium">{category.label}</Text>
                                <Text size="1" color="gray">{category.description}</Text>
                              </Box>
                            </Flex>
                            <Badge color={count > 0 ? "blue" : "gray"} variant="soft" size="1">
                              {count} enregistrements
                            </Badge>
                          </Flex>
                        );
                      })}
                    </Flex>
                  )}
                />
                {errors.categories ? <Text size="1" color="red" mt="2">
                    {errors.categories.message}
                  </Text> : null}
              </Box>
            )}

            {/* Resume */}
            <Box
              p="4"
              mt="2"
              style={{
                backgroundColor: "var(--accent-a2)",
                borderRadius: "var(--radius-3)",
                border: "1px solid var(--accent-6)",
              }}
            >
              <Flex align="center" justify="between">
                <Flex align="center" gap="2">
                  <Archive size={18} style={{ color: "var(--accent-9)" }} />
                  <Text size="2" weight="medium">
                    Total a sauvegarder:
                  </Text>
                </Flex>
                <Text size="3" weight="bold" color="violet">
                  {getTotalSelectedRecords().toLocaleString()} enregistrements
                </Text>
              </Flex>
            </Box>

            {/* Barre de progression */}
            {isCreating ? <Box>
                <Progress value={progress} size="2" />
                <Text size="1" color="gray" mt="1">
                  Creation de la sauvegarde en cours...
                </Text>
              </Box> : null}

            {/* Bouton de creation */}
            <Flex justify="end">
              <Button
                type="submit"
                size="3"
                disabled={isCreating || (selectedType === "partial" && selectedCategories.length === 0)}
              >
                {isCreating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Archive size={16} />
                )}
                Creer la sauvegarde
              </Button>
            </Flex>
          </Flex>
        </form>
      </Card>

      {/* Section: Liste des sauvegardes */}
      <Card size="3">
        <Flex direction="column" gap="4">
          <Flex align="center" justify="between">
            <Flex align="center" gap="2">
              <HardDrive size={20} style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Sauvegardes existantes
              </Text>
              <Badge color="gray" variant="soft" size="1">
                {backups.length}
              </Badge>
            </Flex>
            <Button variant="ghost" size="1" onClick={loadBackups} disabled={isLoading}>
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Actualiser
            </Button>
          </Flex>

          {backups.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              py="6"
              style={{ backgroundColor: "var(--gray-a2)", borderRadius: "var(--radius-2)" }}
            >
              <Archive size={40} style={{ color: "var(--gray-8)", marginBottom: 12 }} />
              <Text size="3" color="gray">
                Aucune sauvegarde
              </Text>
              <Text size="2" color="gray">
                Creez votre premiere sauvegarde ci-dessus
              </Text>
            </Flex>
          ) : (
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Nom</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Taille</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {backups.map((backup) => (
                  <Table.Row key={backup.id}>
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        <FileJson size={16} style={{ color: "var(--gray-9)" }} />
                        <Box>
                          <Text size="2" weight="medium">{backup.nom}</Text>
                          {backup.record_count !== null && (
                            <Text size="1" color="gray">
                              {backup.record_count.toLocaleString()} enregistrements
                            </Text>
                          )}
                        </Box>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex align="center" gap="1">
                        <Clock size={12} style={{ color: "var(--gray-9)" }} />
                        <Text size="2">{formatDate(backup.created_at)}</Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant="soft" size="1">
                        {backup.type === "full" ? "Complet" : "Partiel"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2">{formatFileSize(backup.file_size)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <StatusBadge status={backup.status} />
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="2">
                        <Tooltip content="Telecharger">
                          <IconButton
                            variant="ghost"
                            size="1"
                            onClick={() => handleDownload(backup.id)}
                            disabled={backup.status !== "completed" || downloadingId === backup.id}
                          >
                            {downloadingId === backup.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Download size={14} />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip content="Supprimer">
                          <IconButton
                            variant="ghost"
                            size="1"
                            color="red"
                            onClick={() => handleDelete(backup.id)}
                            disabled={deletingId === backup.id}
                          >
                            {deletingId === backup.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Flex>
      </Card>
    </Flex>
  );
}
