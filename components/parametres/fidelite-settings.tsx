"use client";

/**
 * FideliteSettings - Parametres du programme de fidelite
 */

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Card,
  Flex,
  Text,
  TextField,
  Switch,
  Button,
  Callout,
  Badge,
} from "@radix-ui/themes";
import {
  Gift,
  Star,
  CreditCard,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { updateFideliteSettings } from "@/actions/parametres";
import {
  fideliteSettingsSchema,
  type FideliteSettingsFormData,
} from "@/schemas/parametres.schema";

interface FideliteSettingsProps {
  initialData: FideliteSettingsFormData;
}

export function FideliteSettings({ initialData }: FideliteSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<FideliteSettingsFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(fideliteSettingsSchema) as any,
    defaultValues: initialData,
  });

  const fideliteActif = watch("fideliteActif");
  const creditActif = watch("creditClientActif");
  const tauxPoints = watch("tauxPointsFidelite");
  const valeurPoint = watch("valeurPointFidelite");

  const onSubmit = async (data: FideliteSettingsFormData) => {
    setIsLoading(true);
    setSaveStatus("idle");

    try {
      const result = await updateFideliteSettings(data);

      if (result.success) {
        setSaveStatus("success");
        toast.success("Parametres de fidelite enregistres");
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

  // Calcul exemple
  const exempleAchat = 10000; // 10 000 FCFA
  const pointsGagnes = Math.floor(exempleAchat / valeurPoint) * tauxPoints;
  const valeurPoints = pointsGagnes * valeurPoint;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap="5">
        {/* Information */}
        <Callout.Root color="blue" size="2">
          <Callout.Icon>
            <Info size={18} />
          </Callout.Icon>
          <Callout.Text>
            <Text weight="bold">Programme de fidelite</Text>
            <br />
            Configurez votre programme de fidelite pour recompenser vos clients reguliers
            et augmenter leur engagement.
          </Callout.Text>
        </Callout.Root>

        {/* Activation du programme */}
        <Card size="3">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Gift size={20} style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Programme de fidelite
              </Text>
              {fideliteActif ? (
                <Badge color="green">Actif</Badge>
              ) : (
                <Badge color="gray">Inactif</Badge>
              )}
            </Flex>

            <Controller
              name="fideliteActif"
              control={control}
              render={({ field }) => (
                <Flex align="center" justify="between">
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">
                      Activer le programme de fidelite
                    </Text>
                    <Text size="1" color="gray">
                      Les clients accumuleront des points a chaque achat
                    </Text>
                  </Flex>
                  <Switch
                    size="3"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Flex>
              )}
            />
          </Flex>
        </Card>

        {/* Configuration des points */}
        {fideliteActif ? <Card size="3">
            <Flex direction="column" gap="4">
              <Flex align="center" gap="2">
                <Star size={20} style={{ color: "var(--accent-9)" }} />
                <Text size="4" weight="bold">
                  Configuration des points
                </Text>
              </Flex>

              <Flex gap="4" wrap="wrap">
                <Box style={{ flex: "1 1 200px" }}>
                  <Text as="label" size="2" weight="medium" mb="2">
                    Taux de points
                  </Text>
                  <TextField.Root
                    {...register("tauxPointsFidelite")}
                    type="number"
                    min="1"
                    max="100"
                    size="3"
                    placeholder="1"
                  />
                  {errors.tauxPointsFidelite ? <Text size="1" color="red" mt="1">
                      {errors.tauxPointsFidelite.message}
                    </Text> : null}
                  <Text size="1" color="gray" mt="1">
                    Points gagnes par tranche
                  </Text>
                </Box>

                <Box style={{ flex: "1 1 200px" }}>
                  <Text as="label" size="2" weight="medium" mb="2">
                    Valeur du point (FCFA)
                  </Text>
                  <TextField.Root
                    {...register("valeurPointFidelite")}
                    type="number"
                    min="1"
                    size="3"
                    placeholder="100"
                  />
                  {errors.valeurPointFidelite ? <Text size="1" color="red" mt="1">
                      {errors.valeurPointFidelite.message}
                    </Text> : null}
                  <Text size="1" color="gray" mt="1">
                    1 point = X FCFA de remise
                  </Text>
                </Box>
              </Flex>

              <Box style={{ flex: "1 1 200px" }}>
                <Text as="label" size="2" weight="medium" mb="2">
                  Duree de validite du solde (jours)
                </Text>
                <TextField.Root
                  {...register("dureeValiditeSolde")}
                  type="number"
                  min="1"
                  max="3650"
                  size="3"
                  placeholder="365"
                >
                  <TextField.Slot side="right">
                    <Calendar size={16} />
                  </TextField.Slot>
                </TextField.Root>
                {errors.dureeValiditeSolde ? <Text size="1" color="red" mt="1">
                    {errors.dureeValiditeSolde.message}
                  </Text> : null}
                <Text size="1" color="gray" mt="1">
                  Les points expirent apres cette duree d'inactivite
                </Text>
              </Box>

              {/* Exemple de calcul */}
              <Box
                style={{
                  backgroundColor: "var(--gray-a2)",
                  padding: "16px",
                  borderRadius: "8px",
                }}
              >
                <Text size="2" weight="medium" mb="2">
                  Exemple de calcul :
                </Text>
                <Flex direction="column" gap="1">
                  <Text size="2">
                    Pour un achat de <strong>{exempleAchat.toLocaleString()} FCFA</strong> :
                  </Text>
                  <Text size="2">
                    Points gagnes : <strong>{pointsGagnes} points</strong>
                  </Text>
                  <Text size="2">
                    Valeur potentielle : <strong>{valeurPoints.toLocaleString()} FCFA</strong> de remise
                  </Text>
                </Flex>
              </Box>
            </Flex>
          </Card> : null}

        {/* Credit client */}
        <Card size="3">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <CreditCard size={20} style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Credit client
              </Text>
              {creditActif ? (
                <Badge color="green">Actif</Badge>
              ) : (
                <Badge color="gray">Inactif</Badge>
              )}
            </Flex>

            <Controller
              name="creditClientActif"
              control={control}
              render={({ field }) => (
                <Flex align="center" justify="between">
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">
                      Autoriser le credit client
                    </Text>
                    <Text size="1" color="gray">
                      Permettre aux clients de payer a credit (selon leur limite)
                    </Text>
                  </Flex>
                  <Switch
                    size="3"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Flex>
              )}
            />

            {creditActif ? <Box>
                <Text as="label" size="2" weight="medium" mb="2">
                  Limite de credit par defaut (FCFA)
                </Text>
                <TextField.Root
                  {...register("limiteCreditDefaut")}
                  type="number"
                  min="0"
                  size="3"
                  placeholder="0"
                />
                {errors.limiteCreditDefaut ? <Text size="1" color="red" mt="1">
                    {errors.limiteCreditDefaut.message}
                  </Text> : null}
                <Text size="1" color="gray" mt="1">
                  0 = pas de credit par defaut (a definir par client)
                </Text>
              </Box> : null}

            {creditActif ? <Callout.Root color="amber" size="1">
                <Callout.Icon>
                  <AlertCircle size={14} />
                </Callout.Icon>
                <Callout.Text size="1">
                  Le credit client peut etre ajuste individuellement depuis la fiche de chaque client.
                </Callout.Text>
              </Callout.Root> : null}
          </Flex>
        </Card>

        {/* Bouton de sauvegarde */}
        <Flex justify="end" gap="3" align="center">
          {saveStatus === "success" && (
            <Flex align="center" gap="2">
              <CheckCircle2 size={16} className="text-green-500" />
              <Text size="2" color="green">
                Enregistre
              </Text>
            </Flex>
          )}
          {saveStatus === "error" && (
            <Flex align="center" gap="2">
              <AlertCircle size={16} className="text-red-500" />
              <Text size="2" color="red">
                Erreur d'enregistrement
              </Text>
            </Flex>
          )}
          <Button type="submit" size="3" disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Enregistrer les parametres de fidelite
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
