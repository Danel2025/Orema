"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Flex,
  Text,
  Button,
  Dialog,
  TextField,
  Select,
  Switch,
  Badge,
  Card,
  IconButton,
  Tooltip,
  Callout,
  Separator,
} from "@radix-ui/themes";
import {
  Clock,
  SunHorizon,
  Moon,
  CalendarBlank,
  Plus,
  PencilSimple,
  Trash,
  FloppyDisk,
  CircleNotch,
  Info,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import {
  saveTarifHoraire,
  deleteTarifHoraireAction,
  updateTarifHoraireAction,
} from "@/actions/tarification";
import {
  tarifHoraireSchema,
  type TarifHoraireInput,
} from "@/schemas/tarification.schema";

const JOURS_SEMAINE = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
  { value: 7, label: "Dim" },
];

interface TarifHoraire extends TarifHoraireInput {
  id: string;
}

interface TarifsHorairesManagerProps {
  initialTarifs: TarifHoraire[];
  categories?: { id: string; nom: string }[];
}

function TarifHoraireForm({
  onSubmit,
  initialData,
  isLoading,
  categories,
}: {
  onSubmit: (data: TarifHoraireInput) => void;
  initialData?: TarifHoraireInput;
  isLoading: boolean;
  categories?: { id: string; nom: string }[];
}) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TarifHoraireInput>({
    resolver: zodResolver(tarifHoraireSchema) as any,
    defaultValues: initialData || {
      nom: "",
      heureDebut: "18:00",
      heureFin: "22:00",
      joursSemaine: [1, 2, 3, 4, 5, 6, 7],
      typeAjustement: "pourcentage",
      valeurAjustement: 0,
      categorieId: null,
      actif: true,
      priorite: 0,
    },
  });

  const selectedJours = watch("joursSemaine");
  const typeAjustement = watch("typeAjustement");

  const toggleJour = (jour: number) => {
    const current = selectedJours || [];
    if (current.includes(jour)) {
      setValue(
        "joursSemaine",
        current.filter((j) => j !== jour),
        { shouldValidate: true }
      );
    } else {
      setValue("joursSemaine", [...current, jour].sort(), { shouldValidate: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap="4">
        <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Nom du tarif
          </Text>
          <Controller
            name="nom"
            control={control}
            render={({ field }) => (
              <TextField.Root
                size="2"
                placeholder="Ex: Happy Hour, Tarif Weekend..."
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.nom ? <Text size="1" color="red" mt="1">
              {errors.nom.message}
            </Text> : null}
        </label>

        <Flex gap="4" wrap="wrap">
          <Box style={{ flex: "1 1 140px" }}>
            <Text as="div" size="2" mb="1" weight="bold">
              Heure debut
            </Text>
            <Controller
              name="heureDebut"
              control={control}
              render={({ field }) => (
                <TextField.Root
                  type="time"
                  size="2"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.heureDebut ? <Text size="1" color="red" mt="1">
                Format HH:MM requis
              </Text> : null}
          </Box>

          <Box style={{ flex: "1 1 140px" }}>
            <Text as="div" size="2" mb="1" weight="bold">
              Heure fin
            </Text>
            <Controller
              name="heureFin"
              control={control}
              render={({ field }) => (
                <TextField.Root
                  type="time"
                  size="2"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.heureFin ? <Text size="1" color="red" mt="1">
                Format HH:MM requis
              </Text> : null}
          </Box>
        </Flex>

        <Box>
          <Text as="div" size="2" mb="2" weight="bold">
            <Flex align="center" gap="1">
              <CalendarBlank size={16} />
              Jours de la semaine
            </Flex>
          </Text>
          <Flex gap="2" wrap="wrap">
            {JOURS_SEMAINE.map((jour) => (
              <Button
                key={jour.value}
                type="button"
                variant={selectedJours?.includes(jour.value) ? "solid" : "outline"}
                size="1"
                onClick={() => toggleJour(jour.value)}
              >
                {jour.label}
              </Button>
            ))}
          </Flex>
          {errors.joursSemaine ? <Text size="1" color="red" mt="1">
              Selectionnez au moins un jour
            </Text> : null}
        </Box>

        <Flex gap="4" wrap="wrap">
          <Box style={{ flex: "1 1 180px" }}>
            <Text as="div" size="2" mb="1" weight="bold">
              Type d&apos;ajustement
            </Text>
            <Controller
              name="typeAjustement"
              control={control}
              render={({ field }) => (
                <Select.Root
                  size="2"
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <Select.Trigger style={{ width: "100%" }} />
                  <Select.Content>
                    <Select.Item value="pourcentage">Pourcentage (%)</Select.Item>
                    <Select.Item value="montant_fixe">Montant fixe (FCFA)</Select.Item>
                  </Select.Content>
                </Select.Root>
              )}
            />
          </Box>

          <Box style={{ flex: "1 1 180px" }}>
            <Text as="div" size="2" mb="1" weight="bold">
              Valeur
            </Text>
            <Controller
              name="valeurAjustement"
              control={control}
              render={({ field }) => (
                <TextField.Root
                  type="number"
                  size="2"
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  placeholder={typeAjustement === "pourcentage" ? "Ex: -10 ou +15" : "Ex: -500 ou +1000"}
                >
                  <TextField.Slot side="right">
                    <Text size="1" color="gray">
                      {typeAjustement === "pourcentage" ? "%" : "FCFA"}
                    </Text>
                  </TextField.Slot>
                </TextField.Root>
              )}
            />
            <Text size="1" color="gray" mt="1">
              Negatif = reduction, positif = majoration
            </Text>
          </Box>
        </Flex>

        {categories && categories.length > 0 ? <Box>
            <Text as="div" size="2" mb="1" weight="bold">
              Categorie (optionnel)
            </Text>
            <Controller
              name="categorieId"
              control={control}
              render={({ field }) => (
                <Select.Root
                  size="2"
                  value={field.value || "all"}
                  onValueChange={(v) => field.onChange(v === "all" ? null : v)}
                >
                  <Select.Trigger style={{ width: "100%" }} />
                  <Select.Content>
                    <Select.Item value="all">Toutes les categories</Select.Item>
                    {categories.map((cat) => (
                      <Select.Item key={cat.id} value={cat.id}>
                        {cat.nom}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              )}
            />
          </Box> : null}

        <Flex gap="4" wrap="wrap">
          <Box style={{ flex: "1 1 120px" }}>
            <Text as="div" size="2" mb="1" weight="bold">
              Priorite
            </Text>
            <Controller
              name="priorite"
              control={control}
              render={({ field }) => (
                <TextField.Root
                  type="number"
                  size="2"
                  min="0"
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
            <Text size="1" color="gray" mt="1">
              Plus la valeur est elevee, plus le tarif est prioritaire
            </Text>
          </Box>
        </Flex>

        <Flex justify="end" gap="3" mt="2">
          <Dialog.Close>
            <Button variant="soft" color="gray" type="button">
              Annuler
            </Button>
          </Dialog.Close>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <CircleNotch size={16} className="animate-spin" />
            ) : (
              <FloppyDisk size={16} />
            )}
            Enregistrer
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}

export function TarifsHorairesManager({
  initialTarifs,
  categories,
}: TarifsHorairesManagerProps) {
  const [tarifs, setTarifs] = useState<TarifHoraire[]>(initialTarifs);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTarif, setEditingTarif] = useState<TarifHoraire | null>(null);

  const handleCreate = async (data: TarifHoraireInput) => {
    setIsLoading(true);
    try {
      const result = await saveTarifHoraire(data);
      if (result.success && result.data) {
        // The action returns { id: string }, build the full tarif object
        const newTarif: TarifHoraire = {
          id: result.data.id,
          ...data,
        };
        setTarifs((prev) => [...prev, newTarif]);
        setDialogOpen(false);
        toast.success("Tarif horaire créé");
      } else {
        toast.error(result.error || "Erreur lors de la creation");
      }
    } catch {
      toast.error("Erreur lors de la creation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: TarifHoraireInput) => {
    if (!editingTarif) return;
    setIsLoading(true);
    try {
      const result = await updateTarifHoraireAction(editingTarif.id, data);
      if (result.success) {
        setTarifs((prev) =>
          prev.map((t) =>
            t.id === editingTarif.id ? { ...t, ...data } : t
          )
        );
        setEditingTarif(null);
        setDialogOpen(false);
        toast.success("Tarif horaire modifié");
      } else {
        toast.error(result.error || "Erreur lors de la modification");
      }
    } catch {
      toast.error("Erreur lors de la modification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteTarifHoraireAction(id);
      if (result.success) {
        setTarifs((prev) => prev.filter((t) => t.id !== id));
        toast.success("Tarif horaire supprimé");
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggleActif = async (tarif: TarifHoraire) => {
    try {
      const result = await updateTarifHoraireAction(tarif.id, {
        ...tarif,
        actif: !tarif.actif,
      });
      if (result.success) {
        setTarifs((prev) =>
          prev.map((t) => (t.id === tarif.id ? { ...t, actif: !t.actif } : t))
        );
      } else {
        toast.error("Erreur lors de la modification");
      }
    } catch {
      toast.error("Erreur lors de la modification");
    }
  };

  const getIconForTime = (heureDebut: string) => {
    const hour = parseInt(heureDebut.split(":")[0], 10);
    if (hour >= 6 && hour < 18) {
      return <SunHorizon size={18} weight="duotone" style={{ color: "var(--orange-9)" }} />;
    }
    return <Moon size={18} weight="duotone" style={{ color: "var(--blue-9)" }} />;
  };

  return (
    <Flex direction="column" gap="4">
      <Callout.Root color="blue" size="2">
        <Callout.Icon>
          <Info size={18} weight="regular" />
        </Callout.Icon>
        <Callout.Text>
          Les tarifs horaires permettent d&apos;appliquer automatiquement des majorations
          ou reductions selon les plages horaires et les jours de la semaine.
          Valeur negative = reduction, positive = majoration.
        </Callout.Text>
      </Callout.Root>

      <Flex justify="between" align="center">
        <Flex align="center" gap="2">
          <Clock size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
          <Text size="4" weight="bold">
            Tarifs horaires
          </Text>
          <Badge size="1" variant="soft">
            {tarifs.length}
          </Badge>
        </Flex>

        <Dialog.Root open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTarif(null);
        }}>
          <Dialog.Trigger>
            <Button size="2">
              <Plus size={16} />
              Ajouter un tarif
            </Button>
          </Dialog.Trigger>

          <Dialog.Content maxWidth="520px">
            <Dialog.Title>
              {editingTarif ? "Modifier le tarif" : "Nouveau tarif horaire"}
            </Dialog.Title>
            <Dialog.Description size="2" mb="4">
              {editingTarif
                ? "Modifiez les parametres du tarif horaire."
                : "Definissez une plage horaire avec un ajustement de prix."}
            </Dialog.Description>

            <TarifHoraireForm
              onSubmit={editingTarif ? handleUpdate : handleCreate}
              initialData={editingTarif || undefined}
              isLoading={isLoading}
              categories={categories}
            />
          </Dialog.Content>
        </Dialog.Root>
      </Flex>

      {tarifs.length === 0 ? (
        <Box
          style={{
            border: "1px dashed var(--gray-a6)",
            borderRadius: 8,
            padding: "40px",
            textAlign: "center",
          }}
        >
          <Clock size={40} weight="thin" style={{ color: "var(--gray-8)", marginBottom: 12 }} />
          <Text as="p" size="2" color="gray">
            Aucun tarif horaire configure.
          </Text>
          <Text as="p" size="1" color="gray">
            Ajoutez des tarifs pour appliquer des ajustements automatiques.
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap="3">
          {tarifs.map((tarif) => (
            <Card key={tarif.id} size="2">
              <Flex justify="between" align="start" gap="4">
                <Flex direction="column" gap="2" style={{ flex: 1 }}>
                  <Flex align="center" gap="2">
                    {getIconForTime(tarif.heureDebut)}
                    <Text size="3" weight="bold">
                      {tarif.nom}
                    </Text>
                    {!tarif.actif && (
                      <Badge color="gray" size="1" variant="soft">
                        Inactif
                      </Badge>
                    )}
                  </Flex>

                  <Flex gap="3" wrap="wrap" align="center">
                    <Badge variant="outline" size="1">
                      <Clock size={12} />
                      {tarif.heureDebut} - {tarif.heureFin}
                    </Badge>

                    <Flex gap="1">
                      {JOURS_SEMAINE.map((jour) => (
                        <Badge
                          key={jour.value}
                          size="1"
                          variant={tarif.joursSemaine.includes(jour.value) ? "solid" : "outline"}
                          color={tarif.joursSemaine.includes(jour.value) ? "orange" : "gray"}
                        >
                          {jour.label}
                        </Badge>
                      ))}
                    </Flex>
                  </Flex>

                  <Flex gap="2" align="center">
                    <Badge
                      size="2"
                      color={tarif.valeurAjustement < 0 ? "green" : tarif.valeurAjustement > 0 ? "red" : "gray"}
                    >
                      {tarif.valeurAjustement > 0 ? "+" : ""}
                      {tarif.valeurAjustement}
                      {tarif.typeAjustement === "pourcentage" ? "%" : " FCFA"}
                    </Badge>
                    {tarif.categorieId ? <Badge variant="soft" size="1">
                        Categorie specifique
                      </Badge> : null}
                    {tarif.priorite > 0 && (
                      <Badge variant="outline" size="1" color="gray">
                        Priorite: {tarif.priorite}
                      </Badge>
                    )}
                  </Flex>
                </Flex>

                <Flex gap="2" align="center">
                  <Switch
                    size="2"
                    checked={tarif.actif}
                    onCheckedChange={() => handleToggleActif(tarif)}
                  />
                  <Tooltip content="Modifier">
                    <IconButton
                      variant="ghost"
                      size="2"
                      onClick={() => {
                        setEditingTarif(tarif);
                        setDialogOpen(true);
                      }}
                    >
                      <PencilSimple size={16} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip content="Supprimer">
                    <IconButton
                      variant="ghost"
                      color="red"
                      size="2"
                      onClick={() => handleDelete(tarif.id)}
                    >
                      <Trash size={16} />
                    </IconButton>
                  </Tooltip>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>
      )}
    </Flex>
  );
}
