"use client";

/**
 * ApprobationPendingBadge - Banner affiché quand une approbation de remise est en attente
 */

import { Flex, Text, Button } from "@radix-ui/themes";
import { HourglassSimple, XCircle } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency } from "@/lib/utils";

interface ApprobationPendingBadgeProps {
  montantRemise: number;
  pourcentageRemise: number;
  onAnnuler: () => void;
}

export function ApprobationPendingBadge({
  montantRemise,
  pourcentageRemise,
  onAnnuler,
}: ApprobationPendingBadgeProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25 }}
      >
        <Flex
          align="center"
          justify="between"
          gap="3"
          p="3"
          style={{
            backgroundColor: "var(--orange-a3)",
            border: "1px solid var(--orange-a6)",
            borderRadius: 8,
          }}
        >
          <Flex align="center" gap="2" style={{ flex: 1 }}>
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <HourglassSimple
                size={18}
                weight="duotone"
                style={{ color: "var(--orange-11)" }}
              />
            </motion.div>
            <Text size="2" color="orange" weight="medium">
              Remise de {pourcentageRemise}% ({formatCurrency(montantRemise)})
              en attente d'approbation
            </Text>
          </Flex>

          <Button
            variant="ghost"
            color="orange"
            size="1"
            onClick={onAnnuler}
          >
            <XCircle size={14} />
            Annuler
          </Button>
        </Flex>
      </motion.div>
    </AnimatePresence>
  );
}
