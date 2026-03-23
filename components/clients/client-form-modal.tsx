"use client";

/**
 * ClientFormModal - Modal de creation/edition de client
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  Button,
  Flex,
  Text,
  TextField,
  TextArea,
  Switch,
  Separator,
} from "@radix-ui/themes";
import { X, Loader2, User, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { clientSchema, type ClientFormData } from "@/schemas/client.schema";
import { createClient, updateClient } from "@/actions/clients";
import { toast } from "sonner";

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id: string;
    nom: string;
    prenom?: string | null;
    telephone?: string | null;
    email?: string | null;
    adresse?: string | null;
    creditAutorise: boolean;
    limitCredit?: number | null;
    actif: boolean;
  };
  onSuccess?: () => void;
}

export function ClientFormModal({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: ClientFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      nom: initialData?.nom || "",
      prenom: initialData?.prenom || "",
      telephone: initialData?.telephone || "",
      email: initialData?.email || "",
      adresse: initialData?.adresse || "",
      creditAutorise: initialData?.creditAutorise || false,
      limitCredit: initialData?.limitCredit || undefined,
      actif: initialData?.actif ?? true,
    },
  });

  const creditAutorise = watch("creditAutorise");

  const onSubmit = async (data: ClientFormData) => {
    setIsLoading(true);
    try {
      const result = isEditing
        ? await updateClient(initialData.id, data)
        : await createClient(data);

      if (result.success) {
        toast.success(isEditing ? "Client mis à jour avec succès" : "Client créé avec succès");
        reset();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="500px">
        <Dialog.Title>{isEditing ? "Modifier le client" : "Nouveau client"}</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          {isEditing
            ? "Modifiez les informations du client."
            : "Remplissez les informations pour créer un nouveau client."}
        </Dialog.Description>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            {/* Section: Informations personnelles */}
            <Flex direction="column" gap="3">
              <Text size="2" weight="medium" color="gray">
                Informations personnelles
              </Text>

              {/* Nom */}
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">
                  Nom *
                </Text>
                <TextField.Root
                  {...register("nom")}
                  placeholder="Ex: Ndong, Mba..."
                  color={errors.nom ? "red" : undefined}
                >
                  <TextField.Slot>
                    <User size={16} />
                  </TextField.Slot>
                </TextField.Root>
                {errors.nom ? (
                  <Text size="1" color="red">
                    {errors.nom.message}
                  </Text>
                ) : null}
              </Flex>

              {/* Prénom */}
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">
                  Prénom
                </Text>
                <TextField.Root {...register("prenom")} placeholder="Ex: Jean-Pierre, Marie..." />
              </Flex>

              {/* Téléphone */}
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">
                  Téléphone
                </Text>
                <TextField.Root
                  {...register("telephone")}
                  placeholder="Ex: +241 07 XX XX XX"
                  color={errors.telephone ? "red" : undefined}
                >
                  <TextField.Slot>
                    <Phone size={16} />
                  </TextField.Slot>
                </TextField.Root>
                {errors.telephone ? (
                  <Text size="1" color="red">
                    {errors.telephone.message}
                  </Text>
                ) : null}
              </Flex>

              {/* Email */}
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">
                  Email
                </Text>
                <TextField.Root
                  {...register("email")}
                  type="email"
                  placeholder="Ex: client@email.com"
                  color={errors.email ? "red" : undefined}
                >
                  <TextField.Slot>
                    <Mail size={16} />
                  </TextField.Slot>
                </TextField.Root>
                {errors.email ? (
                  <Text size="1" color="red">
                    {errors.email.message}
                  </Text>
                ) : null}
              </Flex>

              {/* Adresse */}
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">
                  Adresse
                </Text>
                <TextArea
                  {...register("adresse")}
                  placeholder="Ex: Quartier Louis, Libreville..."
                  rows={2}
                />
              </Flex>
            </Flex>

            <Separator size="4" />

            {/* Section: Crédit */}
            <Flex direction="column" gap="3">
              <Text size="2" weight="medium" color="gray">
                Options de crédit
              </Text>

              {/* Autoriser crédit */}
              <Flex align="center" justify="between">
                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium">
                    Autoriser le crédit
                  </Text>
                  <Text size="1" color="gray">
                    Permet au client d'acheter à crédit
                  </Text>
                </Flex>
                <Switch
                  checked={creditAutorise}
                  onCheckedChange={(checked) => setValue("creditAutorise", checked)}
                />
              </Flex>

              {/* Limite crédit */}
              {creditAutorise ? (
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">
                    Limite de crédit (FCFA)
                  </Text>
                  <TextField.Root
                    {...register("limitCredit")}
                    type="number"
                    placeholder="Ex: 50000"
                    min={0}
                    step={1000}
                  >
                    <TextField.Slot>
                      <Building2 size={16} />
                    </TextField.Slot>
                  </TextField.Root>
                </Flex>
              ) : null}
            </Flex>

            <Separator size="4" />

            {/* Section: Statut */}
            <Flex align="center" justify="between">
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">
                  Client actif
                </Text>
                <Text size="1" color="gray">
                  Les clients inactifs n'apparaissent pas dans la recherche
                </Text>
              </Flex>
              <Switch
                checked={watch("actif")}
                onCheckedChange={(checked) => setValue("actif", checked)}
              />
            </Flex>
          </Flex>

          {/* Actions */}
          <Flex gap="3" mt="5" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isLoading}>
                Annuler
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {isEditing ? "Enregistrer" : "Créer le client"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
