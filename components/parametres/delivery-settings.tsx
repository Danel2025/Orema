"use client";

/**
 * DeliverySettings - Gestion des zones de livraison
 */

import { useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Flex,
  Text,
  TextField,
  Switch,
  Button,
  Dialog,
  Table,
  IconButton,
  Callout,
} from "@radix-ui/themes";
import {
  Truck,
  MapPin,
  Plus,
  PencilSimple,
  Trash,
  FloppyDisk,
  CircleNotch,
  Clock,
  Money,
  WarningCircle,
  Info,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import {
  createZoneLivraison,
  updateZoneLivraison,
  deleteZoneLivraison,
  toggleZoneLivraisonActif,
} from "@/actions/parametres";
import { zoneLivraisonSchema, type ZoneLivraisonFormData } from "@/schemas/parametres.schema";
import { formatCurrency } from "@/lib/utils";

interface ZoneLivraison {
  id: string;
  nom: string;
  description?: string | null;
  couleur?: string | null;
  ordre: number;
  active: boolean;
  frais_livraison: number;
  delai_estime?: number | null;
}

interface DeliverySettingsProps {
  initialData: ZoneLivraison[];
}

export function DeliverySettings({ initialData }: DeliverySettingsProps) {
  const [zones, setZones] = useState<ZoneLivraison[]>(initialData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneLivraison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isTogglingActif, setIsTogglingActif] = useState<string | null>(null);

  const {
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<ZoneLivraisonFormData>({
    resolver: zodResolver(zoneLivraisonSchema) as Resolver<ZoneLivraisonFormData>,
    defaultValues: {
      nom: "",
      frais: 0,
      delaiEstime: null,
      actif: true,
    },
  });

  const openCreateDialog = () => {
    setEditingZone(null);
    reset({
      nom: "",
      frais: 0,
      delaiEstime: null,
      actif: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (zone: ZoneLivraison) => {
    setEditingZone(zone);
    reset({
      nom: zone.nom,
      frais: zone.frais_livraison,
      delaiEstime: zone.delai_estime,
      actif: zone.active,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: ZoneLivraisonFormData) => {
    setIsLoading(true);

    try {
      let result;
      if (editingZone) {
        result = await updateZoneLivraison(editingZone.id, data);
      } else {
        result = await createZoneLivraison(data);
      }

      if (result.success && result.data) {
        const updatedZone = result.data as ZoneLivraison;
        if (editingZone) {
          setZones((prev) => prev.map((z) => (z.id === editingZone.id ? updatedZone : z)));
          toast.success("Zone modifiée avec succès");
        } else {
          setZones((prev) => [...prev, updatedZone]);
          toast.success("Zone ajoutée avec succès");
        }
        setIsDialogOpen(false);
      } else {
        toast.error(result.error || "Erreur lors de l'enregistrement");
      }
    } catch (_error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette zone de livraison ?")) {
      return;
    }

    setIsDeleting(id);

    try {
      const result = await deleteZoneLivraison(id);

      if (result.success) {
        setZones((prev) => prev.filter((z) => z.id !== id));
        toast.success("Zone supprimée");
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (_error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleActif = async (id: string) => {
    setIsTogglingActif(id);
    try {
      const result = await toggleZoneLivraisonActif(id);

      if (result.success && result.data) {
        const updatedZone = result.data as ZoneLivraison;
        setZones((prev) => prev.map((z) => (z.id === id ? updatedZone : z)));
        toast.success(updatedZone.active ? "Zone activée" : "Zone désactivée");
      } else {
        toast.error(result.error || "Erreur lors du changement d'etat");
      }
    } catch (_error) {
      toast.error("Erreur lors du changement d'etat");
    } finally {
      setIsTogglingActif(null);
    }
  };

  // Calculer les statistiques
  const zonesActives = zones.filter((z) => z.active).length;
  const fraisMoyen =
    zones.length > 0
      ? Math.round(zones.reduce((acc, z) => acc + z.frais_livraison, 0) / zones.length)
      : 0;

  return (
    <Flex direction="column" gap="5">
      {/* Statistiques */}
      <Flex gap="4" wrap="wrap">
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8, flex: "1 1 150px" }} p="3">
          <Flex direction="column" gap="1">
            <Text size="1" color="gray">
              Zones de livraison
            </Text>
            <Text size="5" weight="bold">
              {zones.length}
            </Text>
            <Text size="1" color="gray">
              {zonesActives} active{zonesActives > 1 ? "s" : ""}
            </Text>
          </Flex>
        </Box>
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8, flex: "1 1 150px" }} p="3">
          <Flex direction="column" gap="1">
            <Text size="1" color="gray">
              Frais moyen
            </Text>
            <Text size="5" weight="bold">
              {formatCurrency(fraisMoyen)}
            </Text>
          </Flex>
        </Box>
      </Flex>

      {/* En-tete */}
      <Flex justify="between" align="center">
        <Flex direction="column" gap="1">
          <Text size="4" weight="bold">
            Zones de livraison
          </Text>
          <Text size="2" color="gray">
            Definissez les zones et frais de livraison
          </Text>
        </Flex>
        <Button size="3" onClick={openCreateDialog}>
          <Plus size={16} />
          Ajouter une zone
        </Button>
      </Flex>

      {/* Liste des zones */}
      {zones.length === 0 ? (
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" align="center" justify="center" gap="3" py="6">
            <Truck size={48} style={{ color: "var(--gray-8)" }} />
            <Text size="3" color="gray">
              Aucune zone de livraison configuree
            </Text>
            <Text size="2" color="gray">
              Ajoutez vos zones de livraison pour proposer ce service a vos clients
            </Text>
            <Button size="2" variant="soft" onClick={openCreateDialog}>
              <Plus size={14} />
              Ajouter une zone
            </Button>
          </Flex>
        </Box>
      ) : (
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="3">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Zone</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Frais de livraison</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Delai estime</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {zones.map((zone) => (
                <Table.Row key={zone.id}>
                  <Table.RowHeaderCell>
                    <Flex align="center" gap="2">
                      <MapPin size={16} />
                      <Text weight="medium">{zone.nom}</Text>
                    </Flex>
                  </Table.RowHeaderCell>
                  <Table.Cell>
                    <Flex align="center" gap="2">
                      <Money size={14} style={{ color: "var(--green-9)" }} />
                      <Text size="2" weight="medium">
                        {formatCurrency(zone.frais_livraison)}
                      </Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    {zone.delai_estime ? (
                      <Flex align="center" gap="2">
                        <Clock size={14} className="text-blue-500" />
                        <Text size="2">{zone.delai_estime} min</Text>
                      </Flex>
                    ) : (
                      <Text size="2" color="gray">
                        Non defini
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Switch
                      size="1"
                      checked={zone.active}
                      onCheckedChange={() => handleToggleActif(zone.id)}
                      disabled={isTogglingActif === zone.id}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2">
                      <IconButton size="1" variant="soft" onClick={() => openEditDialog(zone)}>
                        <PencilSimple size={14} />
                      </IconButton>
                      <IconButton
                        size="1"
                        variant="soft"
                        color="red"
                        onClick={() => handleDelete(zone.id)}
                        disabled={isDeleting === zone.id}
                      >
                        {isDeleting === zone.id ? (
                          <CircleNotch size={14} className="animate-spin" />
                        ) : (
                          <Trash size={14} />
                        )}
                      </IconButton>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Information */}
      <Callout.Root color="blue" size="1">
        <Callout.Icon>
          <Info size={16} />
        </Callout.Icon>
        <Callout.Text>
          Les frais de livraison sont automatiquement ajoutes au total de la commande lorsque le
          mode &quot;Livraison&quot; est selectionne en caisse.
        </Callout.Text>
      </Callout.Root>

      {/* Dialog de creation/edition */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>
            {editingZone ? "Modifier la zone" : "Nouvelle zone de livraison"}
          </Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {editingZone
              ? "Modifiez les parametres de cette zone"
              : "Definissez une nouvelle zone de livraison"}
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Flex direction="column" gap="4">
              {/* Nom */}
              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Nom de la zone *
                </Text>
                <Controller
                  name="nom"
                  control={control}
                  render={({ field }) => (
                    <TextField.Root
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Ex: Centre-ville, Akanda, Owendo..."
                      size="3"
                    >
                      <TextField.Slot>
                        <MapPin size={16} />
                      </TextField.Slot>
                    </TextField.Root>
                  )}
                />
                {errors.nom ? (
                  <Text size="1" color="red" mt="1">
                    {errors.nom.message}
                  </Text>
                ) : null}
              </Box>

              {/* Frais */}
              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Frais de livraison (FCFA) *
                </Text>
                <Controller
                  name="frais"
                  control={control}
                  render={({ field }) => (
                    <TextField.Root
                      type="number"
                      min="0"
                      step="100"
                      value={field.value?.toString() ?? "0"}
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      onBlur={field.onBlur}
                      placeholder="Ex: 1500"
                      size="3"
                    >
                      <TextField.Slot>
                        <Money size={16} />
                      </TextField.Slot>
                      <TextField.Slot side="right">
                        <Text size="1" color="gray">
                          FCFA
                        </Text>
                      </TextField.Slot>
                    </TextField.Root>
                  )}
                />
                {errors.frais ? (
                  <Text size="1" color="red" mt="1">
                    {errors.frais.message}
                  </Text>
                ) : null}
              </Box>

              {/* Delai estime */}
              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Delai de livraison estime (minutes)
                </Text>
                <Controller
                  name="delaiEstime"
                  control={control}
                  render={({ field }) => (
                    <TextField.Root
                      type="number"
                      min="0"
                      value={field.value?.toString() ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? null : Number(val));
                      }}
                      onBlur={field.onBlur}
                      placeholder="Ex: 30, 45, 60..."
                      size="3"
                    >
                      <TextField.Slot>
                        <Clock size={16} />
                      </TextField.Slot>
                      <TextField.Slot side="right">
                        <Text size="1" color="gray">
                          min
                        </Text>
                      </TextField.Slot>
                    </TextField.Root>
                  )}
                />
                <Text size="1" color="gray" mt="1">
                  Optionnel - affiche sur le ticket client
                </Text>
              </Box>

              {/* Statut */}
              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Statut
                </Text>
                <Controller
                  name="actif"
                  control={control}
                  render={({ field }) => (
                    <Flex align="center" gap="2" mt="2">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      <Text size="2">Zone active</Text>
                    </Flex>
                  )}
                />
              </Box>
            </Flex>

            {/* Boutons */}
            <Flex gap="3" mt="5" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray" type="button">
                  Annuler
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <CircleNotch size={16} className="animate-spin" /> : <FloppyDisk size={16} />}
                {editingZone ? "Enregistrer" : "Ajouter"}
              </Button>
            </Flex>
          </form>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
}
