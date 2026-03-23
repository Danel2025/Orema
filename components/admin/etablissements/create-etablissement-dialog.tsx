"use client";

/**
 * Dialog de création d'un nouvel établissement
 * React Hook Form + Zod + Radix UI Dialog
 */

import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Dialog,
  TextField,
  Select,
  Separator,
} from "@radix-ui/themes";
import {
  Buildings,
  Phone,
  EnvelopeSimple,
  MapPin,
  IdentificationBadge,
  FileText,
  CreditCard,
  SpinnerGap,
} from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEtablissementSchema,
  planLabels,
} from "@/schemas/admin-etablissement.schema";
import { toast } from "sonner";
import type { z } from "zod";

type CreateEtablissementFormValues = z.input<typeof createEtablissementSchema>;

interface CreateEtablissementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateEtablissementDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateEtablissementDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateEtablissementFormValues>({
    resolver: zodResolver(createEtablissementSchema),
    defaultValues: {
      nom: "",
      telephone: "",
      email: "",
      adresse: "",
      nif: "",
      rccm: "",
      plan: "essentiel",
    },
  });

  const selectedPlan = watch("plan");

  const onSubmit = async (data: CreateEtablissementFormValues) => {
    setIsSubmitting(true);
    try {
      // Import dynamique pour éviter le chargement initial
      const { createEtablissement } = await import("@/actions/admin/etablissements");
      const result = await createEtablissement(data as Parameters<typeof createEtablissement>[0]);

      if (result.success) {
        toast.success(`Établissement "${data.nom}" créé avec succès`);
        reset();
        onOpenChange(false);
        onCreated();
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur inattendue lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && handleClose()}>
      <Dialog.Content maxWidth="550px">
        <Dialog.Title>
          <Flex align="center" gap="2">
            <Box
              p="2"
              style={{
                background: "var(--accent-a3)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Buildings size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
            </Box>
            Créer un établissement
          </Flex>
        </Dialog.Title>
        <Dialog.Description size="2" mb="4" color="gray">
          Remplissez les informations pour créer un nouvel établissement.
        </Dialog.Description>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Section : Informations générales */}
          <Flex align="center" gap="2" mb="3">
            <Buildings size={14} weight="bold" style={{ color: "var(--gray-9)" }} />
            <Text size="2" weight="bold" color="gray">
              Informations générales
            </Text>
          </Flex>

          <Flex direction="column" gap="3" mb="4">
            {/* Nom */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="1" style={{ display: "block" }}>
                Nom de l'établissement *
              </Text>
              <TextField.Root
                placeholder="Ex: Restaurant Le Soleil"
                {...register("nom")}
                color={errors.nom ? "red" : undefined}
              />
              {errors.nom ? <Text size="1" color="red" mt="1" style={{ display: "block" }}>
                  {errors.nom.message}
                </Text> : null}
            </Box>

            {/* Téléphone + Email */}
            <Grid2Cols>
              <Box>
                <Text as="label" size="2" weight="medium" mb="1" style={{ display: "block" }}>
                  Téléphone *
                </Text>
                <TextField.Root
                  placeholder="Ex: +241 XX XX XX XX"
                  {...register("telephone")}
                  color={errors.telephone ? "red" : undefined}
                >
                  <TextField.Slot>
                    <Phone size={14} style={{ color: "var(--gray-9)" }} />
                  </TextField.Slot>
                </TextField.Root>
                {errors.telephone ? <Text size="1" color="red" mt="1" style={{ display: "block" }}>
                    {errors.telephone.message}
                  </Text> : null}
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium" mb="1" style={{ display: "block" }}>
                  Email
                </Text>
                <TextField.Root
                  placeholder="email@exemple.com"
                  type="email"
                  {...register("email")}
                  color={errors.email ? "red" : undefined}
                >
                  <TextField.Slot>
                    <EnvelopeSimple size={14} style={{ color: "var(--gray-9)" }} />
                  </TextField.Slot>
                </TextField.Root>
                {errors.email ? <Text size="1" color="red" mt="1" style={{ display: "block" }}>
                    {errors.email.message}
                  </Text> : null}
              </Box>
            </Grid2Cols>

            {/* Adresse */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="1" style={{ display: "block" }}>
                Adresse
              </Text>
              <TextField.Root
                placeholder="Ex: Quartier Louis, Libreville"
                {...register("adresse")}
              >
                <TextField.Slot>
                  <MapPin size={14} style={{ color: "var(--gray-9)" }} />
                </TextField.Slot>
              </TextField.Root>
            </Box>
          </Flex>

          <Separator size="4" mb="4" />

          {/* Section : Informations légales */}
          <Flex align="center" gap="2" mb="3">
            <IdentificationBadge size={14} weight="bold" style={{ color: "var(--gray-9)" }} />
            <Text size="2" weight="bold" color="gray">
              Informations légales
            </Text>
          </Flex>

          <Grid2Cols style={{ marginBottom: 16 }}>
            <Box>
              <Text as="label" size="2" weight="medium" mb="1" style={{ display: "block" }}>
                NIF
              </Text>
              <TextField.Root placeholder="Numéro d'Identification Fiscale" {...register("nif")}>
                <TextField.Slot>
                  <FileText size={14} style={{ color: "var(--gray-9)" }} />
                </TextField.Slot>
              </TextField.Root>
            </Box>

            <Box>
              <Text as="label" size="2" weight="medium" mb="1" style={{ display: "block" }}>
                RCCM
              </Text>
              <TextField.Root
                placeholder="Registre du Commerce"
                {...register("rccm")}
              >
                <TextField.Slot>
                  <FileText size={14} style={{ color: "var(--gray-9)" }} />
                </TextField.Slot>
              </TextField.Root>
            </Box>
          </Grid2Cols>

          <Separator size="4" mb="4" />

          {/* Section : Plan d'abonnement */}
          <Flex align="center" gap="2" mb="3">
            <CreditCard size={14} weight="bold" style={{ color: "var(--gray-9)" }} />
            <Text size="2" weight="bold" color="gray">
              Plan d'abonnement
            </Text>
          </Flex>

          <Box mb="4">
            <Select.Root
              value={selectedPlan}
              onValueChange={(val) =>
                setValue("plan", val as CreateEtablissementFormValues["plan"])
              }
              size="2"
            >
              <Select.Trigger
                variant="surface"
                style={{ width: "100%" }}
              >
                {(selectedPlan && planLabels[selectedPlan]) || "Sélectionner un plan"}
              </Select.Trigger>
              <Select.Content position="popper">
                <Select.Item value="essentiel">Essentiel - Pour demarrer</Select.Item>
                <Select.Item value="pro">Pro - Commerces en croissance</Select.Item>
                <Select.Item value="business">Business - Entreprises etablies</Select.Item>
                <Select.Item value="enterprise">Enterprise - Grandes structures</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          {/* Boutons */}
          <Flex gap="3" mt="4" justify="end">
            <Button
              type="button"
              variant="soft"
              color="gray"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <SpinnerGap size={14} weight="bold" className="animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Buildings size={14} weight="bold" />
                  Créer l'établissement
                </>
              )}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

/**
 * Grille simple à 2 colonnes pour le formulaire
 */
function Grid2Cols({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
