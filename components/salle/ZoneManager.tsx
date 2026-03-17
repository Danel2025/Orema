"use client";

/**
 * ZoneManager - Gestionnaire des zones (CRUD complet)
 * Permet de creer, modifier, supprimer et reordonner les zones
 */

import { useState, useTransition } from "react";
import {
  Dialog,
  Button,
  Flex,
  Text,
  TextField,
  IconButton,
  Badge,
  Tooltip,
  Box,
} from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  X,
  Check,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import {
  createZone,
  updateZone,
  deleteZone,
  reorderZones,
} from "@/actions/tables";

// Couleurs predefinies pour les zones
const ZONE_COLORS = [
  { name: "Vert", value: "#22c55e" },
  { name: "Bleu", value: "#3b82f6" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Rose", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
  { name: "Jaune", value: "#eab308" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Gris", value: "#6b7280" },
  { name: "Ambre", value: "#d97706" },
];

interface Zone {
  id: string;
  nom: string;
  description: string | null;
  couleur: string | null;
  ordre: number;
  active: boolean;
  _count?: {
    tables: number;
  };
}

interface ZoneManagerProps {
  zones: Zone[];
  onRefresh: () => void;
}

export function ZoneManager({ zones, onRefresh }: ZoneManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      {/* Bouton pour ouvrir le gestionnaire */}
      <Button variant="soft" onClick={() => setIsOpen(true)}>
        <MapPin size={14} />
        Gerer les zones ({zones.length})
      </Button>

      {/* Dialog principal */}
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Content maxWidth="550px">
          <Dialog.Title>
            <Flex align="center" gap="2">
              <MapPin size={20} />
              Gestion des zones
            </Flex>
          </Dialog.Title>
          <Dialog.Description size="2" mb="4" color="gray">
            Creez et organisez les zones de votre etablissement (Salle, Terrasse, Bar,
            VIP, etc.)
          </Dialog.Description>

          {/* Bouton ajouter */}
          <Flex justify="end" mb="3">
            <Button
              size="2"
              onClick={() => {
                setEditingZone(null);
                setIsFormOpen(true);
              }}
            >
              <Plus size={14} />
              Nouvelle zone
            </Button>
          </Flex>

          {/* Liste des zones */}
          <ScrollArea style={{ maxHeight: 400 }}>
            {zones.length === 0 ? (
              <Box py="6" style={{ textAlign: "center" }}>
                <MapPin size={40} style={{ color: "var(--gray-8)", marginBottom: 12 }} />
                <Text color="gray" size="2" as="p">
                  Aucune zone definie
                </Text>
                <Text color="gray" size="1" as="p">
                  Creez des zones pour organiser vos tables
                </Text>
              </Box>
            ) : (
              <Flex direction="column" gap="2">
                {zones.map((zone) => (
                  <ZoneItem
                    key={zone.id}
                    zone={zone}
                    onEdit={() => {
                      setEditingZone(zone);
                      setIsFormOpen(true);
                    }}
                    onRefresh={onRefresh}
                  />
                ))}
              </Flex>
            )}
          </ScrollArea>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Fermer
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Dialog de formulaire (creation/edition) */}
      <ZoneFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        zone={editingZone}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingZone(null);
          onRefresh();
        }}
      />
    </>
  );
}

/**
 * Element de zone dans la liste
 */
