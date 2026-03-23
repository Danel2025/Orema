"use client";

/**
 * InvoicePreview - Card d'aperçu de facture
 * Affiche les informations de la facture avec actions
 */

import { Flex, Text, Badge, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { DownloadSimple, Check } from "@phosphor-icons/react";
import type { Facture, FactureStatut } from "./types";

interface InvoicePreviewProps {
  facture: Facture;
  onDownload?: () => void;
  onMarkPaid?: () => void;
}

const statutConfig: Record<
  FactureStatut,
  { label: string; color: "gray" | "blue" | "green" | "red" }
> = {
  brouillon: { label: "Brouillon", color: "gray" },
  envoyee: { label: "Envoyee", color: "blue" },
  payee: { label: "Payee", color: "green" },
  annulee: { label: "Annulee", color: "red" },
};

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-GA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(dateEcheance: string | Date, statut: FactureStatut): boolean {
  if (statut === "payee" || statut === "annulee") return false;
  return new Date(dateEcheance) < new Date();
}

export function InvoicePreview({ facture, onDownload, onMarkPaid }: InvoicePreviewProps) {
  const statut = statutConfig[facture.statut];
  const overdue = isOverdue(facture.dateEcheance, facture.statut);

  return (
    <div
      style={{
        backgroundColor: "var(--color-panel-solid)",
        borderRadius: 12,
        padding: 16,
        border: `1px solid ${overdue ? "var(--red-a6)" : "var(--gray-a6)"}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header : numero + statut */}
      <Flex justify="between" align="center" mb="3">
        <Flex direction="column" gap="1">
          <Text size="2" weight="bold" style={{ color: "var(--gray-12)" }}>
            {facture.numero}
          </Text>
          {facture.etablissementNom ? (
            <Text size="1" color="gray">
              {facture.etablissementNom}
            </Text>
          ) : null}
        </Flex>
        <Flex align="center" gap="2">
          {overdue ? (
            <Badge variant="soft" color="red">
              En retard
            </Badge>
          ) : null}
          <Badge variant="soft" color={statut.color}>
            {statut.label}
          </Badge>
        </Flex>
      </Flex>

      {/* Infos : dates + montant */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginBottom: 16,
          padding: "12px 0",
          borderTop: "1px solid var(--gray-a4)",
          borderBottom: "1px solid var(--gray-a4)",
        }}
      >
        <div>
          <Text
            size="1"
            color="gray"
            style={{ display: "block", marginBottom: 2 }}
          >
            Emission
          </Text>
          <Text size="2" style={{ color: "var(--gray-12)" }}>
            {formatDate(facture.dateEmission)}
          </Text>
        </div>
        <div>
          <Text
            size="1"
            color="gray"
            style={{ display: "block", marginBottom: 2 }}
          >
            Echeance
          </Text>
          <Text
            size="2"
            style={{
              color: overdue ? "var(--red-11)" : "var(--gray-12)",
            }}
          >
            {formatDate(facture.dateEcheance)}
          </Text>
        </div>
        <div style={{ textAlign: "right" }}>
          <Text
            size="1"
            color="gray"
            style={{ display: "block", marginBottom: 2 }}
          >
            Montant
          </Text>
          <Text
            size="2"
            weight="bold"
            style={{
              color: "var(--gray-12)",
              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            }}
          >
            {formatCurrency(facture.montant)}
          </Text>
        </div>
      </div>

      {/* Actions */}
      <Flex gap="2" justify="end">
        {onDownload ? (
          <Button variant="soft" color="gray" size="1" onClick={onDownload}>
            <DownloadSimple size={14} />
            Telecharger
          </Button>
        ) : null}
        {onMarkPaid && facture.statut !== "payee" && facture.statut !== "annulee" ? (
          <Button variant="solid" color="green" size="1" onClick={onMarkPaid}>
            <Check size={14} weight="bold" />
            Marquer payee
          </Button>
        ) : null}
      </Flex>
    </div>
  );
}
