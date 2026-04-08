"use client";

import { Box, Flex, Text, IconButton } from "@radix-ui/themes";
import {
  SpinnerGap,
  CheckCircle,
  Warning,
  Info,
  X,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";

// ── Types ──────────────────────────────────────────────────────────────

export type PaymentBannerStatus = "checking" | "success" | "error" | "cancelled";

interface PaymentStatusBannerProps {
  status: PaymentBannerStatus;
  onClose: () => void;
}

// ── Config ─────────────────────────────────────────────────────────────

const BANNER_CONFIG: Record<
  PaymentBannerStatus,
  {
    icon: typeof CheckCircle;
    iconWeight: "regular" | "fill" | "duotone";
    background: string;
    border: string;
    iconColor: string;
    textColor: string;
    message: string;
    spinning?: boolean;
  }
> = {
  checking: {
    icon: SpinnerGap,
    iconWeight: "regular",
    background: "var(--amber-a3)",
    border: "var(--amber-a5)",
    iconColor: "var(--amber-11)",
    textColor: "var(--amber-11)",
    message: "Vérification du paiement en cours...",
    spinning: true,
  },
  success: {
    icon: CheckCircle,
    iconWeight: "fill",
    background: "var(--green-a3)",
    border: "var(--green-a5)",
    iconColor: "var(--green-11)",
    textColor: "var(--green-11)",
    message: "Paiement confirmé ! Votre plan a été mis à jour.",
  },
  error: {
    icon: Warning,
    iconWeight: "fill",
    background: "var(--red-a3)",
    border: "var(--red-a5)",
    iconColor: "var(--red-11)",
    textColor: "var(--red-11)",
    message: "Le paiement n'a pas abouti. Veuillez réessayer.",
  },
  cancelled: {
    icon: Info,
    iconWeight: "fill",
    background: "var(--gray-a3)",
    border: "var(--gray-a5)",
    iconColor: "var(--gray-11)",
    textColor: "var(--gray-11)",
    message: "Paiement annulé.",
  },
};

// ── Component ──────────────────────────────────────────────────────────

export function PaymentStatusBanner({
  status,
  onClose,
}: PaymentStatusBannerProps) {
  const config = BANNER_CONFIG[status];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          p="4"
          mb="4"
          style={{
            background: config.background,
            borderRadius: 12,
            border: `1px solid ${config.border}`,
          }}
        >
          <Flex align="center" justify="between" gap="3">
            <Flex align="center" gap="3">
              {config.spinning ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon
                    size={20}
                    weight={config.iconWeight}
                    style={{ color: config.iconColor }}
                  />
                </motion.div>
              ) : (
                <Icon
                  size={20}
                  weight={config.iconWeight}
                  style={{ color: config.iconColor }}
                />
              )}
              <Text size="2" weight="medium" style={{ color: config.textColor }}>
                {config.message}
              </Text>
            </Flex>
            {status !== "checking" && (
              <IconButton
                size="1"
                variant="ghost"
                color="gray"
                onClick={onClose}
                aria-label="Fermer"
                style={{ cursor: "pointer" }}
              >
                <X size={16} weight="bold" />
              </IconButton>
            )}
          </Flex>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
}
