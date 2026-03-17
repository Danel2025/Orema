"use client";

/**
 * CloseSessionDialog - Dialog pour cloturer une session de caisse
 * Affiche le recapitulatif et permet le comptage des especes
 * Utilise Radix UI Themes pour le styling
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  Flex,
  Box,
  Text,
  Button,
  TextField,
  TextArea,
  Callout,
  Card,
  Badge,
  Separator,
  DataList,
  Tabs,
  Grid,
  IconButton,
  Progress,
} from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import {
  DoorClosed,
  Banknote,
  CreditCard,
  Smartphone,
  Receipt,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  ShoppingCart,
  Calculator,
  FileText,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { closeSession, getSessionStats } from "@/actions/sessions";
import { formatCurrency, formatTime, formatDate, COUPURES_FCFA } from "@/lib/utils";
import type { SessionActive, SessionStats } from "@/actions/sessions";

interface CloseSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionActive;
  onSuccess: () => void;
}

// Coupures simplifiees pour le comptage
const COUPURES = COUPURES_FCFA.filter((c) => c.valeur >= 5);

export function CloseSessionDialog({
  open,
  onOpenChange,
  session,
  onSuccess,
}: CloseSessionDialogProps) {
  const [step, setStep] = useState<"summary" | "counting" | "confirm">("summary");
  const [coupures, setCoupures] = useState<Record<number, number>>({});
  const [notesCloture, setNotesCloture] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Calculer le total des coupures comptees
  const totalComptees = Object.entries(coupures).reduce(
    (sum, [valeur, quantite]) => sum + Number(valeur) * quantite,
    0
  );

  // Especes attendues = fond de caisse + especes encaissees
  const especesAttendues = session.fondCaisse + session.totalEspeces;

  // Ecart
  const ecart = totalComptees - especesAttendues;

  // Charger les stats de la session
  useEffect(() => {
    if (open && session.id) {
      setIsLoadingStats(true);
      getSessionStats(session.id)
        .then(setStats)
        .catch(console.error)
        .finally(() => setIsLoadingStats(false));
    }
  }, [open, session.id]);

  // Reset form quand le dialog se ferme
  useEffect(() => {
    if (!open) {
      setStep("summary");
      setCoupures({});
      setNotesCloture("");
    }
  }, [open]);

  const handleClose = async () => {
    setIsSubmitting(true);
    try {
      const result = await closeSession({
        sessionId: session.id,
        especesComptees: totalComptees,
        notesCloture: notesCloture || undefined,
      });

      if (result.success) {
        toast.success("Session de caisse cloturee avec succes");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Erreur lors de la cloture");
      }
    } catch {
      toast.error("Erreur lors de la cloture de la session");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCoupure = (valeur: number, delta: number) => {
    setCoupures((prev) => {
      const current = prev[valeur] || 0;
      const newValue = Math.max(0, current + delta);
      if (newValue === 0) {
        const { [valeur]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [valeur]: newValue };
    });
  };

  const setCoupureValue = (valeur: number, quantite: number) => {
    setCoupures((prev) => {
      if (quantite <= 0) {
        const { [valeur]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [valeur]: quantite };
    });
  };

  // Duree de la session
  const duration = Date.now() - new Date(session.dateOuverture).getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="700px">
        {/* Header */}
        <Flex align="center" gap="3" mb="4">
          <Box
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-3)",
              backgroundColor: "var(--accent-9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <DoorClosed size={24} />
          </Box>
          <Box>
            <Dialog.Title size="5" mb="1">
              Cloturer la caisse
            </Dialog.Title>
            <Dialog.Description size="2" color="gray">
              Recapitulatif et comptage des especes - Rapport Z
            </Dialog.Description>
          </Box>
        </Flex>

        {/* Tabs pour les etapes */}
        <Tabs.Root value={step} onValueChange={(v) => setStep(v as typeof step)}>
          <Tabs.List>
            <Tabs.Trigger value="summary">
              <Receipt size={14} />
              Recapitulatif
            </Tabs.Trigger>
            <Tabs.Trigger value="counting">
              <Calculator size={14} />
              Comptage especes
            </Tabs.Trigger>
            <Tabs.Trigger value="confirm">
              <FileText size={14} />
              Confirmation
            </Tabs.Trigger>
          </Tabs.List>

          <ScrollArea style={{ maxHeight: "55vh" }}>
            {/* Etape 1: Recapitulatif */}
            <Tabs.Content value="summary">
              <Flex direction="column" gap="4">
                {/* Infos session */}
                <Card>
                  <Flex gap="4" wrap="wrap">
                    <Flex align="center" gap="2">
                      <User size={16} color="var(--gray-10)" />
                      <Text size="2">
                        {session.utilisateur.prenom} {session.utilisateur.nom}
                      </Text>
                    </Flex>
                    <Flex align="center" gap="2">
                      <Clock size={16} color="var(--gray-10)" />
                      <Text size="2">
                        {formatTime(new Date(session.dateOuverture))} - Maintenant
                      </Text>
                    </Flex>
                    <Badge color="blue" size="1">
                      {hours}h{minutes.toString().padStart(2, "0")}
                    </Badge>
                  </Flex>
                </Card>

                {/* Stats principales */}
                <Grid columns={{ initial: "2", sm: "4" }} gap="3">
                  <Card>
                    <Flex direction="column" align="center" gap="1">
                      <Receipt size={20} color="var(--blue-10)" />
                      <Text size="5" weight="bold">
                        {session.nombreVentes}
                      </Text>
                      <Text size="1" color="gray">
                        Ventes
                      </Text>
                    </Flex>
                  </Card>
                  <Card>
                    <Flex direction="column" align="center" gap="1">
                      <TrendingUp size={20} color="var(--green-10)" />
                      <Text
                        size="4"
                        weight="bold"
                        style={{
                          color: "var(--green-11)",
                          fontFamily: "var(--font-google-sans-code), monospace",
                        }}
                      >
                        {formatCurrency(session.totalVentes)}
                      </Text>
                      <Text size="1" color="gray">
                        Total
                      </Text>
                    </Flex>
                  </Card>
                  <Card>
                    <Flex direction="column" align="center" gap="1">
                      <ShoppingCart size={20} color="var(--purple-10)" />
                      <Text
                        size="4"
                        weight="bold"
                        style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                      >
                        {session.nombreVentes > 0
                          ? formatCurrency(Math.round(session.totalVentes / session.nombreVentes))
                          : "0 FCFA"}
                      </Text>
                      <Text size="1" color="gray">
                        Panier moyen
                      </Text>
                    </Flex>
                  </Card>
                  <Card>
                    <Flex direction="column" align="center" gap="1">
                      <Banknote size={20} color="var(--accent-10)" />
                      <Text
                        size="4"
                        weight="bold"
                        style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                      >
                        {formatCurrency(session.fondCaisse)}
                      </Text>
                      <Text size="1" color="gray">
                        Fond caisse
                      </Text>
                    </Flex>
                  </Card>
                </Grid>

                {/* Repartition des paiements */}
                <Card>
                  <Text size="3" weight="bold" mb="3">
                    Repartition des paiements
                  </Text>
                  <DataList.Root>
                    <DataList.Item>
                      <DataList.Label minWidth="140px">
                        <Flex align="center" gap="2">
                          <Banknote size={14} color="var(--green-10)" />
                          Especes
                        </Flex>
                      </DataList.Label>
                      <DataList.Value>
                        <Flex align="center" gap="2">
                          <Text
                            weight="bold"
                            style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                          >
                            {formatCurrency(session.totalEspeces)}
                          </Text>
                          {session.totalVentes > 0 && (
                            <Badge size="1" color="gray">
                              {Math.round((session.totalEspeces / session.totalVentes) * 100)}%
                            </Badge>
                          )}
                        </Flex>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="140px">
                        <Flex align="center" gap="2">
                          <CreditCard size={14} color="var(--blue-10)" />
                          Carte bancaire
                        </Flex>
                      </DataList.Label>
                      <DataList.Value>
                        <Flex align="center" gap="2">
                          <Text
                            weight="bold"
                            style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                          >
                            {formatCurrency(session.totalCartes)}
                          </Text>
                          {session.totalVentes > 0 && (
                            <Badge size="1" color="gray">
                              {Math.round((session.totalCartes / session.totalVentes) * 100)}%
                            </Badge>
                          )}
                        </Flex>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="140px">
                        <Flex align="center" gap="2">
                          <Smartphone size={14} color="var(--accent-10)" />
                          Mobile Money
                        </Flex>
                      </DataList.Label>
                      <DataList.Value>
                        <Flex align="center" gap="2">
                          <Text
                            weight="bold"
                            style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                          >
                            {formatCurrency(session.totalMobileMoney)}
                          </Text>
                          {session.totalVentes > 0 && (
                            <Badge size="1" color="gray">
                              {Math.round((session.totalMobileMoney / session.totalVentes) * 100)}%
                            </Badge>
                          )}
                        </Flex>
                      </DataList.Value>
                    </DataList.Item>
                    {session.totalAutres > 0 && (
                      <DataList.Item>
                        <DataList.Label minWidth="140px">Autres</DataList.Label>
                        <DataList.Value>
                          <Text
                            weight="bold"
                            style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                          >
                            {formatCurrency(session.totalAutres)}
                          </Text>
                        </DataList.Value>
                      </DataList.Item>
                    )}
                  </DataList.Root>
                </Card>

                {session.nombreAnnulations > 0 && (
                  <Callout.Root color="red" size="1">
                    <Callout.Icon>
                      <AlertTriangle size={16} />
                    </Callout.Icon>
                    <Callout.Text>
                      {session.nombreAnnulations} vente(s) annulee(s) durant cette session
                    </Callout.Text>
                  </Callout.Root>
                )}

                <Flex justify="end">
                  <Button onClick={() => setStep("counting")}>
                    Passer au comptage
                  </Button>
                </Flex>
              </Flex>
            </Tabs.Content>

            {/* Etape 2: Comptage des especes */}
            <Tabs.Content value="counting">
              <Flex direction="column" gap="4">
                <Callout.Root color="blue" size="1">
                  <Callout.Icon>
                    <Info size={16} />
                  </Callout.Icon>
                  <Callout.Text>
                    Comptez les especes presentes dans la caisse (fond de caisse + encaissements)
                  </Callout.Text>
                </Callout.Root>

                {/* Montant attendu */}
                <Card variant="surface">
                  <Flex justify="between" align="center">
                    <Box>
                      <Text size="2" color="gray">
                        Especes attendues (fond + encaissements)
                      </Text>
                      <Text size="1" color="gray">
                        {formatCurrency(session.fondCaisse)} + {formatCurrency(session.totalEspeces)}
                      </Text>
                    </Box>
                    <Text
                      size="5"
                      weight="bold"
                      style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                    >
                      {formatCurrency(especesAttendues)}
                    </Text>
                  </Flex>
                </Card>

                {/* Comptage des coupures */}
                <Box>
                  <Text size="2" weight="medium" mb="2">
                    Comptage par coupure
                  </Text>
                  <Flex direction="column" gap="2">
                    {COUPURES.map((c) => (
                      <Flex
                        key={c.valeur}
                        align="center"
                        gap="3"
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "var(--gray-a2)",
                          borderRadius: "var(--radius-2)",
                          border: "1px solid var(--gray-a4)",
                        }}
                      >
                        <Flex align="center" gap="2" style={{ minWidth: 80 }}>
                          {c.type === "billet" ? (
                            <Banknote size={14} color="var(--green-10)" />
                          ) : (
                            <Box
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                backgroundColor: "var(--purple-9)",
                              }}
                            />
                          )}
                          <Text
                            size="2"
                            weight="bold"
                            style={{
                              fontFamily: "var(--font-google-sans-code), monospace",
                            }}
                          >
                            {c.label}
                          </Text>
                        </Flex>

                        <Flex align="center" gap="2" style={{ marginLeft: "auto" }}>
                          <IconButton
                            variant="soft"
                            color="gray"
                            size="1"
                            onClick={() => updateCoupure(c.valeur, -1)}
                            disabled={(coupures[c.valeur] || 0) === 0}
                          >
                            -
                          </IconButton>

                          <TextField.Root
                            type="number"
                            size="1"
                            value={coupures[c.valeur] || ""}
                            onChange={(e) =>
                              setCoupureValue(c.valeur, parseInt(e.target.value) || 0)
                            }
                            style={{
                              width: 60,
                              textAlign: "center",
                              fontFamily: "var(--font-google-sans-code), monospace",
                            }}
                            placeholder="0"
                          />

                          <IconButton
                            variant="soft"
                            color="green"
                            size="1"
                            onClick={() => updateCoupure(c.valeur, 1)}
                          >
                            +
                          </IconButton>
                        </Flex>

                        <Text
                          size="2"
                          color="gray"
                          style={{
                            minWidth: 90,
                            textAlign: "right",
                            fontFamily: "var(--font-google-sans-code), monospace",
                          }}
                        >
                          {formatCurrency((coupures[c.valeur] || 0) * c.valeur)}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                </Box>

                <Separator size="4" />

                {/* Total compte et ecart */}
                <Card
                  style={{
                    backgroundColor:
                      ecart === 0
                        ? "var(--green-a2)"
                        : ecart > 0
                        ? "var(--blue-a2)"
                        : "var(--red-a2)",
                    borderColor:
                      ecart === 0
                        ? "var(--green-a5)"
                        : ecart > 0
                        ? "var(--blue-a5)"
                        : "var(--red-a5)",
                  }}
                >
                  <Flex direction="column" gap="3">
                    <Flex justify="between" align="center">
                      <Text size="2" weight="medium">
                        Total compte
                      </Text>
                      <Text
                        size="5"
                        weight="bold"
                        style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                      >
                        {formatCurrency(totalComptees)}
                      </Text>
                    </Flex>
                    <Separator size="4" />
                    <Flex justify="between" align="center">
                      <Flex align="center" gap="2">
                        {ecart === 0 ? (
                          <CheckCircle size={18} color="var(--green-10)" />
                        ) : ecart > 0 ? (
                          <TrendingUp size={18} color="var(--blue-10)" />
                        ) : (
                          <TrendingDown size={18} color="var(--red-10)" />
                        )}
                        <Text size="2" weight="medium">
                          Ecart de caisse
                        </Text>
                      </Flex>
                      <Text
                        size="5"
                        weight="bold"
                        style={{
                          color:
                            ecart === 0
                              ? "var(--green-11)"
                              : ecart > 0
                              ? "var(--blue-11)"
                              : "var(--red-11)",
                          fontFamily: "var(--font-google-sans-code), monospace",
                        }}
                      >
                        {ecart >= 0 ? "+" : ""}
                        {formatCurrency(ecart)}
                      </Text>
                    </Flex>
                  </Flex>
                </Card>

                <Flex justify="between">
                  <Button variant="soft" color="gray" onClick={() => setStep("summary")}>
                    Retour
                  </Button>
                  <Button onClick={() => setStep("confirm")}>
                    Confirmer le comptage
                  </Button>
                </Flex>
              </Flex>
            </Tabs.Content>

            {/* Etape 3: Confirmation */}
            <Tabs.Content value="confirm">
              <Flex direction="column" gap="4">
                <Card>
                  <Text size="3" weight="bold" mb="3">
                    Resume de la cloture
                  </Text>
                  <DataList.Root>
                    <DataList.Item>
                      <DataList.Label minWidth="160px">Total des ventes</DataList.Label>
                      <DataList.Value>
                        <Text
                          weight="bold"
                          style={{
                            color: "var(--green-11)",
                            fontFamily: "var(--font-google-sans-code), monospace",
                          }}
                        >
                          {formatCurrency(session.totalVentes)}
                        </Text>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="160px">Nombre de ventes</DataList.Label>
                      <DataList.Value>
                        <Badge color="blue">{session.nombreVentes}</Badge>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="160px">Fond de caisse</DataList.Label>
                      <DataList.Value>
                        <Text style={{ fontFamily: "var(--font-google-sans-code), monospace" }}>
                          {formatCurrency(session.fondCaisse)}
                        </Text>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="160px">Especes attendues</DataList.Label>
                      <DataList.Value>
                        <Text style={{ fontFamily: "var(--font-google-sans-code), monospace" }}>
                          {formatCurrency(especesAttendues)}
                        </Text>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="160px">Especes comptees</DataList.Label>
                      <DataList.Value>
                        <Text
                          weight="bold"
                          style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                        >
                          {formatCurrency(totalComptees)}
                        </Text>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="160px">Ecart</DataList.Label>
                      <DataList.Value>
                        <Badge
                          color={ecart === 0 ? "green" : ecart > 0 ? "blue" : "red"}
                          size="2"
                        >
                          {ecart >= 0 ? "+" : ""}
                          {formatCurrency(ecart)}
                        </Badge>
                      </DataList.Value>
                    </DataList.Item>
                  </DataList.Root>
                </Card>

                {ecart !== 0 && (
                  <Callout.Root color={ecart > 0 ? "blue" : "red"} size="1">
                    <Callout.Icon>
                      <AlertTriangle size={16} />
                    </Callout.Icon>
                    <Callout.Text>
                      {ecart > 0
                        ? "Un excedent de caisse a ete detecte. Verifiez le comptage."
                        : "Un deficit de caisse a ete detecte. Verifiez le comptage."}
                    </Callout.Text>
                  </Callout.Root>
                )}

                <Box>
                  <Text as="label" size="2" weight="medium" mb="2">
                    Notes de cloture (optionnel)
                  </Text>
                  <TextArea
                    value={notesCloture}
                    onChange={(e) => setNotesCloture(e.target.value)}
                    placeholder="Observations, remarques..."
                    rows={3}
                  />
                </Box>

                <Separator size="4" />

                <Flex justify="between">
                  <Button variant="soft" color="gray" onClick={() => setStep("counting")}>
                    Retour
                  </Button>
                  <Button
                   
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    <DoorClosed size={16} />
                    {isSubmitting ? "Cloture en cours..." : "Cloturer la caisse"}
                  </Button>
                </Flex>
              </Flex>
            </Tabs.Content>
          </ScrollArea>
        </Tabs.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}
