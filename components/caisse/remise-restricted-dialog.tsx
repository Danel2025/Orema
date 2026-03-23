"use client";

/**
 * RemiseRestrictedDialog - Dialog affiché quand une remise est refusée ou nécessite approbation
 */

import { Dialog, Flex, Text, Button, Box } from "@radix-ui/themes";
import { ShieldWarning, Lock, UserCircleGear } from "@phosphor-icons/react";

interface RemiseRestrictedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  raison: string;
  necessiteApprobation?: boolean;
  onDemanderApprobation?: () => void;
}

export function RemiseRestrictedDialog({
  open,
  onOpenChange,
  raison,
  necessiteApprobation = false,
  onDemanderApprobation,
}: RemiseRestrictedDialogProps) {
  const handleDemanderApprobation = () => {
    onDemanderApprobation?.();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="420px" aria-describedby={undefined}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            {necessiteApprobation ? (
              <ShieldWarning
                size={22}
                weight="duotone"
                style={{ color: "var(--orange-11)" }}
              />
            ) : (
              <Lock
                size={22}
                weight="duotone"
                style={{ color: "var(--red-11)" }}
              />
            )}
            <Text color={necessiteApprobation ? "orange" : "red"}>
              {necessiteApprobation
                ? "Approbation requise"
                : "Remise non autorisée"}
            </Text>
          </Flex>
        </Dialog.Title>

        <Box
          p="3"
          my="4"
          style={{
            backgroundColor: necessiteApprobation
              ? "var(--orange-a2)"
              : "var(--red-a2)",
            borderRadius: 8,
            border: `1px solid ${
              necessiteApprobation ? "var(--orange-a6)" : "var(--red-a6)"
            }`,
          }}
        >
          <Text size="2" style={{ lineHeight: 1.5 }}>
            {raison}
          </Text>
        </Box>

        <Flex gap="3" mt="4" justify="end">
          {necessiteApprobation && onDemanderApprobation ? (
            <>
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Annuler
                </Button>
              </Dialog.Close>
              <Button color="orange" onClick={handleDemanderApprobation}>
                <UserCircleGear size={16} weight="duotone" />
                Demander l'approbation
              </Button>
            </>
          ) : (
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Compris
              </Button>
            </Dialog.Close>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
