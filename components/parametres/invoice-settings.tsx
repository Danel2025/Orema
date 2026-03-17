"use client";

/**
 * InvoiceSettings - Paramètres de personnalisation des factures/tickets
 * Permet de configurer le type de facture par défaut et les options d'affichage
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
  Select,
  Switch,
  Button,
  Tabs,
  Callout,
  Badge,
  Separator,
  TextArea,
} from "@radix-ui/themes";
import {
  Receipt,
  FileText,
  Settings2,
  Save,
  Loader2,
  CheckCircle2,
  Image,
  Building2,
  Hash,
  QrCode,
  Minus,
  Copy,
  FileCheck,
  ClipboardList,
  ScrollText,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import { updateParametresFacture } from "@/actions/parametres";
import {
  parametresFactureSchema,
  typeFactureOptions,
  styleSeparateurOptions,
  copiesOptions,
  type ParametresFactureFormData,
  type TypeFacture,
} from "@/schemas/parametres.schema";
import { TicketPreview } from "./ticket-preview";

interface InvoiceSettingsProps {
  initialData: ParametresFactureFormData;
}

// Icône pour chaque type de facture
const getTypeIcon = (type: TypeFacture) => {
  switch (type) {
    case "TICKET_SIMPLE":
      return <Receipt size={18} />;
    case "FACTURE_DETAILLEE":
      return <FileText size={18} />;
    case "PRO_FORMA":
      return <FileCheck size={18} />;
    case "NOTE_ADDITION":
      return <ClipboardList size={18} />;
    default:
      return <Receipt size={18} />;
  }
};

export function InvoiceSettings({ initialData }: InvoiceSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [previewType, setPreviewType] = useState<TypeFacture>(initialData.typeFactureDefaut);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<ParametresFactureFormData>({
    // @ts-expect-error - Type mismatch between zod input/output due to .default()
    resolver: zodResolver(parametresFactureSchema),
    defaultValues: initialData,
  });

  // Observer toutes les valeurs pour la prévisualisation en temps réel
  const watchedValues = watch();
  const typeFactureDefaut = watchedValues.typeFactureDefaut;

  const onSubmit = async (data: ParametresFactureFormData) => {
    setIsLoading(true);
    setSaveStatus("idle");

    try {
      const result = await updateParametresFacture(data);

      if (result.success) {
        setSaveStatus("success");
        toast.success("Paramètres de facturation enregistrés");
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)}>
      <Flex direction="column" gap="5">
        {/* En-tête avec bouton de sauvegarde */}
        <Flex justify="between" align="center" wrap="wrap" gap="3">
          <Flex direction="column" gap="1">
            <Flex align="center" gap="2">
              <Receipt size={20} />
              <Text size="4" weight="bold">
                Paramètres de facturation
              </Text>
            </Flex>
            <Text size="2" color="gray">
              Personnalisez l'apparence et le contenu de vos tickets et factures
            </Text>
          </Flex>
          <Button type="submit" size="3" disabled={isLoading || !isDirty}>
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : saveStatus === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <Save size={16} />
            )}
            {saveStatus === "success" ? "Enregistré" : "Enregistrer"}
          </Button>
        </Flex>

        {/* Layout en 2 colonnes: Paramètres + Aperçu */}
        <Flex gap="5" direction={{ initial: "column", lg: "row" }}>
          {/* Colonne gauche: Paramètres */}
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Flex direction="column" gap="5">

        {/* Type de facture par défaut */}
        <Card size="3">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Settings2 size={18} />
              <Text size="3" weight="bold">
                Type de document par défaut
              </Text>
            </Flex>

            <Box>
              <Text as="label" size="2" weight="medium" mb="2">
                Type de facture utilisé lors des ventes
              </Text>
              <Controller
                name="typeFactureDefaut"
                control={control}
                render={({ field }) => (
                  <Select.Root
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <Select.Trigger style={{ width: "100%" }} />
                    <Select.Content>
                      {typeFactureOptions.map((option) => (
                        <Select.Item key={option.value} value={option.value}>
                          <Flex align="center" gap="2">
                            {getTypeIcon(option.value)}
                            <span>{option.label}</span>
                            <Text size="1" color="gray">
                              - {option.description}
                            </Text>
                          </Flex>
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              />
            </Box>

            {/* Badge du type sélectionné */}
            <Flex gap="2" wrap="wrap">
              {typeFactureOptions.map((option) => (
                <Badge
                  key={option.value}
                  color={typeFactureDefaut === option.value ? "violet" : "gray"}
                  variant={typeFactureDefaut === option.value ? "solid" : "soft"}
                  size="2"
                >
                  {getTypeIcon(option.value)}
                  {option.label}
                </Badge>
              ))}
            </Flex>
          </Flex>
        </Card>

        {/* Options globales */}
        <Card size="3">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Settings2 size={18} />
              <Text size="3" weight="bold">
                Options d'affichage globales
              </Text>
            </Flex>

            <Flex direction="column" gap="3">
              {/* Afficher logo */}
              <Flex justify="between" align="center">
                <Flex align="center" gap="2">
                  <Image size={16} />
                  <Text size="2">Afficher le logo</Text>
                </Flex>
                <Controller
                  name="afficherLogo"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </Flex>

              {/* Afficher infos établissement */}
              <Flex justify="between" align="center">
                <Flex align="center" gap="2">
                  <Building2 size={16} />
                  <Text size="2">Afficher les informations de l'établissement</Text>
                </Flex>
                <Controller
                  name="afficherInfosEtablissement"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </Flex>

              {/* Afficher NIF/RCCM */}
              <Flex justify="between" align="center">
                <Flex align="center" gap="2">
                  <Hash size={16} />
                  <Text size="2">Afficher NIF et RCCM</Text>
                </Flex>
                <Controller
                  name="afficherNifRccm"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </Flex>

              {/* Afficher détail TVA */}
              <Flex justify="between" align="center">
                <Flex align="center" gap="2">
                  <ScrollText size={16} />
                  <Text size="2">Afficher le détail de la TVA</Text>
                </Flex>
                <Controller
                  name="afficherDetailTva"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </Flex>

              {/* Afficher QR Code */}
              <Flex justify="between" align="center">
                <Flex align="center" gap="2">
                  <QrCode size={16} />
                  <Text size="2">Afficher un QR code de vérification</Text>
                </Flex>
                <Controller
                  name="afficherQrCode"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </Flex>

              <Separator size="4" />

              {/* Style séparateur */}
              <Box>
                <Flex align="center" gap="2" mb="2">
                  <Minus size={16} />
                  <Text size="2" weight="medium">
                    Style des séparateurs
                  </Text>
                </Flex>
                <Controller
                  name="styleSeparateur"
                  control={control}
                  render={({ field }) => (
                    <Select.Root
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <Select.Trigger style={{ width: "100%" }} />
                      <Select.Content>
                        {styleSeparateurOptions.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            <Flex align="center" gap="2">
                              <Text style={{ fontFamily: "monospace" }}>
                                {option.char.repeat(5) || "     "}
                              </Text>
                              <Text>{option.label}</Text>
                            </Flex>
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  )}
                />
              </Box>
            </Flex>
          </Flex>
        </Card>

        {/* Personnalisation par type de facture */}
        <Card size="3">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <FileText size={18} />
              <Text size="3" weight="bold">
                Personnalisation par type de document
              </Text>
            </Flex>

            <Tabs.Root defaultValue="TICKET_SIMPLE">
              <Tabs.List>
                <Tabs.Trigger value="TICKET_SIMPLE">
                  <Receipt size={14} />
                  Ticket simple
                </Tabs.Trigger>
                <Tabs.Trigger value="FACTURE_DETAILLEE">
                  <FileText size={14} />
                  Facture
                </Tabs.Trigger>
                <Tabs.Trigger value="PRO_FORMA">
                  <FileCheck size={14} />
                  Pro-forma
                </Tabs.Trigger>
                <Tabs.Trigger value="NOTE_ADDITION">
                  <ClipboardList size={14} />
                  Addition
                </Tabs.Trigger>
              </Tabs.List>

              {/* Ticket Simple */}
              <Tabs.Content value="TICKET_SIMPLE">
                <Flex direction="column" gap="4" pt="4">
                  <Box>
                    <Text as="label" size="2" weight="medium" mb="1">
                      En-tête personnalisé
                    </Text>
                    <TextField.Root
                      {...register("enteteTicketSimple")}
                      placeholder="Laisser vide pour aucun en-tête"
                    />
                  </Box>
                  <Box>
                    <Text as="label" size="2" weight="medium" mb="1">
                      Pied de page
                    </Text>
                    <TextArea
                      {...register("piedPageTicketSimple")}
                      placeholder="Merci de votre visite !"
                      rows={2}
                    />
                  </Box>
                  <Box>
                    <Flex align="center" gap="2" mb="1">
                      <Copy size={14} />
                      <Text size="2" weight="medium">
                        Nombre de copies
                      </Text>
                    </Flex>
                    <Controller
                      name="copiesTicketSimple"
                      control={control}
                      render={({ field }) => (
                        <Select.Root
                          value={String(field.value)}
                          onValueChange={(v) => field.onChange(Number(v))}
                        >
                          <Select.Trigger />
                          <Select.Content>
                            {copiesOptions.map((opt) => (
                              <Select.Item key={opt.value} value={String(opt.value)}>
                                {opt.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      )}
                    />
                  </Box>
                </Flex>
              </Tabs.Content>

              {/* Facture Détaillée */}
              <Tabs.Content value="FACTURE_DETAILLEE">
                <Flex direction="column" gap="4" pt="4">
                  <Box>
                    <Text as="label" size="2" weight="medium" mb="1">
                      En-tête (titre du document)
                    </Text>
                    <TextField.Root
                      {...register("enteteFactureDetaillee")}
                      placeholder="FACTURE"
                    />
                  </Box>
                  <Box>
                    <Text as="label" size="2" weight="medium" mb="1">
                      Pied de page (conditions)
                    </Text>
                    <TextArea
                      {...register("piedPageFactureDetaillee")}
                      placeholder="Conditions de paiement : comptant"
                      rows={2}
                    />
                  </Box>
                  <Box>
                    <Flex align="center" gap="2" mb="1">
                      <Copy size={14} />
                      <Text size="2" weight="medium">
                        Nombre de copies
                      </Text>
                    </Flex>
                    <Controller
                      name="copiesFactureDetaillee"
                      control={control}
                      render={({ field }) => (
                        <Select.Root
                          value={String(field.value)}
                          onValueChange={(v) => field.onChange(Number(v))}
                        >
                          <Select.Trigger />
                          <Select.Content>
                            {copiesOptions.map((opt) => (
                              <Select.Item key={opt.value} value={String(opt.value)}>
                                {opt.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      )}
                    />
                  </Box>
                  <Callout.Root color="blue" size="1">
                    <Callout.Text>
                      La facture détaillée inclut automatiquement les informations du client,
                      le détail de la TVA et les mentions légales obligatoires.
                    </Callout.Text>
                  </Callout.Root>
                </Flex>
              </Tabs.Content>

              {/* Pro-Forma */}
              <Tabs.Content value="PRO_FORMA">
                <Flex direction="column" gap="4" pt="4">
                  <Box>
                    <Text as="label" size="2" weight="medium" mb="1">
                      En-tête (titre du document)
                    </Text>
                    <TextField.Root
                      {...register("enteteProForma")}
                      placeholder="PRO-FORMA"
                    />
                  </Box>
                  <Box>
                    <Text as="label" size="2" weight="medium" mb="1">
                      Pied de page (mention légale)
                    </Text>
                    <TextArea
                      {...register("piedPageProForma")}
                      placeholder="Ce document n'est pas une facture"
                      rows={2}
                    />
                  </Box>
                  <Box>
                    <Flex align="center" gap="2" mb="1">
                      <Copy size={14} />
                      <Text size="2" weight="medium">
                        Nombre de copies
                      </Text>
                    </Flex>
                    <Controller
                      name="copiesProForma"
                      control={control}
                      render={({ field }) => (
                        <Select.Root
                          value={String(field.value)}
                          onValueChange={(v) => field.onChange(Number(v))}
                        >
                          <Select.Trigger />
                          <Select.Content>
                            {copiesOptions.map((opt) => (
                              <Select.Item key={opt.value} value={String(opt.value)}>
                                {opt.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      )}
                    />
                  </Box>
                  <Callout.Root color="yellow" size="1">
                    <Callout.Text>
                      Le pro-forma est un devis non engageant. Il ne génère pas de mouvement
                      de stock ni de comptabilisation.
                    </Callout.Text>
                  </Callout.Root>
                </Flex>
              </Tabs.Content>

              {/* Note d'Addition */}
              <Tabs.Content value="NOTE_ADDITION">
                <Flex direction="column" gap="4" pt="4">
                  <Box>
                    <Text as="label" size="2" weight="medium" mb="1">
                      En-tête (titre du document)
                    </Text>
                    <TextField.Root
                      {...register("enteteNoteAddition")}
                      placeholder="ADDITION"
                    />
                  </Box>
                  <Box>
                    <Text as="label" size="2" weight="medium" mb="1">
                      Pied de page
                    </Text>
                    <TextArea
                      {...register("piedPageNoteAddition")}
                      placeholder="Merci de régler à la caisse"
                      rows={2}
                    />
                  </Box>
                  <Box>
                    <Flex align="center" gap="2" mb="1">
                      <Copy size={14} />
                      <Text size="2" weight="medium">
                        Nombre de copies
                      </Text>
                    </Flex>
                    <Controller
                      name="copiesNoteAddition"
                      control={control}
                      render={({ field }) => (
                        <Select.Root
                          value={String(field.value)}
                          onValueChange={(v) => field.onChange(Number(v))}
                        >
                          <Select.Trigger />
                          <Select.Content>
                            {copiesOptions.map((opt) => (
                              <Select.Item key={opt.value} value={String(opt.value)}>
                                {opt.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      )}
                    />
                  </Box>
                  <Callout.Root color="green" size="1">
                    <Callout.Text>
                      La note d'addition est une pré-note remise au client avant le paiement.
                      Elle affiche le numéro de table et le nom du serveur.
                    </Callout.Text>
                  </Callout.Root>
                </Flex>
              </Tabs.Content>
            </Tabs.Root>
          </Flex>
        </Card>

        {/* Erreurs de validation */}
        {Object.keys(errors).length > 0 && (
          <Callout.Root color="red" size="1">
            <Callout.Text>
              Veuillez corriger les erreurs de validation avant d'enregistrer.
            </Callout.Text>
          </Callout.Root>
        )}
            </Flex>
          </Box>

          {/* Colonne droite: Aperçu */}
          <Box
            style={{
              width: "360px",
              flexShrink: 0,
              position: "sticky",
              top: "20px",
              alignSelf: "flex-start",
            }}
          >
            <Card size="3">
              <Flex direction="column" gap="4">
                <Flex align="center" gap="2">
                  <Eye size={18} />
                  <Text size="3" weight="bold">
                    Aperçu du ticket
                  </Text>
                </Flex>

                {/* Sélecteur de type pour l'aperçu */}
                <Flex gap="2" wrap="wrap">
                  {typeFactureOptions.map((option) => (
                    <Badge
                      key={option.value}
                      color={previewType === option.value ? "violet" : "gray"}
                      variant={previewType === option.value ? "solid" : "soft"}
                      size="1"
                      style={{ cursor: "pointer" }}
                      onClick={() => setPreviewType(option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </Flex>

                <Separator size="4" />

                {/* Aperçu du ticket */}
                <Box
                  style={{
                    backgroundColor: "var(--gray-2)",
                    borderRadius: "var(--radius-3)",
                    padding: "16px",
                    position: "relative",
                  }}
                >
                  <TicketPreview
                    settings={watchedValues}
                    typeFacture={previewType}
                  />
                </Box>

                <Text size="1" color="gray" align="center">
                  Cliquez sur un type pour voir son aperçu
                </Text>
              </Flex>
            </Card>
          </Box>
        </Flex>
      </Flex>
    </form>
  );
}
