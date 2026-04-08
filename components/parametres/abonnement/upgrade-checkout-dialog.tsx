"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  Dialog,
  Separator,
  TextField,
  Callout,
  Badge,
} from "@radix-ui/themes";
import {
  Star,
  Rocket,
  Crown,
  Sparkle,
  ArrowRight,
  ArrowClockwise,
  DeviceMobile,
  CreditCard,
  Phone,
  Warning,
  CheckCircle,
  ShieldCheck,
  ArrowLeft,
  Envelope,
  Buildings,
  MapPin,
  IdentificationCard,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  PLANS,
  getPlanMonthlyPrice,
  getPlanPrice,
  type PlanSlug,
  type BillingCycle,
} from "@/lib/config/plans";
import { useAuth } from "@/lib/auth/context";
import { upgradePlan } from "@/actions/subscriptions";
import { initiatePayment } from "@/actions/billing";
import { BillingToggle } from "./billing-toggle";
import type { PaymentMethod } from "./payment-method-selector";

// ── Types ──────────────────────────────────────────────────────────────

export interface BillingInfo {
  nom: string;
  adresse: string;
  email: string;
  nif?: string;
  rccm?: string;
}

interface UpgradeCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanSlug;
  currentCycle: BillingCycle;
  targetPlan: PlanSlug;
  targetCycle: BillingCycle;
  initialBillingInfo?: BillingInfo;
}

type Step = 1 | 2 | 3 | 4;

// ── Plan Icons & Colors ────────────────────────────────────────────────

const PLAN_ICONS = {
  essentiel: Star,
  pro: Rocket,
  business: Crown,
  enterprise: Sparkle,
} as const;

const PLAN_COLORS = {
  essentiel: "gray",
  pro: "blue",
  business: "orange",
  enterprise: "violet",
} as const;

// ── Phone Validation ───────────────────────────────────────────────────

const GABON_PHONE_REGEX = /^(\+241|241|0)?[0-9]{7,8}$/;

function validateGabonPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  return GABON_PHONE_REGEX.test(cleaned);
}

// ── Email Validation ───────────────────────────────────────────────────

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Step Labels ────────────────────────────────────────────────────────

const STEP_LABELS: Record<Step, string> = {
  1: "Récapitulatif",
  2: "Paiement",
  3: "Facturation",
  4: "Confirmation",
};

// ── Stepper ────────────────────────────────────────────────────────────

