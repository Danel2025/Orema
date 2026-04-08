"use client";

/**
 * ReviewForm - Formulaire de soumission d'avis client
 * Avec StarRating interactif, validation Zod + React Hook Form
 */

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Flex,
  Text,
  TextField,
  TextArea,
  Select,
  Callout,
} from "@radix-ui/themes";
import { PaperPlaneTilt, Check, SpinnerGap } from "@phosphor-icons/react";
import { StarRating } from "./star-rating";
import {
  avisSchema,
  TYPE_REPAS,
  TYPE_REPAS_LABELS,
  type AvisFormData,
} from "@/schemas/avis.schema";

interface ReviewFormProps {
  etablissementId: string;
  onSubmit: (data: AvisFormData) => Promise<{ success: boolean; error?: string }>;
}

export function ReviewForm({ etablissementId, onSubmit }: ReviewFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AvisFormData>({
    resolver: zodResolver(avisSchema),
    defaultValues: {
      note: 0,
      contenu: "",
      client_prenom: "",
      type_repas: undefined,
    },
  });

  const handleFormSubmit = async (data: AvisFormData) => {
    setStatus("loading");
    setErrorMessage("");

    try {
      const result = await onSubmit(data);

      if (result.success) {
        setStatus("success");
        reset();
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Une erreur est survenue");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  if (status === "success") {
    return (
      <Flex
        direction="column"
        align="center"
        gap="3"
        py="6"
        style={{ textAlign: "center" }}
      >
        <Flex
          align="center"
          justify="center"
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--green-a3)",
          }}
        >
          <Check size={28} weight="bold" style={{ color: "var(--green-9)" }} />
        </Flex>
        <Text size="4" weight="bold">
          Merci pour votre avis !
        </Text>
        <Text size="2" color="gray">
          Votre retour nous aide à améliorer notre service.
        </Text>
        <Button
          variant="soft"
          mt="2"
          onClick={() => {
            setStatus("idle");
            reset();
          }}
        >
          Laisser un autre avis
        </Button>
      </Flex>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Flex direction="column" gap="4">
        {/* Note avec étoiles */}
        <Flex direction="column" gap="2">
          <Text as="label" size="2" weight="medium">
            Votre note *
          </Text>
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <StarRating
                value={field.value}
                onChange={field.onChange}
                size={32}
              />
            )}
          />
          {errors.note ? (
            <Text size="1" color="red">
              {errors.note.message}
            </Text>
          ) : null}
        </Flex>

        {/* Prénom (optionnel) */}
        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium">
            Votre prénom
          </Text>
          <TextField.Root
            {...register("client_prenom")}
            placeholder="Ex : Marie, Jean-Pierre..."
            color={errors.client_prenom ? "red" : undefined}
          />
          {errors.client_prenom ? (
            <Text size="1" color="red">
              {errors.client_prenom.message}
            </Text>
          ) : null}
        </Flex>

        {/* Type de repas */}
        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium">
            Type de repas
          </Text>
          <Controller
            name="type_repas"
            control={control}
            render={({ field }) => (
              <Select.Root
                value={field.value || ""}
                onValueChange={(val) =>
                  field.onChange(val === "" ? undefined : val)
                }
              >
                <Select.Trigger placeholder="Sélectionnez un repas" />
                <Select.Content position="popper">
                  {TYPE_REPAS.map((type) => (
                    <Select.Item key={type} value={type}>
                      {TYPE_REPAS_LABELS[type]}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            )}
          />
        </Flex>

        {/* Contenu de l'avis */}
        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium">
            Votre avis *
          </Text>
          <TextArea
            {...register("contenu")}
            placeholder="Partagez votre expérience..."
            rows={4}
            color={errors.contenu ? "red" : undefined}
          />
          {errors.contenu ? (
            <Text size="1" color="red">
              {errors.contenu.message}
            </Text>
          ) : null}
        </Flex>

        {/* Message d'erreur */}
        {status === "error" && errorMessage ? (
          <Callout.Root color="red" size="1">
            <Callout.Text>{errorMessage}</Callout.Text>
          </Callout.Root>
        ) : null}

        {/* Bouton submit */}
        <Button type="submit" disabled={status === "loading"} size="3">
          {status === "loading" ? (
            <SpinnerGap size={18} className="animate-spin" />
          ) : (
            <PaperPlaneTilt size={18} />
          )}
          {status === "loading" ? "Envoi en cours..." : "Envoyer mon avis"}
        </Button>
      </Flex>
    </form>
  );
}
