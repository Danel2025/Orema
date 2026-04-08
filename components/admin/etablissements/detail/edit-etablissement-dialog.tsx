"use client";

/**
 * Dialog d'edition des informations d'un etablissement
 * Utilise React Hook Form + Zod pour la validation
 */

import { useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Dialog,
  TextField,
} from "@radix-ui/themes";
import {
  PencilSimple,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { EtablissementDetail } from "./types";

const editEtablissementSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caracteres"),
  adresse: z.string().optional().or(z.literal("")),
  telephone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || /^[\d\s+()-]+$/.test(val),
      "Numéro de téléphone invalide"
    ),
  email: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Email invalide"
    ),
  nif: z.string().optional().or(z.literal("")),
  rccm: z.string().optional().or(z.literal("")),
});

type EditEtablissementFormData = z.infer<typeof editEtablissementSchema>;

interface EditEtablissementDialogProps {
  etablissement: EtablissementDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EditEtablissementFormData) => Promise<void>;
}

export function EditEtablissementDialog({
  etablissement,
  open,
  onOpenChange,
  onSubmit,
}: EditEtablissementDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditEtablissementFormData>({
    resolver: zodResolver(editEtablissementSchema),
    defaultValues: {
      nom: etablissement.nom || "",
      adresse: etablissement.adresse || "",
      telephone: etablissement.telephone || "",
      email: etablissement.email || "",
      nif: etablissement.nif || "",
      rccm: etablissement.rccm || "",
    },
  });

  // Reset form quand l'etablissement change
  useEffect(() => {
    reset({
      nom: etablissement.nom || "",
      adresse: etablissement.adresse || "",
      telephone: etablissement.telephone || "",
      email: etablissement.email || "",
      nif: etablissement.nif || "",
      rccm: etablissement.rccm || "",
    });
  }, [etablissement, reset]);

  const handleFormSubmit = async (data: EditEtablissementFormData) => {
    try {
      await onSubmit(data);
      toast.success("Établissement mis à jour");
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="520px">
        <Dialog.Title>
          <Flex align="center" gap="2">
            <PencilSimple size={20} weight="bold" style={{ color: "var(--accent-9)" }} />
            Modifier l'etablissement
          </Flex>
        </Dialog.Title>
        <Dialog.Description size="2" mb="4" color="gray">
          Modifiez les informations de l'etablissement "{etablissement.nom}".
        </Dialog.Description>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Flex direction="column" gap="4">
            {/* Nom */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="1" style={{ display: "block" }}>
                Nom de l'etablissement *
              </Text>
              <TextField.Root
                {...register("nom")}
                placeholder="Ex: Restaurant Le Soleil"
              />
              {errors.nom ? <Text size="1" color="red" mt="1" style={{ display: "block" }}>
                  {errors.nom.message}
                </Text> : null}
            </Box>

            {/* Adresse */}
            <Box>
              <Text as="label" size="2" weight="medium" mb="1" style={{ display: "block" }}>
                Adresse
              </Text>
              <TextField.Root
                {...register("adresse")}
                placeholder="Ex: 123 Rue de la Paix, Libreville"
              />
            </Box>

            {/* Telephone + Email */}
            <Flex gap="3">
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2" weight="medium" mb="1" style={{ display: "block" }}>
                  Telephone
                </Text>
                <TextField.Root
                  {...register("telephone")}
                  placeholder="Ex: +241 01 23 45 67"
                />
                {errors.telephone ? <Text size="1" color="red" mt="1" style={{ display: "block" }}>
                    {errors.telephone.message}
                  </Text> : null}
              </Box>
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2" weight="medium" mb="1" style={{ display: "block" }}>
                  Email
                </Text>
                <TextField.Root
                  {...register("email")}
                  type="email"
                  placeholder="Ex: contact@restaurant.ga"
                />
                {errors.email ? <Text size="1" color="red" mt="1" style={{ display: "block" }}>
                    {errors.email.message}
                  </Text> : null}
              </Box>
            </Flex>

            {/* NIF + RCCM */}
            <Flex gap="3">
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2" weight="medium" mb="1" style={{ display: "block" }}>
                  NIF
                </Text>
                <TextField.Root
                  {...register("nif")}
                  placeholder="Numéro d'Identification Fiscale"
                />
              </Box>
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2" weight="medium" mb="1" style={{ display: "block" }}>
                  RCCM
                </Text>
                <TextField.Root
                  {...register("rccm")}
                  placeholder="Registre du Commerce"
                />
              </Box>
            </Flex>
          </Flex>

          {/* Actions */}
          <Flex gap="3" mt="5" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isSubmitting}>
                Annuler
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <ArrowClockwise size={14} weight="bold" className="animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <PencilSimple size={14} weight="bold" />
                  Enregistrer
                </>
              )}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
