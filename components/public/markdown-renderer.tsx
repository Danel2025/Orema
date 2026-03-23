"use client";

import React, { type JSX } from "react";
import { Box, Heading, Text, Flex, Separator } from "@radix-ui/themes";
import Link from "next/link";

interface MarkdownRendererProps {
  content: string;
  accentColor?: string;
}

export function MarkdownRenderer({ content, accentColor = "violet" }: MarkdownRendererProps) {
  return <>{renderContent(content, accentColor)}</>;
}

function renderContent(content: string, accentColor: string) {
  const lines = content.trim().split("\n");
  const elements: JSX.Element[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];

  lines.forEach((line, index) => {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <Box
            key={`code-${index}`}
            my="4"
            p="4"
            style={{
              background: "var(--gray-a3)",
              borderRadius: 12,
              overflow: "auto",
              fontFamily: "var(--font-google-sans-code), monospace",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <pre style={{ margin: 0 }}>
              <code>{codeContent.join("\n")}</code>
            </pre>
          </Box>
        );
        codeContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      return;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <Heading key={index} size="5" mt="6" mb="3">
          {line.slice(3)}
        </Heading>
      );
      return;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <Heading key={index} size="4" mt="5" mb="2">
          {line.slice(4)}
        </Heading>
      );
      return;
    }
    if (line.startsWith("#### ")) {
      elements.push(
        <Heading key={index} size="3" mt="4" mb="2">
          {line.slice(5)}
        </Heading>
      );
      return;
    }

    if (line.startsWith("> ")) {
      elements.push(
        <Box
          key={index}
          my="4"
          p="4"
          style={{
            background: `var(--${accentColor}-a2)`,
            borderLeft: `4px solid var(--${accentColor}-9)`,
            borderRadius: "0 8px 8px 0",
          }}
        >
          <Text
            size="3"
            style={{
              color: `var(--${accentColor}-11)`,
              fontStyle: "italic",
            }}
          >
            {line.slice(2)}
          </Text>
        </Box>
      );
      return;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <Flex key={index} gap="2" my="1" ml="4">
          <Text style={{ color: "var(--gray-10)" }}>•</Text>
          <Text size="3" style={{ color: "var(--gray-11)", lineHeight: 1.7 }}>
            {renderInlineFormatting(line.slice(2), accentColor)}
          </Text>
        </Flex>
      );
      return;
    }

    if (line.startsWith("|") && line.endsWith("|")) {
      elements.push(
        <Text
          key={index}
          size="2"
          style={{
            fontFamily: "var(--font-google-sans-code), monospace",
            color: "var(--gray-11)",
            display: "block",
            whiteSpace: "pre",
          }}
        >
          {line}
        </Text>
      );
      return;
    }

    if (line.startsWith("---")) {
      elements.push(<Separator key={index} size="4" my="6" />);
      return;
    }

    if (line.trim() === "") {
      elements.push(<Box key={index} style={{ height: 12 }} />);
      return;
    }

    elements.push(
      <Text
        key={index}
        size="3"
        style={{ color: "var(--gray-11)", lineHeight: 1.8, display: "block" }}
      >
        {renderInlineFormatting(line, accentColor)}
      </Text>
    );
  });

  return elements;
}

function renderInlineFormatting(text: string, accentColor: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ fontWeight: 600, color: "var(--gray-12)" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((codePart, j) => {
      if (codePart.startsWith("`") && codePart.endsWith("`")) {
        return (
          <code
            key={`${i}-${j}`}
            style={{
              background: "var(--gray-a4)",
              padding: "2px 6px",
              borderRadius: 4,
              fontFamily: "var(--font-google-sans-code), monospace",
              fontSize: "0.9em",
            }}
          >
            {codePart.slice(1, -1)}
          </code>
        );
      }
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const linkParts = codePart.split(linkRegex);
      if (linkParts.length > 1) {
        const result: (string | JSX.Element)[] = [];
        for (let k = 0; k < linkParts.length; k += 3) {
          if (linkParts[k]) result.push(linkParts[k]);
          if (linkParts[k + 1] && linkParts[k + 2]) {
            const href = linkParts[k + 2];
            const isSafeUrl = href && /^(https?:\/\/|\/|#|mailto:)/i.test(href);
            if (isSafeUrl) {
              result.push(
                <Link
                  key={`${i}-${j}-${k}`}
                  href={href}
                  style={{
                    color: `var(--${accentColor}-9)`,
                    textDecoration: "none",
                  }}
                >
                  {linkParts[k + 1]}
                </Link>
              );
            } else {
              result.push(
                <Text key={`${i}-${j}-${k}`} as="span">
                  {linkParts[k + 1]}
                </Text>
              );
            }
          }
        }
        return result;
      }
      return codePart;
    });
  });
}
