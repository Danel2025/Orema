"use client";

/**
 * Étape 2 du wizard d'inscription: Informations établissement
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Flex, Text, TextField, TextArea } from "@radix-ui/themes";
import {
  StoreIcon,
  PhoneIcon,
  MapPinIcon,
  MailIcon,
  FileTextIcon,
  AlertCircleIcon,
  ArrowLeftIcon,
} from "lucide-react";
import {
  registerEtablissementSchema,
  type RegisterEtablissementInput,
} from "@/schemas/register.schema";

interface RegisterStepEtablissementProps {
  onSubmit: (data: RegisterEtablissementInput) => void;
  onBack: () => void;
  userEmail?: string;
  isLoading?: boolean;
}

export function RegisterStepEtablissement({
  onSubmit,
  onBack,
  userEmail,
  isLoading = false,
}: RegisterStepEtablissementProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterEtablissementInput>({
    resolver: zodResolver(registerEtablissementSchema),
    defaultValues: {
      nom: "",
      telephone: "",
      adresse: "",
      email: userEmail || "",
      nif: "",
      rccm: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap="4">
        {/* Nom établissement */}
        <Box>
          <label htmlFor="nom">
            <Text as="div" size="2" weight="medium" mb="2">
              Nom de l'établissement <Text color="red">*</Text>
            </Text>
          </label>
          <TextField.Root
            id="nom"
            type="text"
            placeholder="Restaurant Le Palmier"
            {...register("nom")}
            disabled={isLoading}
          >
            <TextField.Slot side="left">
              <StoreIcon size={16} />
            </TextField.Slot>
          </TextField.Root>
          {errors.nom ? (
            <Flex gap="1" align="center" mt="1">
              <AlertCircleIcon size={14} color="var(--red-9)" />
              <Text size="1" color="red">
                {errors.nom.message}
              </Text>
            </Flex>
          ) : null}
        </Box>

        {/* Téléphone */}
        <Box>
          <label htmlFor="telephone">
            <Text as="div" size="2" weight="medium" mb="2">
              Téléphone
            </Text>
          </label>
          <TextField.Root
            id="telephone"
            type="tel"
            placeholder="+241 01 23 45 67"
            {...register("telephone")}
            disabled={isLoading}
          >
            <TextField.Slot side="left">
              <PhoneIcon size={16} />
            </TextField.Slot>
          </TextField.Root>
          {errors.telephone ? (
            <Flex gap="1" align="center" mt="1">
              <AlertCircleIcon size={14} color="var(--red-9)" />
              <Text size="1" color="red">
                {errors.telephone.message}
              </Text>
            </Flex>
          ) : null}
        </Box>

        {/* Adresse */}
        <Box>
          <label htmlFor="adresse">
            <Text as="div" size="2" weight="medium" mb="2">
              Adresse
            </Text>
          </label>
          <TextArea
            id="adresse"
            placeholder="Quartier, Rue, Ville..."
            {...register("adresse")}
            disabled={isLoading}
            style={{ minHeight: "80px" }}
          />
          {errors.adresse ? (
            <Flex gap="1" align="center" mt="1">
              <AlertCircleIcon size={14} color="var(--red-9)" />
              <Text size="1" color="red">
                {errors.adresse.message}
              </Text>
            </Flex>
          ) : null}
        </Box>

        {/* Email établissement */}
        <Box>
          <label htmlFor="email">
            <Text as="div" size="2" weight="medium" mb="2">
              Email de l'établissement
            </Text>
          </label>
          <TextField.Root
            id="email"
            type="email"
            placeholder="contact@monrestaurant.ga"
            {...register("email")}
            disabled={isLoading}
          >
            <TextField.Slot side="left">
              <MailIcon size={16} />
            </TextField.Slot>
          </TextField.Root>
          {errors.email ? (
            <Flex gap="1" align="center" mt="1">
              <AlertCircleIcon size={14} color="var(--red-9)" />
              <Text size="1" color="red">
                {errors.email.message}
              </Text>
            </Flex>
          ) : null}
          <Text size="1" color="gray" mt="1">
            Laissez vide pour utiliser votre email personnel
          </Text>
        </Box>

        {/* NIF et RCCM sur la même ligne */}
        <Flex gap="4">
          {/* NIF */}
          <Box style={{ flex: 1 }}>
            <label htmlFor="nif">
              <Text as="div" size="2" weight="medium" mb="2">
                NIF
              </Text>
            </label>
            <TextField.Root
              id="nif"
              type="text"
              placeholder="Numéro fiscal"
              {...register("nif")}
              disabled={isLoading}
            >
              <TextField.Slot side="left">
                <FileTextIcon size={16} />
              </TextField.Slot>
            </TextField.Root>
            {errors.nif ? (
              <Flex gap="1" align="center" mt="1">
                <AlertCircleIcon size={14} color="var(--red-9)" />
                <Text size="1" color="red">
                  {errors.nif.message}
                </Text>
              </Flex>
            ) : null}
          </Box>

          {/* RCCM */}
          <Box style={{ flex: 1 }}>
            <label htmlFor="rccm">
              <Text as="div" size="2" weight="medium" mb="2">
                RCCM
              </Text>
            </label>
            <TextField.Root
              id="rccm"
              type="text"
              placeholder="Registre commerce"
              {...register("rccm")}
              disabled={isLoading}
            >
              <TextField.Slot side="left">
                <FileTextIcon size={16} />
              </TextField.Slot>
            </TextField.Root>
            {errors.rccm ? (
              <Flex gap="1" align="center" mt="1">
                <AlertCircleIcon size={14} color="var(--red-9)" />
                <Text size="1" color="red">
                  {errors.rccm.message}
                </Text>
              </Flex>
            ) : null}
          </Box>
        </Flex>

        <Text size="1" color="gray" style={{ marginTop: "-0.5rem" }}>
          Ces informations sont optionnelles et peuvent être complétées plus tard dans les
          paramètres.
        </Text>

        {/* Boutons */}
        <Flex gap="3" mt="2">
          <Button
            type="button"
            variant="soft"
            size="3"
            onClick={onBack}
            disabled={isLoading}
            style={{ flex: 1, cursor: isLoading ? "not-allowed" : "pointer" }}
          >
            <ArrowLeftIcon size={16} />
            Retour
          </Button>
          <Button
            type="submit"
            size="3"
            disabled={isLoading}
            style={{ flex: 2, cursor: isLoading ? "not-allowed" : "pointer" }}
          >
            {isLoading ? "Création en cours..." : "Créer mon établissement"}
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