function Stepper({ currentStep }: { currentStep: Step }) {
  const steps: Step[] = [1, 2, 3, 4];

  return (
    <Flex align="center" justify="center" gap="0" mb="5">
      {steps.map((step, index) => {
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;
        const isFuture = step > currentStep;

        return (
          <Flex key={step} align="center" gap="0">
            {/* Pastille */}
            <Flex direction="column" align="center" gap="1">
              <Flex
                align="center"
                justify="center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: isCompleted
                    ? "var(--green-9)"
                    : isActive
                      ? "var(--accent-9)"
                      : "var(--gray-a4)",
                  color: isCompleted || isActive ? "white" : "var(--gray-9)",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all 0.3s ease",
                  flexShrink: 0,
                }}
              >
                {isCompleted ? (
                  <CheckCircle size={18} weight="fill" />
                ) : (
                  step
                )}
              </Flex>
              <Text
                size="1"
                weight={isActive ? "bold" : "medium"}
                style={{
                  color: isCompleted
                    ? "var(--green-11)"
                    : isActive
                      ? "var(--accent-11)"
                      : "var(--gray-9)",
                  whiteSpace: "nowrap",
                  fontSize: 10,
                }}
              >
                {STEP_LABELS[step]}
              </Text>
            </Flex>

            {/* Ligne de connexion */}
            {index < steps.length - 1 && (
              <Box
                style={{
                  width: 40,
                  height: 2,
                  background: isCompleted
                    ? "var(--green-9)"
                    : "var(--gray-a4)",
                  marginLeft: 4,
                  marginRight: 4,
                  marginBottom: 18,
                  borderRadius: 1,
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}

// ── Animation Wrapper ──────────────────────────────────────────────────

function StepAnimation({
  children,
  stepKey,
  direction,
}: {
  children: React.ReactNode;
  stepKey: number;
  direction: "forward" | "backward";
}) {
  const xOffset = direction === "forward" ? 20 : -20;

  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, x: xOffset }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -xOffset }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

// ── Component ──────────────────────────────────────────────────────────

export function UpgradeCheckoutDialog({
  open,
  onOpenChange,
  currentPlan,
  currentCycle,
  targetPlan,
  targetCycle,
  initialBillingInfo,
}: UpgradeCheckoutDialogProps) {
  const { user } = useAuth();

  // ── State ──
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [cycle, setCycle] = useState<BillingCycle>(targetCycle);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("monetbil");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Facturation
  const [billingNom, setBillingNom] = useState("");
  const [billingAdresse, setBillingAdresse] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingNif, setBillingNif] = useState("");
  const [billingRccm, setBillingRccm] = useState("");
  const [billingErrors, setBillingErrors] = useState<Record<string, string>>({});

  // ── Pré-remplissage ──
  useEffect(() => {
    if (open) {
      setBillingNom(
        initialBillingInfo?.nom ?? user?.etablissementNom ?? ""
      );
      setBillingAdresse(initialBillingInfo?.adresse ?? "");
      setBillingEmail(initialBillingInfo?.email ?? user?.email ?? "");
      setBillingNif(initialBillingInfo?.nif ?? "");
      setBillingRccm(initialBillingInfo?.rccm ?? "");
    }
  }, [open, initialBillingInfo, user]);

  // ── Plan Configs ──
  const currentConfig = PLANS[currentPlan];
  const targetConfig = PLANS[targetPlan];
  const currentMonthly = getPlanMonthlyPrice(currentPlan, currentCycle);
  const targetMonthly = getPlanMonthlyPrice(targetPlan, cycle);
  const totalPrice = getPlanPrice(targetPlan, cycle);

  const CurrentIcon = PLAN_ICONS[currentPlan];
  const TargetIcon = PLAN_ICONS[targetPlan];
  const targetColor = PLAN_COLORS[targetPlan];

  // ── Navigation ──
  const goNext = useCallback(() => {
    if (step < 4) {
      setDirection("forward");
      setStep((s) => (s + 1) as Step);
    }
  }, [step]);

  const goPrev = useCallback(() => {
    if (step > 1) {
      setDirection("backward");
      setStep((s) => (s - 1) as Step);
    }
  }, [step]);

  // ── Validations ──
  const validateStep2 = useCallback((): boolean => {
    if (selectedMethod === "monetbil") {
      const cleaned = phoneNumber.replace(/[\s\-().]/g, "");
      if (!cleaned) {
        setPhoneError("Le numéro de téléphone est requis");
        return false;
      }
      if (!validateGabonPhone(cleaned)) {
        setPhoneError(
          "Numéro invalide. Format attendu : 0X XX XX XX ou +241 XX XX XX XX"
        );
        return false;
      }
    }
    return true;
  }, [selectedMethod, phoneNumber]);

  const validateStep3 = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!billingNom.trim()) {
      errors.nom = "Le nom ou la raison sociale est requis";
    }
    if (!billingEmail.trim()) {
      errors.email = "L'email de facturation est requis";
    } else if (!validateEmail(billingEmail.trim())) {
      errors.email = "Format d'email invalide";
    }
    setBillingErrors(errors);
    return Object.keys(errors).length === 0;
  }, [billingNom, billingEmail]);

  const handleNextStep2 = useCallback(() => {
    if (validateStep2()) goNext();
  }, [validateStep2, goNext]);

  const handleNextStep3 = useCallback(() => {
    if (validateStep3()) goNext();
  }, [validateStep3, goNext]);

  // ── Soumission ──
  const handleConfirm = async () => {
    setIsProcessing(true);

    try {
      const upgradeResult = await upgradePlan(targetPlan, cycle, selectedMethod);
      if (!upgradeResult.success) {
        toast.error(
          upgradeResult.error ?? "Erreur lors de la préparation de l'upgrade"
        );
        return;
      }

      if (!upgradeResult.data?.requiresPayment) {
        toast.success(`Plan mis à jour vers ${targetConfig.nom}`);
        onOpenChange(false);
        return;
      }

      const paymentResult = await initiatePayment({
        planSlug: targetPlan,
        billingCycle: cycle,
        paymentMethod: selectedMethod,
        phone:
          selectedMethod === "monetbil"
            ? phoneNumber.replace(/[\s\-().]/g, "")
            : undefined,
        billingInfo: {
          nom: billingNom.trim(),
          adresse: billingAdresse.trim(),
          email: billingEmail.trim(),
          nif: billingNif.trim() || undefined,
          rccm: billingRccm.trim() || undefined,
        },
      });

      if (!paymentResult.success) {
        toast.error(
          paymentResult.error ?? "Erreur lors de l'initiation du paiement"
        );
        return;
      }

      if (paymentResult.data?.paymentUrl) {
        toast.success("Redirection vers la page de paiement...");
        window.location.href = paymentResult.data.paymentUrl;
        return;
      }

      toast.success(`Plan mis à jour vers ${targetConfig.nom}`);
      onOpenChange(false);
    } catch {
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Reset on close ──
  const handleClose = (nextOpen: boolean) => {
    if (!isProcessing) {
      onOpenChange(nextOpen);
      if (!nextOpen) {
        setStep(1);
        setDirection("forward");
        setCycle(targetCycle);
        setSelectedMethod("monetbil");
        setPhoneNumber("");
        setPhoneError(null);
        setBillingNom("");
        setBillingAdresse("");
        setBillingEmail("");
        setBillingNif("");
        setBillingRccm("");
        setBillingErrors({});
        setIsProcessing(false);
      }
    }
  };

  // ── Render ──
  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content maxWidth="640px">
        <Dialog.Title>
          <Flex align="center" gap="2">
            <TargetIcon
              size={22}
              weight="duotone"
              style={{ color: `var(--${targetColor}-9)` }}
            />
            Passer au plan {targetConfig.nom}
          </Flex>
        </Dialog.Title>

        <Dialog.Description size="2" mb="4" color="gray">
          Complétez les étapes ci-dessous pour finaliser votre upgrade.
        </Dialog.Description>

        <Stepper currentStep={step} />

        <AnimatePresence mode="wait">
          {/* ── Étape 1 : Récapitulatif ── */}
          {step === 1 && (
            <StepAnimation stepKey={1} direction={direction}>
              <Box>
                {/* Plan actuel → Nouveau plan */}
                <Box
                  p="4"
                  mb="4"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 10,
                  }}
                >
                  {/* Plan actuel */}
                  <Flex align="center" justify="between" mb="3">
                    <Flex align="center" gap="2">
                      <CurrentIcon
                        size={18}
                        weight="duotone"
                        style={{
                          color: `var(--${PLAN_COLORS[currentPlan]}-9)`,
                        }}
                      />
                      <Text size="2" weight="medium">
                        {currentConfig.nom}
                      </Text>
                      <Badge size="1" color="gray" variant="soft">
                        Actuel
                      </Badge>
                    </Flex>
                    <Text
                      size="2"
                      style={{
                        fontFamily:
                          "var(--font-google-sans-code), monospace",
                      }}
                    >
                      {currentMonthly === 0
                        ? "Gratuit"
                        : `${formatCurrency(currentMonthly)}/mois`}
                    </Text>
                  </Flex>

                  <Flex justify="center" my="2">
                    <ArrowRight
                      size={20}
                      weight="bold"
                      style={{
                        color: "var(--gray-8)",
                        transform: "rotate(90deg)",
                      }}
                    />
                  </Flex>

                  {/* Nouveau plan */}
                  <Flex align="center" justify="between">
                    <Flex align="center" gap="2">
                      <TargetIcon
                        size={18}
                        weight="duotone"
                        style={{ color: `var(--${targetColor}-9)` }}
                      />
                      <Text size="2" weight="bold">
                        {targetConfig.nom}
                      </Text>
                    </Flex>
                    <Text
                      size="2"
                      weight="bold"
                      style={{
                        fontFamily:
                          "var(--font-google-sans-code), monospace",
                        color: `var(--${targetColor}-11)`,
                      }}
                    >
                      {`${formatCurrency(targetMonthly)}/mois`}
                    </Text>
                  </Flex>
                </Box>

                {/* Toggle mensuel/annuel */}
                <Flex justify="center" mb="4">
                  <BillingToggle cycle={cycle} onChange={setCycle} />
                </Flex>

                {/* Total */}
                <Box
                  p="4"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 10,
                  }}
                >
                  <Flex align="center" justify="between">
                    <Text size="2" color="gray">
                      Total à payer ({cycle === "annuel" ? "annuel" : "mensuel"})
                    </Text>
                    <Text
                      size="4"
                      weight="bold"
                      style={{
                        fontFamily:
                          "var(--font-google-sans-code), monospace",
                        color: `var(--${targetColor}-11)`,
                      }}
                    >
                      {formatCurrency(totalPrice)}
                    </Text>
                  </Flex>
                </Box>

                {/* Bouton */}
                <Flex justify="end" mt="5">
                  <Button size="3" onClick={goNext}>
                    Suivant
                    <ArrowRight size={16} weight="bold" />
                  </Button>
                </Flex>
              </Box>
            </StepAnimation>
          )}

          {/* ── Étape 2 : Méthode de paiement ── */}
          {step === 2 && (
            <StepAnimation stepKey={2} direction={direction}>
              <Box>
                <Heading size="3" weight="bold" mb="4">
                  Choisissez votre méthode de paiement
                </Heading>

                <Flex direction="column" gap="3" mb="4">
                  {/* Monetbil */}
                  <PaymentCard
                    selected={selectedMethod === "monetbil"}
                    onClick={() => {
                      setSelectedMethod("monetbil");
                      setPhoneError(null);
                    }}
                    icon={DeviceMobile}
                    label="Airtel Money / Moov Money"
                    description="Paiement mobile via Monetbil"
                    color="orange"
                  />

                  {/* Stripe */}
                  <PaymentCard
                    selected={selectedMethod === "stripe"}
                    onClick={() => {
                      setSelectedMethod("stripe");
                      setPhoneError(null);
                    }}
                    icon={CreditCard}
                    label="Carte bancaire (Stripe)"
                    description="Visa, Mastercard via Stripe"
                    color="blue"
                  />
                </Flex>

                {/* Input téléphone Monetbil */}
                <AnimatePresence>
                  {selectedMethod === "monetbil" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Box mb="4">
                        <Text
                          as="label"
                          size="2"
                          weight="medium"
                          mb="2"
                          style={{ display: "block" }}
                        >
                          Numéro de téléphone
                        </Text>
                        <TextField.Root
                          size="3"
                          placeholder="ex : 077 12 34 56"
                          value={phoneNumber}
                          onChange={(e) => {
                            setPhoneNumber(e.target.value);
                            if (phoneError) setPhoneError(null);
                          }}
                          type="tel"
                          aria-invalid={!!phoneError}
                          aria-describedby={
                            phoneError ? "phone-error" : undefined
                          }
                          color={phoneError ? "red" : undefined}
                        >
                          <TextField.Slot side="left">
                            <Phone size={16} weight="duotone" />
                          </TextField.Slot>
                        </TextField.Root>
                        {phoneError && (
                          <Text
                            id="phone-error"
                            size="1"
                            color="red"
                            mt="1"
                            style={{ display: "block" }}
                          >
                            {phoneError}
                          </Text>
                        )}
                        <Text
                          size="1"
                          color="gray"
                          mt="1"
                          style={{ display: "block" }}
                        >
                          Ce numéro sera pré-rempli dans le widget de paiement
                          Monetbil.
                        </Text>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation */}
                <Flex justify="between" mt="5">
                  <Button
                    variant="soft"
                    color="gray"
                    size="3"
                    onClick={goPrev}
                  >
                    <ArrowLeft size={16} weight="bold" />
                    Précédent
                  </Button>
                  <Button size="3" onClick={handleNextStep2}>
                    Suivant
                    <ArrowRight size={16} weight="bold" />
                  </Button>
                </Flex>
              </Box>
            </StepAnimation>
          )}

          {/* ── Étape 3 : Informations de facturation ── */}
          {step === 3 && (
            <StepAnimation stepKey={3} direction={direction}>
              <Box>
                <Heading size="3" weight="bold" mb="4">
                  Informations de facturation
                </Heading>

                <Flex direction="column" gap="4">
                  {/* Nom / Raison sociale */}
                  <Box>
                    <Text
                      as="label"
                      size="2"
                      weight="medium"
                      mb="1"
                      style={{ display: "block" }}
                    >
                      Nom / Raison sociale *
                    </Text>
                    <TextField.Root
                      size="3"
                      placeholder="Ex : Restaurant Le Palmier"
                      value={billingNom}
                      onChange={(e) => {
                        setBillingNom(e.target.value);
                        if (billingErrors.nom)
                          setBillingErrors((prev) => {
                            const { nom, ...rest } = prev;
                            return rest;
                          });
                      }}
                      aria-invalid={!!billingErrors.nom}
                      color={billingErrors.nom ? "red" : undefined}
                    >
                      <TextField.Slot side="left">
                        <Buildings size={16} weight="duotone" />
                      </TextField.Slot>
                    </TextField.Root>
                    {billingErrors.nom && (
                      <Text
                        size="1"
                        color="red"
                        mt="1"
                        style={{ display: "block" }}
                      >
                        {billingErrors.nom}
                      </Text>
                    )}
                  </Box>

                  {/* Adresse */}
                  <Box>
                    <Text
                      as="label"
                      size="2"
                      weight="medium"
                      mb="1"
                      style={{ display: "block" }}
                    >
                      Adresse
                    </Text>
                    <TextField.Root
                      size="3"
                      placeholder="Ex : Quartier Louis, Libreville"
                      value={billingAdresse}
                      onChange={(e) => setBillingAdresse(e.target.value)}
                    >
                      <TextField.Slot side="left">
                        <MapPin size={16} weight="duotone" />
                      </TextField.Slot>
                    </TextField.Root>
                  </Box>

                  {/* Email de facturation */}
                  <Box>
                    <Text
                      as="label"
                      size="2"
                      weight="medium"
                      mb="1"
                      style={{ display: "block" }}
                    >
                      Email de facturation *
                    </Text>
                    <TextField.Root
                      size="3"
                      placeholder="facturation@exemple.com"
                      value={billingEmail}
                      onChange={(e) => {
                        setBillingEmail(e.target.value);
                        if (billingErrors.email)
                          setBillingErrors((prev) => {
                            const { email, ...rest } = prev;
                            return rest;
                          });
                      }}
                      type="email"
                      aria-invalid={!!billingErrors.email}
                      color={billingErrors.email ? "red" : undefined}
                    >
                      <TextField.Slot side="left">
                        <Envelope size={16} weight="duotone" />
                      </TextField.Slot>
                    </TextField.Root>
                    {billingErrors.email && (
                      <Text
                        size="1"
                        color="red"
                        mt="1"
                        style={{ display: "block" }}
                      >
                        {billingErrors.email}
                      </Text>
                    )}
                  </Box>

                  {/* NIF & RCCM */}
                  <Flex gap="3">
                    <Box style={{ flex: 1 }}>
                      <Text
                        as="label"
                        size="2"
                        weight="medium"
                        mb="1"
                        style={{ display: "block" }}
                      >
                        NIF{" "}
                        <Text size="1" color="gray">
                          (optionnel)
                        </Text>
                      </Text>
                      <TextField.Root
                        size="3"
                        placeholder="Numéro d'identification fiscale"
                        value={billingNif}
                        onChange={(e) => setBillingNif(e.target.value)}
                      >
                        <TextField.Slot side="left">
                          <IdentificationCard size={16} weight="duotone" />
                        </TextField.Slot>
                      </TextField.Root>
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Text
                        as="label"
                        size="2"
                        weight="medium"
                        mb="1"
                        style={{ display: "block" }}
                      >
                        RCCM{" "}
                        <Text size="1" color="gray">
                          (optionnel)
                        </Text>
                      </Text>
                      <TextField.Root
                        size="3"
                        placeholder="Registre de commerce"
                        value={billingRccm}
                        onChange={(e) => setBillingRccm(e.target.value)}
                      >
                        <TextField.Slot side="left">
                          <IdentificationCard size={16} weight="duotone" />
                        </TextField.Slot>
                      </TextField.Root>
                    </Box>
                  </Flex>
                </Flex>

                {/* Navigation */}
                <Flex justify="between" mt="5">
                  <Button
                    variant="soft"
                    color="gray"
                    size="3"
                    onClick={goPrev}
                  >
                    <ArrowLeft size={16} weight="bold" />
                    Précédent
                  </Button>
                  <Button size="3" onClick={handleNextStep3}>
                    Suivant
                    <ArrowRight size={16} weight="bold" />
                  </Button>
                </Flex>
              </Box>
            </StepAnimation>
          )}

          {/* ── Étape 4 : Confirmation ── */}
          {step === 4 && (
            <StepAnimation stepKey={4} direction={direction}>
              <Box>
                {/* Résumé Plan */}
                <SummaryBox label="Plan" mb="3">
                  <Flex align="center" justify="between">
                    <Flex align="center" gap="2">
                      <TargetIcon
                        size={18}
                        weight="duotone"
                        style={{ color: `var(--${targetColor}-9)` }}
                      />
                      <Text size="2" weight="bold">
                        {targetConfig.nom}
                      </Text>
                      <Badge
                        size="1"
                        variant="soft"
                        color={targetColor as "orange" | "blue" | "violet"}
                      >
                        {cycle === "annuel" ? "Annuel" : "Mensuel"}
                      </Badge>
                    </Flex>
                    <Flex direction="column" align="end">
                      <Text
                        size="1"
                        color="gray"
                        style={{
                          fontFamily:
                            "var(--font-google-sans-code), monospace",
                        }}
                      >
                        {formatCurrency(targetMonthly)}/mois
                      </Text>
                      <Text
                        size="3"
                        weight="bold"
                        style={{
                          fontFamily:
                            "var(--font-google-sans-code), monospace",
                          color: `var(--${targetColor}-11)`,
                        }}
                      >
                        {formatCurrency(totalPrice)}
                      </Text>
                    </Flex>
                  </Flex>
                </SummaryBox>

                {/* Résumé Paiement */}
                <SummaryBox label="Paiement" mb="3">
                  <Flex align="center" gap="2">
                    {selectedMethod === "monetbil" ? (
                      <DeviceMobile
                        size={16}
                        weight="duotone"
                        style={{ color: "var(--orange-9)" }}
                      />
                    ) : (
                      <CreditCard
                        size={16}
                        weight="duotone"
                        style={{ color: "var(--blue-9)" }}
                      />
                    )}
                    <Text size="2" weight="medium">
                      {selectedMethod === "monetbil"
                        ? "Airtel Money / Moov Money"
                        : "Carte bancaire (Stripe)"}
                    </Text>
                  </Flex>
                  {selectedMethod === "monetbil" && phoneNumber && (
                    <Text
                      size="2"
                      mt="1"
                      style={{
                        display: "block",
                        fontFamily:
                          "var(--font-google-sans-code), monospace",
                        color: "var(--gray-11)",
                      }}
                    >
                      Tél : {phoneNumber}
                    </Text>
                  )}
                </SummaryBox>

                {/* Résumé Facturation */}
                <SummaryBox label="Facturation" mb="4">
                  <Text size="2" weight="medium" style={{ display: "block" }}>
                    {billingNom}
                  </Text>
                  {billingAdresse && (
                    <Text
                      size="2"
                      color="gray"
                      style={{ display: "block" }}
                    >
                      {billingAdresse}
                    </Text>
                  )}
                  <Text size="2" color="gray" style={{ display: "block" }}>
                    {billingEmail}
                  </Text>
                  {(billingNif || billingRccm) && (
                    <Flex gap="3" mt="1">
                      {billingNif && (
                        <Text size="1" color="gray">
                          NIF : {billingNif}
                        </Text>
                      )}
                      {billingRccm && (
                        <Text size="1" color="gray">
                          RCCM : {billingRccm}
                        </Text>
                      )}
                    </Flex>
                  )}
                </SummaryBox>

                {/* Callout */}
                <Callout.Root color="amber" variant="surface" mb="4">
                  <Callout.Icon>
                    <Warning size={16} weight="fill" />
                  </Callout.Icon>
                  <Callout.Text size="2">
                    L&apos;upgrade sera effectif immédiatement. Vous serez
                    facturé au prorata.
                  </Callout.Text>
                </Callout.Root>

                {/* Actions */}
                <Flex justify="between" mt="5">
                  <Button
                    variant="soft"
                    color="gray"
                    size="3"
                    onClick={goPrev}
                    disabled={isProcessing}
                  >
                    <ArrowLeft size={16} weight="bold" />
                    Précédent
                  </Button>
                  <Button
                    size="3"
                    color={targetColor as "orange" | "blue" | "violet"}
                    onClick={handleConfirm}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <ArrowClockwise
                          size={16}
                          weight="bold"
                          className="animate-spin"
                        />
                        Traitement en cours...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} weight="fill" />
                        Confirmer et payer — {formatCurrency(totalPrice)}
                      </>
                    )}
                  </Button>
                </Flex>
              </Box>
            </StepAnimation>
          )}
        </AnimatePresence>
      </Dialog.Content>
    </Dialog.Root>
  );
}

