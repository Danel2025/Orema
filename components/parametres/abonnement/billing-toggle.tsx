"use client";

import { Flex, Text } from "@radix-ui/themes";
import { motion } from "motion/react";
import type { BillingCycle } from "@/lib/config/plans";

interface BillingToggleProps {
  cycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
}

export function BillingToggle({ cycle, onChange }: BillingToggleProps) {
  return (
    <Flex align="center" gap="3">
      <button
        type="button"
        onClick={() => onChange("mensuel")}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          outline: "none",
        }}
      >
        <Text
          size="2"
          weight={cycle === "mensuel" ? "bold" : "medium"}
          style={{
            color: cycle === "mensuel" ? "var(--gray-12)" : "var(--gray-9)",
            transition: "color 0.2s",
            userSelect: "none",
          }}
        >
          Mensuel
        </Text>
      </button>

      <button
        type="button"
        role="switch"
        aria-checked={cycle === "annuel"}
        aria-label="Basculer entre facturation mensuelle et annuelle"
        onClick={() => onChange(cycle === "mensuel" ? "annuel" : "mensuel")}
        style={{
          position: "relative",
          width: 48,
          height: 26,
          borderRadius: 13,
          border: "none",
          background: cycle === "annuel" ? "var(--accent-9)" : "var(--gray-a6)",
          cursor: "pointer",
          transition: "background 0.2s",
          padding: 0,
          outline: "none",
        }}
      >
        <motion.div
          animate={{ x: cycle === "annuel" ? 23 : 3 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{
            position: "absolute",
            top: 3,
            width: 20,
            height: 20,
            borderRadius: 10,
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
        />
      </button>

      <Flex align="center" gap="2">
        <button
          type="button"
          onClick={() => onChange("annuel")}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            outline: "none",
          }}
        >
          <Text
            size="2"
            weight={cycle === "annuel" ? "bold" : "medium"}
            style={{
              color: cycle === "annuel" ? "var(--gray-12)" : "var(--gray-9)",
              transition: "color 0.2s",
              userSelect: "none",
            }}
          >
            Annuel
          </Text>
        </button>
        {cycle === "annuel" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent-11)",
              backgroundColor: "var(--accent-a3)",
              padding: "2px 8px",
              borderRadius: 4,
              letterSpacing: "0.02em",
            }}
          >
            -17%
          </motion.span>
        )}
      </Flex>
    </Flex>
  );
}
