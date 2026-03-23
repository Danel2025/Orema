"use client";

/**
 * Dialog de suspension d'un etablissement
 * Avertissement rouge avec motif obligatoire et resume de l'impact
 */

import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Dialog,
  TextArea,
  Callout,
} from "@radix-ui/themes";
import {
  Pause,
  Warning,
  Users,
  ArrowClockwise,
} from "@phosphor-icons/react";
import type { EtablissementDetail } from "./types";

interface SuspendDialogProps {
  etablissement: EtablissementDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motif: string) => Promise<void>;
  nbUtilisateurs?: number;
}

export function SuspendDialog({
  etablissement,
  open,
  onOpenChange,
  onConfirm,
  nbUtilisateurs = 0,
}: SuspendDialogProps) {
  const [motif, setMotif] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!motif.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(motif.trim());
      setMotif("");
      onOpenChange(false);
    } catch {
      // Erreur geree par le parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMotif("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && handleClose()}>
      <Dialog.Content maxWidth="480px">
        <Dialog.Title>
          <Flex align="center" gap="2">
            <Warning size={20} weight="fill" style={{ color: "var(--red-9)" }} />
            Suspendre l'etablissement
          </Flex>
        </Dialog.Title>
        <Dialog.Description size="2" mb="4" color="gray">
          Vous etes sur le point de suspendre l'etablissement{" "}
          <Text weight="bold">"{etablissement.nom}"</Text>.
        </Dialog.Description>

        {/* Avertissement impact */}
        <Callout.Root color="red" mb="4">
          <Callout.Icon>
            <Warning size={16} weight="fill" />
          </Callout.Icon>
          <Callout.Text size="2">
            <Text weight="bold">Impact de la suspension :</Text>
            <br />
            La suspension bloquera l'acces a tous les utilisateurs de cet etablissement.
            Les donnees seront conservees mais inaccessibles.
          </Callout.Text>
        </Callout.Root>

        {/* Resume de l'impact */}
        <Box
          p="3"
          mb="4"
          style={{
            background: "var(--red-a2)",
            borderRadius: 8,
            border: "1px solid var(--red-a4)",
          }}
        >
          <Flex align="center" gap="2">
            <Users size={16} weight="bold" style={{ color: "var(--red-9)" }} />
            <Text size="2" color="red">
              <Text weight="bold">{nbUtilisateurs}</Text> utilisateur(s) seront bloques
            </Text>
          </Flex>
        </Box>

        {/* Motif (obligatoire) */}
        <Box mb="4">
          <Text as="label" size="2" weight="medium" mb="2" style={{ display: "block" }}>
            Motif de la suspension *
          </Text>
          <TextArea
            placeholder="Indiquez le motif de la suspension (ex: Non-paiement, violation des CGU, demande du client...)"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            rows={3}
            style={{ resize: "vertical" }}
          />
          {motif.length === 0 && (
            <Text size="1" color="gray" mt="1" style={{ display: "block" }}>
              Le motif est obligatoire pour suspendre un etablissement.
            </Text>
          )}
        </Box>

        {/* Actions */}
        <Flex gap="3" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray" disabled={isSubmitting}>
              Annuler
            </Button>
          </Dialog.Close>
          <Button
            color="red"
            onClick={handleConfirm}
            disabled={isSubmitting || !motif.trim()}
          >
            {isSubmitting ? (
              <>
                <ArrowClockwise size={14} weight="bold" className="animate-spin" />
                Suspension...
              </>
            ) : (
              <>
                <Pause size={14} weight="bold" />
                Confirmer la suspension
              </>
            )}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