// ── Payment Card ───────────────────────────────────────────────────────

function PaymentCard({
  selected,
  onClick,
  icon: Icon,
  label,
  description,
  color,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size: number; weight: "regular" | "bold" | "fill" | "duotone" | "thin" | "light"; style?: React.CSSProperties }>;
  label: string;
  description: string;
  color: "orange" | "blue";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${label} — ${description}`}
      style={{
        background: "var(--color-background)",
        borderRadius: 12,
        border: selected
          ? `2px solid var(--${color}-9)`
          : "1px solid var(--gray-a4)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        padding: "var(--space-4)",
        width: "100%",
        textAlign: "left",
        outline: "none",
      }}
    >
      <Flex align="center" gap="3">
        <Flex
          align="center"
          justify="center"
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: selected
              ? `var(--${color}-a3)`
              : "var(--gray-a3)",
            flexShrink: 0,
          }}
        >
          <Icon
            size={22}
            weight="duotone"
            style={{
              color: selected ? `var(--${color}-9)` : "var(--gray-9)",
            }}
          />
        </Flex>

        <Box style={{ flex: 1 }}>
          <Flex align="center" gap="2">
            <Text size="3" weight="bold">
              {label}
            </Text>
            {selected && (
              <CheckCircle
                size={16}
                weight="fill"
                style={{ color: `var(--${color}-9)` }}
              />
            )}
          </Flex>
          <Text size="2" color="gray">
            {description}
          </Text>
        </Box>
      </Flex>
    </button>
  );
}

// ── Summary Box ────────────────────────────────────────────────────────

function SummaryBox({
  label,
  children,
  mb,
}: {
  label: string;
  children: React.ReactNode;
  mb?: string;
}) {
  return (
    <Box
      p="3"
      mb={mb as "3" | "4" | undefined}
      style={{
        background: "var(--gray-a2)",
        borderRadius: 10,
      }}
    >
      <Text
        size="1"
        weight="bold"
        color="gray"
        mb="2"
        style={{
          display: "block",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </Text>
      {children}
    </Box>
  );
}
