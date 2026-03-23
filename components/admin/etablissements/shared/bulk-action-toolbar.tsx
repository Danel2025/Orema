"use client";

/**
 * BulkActionToolbar - Toolbar flottante en bas pour les actions en masse
 * Apparaît quand des items sont sélectionnés avec animation slide-up
 */

import { Text, Button } from "@/components/ui";
import { X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import type { BulkAction } from "./types";

interface BulkActionToolbarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
}

const actionColorMap: Record<string, string> = {
  red: "var(--red-9)",
  green: "var(--green-9)",
  blue: "var(--blue-9)",
  orange: "var(--orange-9)",
  gray: "var(--gray-11)",
};

export function BulkActionToolbar({
  selectedCount,
  actions,
  onClearSelection,
}: BulkActionToolbarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 ? (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            borderRadius: 12,
            backgroundColor: "var(--gray-12)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Compteur */}
          <Text
            size="2"
            weight="medium"
            style={{
              color: "var(--gray-1)",
              whiteSpace: "nowrap",
            }}
          >
            {selectedCount} selectionne{selectedCount > 1 ? "s" : ""}
          </Text>

          {/* Separator */}
          <div
            style={{
              width: 1,
              height: 20,
              backgroundColor: "var(--gray-8)",
            }}
          />

          {/* Actions */}
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  color: actionColorMap[action.color || "gray"] || "var(--gray-1)",
                  backgroundColor: "var(--gray-10)",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--gray-9)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--gray-10)";
                }}
              >
                <Icon size={14} />
                {action.label}
              </button>
            );
          })}

          {/* Separator */}
          <div
            style={{
              width: 1,
              height: 20,
              backgroundColor: "var(--gray-8)",
            }}
          />

          {/* Annuler */}
          <button
            onClick={onClearSelection}
            aria-label="Annuler la selection"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              backgroundColor: "transparent",
              color: "var(--gray-6)",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--gray-1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--gray-6)";
            }}
          >
            <X size={16} weight="bold" />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
