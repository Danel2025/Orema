"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Lock } from "@phosphor-icons/react";
import { usePlanFeature, usePlanAtLeast } from "@/hooks/use-plan-gate";
import type { PlanFeatures, PlanSlug } from "@/lib/config/plans";

interface PlanGateProps {
  feature?: keyof PlanFeatures;
  minPlan?: PlanSlug;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PlanGate({ feature, minPlan, children, fallback }: PlanGateProps) {
  const featureCheck = usePlanFeature(feature ?? "tables_salle");
  const planCheck = usePlanAtLeast(minPlan ?? "essentiel");

  // Determine which check to use
  const check = feature ? featureCheck : planCheck;

  if (check.allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        maxHeight: 480,
        borderRadius: 12,
      }}
    >
      {/* Contenu flouté — déborde pour ne pas couper net */}
      <div
        style={{
          filter: "blur(4px)",
          pointerEvents: "none",
          userSelect: "none",
          opacity: 0.7,
        }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Dégradé de fondu en bas */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background:
            "linear-gradient(to bottom, transparent, var(--color-background))",
          zIndex: 5,
        }}
      />

      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          zIndex: 10,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: "32px 40px",
            borderRadius: 12,
            backgroundColor: "var(--color-panel-solid)",
            border: "1px solid var(--gray-a6)",
            boxShadow: "var(--shadow-4)",
            textAlign: "center",
            maxWidth: 320,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: "var(--accent-a3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock size={24} weight="duotone" style={{ color: "var(--accent-9)" }} />
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 500,
              color: "var(--gray-11)",
              lineHeight: 1.5,
            }}
          >
            Disponible avec le plan{" "}
            <span style={{ fontWeight: 700, color: "var(--accent-11)" }}>
              {check.planName}
            </span>
          </p>

          <Link
            href="/parametres/abonnement"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 20px",
              borderRadius: 6,
              backgroundColor: "var(--accent-9)",
              color: "var(--accent-contrast)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--accent-10)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--accent-9)";
            }}
          >
            Mettre à niveau
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
