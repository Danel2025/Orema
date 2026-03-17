"use client";

/**
 * EtablissementSettings - Parametres de l'etablissement
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Card,
  Flex,
  Text,
  TextField,
  TextArea,
  Button,
  Callout,
} from "@radix-ui/themes";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

import { updateEtablissement } from "@/actions/parametres";
import {
  etablissementSchema,
  type EtablissementFormData,
} from "@/schemas/parametres.schema";

interface EtablissementSettingsProps {
  initialData: {
    id: string;
    nom: string;
    adresse?: string | null;
    telephone?: string | null;
    email?: string | null;
    nif?: string | null;
    rccm?: string | null;
    logo?: string | null;
    messageTicket?: string | null;
  };
}

export function EtablissementSettings({ initialData }: EtablissementSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
   
  } = useForm<EtablissementFormData>({
    resolver: zodResolver(etablissementSchema) as any,
    defaultValues: {
      nom: initialData.nom,
      adresse: initialData.adresse || "",
      telephone: initialData.telephone || "",
      email: initialData.email || "",
      nif: initialData.nif || "",
      rccm: initialData.rccm || "",
      logo: initialData.logo || "",
      messageTicket: initialData.messageTicket || "",
    },
  });

  const onSubmit = async (data: EtablissementFormData) => {
    setIsLoading(true);
    setSaveStatus("idle");

    try {
      const result = await updateEtablissement(data);

      if (result.success) {
        setSaveStatus("success");
        toast.success("Parametres enregistres avec succes");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        toast.error(result.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      setSaveStatus("error");
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap="5">
        {/* Informations principales */}
        <Card size="3">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Building2 size={20} style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Informations de l'etablissement
              </Text>
            </Flex>

            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Nom de l'etablissement *
              </Text>
              <TextField.Root
                {...register("nom")}
                placeholder="Ex: Restaurant Le Coeur de Libreville"
                size="3"
              />
              {errors.nom ? <Text size="1" color="red" mt="1">
                  {errors.nom.message}
                </Text> : null}
            </Box>

            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                <Flex align="center" gap="1">
                  <MapPin size={14} />
                  Adresse
                </Flex>
              </Text>
              <TextArea
                {...register("adresse")}
                placeholder="Adresse complete de l'etablissement"
                rows={2}
              />
            </Box>

            <Flex gap="4" wrap="wrap">
              <Box style={{ flex: "1 1 200px" }}>
                <Text as="label" size="2" weight="medium" mb="1">
                  <Flex align="center" gap="1">
                    <Phone size={14} />
                    Telephone
                  </Flex>
                </Text>
                <TextField.Root
                  {...register("telephone")}
                  placeholder="+241 XX XX XX XX"
                  size="3"
                />
              </Box>

              <Box style={{ flex: "1 1 200px" }}>
                <Text as="label" size="2" weight="medium" mb="1">
                  <Flex align="center" gap="1">
                    <Mail size={14} />
                    Email
                  </Flex>
                </Text>
                <TextField.Root
                  {...register("email")}
                  type="email"
                  placeholder="contact@example.com"
                  size="3"
                />
                {errors.email ? <Text size="1" color="red" mt="1">
                    {errors.email.message}
                  </Text> : null}
              </Box>
            </Flex>
          </Flex>
        </Card>

        {/* Informations fiscales */}
        <Card size="3">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <FileText size={20} style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Informations fiscales (Gabon)
              </Text>
            </Flex>

            <Callout.Root color="violet" size="1">
              <Callout.Icon>
                <AlertCircle size={16} />
              </Callout.Icon>
              <Callout.Text>
                Ces informations apparaitront sur vos tickets de caisse et factures.
              </Callout.Text>
            </Callout.Root>

            <Flex gap="4" wrap="wrap">
              <Box style={{ flex: "1 1 200px" }}>
                <Text as="label" size="2" weight="medium" mb="1">
                  NIF (Numero d'Identification Fiscale)
                </Text>
                <TextField.Root
                  {...register("nif")}
                  placeholder="Ex: 123456789A"
                  size="3"
                />
                {errors.nif ? <Text size="1" color="red" mt="1">
                    {errors.nif.message}
                  </Text> : null}
              </Box>

              <Box style={{ flex: "1 1 200px" }}>
                <Text as="label" size="2" weight="medium" mb="1">
                  RCCM (Registre du Commerce)
                </Text>
                <TextField.Root
                  {...register("rccm")}
                  placeholder="Ex: GA-LBV-01-2024-B12-00001"
                  size="3"
                />
                {errors.rccm ? <Text size="1" color="red" mt="1">
                    {errors.rccm.message}
                  </Text> : null}
              </Box>
            </Flex>
          </Flex>
        </Card>

        {/* Logo et personnalisation */}
        <Card size="3">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <ImageIcon size={20} style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Personnalisation des tickets
              </Text>
            </Flex>

            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                URL du logo
              </Text>
              <TextField.Root
                {...register("logo")}
                placeholder="https://example.com/logo.png"
                size="3"
              >
                <TextField.Slot>
                  <Upload size={16} />
                </TextField.Slot>
              </TextField.Root>
              <Text size="1" color="gray" mt="1">
                Le logo apparaitra en haut de vos tickets (format recommande: PNG ou JPEG, max 200x100px)
              </Text>
            </Box>

            <Box>
              <Text as="label" size="2" weight="medium" mb="1">
                Message de remerciement
              </Text>
              <TextArea
                {...register("messageTicket")}
                placeholder="Ex: Merci de votre visite ! A bientot chez nous."
                rows={2}
              />
              <Text size="1" color="gray" mt="1">
                Ce message apparaitra en bas de chaque ticket de caisse
              </Text>
            </Box>
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
          <Button
            type="submit"
            size="3"
            disabled={isLoading || !isDirty}
           
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Enregistrer les modifications
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
