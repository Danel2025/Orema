"use client";

/**
 * ResponseEditor - Éditeur de réponse IA aux avis clients
 * Affiche l'avis, génère une réponse avec choix de ton, permet l'édition
 */

import { useState } from "react";
import {
  Button,
  Flex,
  Text,
  TextArea,
  Select,
  Separator,
  Skeleton,
  Callout,
} from "@radix-ui/themes";
import {
  Robot,
  ArrowsClockwise,
  PaperPlaneTilt,
  X,
  SpinnerGap,
  Check,
} from "@phosphor-icons/react";
import { ReviewCard } from "./review-card";
import {
  TONS_REPONSE,
  TONS_REPONSE_LABELS,
  type TonReponse,
  type AvisAvecReponse,
} from "@/schemas/avis.schema";

interface ResponseEditorProps {
  avis: AvisAvecReponse;
  onGenerate: (avisId: string, ton: TonReponse) => Promise<{ success: boolean; contenu?: string; error?: string }>;
  onPublish: (avisId: string, contenu: string) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

type EditorStatus = "idle" | "generating" | "editing" | "publishing" | "published";

export function ResponseEditor({
  avis,
  onGenerate,
  onPublish,
  onCancel,
}: ResponseEditorProps) {
  const [status, setStatus] = useState<EditorStatus>("idle");
  const [ton, setTon] = useState<TonReponse>("chaleureux");
  const [reponse, setReponse] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleGenerate = async () => {
    setStatus("generating");
    setErrorMessage("");

    try {
      const result = await onGenerate(avis.id, ton);

      if (result.success && result.contenu) {
        setReponse(result.contenu);
        setStatus("editing");
      } else {
        setStatus("idle");
        setErrorMessage(result.error || "Erreur lors de la génération");
      }
    } catch {
      setStatus("idle");
      setErrorMessage("Erreur lors de la génération. Veuillez réessayer.");
    }
  };

  const handlePublish = async () => {
    if (!reponse.trim()) return;

    setStatus("publishing");
    setErrorMessage("");

    try {
      const result = await onPublish(avis.id, reponse.trim());

      if (result.success) {
        setStatus("published");
      } else {
        setStatus("editing");
        setErrorMessage(result.error || "Erreur lors de la publication");
      }
    } catch {
      setStatus("editing");
      setErrorMessage("Erreur lors de la publication. Veuillez réessayer.");
    }
  };

  if (status === "published") {
    return (
      <Flex direction="column" gap="4">
        <ReviewCard avis={avis} />
        <Flex
          direction="column"
          align="center"
          gap="3"
          py="4"
          style={{ textAlign: "center" }}
        >
          <Flex
            align="center"
            justify="center"
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--green-a3)",
            }}
          >
            <Check size={24} weight="bold" style={{ color: "var(--green-9)" }} />
          </Flex>
          <Text size="3" weight="medium">
            Réponse publiée avec succès
          </Text>
          <Button variant="soft" color="gray" onClick={onCancel}>
            Fermer
          </Button>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="4">
      {/* Avis original */}
      <Flex direction="column" gap="2">
        <Text size="2" weight="medium" color="gray">
          Avis original
        </Text>
        <ReviewCard avis={avis} />
      </Flex>

      <Separator size="4" />

      {/* Sélecteur de ton */}
      <Flex direction="column" gap="2">
        <Text as="label" size="2" weight="medium">
          Ton de la réponse
        </Text>
        <Select.Root
          value={ton}
          onValueChange={(val) => setTon(val as TonReponse)}
          disabled={status === "generating" || status === "publishing"}
        >
          <Select.Trigger />
          <Select.Content position="popper">
            {TONS_REPONSE.map((t) => (
              <Select.Item key={t} value={t}>
                {TONS_REPONSE_LABELS[t]}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Flex>

      {/* Bouton générer / État de chargement */}
      {status === "idle" ? (
        <Button onClick={handleGenerate} size="2">
          <Robot size={18} />
          Générer la réponse
        </Button>
      ) : null}

      {status === "generating" ? (
        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            <SpinnerGap size={18} className="animate-spin" style={{ color: "var(--accent-9)" }} />
            <Text size="2" color="gray">
              Génération de la réponse en cours...
            </Text>
          </Flex>
          <Skeleton height="80px" />
        </Flex>
      ) : null}

      {/* Zone d'édition de la réponse */}
      {status === "editing" || status === "publishing" ? (
        <Flex direction="column" gap="3">
          <Text as="label" size="2" weight="medium">
            Réponse générée
          </Text>
          <TextArea
            value={reponse}
            onChange={(e) => setReponse(e.target.value)}
            rows={5}
            disabled={status === "publishing"}
            placeholder="La réponse apparaîtra ici..."
          />

          {/* Actions */}
          <Flex gap="2" justify="end" wrap="wrap">
            <Button
              variant="soft"
              color="gray"
              onClick={onCancel}
              disabled={status === "publishing"}
            >
              <X size={16} />
              Annuler
            </Button>
            <Button
              variant="soft"
              onClick={handleGenerate}
              disabled={status === "publishing"}
            >
              <ArrowsClockwise size={16} />
              Régénérer
            </Button>
            <Button
              onClick={handlePublish}
              disabled={status === "publishing" || !reponse.trim()}
            >
              {status === "publishing" ? (
                <SpinnerGap size={16} className="animate-spin" />
              ) : (
                <PaperPlaneTilt size={16} />
              )}
              {status === "publishing" ? "Publication..." : "Publier"}
            </Button>
          </Flex>
        </Flex>
      ) : null}

      {/* Message d'erreur */}
      {errorMessage ? (
        <Callout.Root color="red" size="1">
          <Callout.Text>{errorMessage}</Callout.Text>
        </Callout.Root>
      ) : null}
    </Flex>
  );
}
