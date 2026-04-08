"use client";

/**
 * Dialog de configuration de masse (wizard multi-etapes)
 * Permet d'appliquer des parametres a plusieurs etablissements
 */

import { useState, useMemo } from "react";
import {
  Box,
  Flex,
  Grid,
  Text,
  Heading,
  Badge,
  Button,
  Dialog,
  TextField,
  Checkbox,
  Select,
  Separator,
  Callout,
  ScrollArea,
} from "@radix-ui/themes";
import {
  GearSix,
  MagnifyingGlass,
  Buildings,
  CheckCircle,
  CaretRight,
  CaretLeft,
  Warning,
  ArrowClockwise,
  Sliders,
  Eye,
  ShieldCheck,
  CurrencyCircleDollar,
  Package,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────────────────────────────

interface Etablissement {
  id: string;
  nom: string;
  plan?: string;
  statut?: string;
}

interface BulkSettings {
  taux_tva_standard?: number;
  taux_tva_reduit?: number;
  modes_paiement_actifs?: string[];
  longueur_pin_minimum?: number;
  tentatives_login_max?: number;
  session_timeout?: number;
}

interface BulkConfigDialogProps {
  etablissements: Etablissement[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (
    etablissementIds: string[],
    settings: BulkSettings
  ) => Promise<void>;
}

// ── Constants ───────────────────────────────────────────────────────────

const STEPS = [
  { label: "Sélection", icon: Buildings },
  { label: "Paramètres", icon: Sliders },
  { label: "Configuration", icon: GearSix },
  { label: "Aperçu", icon: Eye },
  { label: "Confirmation", icon: CheckCircle },
] as const;

const MODES_PAIEMENT = [
  { value: "especes", label: "Especes" },
  { value: "carte", label: "Carte bancaire" },
  { value: "airtel_money", label: "Airtel Money" },
  { value: "moov_money", label: "Moov Money" },
  { value: "cheque", label: "Cheque" },
  { value: "virement", label: "Virement" },
];

type SettingCategory = "tva" | "paiement" | "securite" | "stock";

const SETTING_CATEGORIES: {
  key: SettingCategory;
  label: string;
  description: string;
  icon: typeof CurrencyCircleDollar;
  color: string;
}[] = [
  {
    key: "tva",
    label: "TVA",
    description: "Taux de TVA standard et reduit",
    icon: CurrencyCircleDollar,
    color: "green",
  },
  {
    key: "paiement",
    label: "Modes de paiement",
    description: "Modes de paiement actifs",
    icon: CurrencyCircleDollar,
    color: "blue",
  },
  {
    key: "securite",
    label: "Sécurité",
    description: "PIN, tentatives login, session timeout",
    icon: ShieldCheck,
    color: "red",
  },
  {
    key: "stock",
    label: "Stock",
    description: "Paramètres de gestion du stock",
    icon: Package,
    color: "orange",
  },
];

// ── Progress Bar ────────────────────────────────────────────────────────

function StepProgressBar({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <Flex gap="2" align="center" mb="5">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const Icon = step.icon;

        return (
          <Flex key={step.label} align="center" gap="2" style={{ flex: 1 }}>
            <Flex align="center" gap="2" style={{ whiteSpace: "nowrap" }}>
              <Flex
                align="center"
                justify="center"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: isCompleted
                    ? "var(--green-9)"
                    : isCurrent
                      ? "var(--accent-9)"
                      : "var(--gray-a4)",
                  transition: "all 0.3s ease",
                }}
              >
                {isCompleted ? (
                  <CheckCircle
                    size={16}
                    weight="fill"
                    style={{ color: "white" }}
                  />
                ) : (
                  <Icon
                    size={14}
                    weight={isCurrent ? "bold" : "regular"}
                    style={{
                      color: isCurrent ? "white" : "var(--gray-9)",
                    }}
                  />
                )}
              </Flex>
              <Text
                size="1"
                weight={isCurrent ? "bold" : "regular"}
                color={isCurrent ? undefined : "gray"}
                style={{ display: index < 3 ? "block" : "none" }}
              >
                {step.label}
              </Text>
            </Flex>
            {index < totalSteps - 1 && (
              <Box
                style={{
                  flex: 1,
                  height: 2,
                  background: isCompleted
                    ? "var(--green-9)"
                    : "var(--gray-a4)",
                  borderRadius: 1,
                  transition: "all 0.3s ease",
                  minWidth: 16,
                }}
              />
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export function BulkConfigDialog({
  etablissements,
  open,
  onOpenChange,
  onApply,
}: BulkConfigDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<
    Set<SettingCategory>
  >(new Set());
  const [settings, setSettings] = useState<BulkSettings>({});
  const [isApplying, setIsApplying] = useState(false);

  // Filtrer etablissements par recherche
  const filteredEtablissements = useMemo(() => {
    if (!searchQuery) return etablissements;
    const q = searchQuery.toLowerCase();
    return etablissements.filter((e) => e.nom.toLowerCase().includes(q));
  }, [etablissements, searchQuery]);

  const toggleEtablissement = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    if (filteredEtablissements.every((e) => selectedIds.has(e.id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredEtablissements.forEach((e) => next.delete(e.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredEtablissements.forEach((e) => next.add(e.id));
        return next;
      });
    }
  };

  const toggleCategory = (cat: SettingCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const updateSetting = <K extends keyof BulkSettings>(
    key: K,
    value: BulkSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const canAdvance = () => {
    switch (currentStep) {
      case 0:
        return selectedIds.size > 0;
      case 1:
        return selectedCategories.size > 0;
      case 2:
        return Object.values(settings).some((v) => v !== undefined);
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(Array.from(selectedIds), settings);
      toast.success(
        `Configuration appliquee a ${selectedIds.size} etablissement(s)`
      );
      handleReset();
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de l'application de la configuration");
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSelectedIds(new Set());
    setSearchQuery("");
    setSelectedCategories(new Set());
    setSettings({});
  };

  // ── Step Content ─────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      // Etape 1 : Selection des etablissements
      case 0:
        return (
          <Box>
            <Heading size="3" mb="1">
              Selectionner les etablissements
            </Heading>
            <Text size="2" color="gray" mb="4" style={{ display: "block" }}>
              Choisissez les etablissements auxquels appliquer la configuration.
            </Text>

            <TextField.Root
              placeholder="Rechercher un etablissement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="2"
              mb="3"
            >
              <TextField.Slot>
                <MagnifyingGlass
                  size={16}
                  weight="bold"
                  style={{ color: "var(--gray-9)" }}
                />
              </TextField.Slot>
            </TextField.Root>

            <Flex align="center" justify="between" mb="2">
              <Button
                variant="ghost"
                size="1"
                color="gray"
                onClick={toggleAllVisible}
                style={{ cursor: "pointer" }}
              >
                {filteredEtablissements.every((e) => selectedIds.has(e.id))
                  ? "Tout deselectionner"
                  : "Tout selectionner"}
              </Button>
              <Badge variant="soft" color="blue" size="1">
                {selectedIds.size} selectionne(s)
              </Badge>
            </Flex>

            <ScrollArea style={{ maxHeight: 280 }}>
              <Flex direction="column" gap="1">
                {filteredEtablissements.map((etab) => (
                  <Box
                    key={etab.id}
                    px="3"
                    py="2"
                    style={{
                      borderRadius: 8,
                      background: selectedIds.has(etab.id)
                        ? "var(--accent-a2)"
                        : "transparent",
                      border: selectedIds.has(etab.id)
                        ? "1px solid var(--accent-a4)"
                        : "1px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onClick={() => toggleEtablissement(etab.id)}
                  >
                    <Flex align="center" gap="3">
                      <Checkbox
                        checked={selectedIds.has(etab.id)}
                        onCheckedChange={() =>
                          toggleEtablissement(etab.id)
                        }
                      />
                      <Box style={{ flex: 1 }}>
                        <Text size="2" weight="medium">
                          {etab.nom}
                        </Text>
                        {etab.plan ? <Text size="1" color="gray">
                            {" "}
                            — {etab.plan}
                          </Text> : null}
                      </Box>
                      {etab.statut ? <Badge
                          size="1"
                          variant="soft"
                          color={
                            etab.statut === "actif"
                              ? "green"
                              : etab.statut === "suspendu"
                                ? "red"
                                : "amber"
                          }
                        >
                          {etab.statut}
                        </Badge> : null}
                    </Flex>
                  </Box>
                ))}

                {filteredEtablissements.length === 0 && (
                  <Flex
                    direction="column"
                    align="center"
                    py="6"
                    gap="2"
                  >
                    <Buildings
                      size={24}
                      weight="duotone"
                      style={{ color: "var(--gray-8)" }}
                    />
                    <Text size="2" color="gray">
                      Aucun etablissement trouve
                    </Text>
                  </Flex>
                )}
              </Flex>
            </ScrollArea>
          </Box>
        );

      // Etape 2 : Choix des categories de parametres
      case 1:
        return (
          <Box>
            <Heading size="3" mb="1">
              Parametres a modifier
            </Heading>
            <Text size="2" color="gray" mb="4" style={{ display: "block" }}>
              Selectionnez les categories de parametres que vous souhaitez
              configurer.
            </Text>

            <Grid columns="2" gap="3">
              {SETTING_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.has(cat.key);
                const Icon = cat.icon;
                return (
                  <Box
                    key={cat.key}
                    p="4"
                    style={{
                      borderRadius: 10,
                      border: isSelected
                        ? `2px solid var(--${cat.color}-9)`
                        : "1px solid var(--gray-a4)",
                      background: isSelected
                        ? `var(--${cat.color}-a2)`
                        : "var(--color-background)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => toggleCategory(cat.key)}
                  >
                    <Flex direction="column" gap="2">
                      <Flex align="center" gap="2">
                        <Flex
                          align="center"
                          justify="center"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: `var(--${cat.color}-a3)`,
                          }}
                        >
                          <Icon
                            size={16}
                            weight="duotone"
                            style={{
                              color: `var(--${cat.color}-9)`,
                            }}
                          />
                        </Flex>
                        <Text size="2" weight="bold">
                          {cat.label}
                        </Text>
                      </Flex>
                      <Text size="1" color="gray">
                        {cat.description}
                      </Text>
                    </Flex>
                  </Box>
                );
              })}
            </Grid>
          </Box>
        );

      // Etape 3 : Configuration des valeurs
      case 2:
        return (
          <Box>
            <Heading size="3" mb="1">
              Configurer les valeurs
            </Heading>
            <Text size="2" color="gray" mb="4" style={{ display: "block" }}>
              Definissez les valeurs pour les parametres selectionnes.
            </Text>

            <Flex direction="column" gap="4">
              {selectedCategories.has("tva") && (
                <Box
                  p="4"
                  style={{
                    borderRadius: 10,
                    border: "1px solid var(--gray-a4)",
                  }}
                >
                  <Heading size="2" mb="3" color="green">
                    TVA
                  </Heading>
                  <Grid columns="2" gap="3">
                    <Box>
                      <Text
                        as="label"
                        size="2"
                        weight="medium"
                        mb="1"
                        style={{ display: "block" }}
                      >
                        Taux standard (%)
                      </Text>
                      <TextField.Root
                        type="number"
                        placeholder="18"
                        value={
                          settings.taux_tva_standard?.toString() ?? ""
                        }
                        onChange={(e) =>
                          updateSetting(
                            "taux_tva_standard",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        min="0"
                        max="100"
                      />
                    </Box>
                    <Box>
                      <Text
                        as="label"
                        size="2"
                        weight="medium"
                        mb="1"
                        style={{ display: "block" }}
                      >
                        Taux reduit (%)
                      </Text>
                      <TextField.Root
                        type="number"
                        placeholder="10"
                        value={
                          settings.taux_tva_reduit?.toString() ?? ""
                        }
                        onChange={(e) =>
                          updateSetting(
                            "taux_tva_reduit",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        min="0"
                        max="100"
                      />
                    </Box>
                  </Grid>
                </Box>
              )}

              {selectedCategories.has("paiement") && (
                <Box
                  p="4"
                  style={{
                    borderRadius: 10,
                    border: "1px solid var(--gray-a4)",
                  }}
                >
                  <Heading size="2" mb="3" color="blue">
                    Modes de paiement
                  </Heading>
                  <Flex direction="column" gap="2">
                    {MODES_PAIEMENT.map((mode) => {
                      const isActive =
                        settings.modes_paiement_actifs?.includes(
                          mode.value
                        ) ?? false;
                      return (
                        <Flex key={mode.value} align="center" gap="2">
                          <Checkbox
                            checked={isActive}
                            onCheckedChange={(checked) => {
                              const current =
                                settings.modes_paiement_actifs ?? [];
                              if (checked) {
                                updateSetting("modes_paiement_actifs", [
                                  ...current,
                                  mode.value,
                                ]);
                              } else {
                                updateSetting(
                                  "modes_paiement_actifs",
                                  current.filter(
                                    (v) => v !== mode.value
                                  )
                                );
                              }
                            }}
                          />
                          <Text size="2">{mode.label}</Text>
                        </Flex>
                      );
                    })}
                  </Flex>
                </Box>
              )}

              {selectedCategories.has("securite") && (
                <Box
                  p="4"
                  style={{
                    borderRadius: 10,
                    border: "1px solid var(--gray-a4)",
                  }}
                >
                  <Heading size="2" mb="3" color="red">
                    Securite
                  </Heading>
                  <Flex direction="column" gap="3">
                    <Box>
                      <Text
                        as="label"
                        size="2"
                        weight="medium"
                        mb="1"
                        style={{ display: "block" }}
                      >
                        Longueur PIN minimum
                      </Text>
                      <TextField.Root
                        type="number"
                        placeholder="4"
                        value={
                          settings.longueur_pin_minimum?.toString() ?? ""
                        }
                        onChange={(e) =>
                          updateSetting(
                            "longueur_pin_minimum",
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        min="4"
                        max="8"
                      />
                    </Box>
                    <Box>
                      <Text
                        as="label"
                        size="2"
                        weight="medium"
                        mb="1"
                        style={{ display: "block" }}
                      >
                        Tentatives login max
                      </Text>
                      <TextField.Root
                        type="number"
                        placeholder="5"
                        value={
                          settings.tentatives_login_max?.toString() ?? ""
                        }
                        onChange={(e) =>
                          updateSetting(
                            "tentatives_login_max",
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        min="1"
                        max="10"
                      />
                    </Box>
                    <Box>
                      <Text
                        as="label"
                        size="2"
                        weight="medium"
                        mb="1"
                        style={{ display: "block" }}
                      >
                        Timeout session (minutes)
                      </Text>
                      <TextField.Root
                        type="number"
                        placeholder="30"
                        value={
                          settings.session_timeout?.toString() ?? ""
                        }
                        onChange={(e) =>
                          updateSetting(
                            "session_timeout",
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        min="5"
                        max="480"
                      />
                    </Box>
                  </Flex>
                </Box>
              )}
            </Flex>
          </Box>
        );

      // Etape 4 : Apercu
      case 3:
        return (
          <Box>
            <Heading size="3" mb="1">
              Apercu des changements
            </Heading>
            <Text size="2" color="gray" mb="4" style={{ display: "block" }}>
              Verifiez les modifications avant de les appliquer.
            </Text>

            {/* Etablissements cibles */}
            <Box
              p="4"
              mb="4"
              style={{
                borderRadius: 10,
                border: "1px solid var(--gray-a4)",
              }}
            >
              <Flex align="center" gap="2" mb="3">
                <Buildings
                  size={16}
                  weight="duotone"
                  style={{ color: "var(--accent-9)" }}
                />
                <Text size="2" weight="bold">
                  Etablissements cibles ({selectedIds.size})
                </Text>
              </Flex>
              <Flex gap="2" wrap="wrap">
                {etablissements
                  .filter((e) => selectedIds.has(e.id))
                  .map((e) => (
                    <Badge key={e.id} variant="soft" size="1">
                      {e.nom}
                    </Badge>
                  ))}
              </Flex>
            </Box>

            {/* Parametres modifies */}
            <Box
              p="4"
              style={{
                borderRadius: 10,
                border: "1px solid var(--gray-a4)",
              }}
            >
              <Flex align="center" gap="2" mb="3">
                <GearSix
                  size={16}
                  weight="duotone"
                  style={{ color: "var(--accent-9)" }}
                />
                <Text size="2" weight="bold">
                  Parametres a appliquer
                </Text>
              </Flex>
              <Flex direction="column" gap="2">
                {settings.taux_tva_standard !== undefined && (
                  <Flex justify="between" align="center">
                    <Text size="2" color="gray">
                      TVA standard
                    </Text>
                    <Badge variant="soft" color="green">
                      {settings.taux_tva_standard}%
                    </Badge>
                  </Flex>
                )}
                {settings.taux_tva_reduit !== undefined && (
                  <Flex justify="between" align="center">
                    <Text size="2" color="gray">
                      TVA reduit
                    </Text>
                    <Badge variant="soft" color="green">
                      {settings.taux_tva_reduit}%
                    </Badge>
                  </Flex>
                )}
                {settings.modes_paiement_actifs &&
                  settings.modes_paiement_actifs.length > 0 ? <Flex justify="between" align="start">
                      <Text size="2" color="gray">
                        Modes paiement
                      </Text>
                      <Flex gap="1" wrap="wrap" justify="end">
                        {settings.modes_paiement_actifs.map((m) => (
                          <Badge key={m} variant="soft" color="blue" size="1">
                            {MODES_PAIEMENT.find((mp) => mp.value === m)
                              ?.label ?? m}
                          </Badge>
                        ))}
                      </Flex>
                    </Flex> : null}
                {settings.longueur_pin_minimum !== undefined && (
                  <Flex justify="between" align="center">
                    <Text size="2" color="gray">
                      Longueur PIN minimum
                    </Text>
                    <Badge variant="soft" color="red">
                      {settings.longueur_pin_minimum} chiffres
                    </Badge>
                  </Flex>
                )}
                {settings.tentatives_login_max !== undefined && (
                  <Flex justify="between" align="center">
                    <Text size="2" color="gray">
                      Tentatives login max
                    </Text>
                    <Badge variant="soft" color="red">
                      {settings.tentatives_login_max}
                    </Badge>
                  </Flex>
                )}
                {settings.session_timeout !== undefined && (
                  <Flex justify="between" align="center">
                    <Text size="2" color="gray">
                      Timeout session
                    </Text>
                    <Badge variant="soft" color="red">
                      {settings.session_timeout} min
                    </Badge>
                  </Flex>
                )}
              </Flex>
            </Box>
          </Box>
        );

      // Etape 5 : Confirmation
      case 4:
        return (
          <Box>
            <Flex
              direction="column"
              align="center"
              gap="4"
              py="4"
            >
              <Box
                p="4"
                style={{
                  background: "var(--amber-a3)",
                  borderRadius: "50%",
                }}
              >
                <Warning
                  size={40}
                  weight="duotone"
                  style={{ color: "var(--amber-9)" }}
                />
              </Box>
              <Box style={{ textAlign: "center" }}>
                <Heading size="4" mb="2">
                  Confirmer l&apos;application
                </Heading>
                <Text size="2" color="gray">
                  Vous etes sur le point d&apos;appliquer ces parametres a{" "}
                  <Text weight="bold">{selectedIds.size}</Text>{" "}
                  etablissement(s). Cette action est immediate.
                </Text>
              </Box>
            </Flex>

            <Callout.Root color="amber" variant="surface">
              <Callout.Icon>
                <Warning size={16} weight="fill" />
              </Callout.Icon>
              <Callout.Text size="2">
                Les parametres precedents de chaque etablissement seront
                remplaces par les nouvelles valeurs. Cette action ne peut
                pas etre annulee automatiquement.
              </Callout.Text>
            </Callout.Root>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(val) => {
        if (!isApplying) {
          onOpenChange(val);
          if (!val) handleReset();
        }
      }}
    >
      <Dialog.Content maxWidth="600px">
        <Dialog.Title>
          <Flex align="center" gap="2">
            <GearSix
              size={20}
              weight="duotone"
              style={{ color: "var(--accent-9)" }}
            />
            Configuration de masse
          </Flex>
        </Dialog.Title>

        <Dialog.Description size="2" mb="4">
          Appliquez des parametres a plusieurs etablissements simultanement.
        </Dialog.Description>

        {/* Progress Bar */}
        <StepProgressBar
          currentStep={currentStep}
          totalSteps={STEPS.length}
        />

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <Separator size="4" my="4" />
        <Flex justify="between" align="center">
          <Button
            variant="soft"
            color="gray"
            onClick={() => {
              if (currentStep === 0) {
                onOpenChange(false);
                handleReset();
              } else {
                setCurrentStep((s) => s - 1);
              }
            }}
            disabled={isApplying}
          >
            <CaretLeft size={16} weight="bold" />
            {currentStep === 0 ? "Annuler" : "Precedent"}
          </Button>

          <Text size="1" color="gray">
            Etape {currentStep + 1} / {STEPS.length}
          </Text>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!canAdvance()}
            >
              Suivant
              <CaretRight size={16} weight="bold" />
            </Button>
          ) : (
            <Button
              color="orange"
              onClick={handleApply}
              disabled={isApplying}
            >
              {isApplying ? (
                <>
                  <ArrowClockwise
                    size={14}
                    weight="bold"
                    className="animate-spin"
                  />
                  Application...
                </>
              ) : (
                <>
                  <CheckCircle size={14} weight="fill" />
                  Appliquer
                </>
              )}
            </Button>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
