"use client";

/**
 * Table des derniers paiements
 * Radix UI Table avec badges colorés par méthode et statut
 */

import { Box, Flex, Heading, Text, Table, Badge } from "@radix-ui/themes";
import { Receipt } from "@phosphor-icons/react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { PLAN_LABELS, resolvePlanSlug, type PlanSlug } from "@/lib/config/plans";
import type { RecentPayment } from "./types";

interface RecentPaymentsTableProps {
  payments: RecentPayment[];
}

const PLAN_BADGE_COLORS: Record<PlanSlug, "gray" | "blue" | "orange" | "violet"> = {
  essentiel: "gray",
  pro: "blue",
  business: "orange",
  enterprise: "violet",
};

function getPlanBadgeColor(plan: string): "gray" | "blue" | "orange" | "violet" {
  const slug = resolvePlanSlug(plan);
  return PLAN_BADGE_COLORS[slug] ?? "gray";
}

function getPlanLabel(plan: string): string {
  const slug = resolvePlanSlug(plan);
  return PLAN_LABELS[slug] ?? plan;
}

const METHOD_BADGE: Record<string, { label: string; color: "green" | "blue" | "gray" }> = {
  monetbil: { label: "Airtel Money", color: "green" },
  stripe: { label: "Stripe", color: "blue" },
  manuel: { label: "Manuel", color: "gray" },
};

const STATUS_BADGE: Record<string, { label: string; color: "green" | "red" | "amber" }> = {
  reussi: { label: "Réussi", color: "green" },
  echoue: { label: "Échoué", color: "red" },
  en_attente: { label: "En attente", color: "amber" },
};

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Libreville",
  }).format(date);
}

export function RecentPaymentsTable({ payments }: RecentPaymentsTableProps) {
  if (payments.length === 0) {
    return (
      <Box
        p="5"
        style={{
          background: "var(--color-background)",
          borderRadius: 12,
          border: "1px solid var(--gray-a4)",
        }}
      >
        <Heading size="3" weight="bold" mb="4">
          Derniers paiements
        </Heading>
        <Flex direction="column" align="center" justify="center" py="8" gap="3">
          <Flex
            align="center"
            justify="center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--gray-a3)",
            }}
          >
            <Receipt size={24} weight="duotone" style={{ color: "var(--gray-9)" }} />
          </Flex>
          <Text size="2" color="gray">
            Aucun paiement récent
          </Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box
      p="5"
      style={{
        background: "var(--color-background)",
        borderRadius: 12,
        border: "1px solid var(--gray-a4)",
      }}
    >
      <Flex align="center" justify="between" mb="4">
        <Heading size="3" weight="bold">
          Derniers paiements
        </Heading>
        <Badge color="gray" variant="soft" size="1">
          {payments.length} paiement{payments.length > 1 ? "s" : ""}
        </Badge>
      </Flex>

      <Box style={{ overflowX: "auto" }}>
        <Table.Root size="2">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Établissement</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Plan</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Montant</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Méthode</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {payments.map((payment) => {
              const methodInfo = METHOD_BADGE[payment.methode] || {
                label: payment.methode,
                color: "gray" as const,
              };
              const statusInfo = STATUS_BADGE[payment.statut] || {
                label: payment.statut,
                color: "gray" as const,
              };

              return (
                <Table.Row key={payment.id}>
                  <Table.Cell>
                    <Text size="2" color="gray">
                      {formatDateShort(payment.date)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Link
                      href={`/admin/etablissements/${payment.etablissementId}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Text size="2" weight="medium" style={{ color: "var(--accent-11)" }}>
                        {payment.etablissementNom}
                      </Text>
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={getPlanBadgeColor(payment.plan)}
                      variant="soft"
                      size="1"
                    >
                      {getPlanLabel(payment.plan)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text
                      size="2"
                      weight="medium"
                      style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                    >
                      {formatCurrency(payment.montant)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={methodInfo.color} variant="soft" size="1">
                      {methodInfo.label}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={statusInfo.color} variant="soft" size="1">
                      {statusInfo.label}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}
