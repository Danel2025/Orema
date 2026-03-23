"use client";

/**
 * StatusIndicator - Indicateur de statut avec point coloré animé + texte
 * Point animé (pulse) pour actif, statique pour suspendu
 */

import { Text } from "@/components/ui";
import type { EtablissementStatus } from "./types";

interface StatusIndicatorProps {
  status: EtablissementStatus;
  size?: "sm" | "md";
  showText?: boolean;
}

const statusConfig: Record<
  EtablissementStatus,
  { label: string; color: string; pulse: boolean }
> = {
  actif: {
    label: "Actif",
    color: "var(--green-9)",
    pulse: true,
  },
  suspendu: {
    label: "Suspendu",
    color: "var(--red-9)",
    pulse: false,
  },
  en_essai: {
    label: "En essai",
    color: "var(--blue-9)",
    pulse: true,
  },
};

const sizeConfig = {
  sm: { dot: 8, fontSize: "1" as const, gap: 6 },
  md: { dot: 10, fontSize: "2" as const, gap: 8 },
};

export function StatusIndicator({
  status,
  size = "md",
  showText = true,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const s = sizeConfig[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
      }}
    >
      {/* Point avec animation pulse */}
      <span
        style={{
          position: "relative",
          display: "inline-block",
          width: s.dot,
          height: s.dot,
          flexShrink: 0,
        }}
      >
        {/* Halo animé */}
        {config.pulse ? (
          <span
            style={{
              position: "absolute",
              inset: -2,
              borderRadius: "50%",
              backgroundColor: config.color,
              opacity: 0.3,
              animation: "status-pulse 2s ease-in-out infinite",
            }}
          />
        ) : null}

        {/* Point central */}
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            backgroundColor: config.color,
          }}
        />
      </span>

      {showText ? (
        <Text size={s.fontSize} weight="medium" style={{ color: config.color }}>
          {config.label}
        </Text>
      ) : null}

      {/* Keyframes pour l'animation pulse */}
      {config.pulse ? (
        <style>{`
          @keyframes status-pulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.8); opacity: 0; }
          }
        `}</style>
      ) : null}
    </span>
  );
}