function ZoneItem({
  zone,
  onEdit,
  onRefresh,
}: {
  zone: Zone;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteZone(zone.id);
        if (result.success) {
          toast.success(`Zone "${zone.nom}" supprimee`);
          setShowDeleteConfirm(false);
          onRefresh();
        } else {
          toast.error(result.error || "Erreur lors de la suppression");
        }
      } catch {
        toast.error("Erreur lors de la suppression");
      }
    });
  };

  const tableCount = zone._count?.tables || 0;

  return (
    <Flex
      align="center"
      gap="3"
      p="3"
      style={{
        backgroundColor: "var(--gray-a2)",
        borderRadius: 8,
        border: "1px solid var(--gray-a5)",
      }}
    >
      {/* Indicateur de couleur */}
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: 4,
          backgroundColor: zone.couleur || "#6b7280",
          flexShrink: 0,
        }}
      />

      {/* Infos de la zone */}
      <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
        <Text size="2" weight="medium" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {zone.nom}
        </Text>
        {zone.description ? <Text size="1" color="gray" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {zone.description}
          </Text> : null}
      </Flex>

      {/* Badge nombre de tables */}
      <Badge variant="soft" color="gray" size="1">
        {tableCount} table{tableCount !== 1 ? "s" : ""}
      </Badge>

      {/* Actions */}
      <Flex gap="1">
        <Tooltip content="Modifier">
          <IconButton variant="ghost" size="1" onClick={onEdit}>
            <Pencil size={14} />
          </IconButton>
        </Tooltip>

        {showDeleteConfirm ? (
          <Flex gap="1">
            <Tooltip content="Confirmer">
              <IconButton
                variant="soft"
                color="red"
                size="1"
                onClick={handleDelete}
                disabled={isPending || tableCount > 0}
              >
                <Check size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip content="Annuler">
              <IconButton
                variant="ghost"
                size="1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <X size={14} />
              </IconButton>
            </Tooltip>
          </Flex>
        ) : (
          <Tooltip
            content={
              tableCount > 0
                ? "Impossible de supprimer: tables associees"
                : "Supprimer"
            }
          >
            <IconButton
              variant="ghost"
              color="red"
              size="1"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={tableCount > 0}
            >
              <Trash2 size={14} />
            </IconButton>
          </Tooltip>
        )}
      </Flex>
    </Flex>
  );
}

/**
 * Dialog de formulaire pour creer/editer une zone
 */
function ZoneFormDialog({
  open,
  onOpenChange,
  zone,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: Zone | null;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [couleur, setCouleur] = useState(ZONE_COLORS[0].value);

  const isEdit = !!zone;

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      if (zone) {
        setNom(zone.nom);
        setDescription(zone.description || "");
        setCouleur(zone.couleur || ZONE_COLORS[0].value);
      } else {
        setNom("");
        setDescription("");
        setCouleur(ZONE_COLORS[0].value);
      }
    }
    onOpenChange(open);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nom.trim()) {
      toast.error("Le nom de la zone est requis");
      return;
    }

    startTransition(async () => {
      try {
        const data = {
          nom: nom.trim(),
          description: description.trim() || undefined,
          couleur,
        };

        const result = isEdit
          ? await updateZone(zone.id, data)
          : await createZone(data);

        if (result.success) {
          toast.success(isEdit ? "Zone mise a jour" : "Zone creee");
          onSuccess();
        } else {
          toast.error(result.error || "Une erreur est survenue");
        }
      } catch {
        toast.error("Une erreur est survenue");
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content maxWidth="420px">
        <Dialog.Title>
          {isEdit ? "Modifier la zone" : "Nouvelle zone"}
        </Dialog.Title>
        <Dialog.Description size="2" mb="4" color="gray">
          {isEdit
            ? "Modifiez les informations de la zone"
            : "Creez une nouvelle zone pour organiser vos tables"}
        </Dialog.Description>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            {/* Nom */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Nom <span style={{ color: "var(--red-9)" }}>*</span>
              </Text>
              <TextField.Root
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Salle principale, Terrasse, VIP..."
                autoFocus
              />
            </Box>

            {/* Description */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Description
              </Text>
              <TextField.Root
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description optionnelle..."
              />
            </Box>

            {/* Couleur */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="2">
                <Flex align="center" gap="1">
                  <Palette size={14} />
                  Couleur
                </Flex>
              </Text>
              <Flex gap="2" wrap="wrap">
                {ZONE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCouleur(c.value)}
                    title={c.name}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      backgroundColor: c.value,
                      border:
                        couleur === c.value
                          ? "3px solid var(--gray-12)"
                          : "2px solid transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.15s",
                    }}
                  >
                    {couleur === c.value && (
                      <Check size={14} style={{ color: "white" }} />
                    )}
                  </button>
                ))}
              </Flex>
            </Box>

            {/* Preview */}
            <Box
              p="3"
              style={{
                backgroundColor: `${couleur}15`,
                border: `2px dashed ${couleur}80`,
                borderRadius: 8,
              }}
            >
              <Flex align="center" gap="2">
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    backgroundColor: couleur,
                  }}
                />
                <Text size="2" weight="medium">
                  {nom || "Nom de la zone"}
                </Text>
              </Flex>
              {description ? <Text size="1" color="gray" mt="1">
                  {description}
                </Text> : null}
            </Box>
          </Flex>

          <Flex gap="3" mt="5" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isPending}>
                Annuler
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={isPending || !nom.trim()}>
              {isPending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Creer"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
