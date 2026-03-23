"use client";

/**
 * EcransSettings - Gestion des ecrans d'affichage (cuisine, bar, personnalise)
 * Permet de configurer les ecrans distants avec tokens d'acces, QR codes, etc.
 */

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Flex,
  Text,
  TextField,
  Select,
  Switch,
  Button,
  Dialog,
  Card,
  Badge,
  IconButton,
  Heading,
  Separator,
  Tooltip,
  AlertDialog,
} from "@radix-ui/themes";
import {
  Monitor,
  Plus,
  Trash,
  Copy,
  QrCode,
  ArrowsClockwise,
  Timer,
  SpeakerHigh,
  SpeakerSlash,
  Clock,
  CircleNotch,
  Link as LinkIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  ecranSchema,
  typeEcranOptions,
  type EcranFormData,
  type EcranFormInput,
} from "@/schemas/ecran.schema";
import {
  createEcran,
  deleteEcran,
  regenererToken,
  prolongerToken,
  type EcranAffichage,
} from "@/actions/ecrans";

// ============================================================================
// TYPES
// ============================================================================

interface Categorie {
  id: string;
  nom: string;
  couleur: string;
}

interface EcransSettingsProps {
  initialEcrans: EcranAffichage[];
  initialCategories?: Categorie[];
}

// ============================================================================
// HELPERS
// ============================================================================

function getExpirationStatus(expiresAt: string): {
  label: string;
  color: "green" | "orange" | "red";
  expired: boolean;
} {
  const now = new Date();
  const expDate = new Date(expiresAt);
  const diffMs = expDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffMs <= 0) {
    return { label: "Expire", color: "red", expired: true };
  }
  if (diffDays < 3) {
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    return {
      label: hours < 24 ? `${hours}h restantes` : `${Math.floor(diffDays)}j restants`,
      color: "orange",
      expired: false,
    };
  }
  return {
    label: `${Math.floor(diffDays)}j restants`,
    color: "green",
    expired: false,
  };
}

function getTypeBadgeColor(type: string): "blue" | "purple" | "orange" {
  switch (type) {
    case "CUISINE":
      return "blue";
    case "BAR":
      return "purple";
    case "PERSONNALISE":
      return "orange";
    default:
      return "blue";
  }
}

