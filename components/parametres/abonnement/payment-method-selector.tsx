"use client";

import { useState } from "react";
import { Box, Flex, Text, Heading, Button } from "@radix-ui/themes";
import {
  CreditCard,
  DeviceMobile,
  CheckCircle,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────

export type PaymentMethod = "monetbil" | "stripe";

interface PaymentMethodSelectorProps {
  currentMethod?: PaymentMethod;
  phoneNumber?: string;
  cardLast4?: string;
  onSelect?: (method: PaymentMethod) => Promise<void>;
}

// ── Method Card ────────────────────────────────────────────────────────

function MethodCard({
  method,
  isSelected,
  onSelect,
  detail,
}: {
  method: PaymentMethod;
  isSelected: boolean;
  onSelect: () => void;
  detail?: string;
}) {
  const config = {
    monetbil: {
      icon: DeviceMobile,
      label: "Airtel Money",
      description: "Paiement via Monetbil (Airtel Money, Moov Money)",
      color: "orange" as const,
    },
    stripe: {
      icon: CreditCard,
      label: "Carte bancaire",
      description: "Visa, Mastercard via Stripe",
      color: "blue" as const,
    },
  };

  const { icon: Icon, label, description, color } = config[method];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`${label} — ${description}`}
      style={{
        background: "var(--color-background)",
        borderRadius: 12,
        border: isSelected
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
            background: isSelected ? `var(--${color}-a3)` : "var(--gray-a3)",
            flexShrink: 0,
          }}
        >
          <Icon
            size={22}
            weight="duotone"
            style={{ color: isSelected ? `var(--${color}-9)` : "var(--gray-9)" }}
          />
        </Flex>

        <Box style={{ flex: 1 }}>
          <Flex align="center" gap="2">
            <Text size="3" weight="bold">
              {label}
            </Text>
            {isSelected ? <CheckCircle
                size={16}
                weight="fill"
                style={{ color: `var(--${color}-9)` }}
              /> : null}
          </Flex>
          <Text size="2" color="gray">
            {description}
          </Text>
          {detail ? <Text
              size="2"
              mt="1"
              style={{
                display: "block",
                fontFamily: "var(--font-google-sans-code), monospace",
                color: "var(--gray-11)",
              }}
            >
              {detail}
            </Text> : null}
        </Box>
      </Flex>
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function PaymentMethodSelector({
  currentMethod,
  phoneNumber,
  cardLast4,
  onSelect,
}: PaymentMethodSelectorProps) {
  const [selected, setSelected] = useState<PaymentMethod>(currentMethod ?? "monetbil");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSelect) return;
    setIsSaving(true);
    try {
      await onSelect(selected);
      toast.success("Méthode de paiement mise à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanged = currentMethod !== selected;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.16 }}
    >
      <Box
        p="5"
        style={{
          background: "var(--color-background)",
          borderRadius: 14,
          border: "1px solid var(--gray-a4)",
        }}
      >
        <Heading size="3" weight="bold" mb="4">
          Méthode de paiement
        </Heading>

        <Flex direction="column" gap="3">
          <MethodCard
            method="monetbil"
            isSelected={selected === "monetbil"}
            onSelect={() => setSelected("monetbil")}
            detail={phoneNumber ? `Tel: ${phoneNumber}` : undefined}
          />

          <MethodCard
            method="stripe"
            isSelected={selected === "stripe"}
            onSelect={() => setSelected("stripe")}
            detail={cardLast4 ? `**** **** **** ${cardLast4}` : undefined}
          />
        </Flex>

        {hasChanged ? <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.2 }}
          >
            <Flex justify="end" mt="4">
              <Button
                color="orange"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <ArrowClockwise size={14} weight="bold" className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </Flex>
          </motion.div> : null}
      </Box>
    </motion.div>
  );
}
