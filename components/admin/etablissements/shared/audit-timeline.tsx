"use client";

/**
 * AuditTimeline - Timeline verticale pour les événements d'audit
 * Affiche des événements avec icônes, descriptions et timestamps relatifs
 */

import { Flex, Text, Button } from "@/components/ui";
import { Skeleton } from "@radix-ui/themes";
import {
  PlusCircle,
  PencilSimple,
  Trash,
  SignIn,
  SignOut,
  Prohibit,
  ArrowCounterClockwise,
  CreditCard,
  Export,
  Download,
  GearSix,
  Warning,
} from "@phosphor-icons/react";
import type { IconWeight } from "@phosphor-icons/react";
import type { AuditEvent, AuditActionType, AuditSeverity } from "./types";

interface AuditTimelineProps {
  events: AuditEvent[];
  loading?: boolean;
  onLoadMore?: () => void;
}

const actionIconMap: Record<AuditActionType, React.ComponentType<{ size?: number; weight?: IconWeight; style?: React.CSSProperties }>> = {
  creation: PlusCircle,
  modification: PencilSimple,
  suppression: Trash,
  connexion: SignIn,
  deconnexion: SignOut,
  suspension: Prohibit,
  reactivation: ArrowCounterClockwise,
  paiement: CreditCard,
  export: Export,
  import: Download,
  configuration: GearSix,
  erreur: Warning,
};

const severityColorMap: Record<AuditSeverity, { icon: string; bg: string; border: string }> = {
  info: {
    icon: "var(--blue-9)",
    bg: "var(--blue-a3)",
    border: "var(--blue-a6)",
  },
  warning: {
    icon: "var(--orange-9)",
    bg: "var(--orange-a3)",
    border: "var(--orange-a6)",
  },
  danger: {
    icon: "var(--red-9)",
    bg: "var(--red-a3)",
    border: "var(--red-a6)",
  },
  success: {
    icon: "var(--green-9)",
    bg: "var(--green-a3)",
    border: "var(--green-a6)",
  },
};

function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return "Hier";
  if (diffD < 7) return `Il y a ${diffD} jours`;
  if (diffD < 30) return `Il y a ${Math.floor(diffD / 7)} sem.`;
  return d.toLocaleDateString("fr-GA", { day: "numeric", month: "short" });
}

function getInitials(nom: string): string {
  return nom
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function TimelineSkeleton() {
  return (
    <Flex direction="column" gap="4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Flex key={i} gap="3" align="start">
          <Skeleton width="36px" height="36px" style={{ borderRadius: "50%" }} />
          <Flex direction="column" gap="2" style={{ flex: 1 }}>
            <Skeleton><Text size="2">Chargement de l'événement d'audit</Text></Skeleton>
            <Skeleton><Text size="1">Il y a quelques minutes</Text></Skeleton>
          </Flex>
        </Flex>
      ))}
    </Flex>
  );
}

function TimelineEvent({ event }: { event: AuditEvent }) {
  const Icon = actionIconMap[event.actionType] || GearSix;
  const colors = severityColorMap[event.severity];

  return (
    <div style={{ display: "flex", gap: 12, position: "relative" }}>
      {/* Icône */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        <Icon size={18} style={{ color: colors.icon }} />
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, paddingBottom: 20 }}>
        <Text size="2" style={{ color: "var(--gray-12)", display: "block" }}>
          {event.description}
        </Text>

        <Flex align="center" gap="2" mt="1">
          {/* Avatar utilisateur */}
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: "var(--accent-a3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 600,
              color: "var(--accent-11)",
            }}
          >
            {getInitials(event.utilisateur.nom)}
          </div>
          <Text size="1" style={{ color: "var(--gray-10)" }}>
            {event.utilisateur.nom}
          </Text>
          <Text size="1" style={{ color: "var(--gray-8)" }}>
            ·
          </Text>
          <Text size="1" style={{ color: "var(--gray-9)" }}>
            {getRelativeTime(event.timestamp)}
          </Text>
        </Flex>
      </div>
    </div>
  );
}

export function AuditTimeline({ events, loading, onLoadMore }: AuditTimelineProps) {
  if (loading) {
    return <TimelineSkeleton />;
  }

  if (events.length === 0) {
    return (
      <Flex align="center" justify="center" py="6">
        <Text size="2" color="gray">Aucun événement d'audit</Text>
      </Flex>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Ligne verticale de connexion */}
      <div
        style={{
          position: "absolute",
          left: 17,
          top: 36,
          bottom: onLoadMore ? 60 : 20,
          width: 2,
          backgroundColor: "var(--gray-a4)",
        }}
      />

      {events.map((event) => (
        <TimelineEvent key={event.id} event={event} />
      ))}

      {onLoadMore ? (
        <Flex justify="center" mt="2">
          <Button variant="ghost" color="gray" size="1" onClick={onLoadMore}>
            Charger plus
          </Button>
        </Flex>
      ) : null}
    </div>
  );
}
