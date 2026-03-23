"use client";

/**
 * SecuriteSettings - Paramètres de sécurité
 */

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Flex,
  Text,
  TextField,
  Switch,
  Button,
  Callout,
  Select,
  Checkbox,
} from "@radix-ui/themes";
import {
  ShieldCheck,
  Key,
  Clock,
  FileText,
  FloppyDisk,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  Info,
  Lock,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { updateSecuriteSettings } from "@/actions/parametres";
import {
  securiteSettingsSchema,
  longueurPinOptions,
  actionAuditOptions,
  type SecuriteSettingsFormData,
} from "@/schemas/parametres.schema";

interface SecuriteSettingsProps {
  initialData: SecuriteSettingsFormData;
}

export function SecuriteSettings({ initialData }: SecuriteSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<SecuriteSettingsFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(securiteSettingsSchema) as any,
    defaultValues: initialData,
  });

  const auditActif = watch("auditActif");

  const onSubmit = async (data: SecuriteSettingsFormData) => {
    setIsLoading(true);
    setSaveStatus("idle");

    try {
      const result = await updateSecuriteSettings(data);

      if (result.success) {
        setSaveStatus("success");
        toast.success("Paramètres de sécurité enregistrés");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        toast.error(result.error || "Erreur lors de l'enregistrement");
      }
    } catch {
      setSaveStatus("error");
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap="5">
        {/* Information */}
        <Callout.Root color="amber" size="2">
          <Callout.Icon>
            <ShieldCheck size={18} weight="duotone" />
          </Callout.Icon>
          <Callout.Text>
            <Text weight="bold">Paramètres de sécurité</Text>
            <br />
            Ces parametres affectent la securite de votre systeme. Modifiez-les avec precaution.
          </Callout.Text>
        </Callout.Root>

        {/* Code PIN */}
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Key size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Code PIN
              </Text>
            </Flex>

            <Controller
              name="longueurPinMinimum"
              control={control}
              render={({ field }) => (
                <Box>
                  <Text as="label" size="2" weight="medium" mb="2">
                    Longueur minimale du code PIN
                  </Text>
                  <Select.Root
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <Select.Trigger style={{ width: "200px" }} />
                    <Select.Content position="popper">
                      {longueurPinOptions.map((option) => (
                        <Select.Item key={option.value} value={String(option.value)}>
                          {option.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                  <Text size="1" color="gray" mt="1">
                    Les caissiers devront saisir un PIN d'au moins cette longueur
                  </Text>
                </Box>
              )}
            />
          </Flex>
        </Box>

        {/* Protection contre les attaques */}
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Lock size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Protection contre les attaques
              </Text>
            </Flex>

            <Flex gap="4" wrap="wrap">
              <Box style={{ flex: "1 1 200px" }}>
                <Text as="label" size="2" weight="medium" mb="2">
                  Tentatives de connexion max
                </Text>
                <TextField.Root
                  {...register("tentativesLoginMax")}
                  type="number"
                  min="1"
                  max="10"
                  size="3"
                  placeholder="5"
                />
                {errors.tentativesLoginMax ? (
                  <Text size="1" color="red" mt="1">
                    {errors.tentativesLoginMax.message}
                  </Text>
                ) : null}
                <Text size="1" color="gray" mt="1">
                  Nombre d'echecs avant blocage
                </Text>
              </Box>

              <Box style={{ flex: "1 1 200px" }}>
                <Text as="label" size="2" weight="medium" mb="2">
                  Duree de blocage (minutes)
                </Text>
                <TextField.Root
                  {...register("dureeBlocage")}
                  type="number"
                  min="1"
                  max="1440"
                  size="3"
                  placeholder="15"
                />
                {errors.dureeBlocage ? (
                  <Text size="1" color="red" mt="1">
                    {errors.dureeBlocage.message}
                  </Text>
                ) : null}
                <Text size="1" color="gray" mt="1">
                  Temps de blocage apres trop de tentatives
                </Text>
              </Box>
            </Flex>
          </Flex>
        </Box>

        {/* Session */}
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Clock size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Gestion de session
              </Text>
            </Flex>

            <Box>
              <Text as="label" size="2" weight="medium" mb="2">
                Timeout de session (minutes)
              </Text>
              <TextField.Root
                {...register("sessionTimeout")}
                type="number"
                min="5"
                max="480"
                size="3"
                placeholder="30"
              />
              {errors.sessionTimeout ? (
                <Text size="1" color="red" mt="1">
                  {errors.sessionTimeout.message}
                </Text>
              ) : null}
              <Text size="1" color="gray" mt="1">
                Deconnexion automatique apres inactivite
              </Text>
            </Box>
          </Flex>
        </Box>

        {/* Audit */}
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <FileText size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Journal d'audit
              </Text>
            </Flex>

            <Controller
              name="auditActif"
              control={control}
              render={({ field }) => (
                <Flex align="center" justify="between">
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">
                      Activer le journal d'audit
                    </Text>
                    <Text size="1" color="gray">
                      Enregistrer les actions importantes pour la tracabilite
                    </Text>
                  </Flex>
                  <Switch size="3" checked={field.value} onCheckedChange={field.onChange} />
                </Flex>
              )}
            />

            {auditActif ? (
              <>
                <Box
                  style={{
                    borderTop: "1px solid var(--gray-5)",
                    paddingTop: "16px",
                  }}
                >
                  <Text size="2" weight="medium" mb="3">
                    Actions a enregistrer :
                  </Text>
                  <Controller
                    name="actionsALogger"
                    control={control}
                    render={({ field }) => (
                      <Flex direction="column" gap="2">
                        {actionAuditOptions.map((option) => (
                          <Flex key={option.value} align="center" gap="2">
                            <Checkbox
                              checked={field.value.includes(option.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, option.value]);
                                } else {
                                  field.onChange(field.value.filter((v) => v !== option.value));
                                }
                              }}
                            />
                            <Text size="2">{option.label}</Text>
                          </Flex>
                        ))}
                      </Flex>
                    )}
                  />
                  {errors.actionsALogger ? (
                    <Text size="1" color="red" mt="2">
                      {errors.actionsALogger.message}
                    </Text>
                  ) : null}
                </Box>

                <Callout.Root color="blue" size="1">
                  <Callout.Icon>
                    <Info size={14} />
                  </Callout.Icon>
                  <Callout.Text size="1">
                    Le journal d'audit est accessible depuis Rapports &gt; Journal d'audit
                  </Callout.Text>
                </Callout.Root>
              </>
            ) : null}
          </Flex>
        </Box>

        {/* Bouton de sauvegarde */}
        <Flex justify="end" gap="3" align="center">
          {saveStatus === "success" && (
            <Flex align="center" gap="2">
              <CheckCircle size={16} weight="fill" className="text-green-500" />
              <Text size="2" color="green">
                Enregistre
              </Text>
            </Flex>
          )}
          {saveStatus === "error" && (
            <Flex align="center" gap="2">
              <WarningCircle size={16} weight="fill" className="text-red-500" />
              <Text size="2" color="red">
                Erreur d'enregistrement
              </Text>
            </Flex>
          )}
          <Button type="submit" size="3" disabled={isLoading}>
            {isLoading ? <CircleNotch size={16} className="animate-spin" /> : <FloppyDisk size={16} />}
            Enregistrer les parametres de securite
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
