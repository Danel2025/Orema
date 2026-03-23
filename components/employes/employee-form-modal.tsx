"use client";

/**
 * Modal de création/édition d'un employé
 * Utilise React Hook Form + Zod pour la validation
 */

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, Button, Flex, Text, TextField, Select, Switch } from "@radix-ui/themes";
import { CircleNotch, UserPlus, FloppyDisk, Eye, EyeSlash } from "@phosphor-icons/react";
import { toast } from "sonner";

import {
  createEmployeSchema,
  updateEmployeSchema,
  ROLES,
  ROLE_LABELS,
  type CreateEmployeInput,
  type UpdateEmployeInput,
  type RoleType,
} from "@/schemas/employe";
import { createEmploye, updateEmploye, generateRandomPin } from "@/actions/employes";

interface EmployeeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    actif: boolean;
  };
  onSuccess?: () => void;
}

type FormData = CreateEmployeInput | UpdateEmployeInput;

export function EmployeeFormModal({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EmployeeFormModalProps) {
  const isEditing = !!employee;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(isEditing ? updateEmployeSchema : createEmployeSchema) as any,
    defaultValues: isEditing
      ? {
          id: employee.id,
          nom: employee.nom,
          prenom: employee.prenom,
          email: employee.email,
          role: employee.role as RoleType,
          actif: employee.actif,
        }
      : {
          nom: "",
          prenom: "",
          email: "",
          role: "CAISSIER" as RoleType,
          password: "",
          pinCode: "",
          actif: true,
        },
  });

  // Reset form when employee changes
  useEffect(() => {
    if (employee) {
      reset({
        id: employee.id,
        nom: employee.nom,
        prenom: employee.prenom,
        email: employee.email,
        role: employee.role as RoleType,
        actif: employee.actif,
      });
    } else {
      reset({
        nom: "",
        prenom: "",
        email: "",
        role: "CAISSIER" as RoleType,
        password: "",
        pinCode: "",
        actif: true,
      });
    }
  }, [employee, reset]);

  const handleGeneratePin = async () => {
    const pin = await generateRandomPin();
    setValue("pinCode" as keyof FormData, pin);
    setShowPin(true);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      if (isEditing) {
        const result = await updateEmploye(data as UpdateEmployeInput);
        if (result.success) {
          toast.success("Employé mis à jour avec succès");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(result.error || "Erreur lors de la mise à jour");
        }
      } else {
        const result = await createEmploye(data as CreateEmployeInput);
        if (result.success) {
          toast.success("Employé créé avec succès");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(result.error || "Erreur lors de la création");
        }
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="500px">
        <Dialog.Title>{isEditing ? "Modifier l'employé" : "Nouvel employé"}</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          {isEditing
            ? "Modifiez les informations de l'employé"
            : "Remplissez les informations du nouvel employé"}
        </Dialog.Description>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            {/* Nom et Prénom */}
            <Flex gap="3">
              <Flex direction="column" gap="1" style={{ flex: 1 }}>
                <Text as="label" size="2" weight="medium">
                  Nom *
                </Text>
                <TextField.Root {...register("nom")} placeholder="Nom de famille" />
                {errors.nom ? (
                  <Text size="1" color="red">
                    {errors.nom.message}
                  </Text>
                ) : null}
              </Flex>

              <Flex direction="column" gap="1" style={{ flex: 1 }}>
                <Text as="label" size="2" weight="medium">
                  Prénom *
                </Text>
                <TextField.Root {...register("prenom")} placeholder="Prénom" />
                {errors.prenom ? (
                  <Text size="1" color="red">
                    {errors.prenom.message}
                  </Text>
                ) : null}
              </Flex>
            </Flex>

            {/* Email */}
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">
                Email *
              </Text>
              <TextField.Root {...register("email")} type="email" placeholder="email@exemple.com" />
              {errors.email ? (
                <Text size="1" color="red">
                  {errors.email.message}
                </Text>
              ) : null}
            </Flex>

            {/* Rôle */}
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">
                Rôle *
              </Text>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select.Root value={field.value} onValueChange={field.onChange}>
                    <Select.Trigger placeholder="Sélectionnez un rôle" />
                    <Select.Content position="popper">
                      {ROLES.map((role) => (
                        <Select.Item key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              />
              {errors.role ? (
                <Text size="1" color="red">
                  {errors.role.message}
                </Text>
              ) : null}
            </Flex>

            {/* Mot de passe (creation uniquement) */}
            {!isEditing && (
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium">
                  Mot de passe *
                </Text>
                <TextField.Root
                  {...register("password" as keyof FormData)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 caractères"
                >
                  <TextField.Slot side="right">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                      }}
                    >
                      {showPassword ? (
                        <EyeSlash size={16} style={{ color: "var(--gray-9)" }} />
                      ) : (
                        <Eye size={16} style={{ color: "var(--gray-9)" }} />
                      )}
                    </button>
                  </TextField.Slot>
                </TextField.Root>
                {(errors as Record<string, { message?: string }>).password ? (
                  <Text size="1" color="red">
                    {(errors as Record<string, { message?: string }>).password?.message}
                  </Text>
                ) : null}
                <Text size="1" color="gray">
                  Majuscule, minuscule et chiffre requis
                </Text>
              </Flex>
            )}

            {/* Code PIN (creation uniquement) */}
            {!isEditing && (
              <Flex direction="column" gap="1">
                <Flex justify="between" align="center">
                  <Text as="label" size="2" weight="medium">
                    Code PIN (optionnel)
                  </Text>
                  <Button type="button" variant="ghost" size="1" onClick={handleGeneratePin}>
                    Générer
                  </Button>
                </Flex>
                <TextField.Root
                  {...register("pinCode" as keyof FormData)}
                  type={showPin ? "text" : "password"}
                  placeholder="4 à 6 chiffres"
                  maxLength={6}
                >
                  <TextField.Slot side="right">
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                      }}
                    >
                      {showPin ? (
                        <EyeSlash size={16} style={{ color: "var(--gray-9)" }} />
                      ) : (
                        <Eye size={16} style={{ color: "var(--gray-9)" }} />
                      )}
                    </button>
                  </TextField.Slot>
                </TextField.Root>
                {(errors as Record<string, { message?: string }>).pinCode ? (
                  <Text size="1" color="red">
                    {(errors as Record<string, { message?: string }>).pinCode?.message}
                  </Text>
                ) : null}
                <Text size="1" color="gray">
                  Pour connexion rapide a la caisse
                </Text>
              </Flex>
            )}

            {/* Statut actif */}
            <Flex direction="column" gap="1">
              <Controller
                name="actif"
                control={control}
                render={({ field }) => (
                  <Text as="label" size="2">
                    <Flex gap="2" align="center">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      <Text weight="medium">Compte actif</Text>
                    </Flex>
                  </Text>
                )}
              />
              <Text size="1" color="gray">
                Un compte désactivé ne peut pas se connecter
              </Text>
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
                <CircleNotch className="animate-spin" size={16} />
              ) : isEditing ? (
                <FloppyDisk size={16} />
              ) : (
                <UserPlus size={16} />
              )}
              {isEditing ? "Enregistrer" : "Créer"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
