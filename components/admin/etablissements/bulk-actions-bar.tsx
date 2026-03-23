"use client";

/**
 * Barre d'actions groupées sticky en bas
 * Apparaît quand des établissements sont sélectionnés
 */

import { Box, Flex, Text, Button } from "@radix-ui/themes";
import { Pause, Play, ChartBar, X } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";

interface BulkActionsBarProps {
  selectedCount: number;
  onSuspend: () => void;
  onReactivate: () => void;
  onCompare: () => void;
  onDeselectAll: () => void;
  canCompare: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onSuspend,
  onReactivate,
  onCompare,
  onDeselectAll,
  canCompare,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
          }}
        >
          <Box
            px="5"
            py="3"
            style={{
              background: "var(--gray-12)",
              borderRadius: 12,
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)",
              minWidth: 400,
            }}
          >
            <Flex align="center" gap="4" justify="between">
              {/* Compteur */}
              <Flex align="center" gap="2">
                <Box
                  style={{
                    background: "var(--accent-9)",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  <Text
                    size="2"
                    weight="bold"
                    style={{ color: "white" }}
                  >
                    {selectedCount}
                  </Text>
                </Box>
                <Text size="2" style={{ color: "var(--gray-1)" }}>
                  sélectionné{selectedCount > 1 ? "s" : ""}
                </Text>
              </Flex>

              {/* Actions */}
              <Flex align="center" gap="2">
                {canCompare ? <Button
                    variant="soft"
                    size="2"
                    onClick={onCompare}
                    style={{
                      background: "var(--accent-a4)",
                      color: "var(--accent-11)",
                      cursor: "pointer",
                    }}
                  >
                    <ChartBar size={14} weight="bold" />
                    Comparer
                  </Button> : null}

                <Button
                  variant="soft"
                  color="amber"
                  size="2"
                  onClick={onSuspend}
                  style={{ cursor: "pointer" }}
                >
                  <Pause size={14} weight="bold" />
                  Suspendre
                </Button>

                <Button
                  variant="soft"
                  color="green"
                  size="2"
                  onClick={onReactivate}
                  style={{ cursor: "pointer" }}
                >
                  <Play size={14} weight="bold" />
                  Réactiver
                </Button>

                {/* Séparateur */}
                <Box
                  style={{
                    width: 1,
                    height: 20,
                    background: "var(--gray-8)",
                  }}
                />

                <Button
                  variant="ghost"
                  size="2"
                  onClick={onDeselectAll}
                  style={{
                    color: "var(--gray-6)",
                    cursor: "pointer",
                  }}
                >
                  <X size={14} weight="bold" />
                  Tout désélectionner
                </Button>
              </Flex>
            </Flex>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
