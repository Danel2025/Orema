"use client";

import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Badge,
  Button,
  Table,
} from "@radix-ui/themes";
import {
  Receipt,
  DownloadSimple,
  CaretLeft,
  CaretRight,
  FunnelSimple,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { formatCurrency } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  numero: string;
  date: string;
  montant: number;
  statut: "payee" | "en_attente" | "echue";
  downloadUrl?: string;
}

interface InvoiceHistoryProps {
  invoices: Invoice[];
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onDownload?: (invoiceId: string) => void;
}

// ── Statut Badge ───────────────────────────────────────────────────────

function InvoiceStatusBadge({ statut }: { statut: Invoice["statut"] }) {
  const config = {
    payee: { color: "green" as const, label: "Payee" },
    en_attente: { color: "amber" as const, label: "En attente" },
    echue: { color: "red" as const, label: "Echue" },
  };

  const { color, label } = config[statut];

  return (
    <Badge color={color} variant="soft" size="1">
      {label}
    </Badge>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function InvoiceHistory({
  invoices,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  onDownload,
}: InvoiceHistoryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.24 }}
    >
      <Box
        p="5"
        style={{
          background: "var(--color-background)",
          borderRadius: 14,
          border: "1px solid var(--gray-a4)",
        }}
      >
        <Flex align="center" justify="between" mb="4">
          <Flex align="center" gap="2">
            <Receipt size={20} weight="duotone" style={{ color: "var(--gray-9)" }} />
            <Heading size="3" weight="bold">
              Historique des factures
            </Heading>
          </Flex>
        </Flex>

        {invoices.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py="8"
            gap="2"
          >
            <Receipt size={40} weight="thin" style={{ color: "var(--gray-7)" }} />
            <Text size="2" color="gray">
              Aucune facture pour le moment
            </Text>
          </Flex>
        ) : (
          <>
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Numéro</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="right">Montant</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="right">Action</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {invoices.map((invoice) => (
                  <Table.Row key={invoice.id}>
                    <Table.Cell>
                      <Text size="2">
                        {new Date(invoice.date).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text
                        size="2"
                        style={{
                          fontFamily: "var(--font-google-sans-code), monospace",
                        }}
                      >
                        {invoice.numero}
                      </Text>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <Text
                        size="2"
                        weight="bold"
                        style={{
                          fontFamily: "var(--font-google-sans-code), monospace",
                        }}
                      >
                        {formatCurrency(invoice.montant)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <InvoiceStatusBadge statut={invoice.statut} />
                    </Table.Cell>
                    <Table.Cell align="right">
                      {invoice.statut === "payee" && (
                        <Button
                          size="1"
                          variant="ghost"
                          color="gray"
                          onClick={() => onDownload?.(invoice.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <DownloadSimple size={14} weight="bold" />
                          PDF
                        </Button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>

            {/* Pagination */}
            {totalPages > 1 && (
              <Flex align="center" justify="center" gap="3" mt="4">
                <Button
                  size="2"
                  variant="soft"
                  color="gray"
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange?.(currentPage - 1)}
                  style={{ cursor: currentPage <= 1 ? "default" : "pointer" }}
                >
                  <CaretLeft size={14} weight="bold" />
                </Button>
                <Text size="2" color="gray">
                  Page {currentPage} sur {totalPages}
                </Text>
                <Button
                  size="2"
                  variant="soft"
                  color="gray"
                  disabled={currentPage >= totalPages}
                  onClick={() => onPageChange?.(currentPage + 1)}
                  style={{ cursor: currentPage >= totalPages ? "default" : "pointer" }}
                >
                  <CaretRight size={14} weight="bold" />
                </Button>
              </Flex>
            )}
          </>
        )}
      </Box>
    </motion.div>
  );
}
