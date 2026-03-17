"use client";

/**
 * Éditeur Markdown avec preview
 * Utilise @uiw/react-md-editor
 */

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Box, Flex, Text, SegmentedControl, Badge } from "@radix-ui/themes";
import { Eye, Edit3, Columns, FileText } from "lucide-react";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// Import dynamique pour éviter les erreurs SSR
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  label?: string;
  error?: string;
  required?: boolean;
}

type ViewMode = "edit" | "preview" | "split";

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Écrivez votre contenu en markdown...",
  minHeight = 400,
  maxHeight = 600,
  label,
  error,
  required,
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  const handleChange = useCallback(
    (val?: string) => {
      onChange(val || "");
    },
    [onChange]
  );

  // Calculer les stats du contenu
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;
  const lineCount = value.split("\n").length;

  return (
    <Box>
      {/* Header */}
      {label ? <Flex align="center" justify="between" mb="2">
          <Flex align="center" gap="2">
            <Text size="2" weight="medium">
              {label}
              {required ? <Text color="red"> *</Text> : null}
            </Text>
            <Badge size="1" variant="soft" color="gray">
              Markdown
            </Badge>
          </Flex>

          {/* View Mode Toggle */}
          <SegmentedControl.Root
            value={viewMode}
            onValueChange={(val) => setViewMode(val as ViewMode)}
            size="1"
          >
            <SegmentedControl.Item value="edit">
              <Flex align="center" gap="1">
                <Edit3 size={12} />
                <Text size="1">Éditer</Text>
              </Flex>
            </SegmentedControl.Item>
            <SegmentedControl.Item value="split">
              <Flex align="center" gap="1">
                <Columns size={12} />
                <Text size="1">Split</Text>
              </Flex>
            </SegmentedControl.Item>
            <SegmentedControl.Item value="preview">
              <Flex align="center" gap="1">
                <Eye size={12} />
                <Text size="1">Aperçu</Text>
              </Flex>
            </SegmentedControl.Item>
          </SegmentedControl.Root>
        </Flex> : null}

      {/* Editor */}
      <Box
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: error ? "1px solid var(--red-8)" : "1px solid var(--gray-a5)",
        }}
        data-color-mode="auto"
      >
        <MDEditor
          value={value}
          onChange={handleChange}
          preview={viewMode === "edit" ? "edit" : viewMode === "preview" ? "preview" : "live"}
          height={minHeight}
          visibleDragbar={true}
          hideToolbar={false}
          enableScroll={true}
          textareaProps={{
            placeholder,
          }}
          style={{
            backgroundColor: "var(--color-background)",
          }}
        />
      </Box>

      {/* Footer with stats */}
      <Flex align="center" justify="between" mt="2">
        <Flex align="center" gap="3">
          <Flex align="center" gap="1">
            <FileText size={12} style={{ color: "var(--gray-9)" }} />
            <Text size="1" color="gray">
              {wordCount} mots
            </Text>
          </Flex>
          <Text size="1" color="gray">
            •
          </Text>
          <Text size="1" color="gray">
            {charCount} caractères
          </Text>
          <Text size="1" color="gray">
            •
          </Text>
          <Text size="1" color="gray">
            {lineCount} lignes
          </Text>
        </Flex>

        {error ? <Text size="1" color="red">
            {error}
          </Text> : null}
      </Flex>

      {/* Markdown Help */}
      <Box
        mt="3"
        p="3"
        style={{
          background: "var(--gray-a2)",
          borderRadius: 8,
        }}
      >
        <Text size="1" color="gray" style={{ lineHeight: 1.5 }}>
          <strong>Aide Markdown:</strong> **gras**, *italique*, # Titre, ## Sous-titre,
          - liste, `code`, [lien](url), ![image](url)
        </Text>
      </Box>
    </Box>
  );
}

export default MarkdownEditor;
