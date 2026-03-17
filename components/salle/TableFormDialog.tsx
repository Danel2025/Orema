"use client";

import { useTransition, useEffect, useState } from "react";
import {
  Dialog,
  Button,
  Flex,
  Text,
  TextField,
  Select,
  Popover,
  Box,
} from "@radix-ui/themes";
import { Plus, Check } from "lucide-react";
import type { SubmitHandler } from "react-hook-form";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  FormeTable,
  FORME_TABLE_LABELS,
} from "@/schemas/table.schema";
import { createTable, updateTable, createZone } from "@/actions/tables";

// Schema local pour le formulaire avec des valeurs par défaut explicites
const formSchema = z.object({
  numero: z
    .string()
    .min(1, "Le numéro est requis")
    .max(20, "Le numéro ne peut pas dépasser 20 caractères"),
  capacite: z
    .number()
    .int("La capacité doit être un nombre entier")
    .min(1, "La capacité doit être d'au moins 1 place")
    .max(50, "La capacité ne peut pas dépasser 50 places"),
  forme: z.enum(["RONDE", "CARREE", "RECTANGULAIRE"]),
  zoneId: z.string().optional().nullable(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  largeur: z.number().min(40).max(300).optional(),
  hauteur: z.number().min(40).max(300).optional(),
  active: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface Zone {
  id: string;
  nom: string;
  couleur: string | null;
}

interface TableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: {
    id: string;
    numero: string;
    capacite: number;
    forme: string;
    zoneId: string | null;
    zone: Zone | null;
    positionX: number | null;
    positionY: number | null;
    largeur: number | null;
    hauteur: number | null;
    active: boolean;
  };
  zones: Zone[];
  onSuccess?: () => void;
  /** Données pré-remplies lors de la création depuis le canvas */
  prefilledData?: {
    forme: "CARREE" | "RONDE" | "RECTANGULAIRE";
    positionX: number;
    positionY: number;
  };
}

export function TableFormDialog({
  open,
  onOpenChange,
  table,
  zones,
  onSuccess,
  prefilledData,
}: TableFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [newZonePopoverOpen, setNewZonePopoverOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [localZones, setLocalZones] = useState<Zone[]>(zones);
  const isEdit = !!table;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero: table?.numero || "",
      capacite: table?.capacite || 4,
      forme: (table?.forme as "RONDE" | "CARREE" | "RECTANGULAIRE") || prefilledData?.forme || "CARREE",
      zoneId: table?.zoneId || undefined,
      positionX: table?.positionX ?? prefilledData?.positionX ?? undefined,
      positionY: table?.positionY ?? prefilledData?.positionY ?? undefined,
      largeur: table?.largeur || undefined,
      hauteur: table?.hauteur || undefined,
      active: table?.active ?? true,
    },
  });

  // Watch current zone value
  const currentZoneId = watch("zoneId");

  // Add new zone handler
  const handleAddNewZone = async () => {
    const trimmedName = newZoneName.trim();
    if (trimmedName) {
      // Close popover and reset input first
      setNewZonePopoverOpen(false);
      setNewZoneName("");

      // Create the zone in the database
      const result = await createZone({ nom: trimmedName });

      if (result.success && result.data) {
        // Add to local zones
        setLocalZones((prev) => [...prev, result.data as Zone]);
        // Set the form value after a short delay
        setTimeout(() => {
          setValue("zoneId", result.data!.id, { shouldValidate: true, shouldDirty: true });
        }, 50);
        toast.success(`Zone "${trimmedName}" créée`);
      } else {
        toast.error(result.error || "Erreur lors de la création de la zone");
      }
    }
  };

  // Update local zones when props change
  useEffect(() => {
    setLocalZones(zones);
  }, [zones]);

  // Reset form when table changes or prefilled data changes
  useEffect(() => {
    if (open) {
      reset({
        numero: table?.numero || "",
        capacite: table?.capacite || 4,
        forme: (table?.forme as "RONDE" | "CARREE" | "RECTANGULAIRE") || prefilledData?.forme || "CARREE",
        zoneId: table?.zoneId || undefined,
        positionX: table?.positionX ?? prefilledData?.positionX ?? undefined,
        positionY: table?.positionY ?? prefilledData?.positionY ?? undefined,
        largeur: table?.largeur || undefined,
        hauteur: table?.hauteur || undefined,
        active: table?.active ?? true,
      });
    }
  }, [open, table, prefilledData, reset]);

  const onSubmit: SubmitHandler<FormData> = (data) => {
    startTransition(async () => {
      try {
        const result = isEdit && table
          ? await updateTable(table.id, data)
          : await createTable(data);

        if (result.success) {
          toast.success(isEdit ? "Table mise à jour" : "Table créée");
          reset();
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(result.error || "Une erreur est survenue");
        }
      } catch {
        toast.error("Une erreur est survenue");
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>{isEdit ? "Modifier la table" : "Nouvelle table"}</Dialog.Title>
        <Dialog.Description size="2" mb="4" color="gray">
          {isEdit
            ? "Modifiez les informations de la table"
            : "Ajoutez une nouvelle table au plan de salle"}
        </Dialog.Description>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            {/* Numéro */}
            <div>
              <Text as="label" size="2" weight="medium" mb="1">
                Numéro / Nom <span className="text-red-500">*</span>
              </Text>
              <TextField.Root
                {...register("numero")}
                placeholder="Ex: T1, Table 1, VIP..."
              />
              {errors.numero ? <Text size="1" color="red" mt="1">
                  {errors.numero.message}
                </Text> : null}
            </div>

            {/* Capacité */}
            <div>
              <Text as="label" size="2" weight="medium" mb="1">
                Capacité (places) <span className="text-red-500">*</span>
              </Text>
              <TextField.Root
                type="number"
                {...register("capacite", { valueAsNumber: true })}
                placeholder="4"
                min={1}
                max={50}
              />
              {errors.capacite ? <Text size="1" color="red" mt="1">
                  {errors.capacite.message}
                </Text> : null}
            </div>

            {/* Forme */}
            <div>
              <Text as="label" size="2" weight="medium" mb="1">
                Forme
              </Text>
              <Controller
                name="forme"
                control={control}
                render={({ field }) => (
                  <Select.Root
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <Select.Trigger style={{ width: "100%" }} />
                    <Select.Content>
                      {Object.entries(FormeTable).map(([key, value]) => (
                        <Select.Item key={key} value={value}>
                          {FORME_TABLE_LABELS[value as keyof typeof FORME_TABLE_LABELS]}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              />
            </div>

            {/* Zone */}
            <div>
              <Text as="label" size="2" weight="medium" mb="1">
                Zone / Salle
              </Text>
              <Flex gap="2" align="center">
                <Box style={{ flex: 1 }}>
                  <Select.Root
                    value={currentZoneId || "__none__"}
                    onValueChange={(val) => {
                      if (val === "__none__") {
                        setValue("zoneId", undefined, { shouldValidate: true });
                      } else {
                        setValue("zoneId", val, { shouldValidate: true });
                      }
                    }}
                  >
                    <Select.Trigger style={{ width: "100%" }} placeholder="Sélectionner une zone..." />
                    <Select.Content>
                      <Select.Item value="__none__">
                        <Text color="gray">Aucune zone</Text>
                      </Select.Item>
                      {localZones.length > 0 && <Select.Separator />}
                      {localZones.map((zone) => (
                        <Select.Item key={zone.id} value={zone.id}>
                          {zone.nom}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>

                {/* Bouton pour ajouter une nouvelle zone */}
                <Popover.Root open={newZonePopoverOpen} onOpenChange={setNewZonePopoverOpen}>
                  <Popover.Trigger>
                    <Button type="button" variant="soft" size="2">
                      <Plus size={14} />
                    </Button>
                  </Popover.Trigger>
                  <Popover.Content style={{ width: 280 }}>
                    <Flex direction="column" gap="3">
                      <Text size="2" weight="medium">Nouvelle zone</Text>
                      <input
                        type="text"
                        autoFocus
                        value={newZoneName}
                        onChange={(e) => setNewZoneName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddNewZone();
                          }
                          if (e.key === "Escape") {
                            setNewZonePopoverOpen(false);
                            setNewZoneName("");
                          }
                        }}
                        placeholder="Ex: Terrasse, Salle VIP..."
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          fontSize: 14,
                          border: "1px solid var(--gray-a6)",
                          borderRadius: 6,
                          backgroundColor: "var(--color-surface)",
                          color: "var(--gray-12)",
                          outline: "none",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "var(--accent-8)";
                          e.target.style.boxShadow = "0 0 0 1px var(--accent-8)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "var(--gray-a6)";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                      <Flex gap="2" justify="end">
                        <Button
                          type="button"
                          variant="soft"
                          color="gray"
                          size="1"
                          onClick={() => {
                            setNewZonePopoverOpen(false);
                            setNewZoneName("");
                          }}
                        >
                          Annuler
                        </Button>
                        <Button
                          type="button"
                          size="1"
                          onClick={handleAddNewZone}
                          disabled={!newZoneName.trim()}
                        >
                          <Check size={14} />
                          Ajouter
                        </Button>
                      </Flex>
                    </Flex>
                  </Popover.Content>
                </Popover.Root>
              </Flex>
              {errors.zoneId ? <Text size="1" color="red" mt="1">
                  {errors.zoneId.message}
                </Text> : null}
            </div>
          </Flex>

          <Flex gap="3" mt="5" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isPending}>
                Annuler
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
