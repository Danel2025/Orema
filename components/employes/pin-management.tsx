"use client";

/**
 * Composant de gestion des codes PIN
 * Permet de reset/generer un nouveau PIN pour un employe
 */

import { useState } from "react";
import { Dialog, Button, Flex, Text, TextField, Callout, Box } from "@radix-ui/themes";
import { Key, ArrowsClockwise, Copy, Check, WarningCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

import { resetEmployePin, generateRandomPin } from "@/actions/employes";

interface PinManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    id: string;
    nom: string;
    prenom: string;
    hasPin: boolean;
  };
  onSuccess?: () => void;
}

export function PinManagement({ open, onOpenChange, employee, onSuccess }: PinManagementProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePin = async () => {
    const pin = await generateRandomPin();
    setNewPin(pin);
    setError(null);
  };

  const validatePin = (pin: string): boolean => {
    if (!/^\d{4,6}$/.test(pin)) {
      setError("Le PIN doit contenir entre 4 et 6 chiffres");
      return false;
    }
    setError(null);
    return true;
  };

  const handlePinChange = (value: string) => {
    // Autoriser uniquement les chiffres
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setNewPin(numericValue);
    if (numericValue.length >= 4) {
      validatePin(numericValue);
    } else {
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!validatePin(newPin)) return;

    setIsSubmitting(true);
    setGeneratedPin(null);

    try {
      const result = await resetEmployePin({
        employeId: employee.id,
        newPin,
      });

      if (result.success) {
        setGeneratedPin(newPin);
        toast.success("PIN mis à jour avec succès");
        onSuccess?.();
      } else {
        toast.error(result.error || "Erreur lors de la mise a jour du PIN");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPin = () => {
    if (generatedPin) {
      navigator.clipboard.writeText(generatedPin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("PIN copie dans le presse-papiers");
    }
  };

  const handleClose = () => {
    setNewPin("");
    setGeneratedPin(null);
    setError(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content maxWidth="400px">
        <Dialog.Title>
          <Flex align="center" gap="2">
            <Key size={20} />
            Gestion du PIN
          </Flex>
        </Dialog.Title>
        <Dialog.Description size="2" mb="4">
          {employee.hasPin ? "Modifier" : "Definir"} le code PIN de{" "}
          <Text weight="bold">
            {employee.prenom} {employee.nom}
          </Text>
        </Dialog.Description>

        <Flex direction="column" gap="4">
          {/* Affichage du PIN genere */}
          {generatedPin ? (
            <Callout.Root color="green">
              <Callout.Icon>
                <Check size={16} />
              </Callout.Icon>
              <Callout.Text>
                <Flex direction="column" gap="2">
                  <Text>Nouveau PIN configure avec succes :</Text>
                  <Flex align="center" gap="2">
                    <Text
                      size="5"
                      weight="bold"
                      style={{
                        fontFamily: "var(--font-google-sans-code), monospace",
                        letterSpacing: "0.3em",
                      }}
                    >
                      {generatedPin}
                    </Text>
                    <Button variant="ghost" size="1" onClick={handleCopyPin}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                  </Flex>
                  <Text size="1" color="gray">
                    Communiquez ce PIN a l'employe. Il ne sera plus visible apres fermeture.
                  </Text>
                </Flex>
              </Callout.Text>
            </Callout.Root>
          ) : null}

          {/* Formulaire de saisie du PIN */}
          {!generatedPin && (
            <>
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                  <Text as="label" size="2" weight="medium">
                    Nouveau code PIN
                  </Text>
                  <Button type="button" variant="ghost" size="1" onClick={handleGeneratePin}>
                    <ArrowsClockwise size={14} />
                    Generer
                  </Button>
                </Flex>
                <TextField.Root
                  value={newPin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="4 a 6 chiffres"
                  size="3"
                  style={{
                    textAlign: "center",
                    letterSpacing: "0.5em",
                    fontFamily: "var(--font-google-sans-code), monospace",
                    fontSize: 24,
                  }}
                />
                {error ? (
                  <Flex align="center" gap="1">
                    <WarningCircle size={12} style={{ color: "var(--red-9)" }} />
                    <Text size="1" color="red">
                      {error}
                    </Text>
                  </Flex>
                ) : null}
              </Flex>

              <Callout.Root color="amber" size="1">
                <Callout.Icon>
                  <WarningCircle size={14} />
                </Callout.Icon>
                <Callout.Text size="1">
                  Le PIN permet une connexion rapide a la caisse. Choisissez un code facile a
                  retenir mais difficile a deviner.
                </Callout.Text>
              </Callout.Root>
            </>
          )}
        </Flex>

        {/* Actions */}
        <Flex gap="3" mt="5" justify="end">
          <Button variant="soft" color="gray" onClick={handleClose}>
            {generatedPin ? "Fermer" : "Annuler"}
          </Button>
          {!generatedPin && (
            <Button onClick={handleSubmit} disabled={isSubmitting || !newPin || newPin.length < 4}>
              {isSubmitting ? <ArrowsClockwise className="animate-spin" size={16} /> : <Key size={16} />}
              {employee.hasPin ? "Modifier le PIN" : "Definir le PIN"}
            </Button>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
