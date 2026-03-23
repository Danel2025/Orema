"use client";

/**
 * Dialog de reactivation d'un etablissement suspendu
 * Confirmation verte avec affichage du motif original et duree de suspension
 */

import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Dialog,
  Callout,
} from "@radix-ui/themes";
import {
  Play,
  CheckCircle,
  ClockCounterClockwise,
  Warning,
  ArrowClockwise,
} from "@phosphor-icons/react";
import type { EtablissementDetail } from "./types";

interface ReactivateDialogProps {
  etablissement: EtablissementDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  motifSuspension?: string | null;
  dateSuspension?: string | null;
}

function getSuspensionDuration(dateSuspension: string | null | undefined): string {
  if (!dateSuspension) return "Inconnue";

  const now = new Date();
  const suspended = new Date(dateSuspension);
  const diff = now.getTime() - suspended.getTime();

  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 1) return "Moins d'une heure";
  if (hours < 24) return `${hours} heure(s)`;
  if (days < 30) return `${days} jour(s)`;
  if (days < 365) return `${Math.floor(days / 30)} mois`;
  return `${Math.floor(days / 365)} an(s)`;
}

export function ReactivateDialog({
  etablissement,
  open,
  onOpenChange,
  onConfirm,
  motifSuspension,
  dateSuspension,
}: ReactivateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Erreur geree par le parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="480px">
        <Dialog.Title>
          <Flex align="center" gap="2">
            <CheckCircle size={20} weight="fill" style={{ color: "var(--green-9)" }} />
            Reactiver l'etablissement
          </Flex>
        </Dialog.Title>
        <Dialog.Description size="2" mb="4" color="gray">
          Vous etes sur le point de reactiver l'etablissement{" "}
          <Text weight="bold">"{etablissement.nom}"</Text>.
        </Dialog.Description>

        {/* Motif de suspension original */}
        {motifSuspension ? <Box
            p="3"
            mb="4"
            style={{
              background: "var(--red-a2)",
              borderRadius: 8,
              border: "1px solid var(--red-a4)",
            }}
          >
            <Flex align="start" gap="2">
              <Warning
                size={16}
                weight="fill"
                style={{ color: "var(--red-9)", flexShrink: 0, marginTop: 2 }}
              />
              <Box>
                <Text size="1" color="red" weight="medium" style={{ display: "block", marginBottom: 4 }}>
                  Motif de suspension :
                </Text>
                <Text size="2" style={{ display: "block" }}>
                  {motifSuspension}
                </Text>
              </Box>
            </Flex>
          </Box> : null}

        {/* Duree de suspension */}
        {dateSuspension ? <Box
            p="3"
            mb="4"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 8,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex align="center" gap="2">
              <ClockCounterClockwise
                size={16}
                weight="bold"
                style={{ color: "var(--gray-9)" }}
              />
              <Text size="2" color="gray">
                Suspendu depuis{" "}
                <Text weight="bold">{getSuspensionDuration(dateSuspension)}</Text>
              </Text>
            </Flex>
          </Box> : null}

        {/* Confirmation */}
        <Callout.Root color="green" mb="4">
          <Callout.Icon>
            <CheckCircle size={16} weight="fill" />
          </Callout.Icon>
          <Callout.Text size="2">
            La reactivation restaurera l'acces a tous les utilisateurs de cet etablissement.
            Toutes les donnees seront a nouveau accessibles.
          </Callout.Text>
        </Callout.Root>

        {/* Actions */}
        <Flex gap="3" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray" disabled={isSubmitting}>
              Annuler
            </Button>
          </Dialog.Close>
          <Button
            color="green"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ArrowClockwise size={14} weight="bold" className="animate-spin" />
                Reactivation...
              </>
            ) : (
              <>
                <Play size={14} weight="fill" />
                Reactiver
              </>
            )}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
