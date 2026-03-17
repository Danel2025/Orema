"use client";

/**
 * LineNotesPopover - Popover pour ajouter/editer des notes sur une ligne
 * Ex: "sans sel", "bien cuit", "sans glace"
 */

import { useState, useEffect, useRef } from "react";
import { Popover, TextArea, Flex, Text, Button, IconButton, Box } from "@radix-ui/themes";
import { MessageSquare, X } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import type { CartItem } from "@/types";

interface LineNotesPopoverProps {
  item: CartItem;
  children: React.ReactNode;
}

// Suggestions de notes courantes pour la restauration
const NOTES_SUGGESTIONS = [
  "Sans sel",
  "Sans sauce",
  "Bien cuit",
  "Saignant",
  "A point",
  "Sans oignon",
  "Sans piment",
  "Sans glace",
  "Extra chaud",
  "A emporter",
  "Urgent",
];

export function LineNotesPopover({ item, children }: LineNotesPopoverProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateNotes = useCartStore((state) => state.updateNotes);

  // Synchroniser les notes quand le popover s'ouvre
  useEffect(() => {
    if (open) {
      setNotes(item.notes || "");
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open, item.notes]);

  // Sauvegarder les notes
  const handleSave = () => {
    updateNotes(item.lineId, notes.trim());
    setOpen(false);
  };

  // Effacer les notes
  const handleClear = () => {
    setNotes("");
    updateNotes(item.lineId, "");
    setOpen(false);
  };

  // Ajouter une suggestion
  const handleAddSuggestion = (suggestion: string) => {
    if (notes.trim()) {
      setNotes((prev) => prev + ", " + suggestion);
    } else {
      setNotes(suggestion);
    }
    textareaRef.current?.focus();
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>{children}</Popover.Trigger>

      <Popover.Content width="320px" side="left" align="start">
        <Flex direction="column" gap="3">
          {/* Header */}
          <Flex justify="between" align="center">
            <Flex align="center" gap="2">
              <MessageSquare size={16} style={{ color: "var(--accent-9)" }} />
              <Text size="2" weight="medium">
                Notes pour {item.produit.nom}
              </Text>
            </Flex>
          </Flex>

          {/* Textarea */}
          <TextArea
            ref={textareaRef}
            placeholder="Ex: sans sel, bien cuit..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ minHeight: 80 }}
          />

          {/* Suggestions rapides */}
          <Box>
            <Text size="1" color="gray" mb="2" style={{ display: "block" }}>
              Suggestions rapides
            </Text>
            <Flex gap="2" wrap="wrap">
              {NOTES_SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  size="1"
                  variant="soft"
                  color="gray"
                  onClick={() => handleAddSuggestion(suggestion)}
                  style={{ fontSize: 11 }}
                >
                  {suggestion}
                </Button>
              ))}
            </Flex>
          </Box>

          {/* Actions */}
          <Flex gap="2" justify="end">
            {item.notes ? <Button
                size="1"
                variant="soft"
                color="red"
                onClick={handleClear}
                style={{ marginRight: "auto" }}
              >
                <X size={14} />
                Effacer
              </Button> : null}
            <Popover.Close>
              <Button size="1" variant="soft" color="gray">
                Annuler
              </Button>
            </Popover.Close>
            <Button size="1" onClick={handleSave}>
              Enregistrer
            </Button>
          </Flex>
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
}