function getDisplayUrl(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/display/${token}`;
  }
  return `/display/${token}`;
}

// ============================================================================
// QR CODE DISPLAY
// ============================================================================

function QrCodeCanvas({ url }: { url: string }) {
  return (
    <Flex direction="column" align="center" gap="3">
      <Box
        style={{
          border: "2px solid var(--gray-a6)",
          borderRadius: 8,
          padding: 12,
          background: "white",
        }}
      >
        <QRCodeSVG value={url} size={200} level="M" />
      </Box>
      <Text size="1" color="gray" align="center" style={{ maxWidth: 280, wordBreak: "break-all" }}>
        {url}
      </Text>
    </Flex>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function EcransSettings({ initialEcrans, initialCategories = [] }: EcransSettingsProps) {
  const [ecrans, setEcrans] = useState<EcranAffichage[]>(initialEcrans);
  const [categories] = useState<Categorie[]>(initialCategories);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [selectedEcranForQr, setSelectedEcranForQr] = useState<EcranAffichage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [prolongingId, setProlongingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [regenConfirmId, setRegenConfirmId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<EcranFormInput, unknown, EcranFormData>({
    resolver: zodResolver(ecranSchema),
    defaultValues: {
      nom: "",
      type: "CUISINE",
      categories: [],
      son_actif: true,
      delai_urgence_minutes: 15,
    },
  });

  const selectedType = watch("type");

  // ------ CREATE ------
  const openCreateDialog = () => {
    reset({
      nom: "",
      type: "CUISINE",
      categories: [],
      son_actif: true,
      delai_urgence_minutes: 15,
    });
    setIsCreateDialogOpen(true);
  };

  const onSubmitCreate = async (data: EcranFormData) => {
    setIsLoading(true);
    try {
      const result = await createEcran({
        ...data,
        categories: data.type === "PERSONNALISE" ? data.categories : null,
      });
      if (result.success) {
        setEcrans((prev) => [...prev, result.data as EcranAffichage]);
        setIsCreateDialogOpen(false);
        toast.success("Ecran cree avec succes");
        reset();
      } else {
        toast.error("error" in result ? result.error : "Erreur lors de la creation");
      }
    } catch {
      toast.error("Erreur inattendue lors de la creation");
    } finally {
      setIsLoading(false);
    }
  };

  // ------ DELETE ------
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteEcran(id);
      if (result.success) {
        setEcrans((prev) => prev.filter((e) => e.id !== id));
        toast.success("Ecran supprime");
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur inattendue");
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  // ------ REGENERATE TOKEN ------
  const handleRegenerateToken = async (id: string) => {
    setRegeneratingId(id);
    try {
      const result = await regenererToken(id);
      if (result.success) {
        setEcrans((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  token: (result.data as EcranAffichage).token,
                  token_expires_at: (result.data as EcranAffichage).token_expires_at,
                }
              : e
          )
        );
        toast.success("Token regenere avec succes");
      } else {
        toast.error("error" in result ? result.error : "Erreur lors de la regeneration");
      }
    } catch {
      toast.error("Erreur inattendue");
    } finally {
      setRegeneratingId(null);
      setRegenConfirmId(null);
    }
  };

  // ------ EXTEND TOKEN ------
  const handleProlongerToken = async (id: string) => {
    setProlongingId(id);
    try {
      const result = await prolongerToken(id);
      if (result.success) {
        setEcrans((prev) =>
          prev.map((e) =>
            e.id === id
              ? { ...e, token_expires_at: (result.data as EcranAffichage).token_expires_at }
              : e
          )
        );
        toast.success("Token prolonge de 7 jours");
      } else {
        toast.error("error" in result ? result.error : "Erreur lors de la prolongation");
      }
    } catch {
      toast.error("Erreur inattendue");
    } finally {
      setProlongingId(null);
    }
  };

  // ------ COPY URL ------
  const handleCopyUrl = useCallback(async (token: string) => {
    const url = getDisplayUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copiee dans le presse-papiers");
    } catch {
      toast.error("Impossible de copier l'URL");
    }
  }, []);

  // ------ QR CODE ------
  const openQrDialog = (ecran: EcranAffichage) => {
    setSelectedEcranForQr(ecran);
    setIsQrDialogOpen(true);
  };

  // ------ RENDER ------
  return (
    <Box>
      <Flex direction="column" gap="4">
        {/* Header */}
        <Flex justify="between" align="center" wrap="wrap" gap="3">
          <Box>
            <Heading size="4">Ecrans d&apos;affichage</Heading>
            <Text size="2" color="gray">
              Configurez les ecrans de cuisine, bar ou personnalises pour afficher les commandes en temps reel.
            </Text>
          </Box>
          <Button onClick={openCreateDialog}>
            <Plus size={16} />
            Ajouter un ecran
          </Button>
        </Flex>

        <Separator size="4" />

        {/* Liste des ecrans */}
        {ecrans.length === 0 ? (
          <Card size="3">
            <Flex direction="column" align="center" gap="3" py="6">
              <Monitor size={48} weight="light" style={{ color: "var(--gray-8)" }} />
              <Text size="3" color="gray" align="center">
                Aucun ecran configure
              </Text>
              <Text size="2" color="gray" align="center">
                Ajoutez un ecran pour afficher les commandes en temps reel sur un moniteur dedie.
              </Text>
              <Button variant="soft" onClick={openCreateDialog}>
                <Plus size={16} />
                Ajouter un ecran
              </Button>
            </Flex>
          </Card>
        ) : (
          <Flex direction="column" gap="3">
            {ecrans.map((ecran) => {
              const expStatus = getExpirationStatus(ecran.token_expires_at);
              return (
                <Card key={ecran.id} size="2">
                  <Flex direction="column" gap="3">
                    {/* En-tete de la carte */}
                    <Flex justify="between" align="start" wrap="wrap" gap="3">
                      <Flex direction="column" gap="1">
                        <Flex align="center" gap="2">
                          <Monitor size={18} weight="bold" />
                          <Text size="3" weight="bold">
                            {ecran.nom}
                          </Text>
                          <Badge color={getTypeBadgeColor(ecran.type)} size="1">
                            {ecran.type}
                          </Badge>
                          {!ecran.actif && (
                            <Badge color="gray" size="1" variant="soft">
                              Inactif
                            </Badge>
                          )}
                        </Flex>
                        <Flex align="center" gap="2">
                          <Badge
                            color={expStatus.color}
                            size="1"
                            variant="soft"
                          >
                            <Clock size={12} />
                            {expStatus.label}
                          </Badge>
                          <Badge
                            color={ecran.son_actif ? "green" : "gray"}
                            size="1"
                            variant="soft"
                          >
                            {ecran.son_actif ? (
                              <SpeakerHigh size={12} />
                            ) : (
                              <SpeakerSlash size={12} />
                            )}
                            Son {ecran.son_actif ? "actif" : "desactive"}
                          </Badge>
                          <Badge color="gray" size="1" variant="soft">
                            <Timer size={12} />
                            Urgence : {ecran.delai_urgence_minutes} min
                          </Badge>
                        </Flex>
                      </Flex>

                      {/* Actions */}
                      <Flex gap="2" wrap="wrap">
                        <Tooltip content="Copier l'URL d'acces">
                          <IconButton
                            size="1"
                            variant="soft"
                            onClick={() => handleCopyUrl(ecran.token)}
                          >
                            <Copy size={14} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip content="Afficher le QR Code">
                          <IconButton
                            size="1"
                            variant="soft"
                            onClick={() => openQrDialog(ecran)}
                          >
                            <QrCode size={14} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip content="Regenerer le token">
                          <IconButton
                            size="1"
                            variant="soft"
                            color="orange"
                            disabled={regeneratingId === ecran.id}
                            onClick={() => setRegenConfirmId(ecran.id)}
                          >
                            {regeneratingId === ecran.id ? (
                              <CircleNotch size={14} className="animate-spin" />
                            ) : (
                              <ArrowsClockwise size={14} />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip content="Prolonger de 7 jours">
                          <IconButton
                            size="1"
                            variant="soft"
                            color="green"
                            disabled={prolongingId === ecran.id}
                            onClick={() => handleProlongerToken(ecran.id)}
                          >
                            {prolongingId === ecran.id ? (
                              <CircleNotch size={14} className="animate-spin" />
                            ) : (
                              <Timer size={14} />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip content="Supprimer">
                          <IconButton
                            size="1"
                            variant="soft"
                            color="red"
                            disabled={deletingId === ecran.id}
                            onClick={() => setDeleteConfirmId(ecran.id)}
                          >
                            {deletingId === ecran.id ? (
                              <CircleNotch size={14} className="animate-spin" />
                            ) : (
                              <Trash size={14} />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Flex>
                    </Flex>

                    {/* URL d'acces */}
                    <Flex align="center" gap="2">
                      <LinkIcon size={14} style={{ color: "var(--gray-9)", flexShrink: 0 }} />
                      <Text
                        size="1"
                        color="gray"
                        style={{
                          fontFamily: "var(--code-font-family, monospace)",
                          wordBreak: "break-all",
                        }}
                      >
                        {getDisplayUrl(ecran.token)}
                      </Text>
                    </Flex>
                  </Flex>
                </Card>
              );
            })}
          </Flex>
        )}
      </Flex>

      {/* ================================================================== */}
      {/* DIALOG : Creer un ecran */}
      {/* ================================================================== */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Content maxWidth="480px">
          <Dialog.Title>Ajouter un ecran d&apos;affichage</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Configurez un nouvel ecran pour afficher les commandes.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmitCreate)}>
            <Flex direction="column" gap="4">
              {/* Nom */}
              <Box>
                <Text as="label" size="2" weight="bold" mb="1">
                  Nom de l&apos;ecran
                </Text>
                <TextField.Root
                  placeholder="ex: Cuisine principale"
                  {...register("nom")}
                />
                {errors.nom ? <Text size="1" color="red" mt="1">
                    {errors.nom.message}
                  </Text> : null}
              </Box>

              {/* Type */}
              <Box>
                <Text as="label" size="2" weight="bold" mb="1">
                  Type
                </Text>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select.Root
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <Select.Trigger style={{ width: "100%" }} />
                      <Select.Content>
                        {typeEcranOptions.map((opt) => (
                          <Select.Item key={opt.value} value={opt.value}>
                            {opt.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  )}
                />
              </Box>

              {/* Categories (visible seulement si type = PERSONNALISE) */}
              {selectedType === "PERSONNALISE" && (
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    Categories a afficher
                  </Text>
                  <Controller
                    name="categories"
                    control={control}
                    render={({ field }) => (
                      <Flex direction="column" gap="2">
                        {categories.length === 0 ? (
                          <Text size="2" color="gray">
                            Aucune categorie disponible
                          </Text>
                        ) : (
                          <Flex gap="2" wrap="wrap">
                            {categories.map((cat) => {
                              const isSelected = (field.value || []).includes(cat.id);
                              return (
                                <Button
                                  key={cat.id}
                                  type="button"
                                  size="1"
                                  variant={isSelected ? "solid" : "outline"}
                                  style={
                                    isSelected
                                      ? { backgroundColor: cat.couleur, borderColor: cat.couleur }
                                      : { borderColor: cat.couleur, color: cat.couleur }
                                  }
                                  onClick={() => {
                                    const current = field.value || [];
                                    if (isSelected) {
                                      field.onChange(current.filter((id: string) => id !== cat.id));
                                    } else {
                                      field.onChange([...current, cat.id]);
                                    }
                                  }}
                                >
                                  {cat.nom}
                                </Button>
                              );
                            })}
                          </Flex>
                        )}
                      </Flex>
                    )}
                  />
                </Box>
              )}

              {/* Son actif */}
              <Flex align="center" justify="between">
                <Text as="label" size="2" weight="bold">
                  Son de notification
                </Text>
                <Controller
                  name="son_actif"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </Flex>

              {/* Delai urgence */}
              <Box>
                <Text as="label" size="2" weight="bold" mb="1">
                  Delai d&apos;urgence (minutes)
                </Text>
                <TextField.Root
                  type="number"
                  placeholder="15"
                  {...register("delai_urgence_minutes")}
                />
                {errors.delai_urgence_minutes ? <Text size="1" color="red" mt="1">
                    {errors.delai_urgence_minutes.message}
                  </Text> : null}
                <Text size="1" color="gray" mt="1">
                  Apres ce delai, la commande sera mise en surbrillance comme urgente.
                </Text>
              </Box>
            </Flex>

            {/* Actions du formulaire */}
            <Flex gap="3" mt="5" justify="end">
              <Dialog.Close>
                <Button type="button" variant="soft" color="gray">
                  Annuler
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <CircleNotch size={16} className="animate-spin" />
                    Creation...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Creer l&apos;ecran
                  </>
                )}
              </Button>
            </Flex>
          </form>
        </Dialog.Content>
      </Dialog.Root>

      {/* ================================================================== */}
      {/* DIALOG : QR Code */}
      {/* ================================================================== */}
      <Dialog.Root open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <Dialog.Content maxWidth="400px">
          <Dialog.Title>
            QR Code - {selectedEcranForQr?.nom}
          </Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Scannez ce QR code ou copiez l&apos;URL pour ouvrir l&apos;ecran d&apos;affichage.
          </Dialog.Description>

          {selectedEcranForQr ? <Flex direction="column" gap="4" align="center">
              <QrCodeCanvas url={getDisplayUrl(selectedEcranForQr.token)} />
              <Button
                variant="soft"
                onClick={() => handleCopyUrl(selectedEcranForQr.token)}
              >
                <Copy size={16} />
                Copier l&apos;URL
              </Button>
            </Flex> : null}

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Fermer
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* ================================================================== */}
      {/* ALERT DIALOG : Confirmer suppression */}
      {/* ================================================================== */}
      <AlertDialog.Root
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <AlertDialog.Content maxWidth="400px">
          <AlertDialog.Title>Supprimer l&apos;ecran</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Cette action est irreversible. L&apos;ecran ne sera plus accessible et le token sera invalide.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Annuler
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                Supprimer
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* ================================================================== */}
      {/* ALERT DIALOG : Confirmer regeneration de token */}
      {/* ================================================================== */}
      <AlertDialog.Root
        open={regenConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setRegenConfirmId(null);
        }}
      >
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Regenerer le token</AlertDialog.Title>
          <AlertDialog.Description size="2">
            L&apos;ancien token sera invalide immediatement. Tous les ecrans utilisant l&apos;ancienne URL
            devront etre reconfigures avec la nouvelle.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Annuler
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="orange"
                onClick={() => regenConfirmId && handleRegenerateToken(regenConfirmId)}
              >
                Regenerer
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
}
