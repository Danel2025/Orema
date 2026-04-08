"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Tabs,
  Skeleton,
  Card,
  Button,
  Select,
  TextArea,
  TextField,
  Badge,
  Dialog,
  Slider,
  Callout,
} from "@radix-ui/themes";
import {
  ChatCircleDots,
  Star,
  Brain,
  Question,
  ArrowBendUpLeft,
  MagnifyingGlass,
  Export,
  FunnelSimple,
  Plus,
  SpinnerGap,
  CaretLeft,
  CaretRight,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/context";
import { ReviewCard, AnalysisDashboard, ResponseEditor } from "@/components/avis";
import {
  getAvisAction,
  analyserAvisAction,
  genererQuestionsAction,
  repondreAvisAction,
  publierReponseAction,
  getLatestAnalyseAction,
  getQuestionsAction,
} from "@/actions/avis";
import type {
  AvisAvecReponse,
  AnalyseResult,
  TonReponse,
} from "@/schemas/avis.schema";

// ============================================================================
// Query keys
// ============================================================================

const avisKeys = {
  all: ["avis"] as const,
  list: (filters: Record<string, unknown>) => [...avisKeys.all, "list", filters] as const,
  analyse: () => [...avisKeys.all, "analyse"] as const,
  questions: (options?: Record<string, unknown>) => [...avisKeys.all, "questions", options] as const,
  enAttente: () => [...avisKeys.all, "en-attente"] as const,
};

// ============================================================================
// Page principale
// ============================================================================

export default function AvisPage() {
  const [activeTab, setActiveTab] = useState("tous");

  return (
    <Box>
      {/* Header */}
      <Flex justify="between" align="center" mb="6">
        <Box>
          <Flex align="center" gap="2" mb="1">
            <ChatCircleDots size={28} weight="duotone" />
            <Heading size="7" weight="bold">
              Avis clients
            </Heading>
          </Flex>
          <Text size="3" color="gray">
            Collectez, analysez et répondez aux avis de vos clients grâce à l&apos;IA
          </Text>
        </Box>
      </Flex>

      {/* Onglets */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List mb="4">
          <Tabs.Trigger value="tous">
            <Flex align="center" gap="2">
              <Star size={16} />
              Tous les avis
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="analyse">
            <Flex align="center" gap="2">
              <Brain size={16} />
              Analyse IA
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="questions">
            <Flex align="center" gap="2">
              <Question size={16} />
              Questions
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="reponses">
            <Flex align="center" gap="2">
              <ArrowBendUpLeft size={16} />
              Réponses
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="tous">
          <TousLesAvisTab />
        </Tabs.Content>

        <Tabs.Content value="analyse">
          <AnalyseIATab />
        </Tabs.Content>

        <Tabs.Content value="questions">
          <QuestionsTab />
        </Tabs.Content>

        <Tabs.Content value="reponses">
          <ReponsesTab />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}

// ============================================================================
// Onglet "Tous les avis"
// ============================================================================

function TousLesAvisTab() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [noteMin, setNoteMin] = useState<string>("all");
  const [noteMax, setNoteMax] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filters = {
    search: searchQuery || undefined,
    note_min: noteMin !== "all" ? Number(noteMin) : undefined,
    note_max: noteMax !== "all" ? Number(noteMax) : undefined,
    page,
    limit: 20,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: avisKeys.list(filters),
    queryFn: () => getAvisAction(user?.etablissementId || "", filters),
    enabled: !!user?.etablissementId,
    staleTime: 30_000,
  });

  const avis: AvisAvecReponse[] = (data?.data as AvisAvecReponse[]) ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.count ?? 0;

  const handleFilter = () => {
    setPage(1);
  };

  return (
    <Box>
      {/* Barre de filtres */}
      <Card mb="4">
        <Flex gap="4" wrap="wrap" align="end">
          <Box style={{ flex: "1 1 250px" }}>
            <Text as="label" size="2" weight="medium" mb="1">
              Recherche
            </Text>
            <TextField.Root
              placeholder="Rechercher dans les avis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            >
              <TextField.Slot>
                <MagnifyingGlass size={16} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          <Box>
            <Text as="label" size="2" weight="medium" mb="1">
              Note min.
            </Text>
            <Select.Root value={noteMin} onValueChange={setNoteMin}>
              <Select.Trigger placeholder="Toutes" />
              <Select.Content>
                <Select.Item value="all">Toutes</Select.Item>
                <Select.Item value="1">1 étoile</Select.Item>
                <Select.Item value="2">2 étoiles</Select.Item>
                <Select.Item value="3">3 étoiles</Select.Item>
                <Select.Item value="4">4 étoiles</Select.Item>
                <Select.Item value="5">5 étoiles</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          <Box>
            <Text as="label" size="2" weight="medium" mb="1">
              Note max.
            </Text>
            <Select.Root value={noteMax} onValueChange={setNoteMax}>
              <Select.Trigger placeholder="Toutes" />
              <Select.Content>
                <Select.Item value="all">Toutes</Select.Item>
                <Select.Item value="1">1 étoile</Select.Item>
                <Select.Item value="2">2 étoiles</Select.Item>
                <Select.Item value="3">3 étoiles</Select.Item>
                <Select.Item value="4">4 étoiles</Select.Item>
                <Select.Item value="5">5 étoiles</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          <Button variant="soft" color="gray" onClick={handleFilter}>
            <FunnelSimple size={16} />
            Filtrer
          </Button>

          <Button variant="soft" color="gray">
            <Export size={16} />
            Exporter
          </Button>
        </Flex>
      </Card>

      {/* Erreur */}
      {error ? (
        <Callout.Root color="red" mb="4">
          <Callout.Icon>
            <XCircle size={18} />
          </Callout.Icon>
          <Callout.Text>Erreur lors du chargement des avis. Veuillez réessayer.</Callout.Text>
        </Callout.Root>
      ) : null}

      {/* Liste des avis */}
      {isLoading ? (
        <Flex direction="column" gap="4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="120px" style={{ borderRadius: 12 }} />
          ))}
        </Flex>
      ) : avis.length === 0 ? (
        <Card>
          <Flex direction="column" align="center" justify="center" py="9" gap="3">
            <ChatCircleDots size={48} weight="duotone" color="var(--gray-8)" />
            <Text size="4" weight="medium" color="gray">
              Aucun avis pour le moment
            </Text>
            <Text size="2" color="gray">
              Les avis de vos clients apparaîtront ici
            </Text>
          </Flex>
        </Card>
      ) : (
        <Flex direction="column" gap="4">
          {avis.map((a) => (
            <ReviewCard key={a.id} avis={a} />
          ))}
        </Flex>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <Flex justify="between" align="center" mt="4">
          <Text size="2" color="gray">
            {total} avis au total
          </Text>
          <Flex gap="2" align="center">
            <Button
              variant="soft"
              color="gray"
              size="1"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <CaretLeft size={14} />
              Précédent
            </Button>
            <Text size="2">
              Page {page} / {totalPages}
            </Text>
            <Button
              variant="soft"
              color="gray"
              size="1"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
              <CaretRight size={14} />
            </Button>
          </Flex>
        </Flex>
      ) : null}
    </Box>
  );
}

// ============================================================================
// Onglet "Analyse IA"
// ============================================================================

function AnalyseIATab() {
  const queryClient = useQueryClient();

  const { data: latestAnalyse, isLoading: isLoadingAnalyse } = useQuery({
    queryKey: avisKeys.analyse(),
    queryFn: () => getLatestAnalyseAction(),
    staleTime: 60_000,
  });

  const analyseMutation = useMutation({
    mutationFn: (params: { etablissementId: string; periode?: string }) =>
      analyserAvisAction(params.etablissementId, params.periode),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: avisKeys.analyse() });
      }
    },
  });

  const { user } = useAuth();

  const handleAnalyse = () => {
    if (!user?.etablissementId) return;
    analyseMutation.mutate({ etablissementId: user.etablissementId });
  };

  return (
    <Box>
      {/* Actions */}
      <Card mb="4">
        <Flex justify="between" align="center">
          <Box>
            <Text size="3" weight="medium">
              Analyse des avis par l&apos;IA
            </Text>
            <Text size="2" color="gray">
              L&apos;IA analyse les tendances, sentiments et points clés de vos avis clients
            </Text>
          </Box>
          <Button
            disabled={analyseMutation.isPending}
            onClick={handleAnalyse}
          >
            {analyseMutation.isPending ? (
              <>
                <SpinnerGap size={16} className="animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Brain size={16} />
                Lancer l&apos;analyse
              </>
            )}
          </Button>
        </Flex>
      </Card>

      {/* Erreur mutation */}
      {analyseMutation.data && !analyseMutation.data.success ? (
        <Callout.Root color="red" mb="4">
          <Callout.Icon>
            <XCircle size={18} />
          </Callout.Icon>
          <Callout.Text>{analyseMutation.data.error}</Callout.Text>
        </Callout.Root>
      ) : null}

      {/* Succès mutation */}
      {analyseMutation.data?.success ? (
        <Callout.Root color="green" mb="4">
          <Callout.Icon>
            <CheckCircle size={18} />
          </Callout.Icon>
          <Callout.Text>Analyse terminée avec succès</Callout.Text>
        </Callout.Root>
      ) : null}

      {/* Résultats d'analyse */}
      {isLoadingAnalyse ? (
        <Skeleton height="300px" style={{ borderRadius: 12 }} />
      ) : latestAnalyse ? (
        <AnalysisDashboard analyse={latestAnalyse as AnalyseResult} />
      ) : (
        <Card>
          <Flex direction="column" align="center" justify="center" py="9" gap="3">
            <Brain size={48} weight="duotone" color="var(--gray-8)" />
            <Text size="4" weight="medium" color="gray">
              Aucune analyse disponible
            </Text>
            <Text size="2" color="gray">
              Lancez une analyse pour obtenir des insights sur vos avis
            </Text>
          </Flex>
        </Card>
      )}
    </Box>
  );
}

// ============================================================================
// Onglet "Questions"
// ============================================================================

function QuestionsTab() {
  const queryClient = useQueryClient();
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  // Paramètres de génération
  const [cible, setCible] = useState<"client_restaurant" | "gerant_outil">("client_restaurant");
  const [contexte, setContexte] = useState("");
  const [ton, setTon] = useState<"formel" | "decontracte" | "chaleureux">("chaleureux");
  const [nombre, setNombre] = useState(5);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: avisKeys.questions(),
    queryFn: () => getQuestionsAction(),
    staleTime: 60_000,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      genererQuestionsAction({
        cible,
        contexte,
        ton,
        nb_questions: nombre,
      }),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: avisKeys.questions() });
        setShowGenerateDialog(false);
        setContexte("");
      }
    },
  });

  return (
    <Box>
      {/* Actions */}
      <Card mb="4">
        <Flex justify="between" align="center">
          <Box>
            <Text size="3" weight="medium">
              Questions de satisfaction
            </Text>
            <Text size="2" color="gray">
              Configurez les questions posées à vos clients
            </Text>
          </Box>

          <Dialog.Root open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <Dialog.Trigger>
              <Button>
                <Plus size={16} />
                Générer des questions
              </Button>
            </Dialog.Trigger>

            <Dialog.Content maxWidth="500px">
              <Dialog.Title>Générer des questions</Dialog.Title>
              <Dialog.Description size="2" color="gray" mb="4">
                Configurez les paramètres pour générer des questions de satisfaction adaptées
              </Dialog.Description>

              <Flex direction="column" gap="4">
                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Cible
                  </Text>
                  <Select.Root value={cible} onValueChange={(v) => setCible(v as typeof cible)}>
                    <Select.Trigger style={{ width: "100%" }} />
                    <Select.Content>
                      <Select.Item value="client_restaurant">
                        Client du restaurant
                      </Select.Item>
                      <Select.Item value="gerant_outil">
                        Gérant (outil POS)
                      </Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>

                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Contexte
                  </Text>
                  <TextArea
                    placeholder="Décrivez le contexte spécifique (ex: après un événement, nouvelle carte...)"
                    value={contexte}
                    onChange={(e) => setContexte(e.target.value)}
                    rows={3}
                  />
                </Box>

                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Ton
                  </Text>
                  <Select.Root value={ton} onValueChange={(v) => setTon(v as typeof ton)}>
                    <Select.Trigger style={{ width: "100%" }} />
                    <Select.Content>
                      <Select.Item value="chaleureux">Chaleureux</Select.Item>
                      <Select.Item value="formel">Formel</Select.Item>
                      <Select.Item value="decontracte">Décontracté</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>

                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Nombre de questions : {nombre}
                  </Text>
                  <Slider
                    value={[nombre]}
                    onValueChange={(values) => setNombre(values[0])}
                    min={2}
                    max={8}
                    step={1}
                  />
                  <Flex justify="between" mt="1">
                    <Text size="1" color="gray">2</Text>
                    <Text size="1" color="gray">8</Text>
                  </Flex>
                </Box>
              </Flex>

              {/* Erreur de génération */}
              {generateMutation.data && !generateMutation.data.success ? (
                <Callout.Root color="red" mt="3" size="1">
                  <Callout.Text>{generateMutation.data.error}</Callout.Text>
                </Callout.Root>
              ) : null}

              <Flex gap="3" mt="4" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    Annuler
                  </Button>
                </Dialog.Close>
                <Button
                  disabled={generateMutation.isPending || !contexte.trim()}
                  onClick={() => generateMutation.mutate()}
                >
                  {generateMutation.isPending ? (
                    <>
                      <SpinnerGap size={16} className="animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Brain size={16} />
                      Générer
                    </>
                  )}
                </Button>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>
      </Card>

      {/* Liste des questions */}
      {isLoading ? (
        <Flex direction="column" gap="3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="60px" style={{ borderRadius: 12 }} />
          ))}
        </Flex>
      ) : (questions as Array<{ id: string; question: string; type: string; cible: string; actif?: boolean }>).length === 0 ? (
        <Card>
          <Flex direction="column" align="center" justify="center" py="9" gap="3">
            <Question size={48} weight="duotone" color="var(--gray-8)" />
            <Text size="4" weight="medium" color="gray">
              Aucune question configurée
            </Text>
            <Text size="2" color="gray">
              Générez des questions de satisfaction pour vos clients
            </Text>
          </Flex>
        </Card>
      ) : (
        <Flex direction="column" gap="3">
          {(questions as Array<{ id: string; question: string; type: string; cible: string; actif?: boolean }>).map((q) => (
            <Card key={q.id}>
              <Flex justify="between" align="center" gap="3">
                <Flex direction="column" gap="1" style={{ flex: 1 }}>
                  <Text size="2" weight="medium">
                    {q.question}
                  </Text>
                  <Flex gap="2">
                    <Badge size="1" variant="soft" color="blue">
                      {q.type}
                    </Badge>
                    <Badge size="1" variant="soft" color="gray">
                      {q.cible === "client_restaurant" ? "Client" : "Gérant"}
                    </Badge>
                  </Flex>
                </Flex>
                <Badge
                  size="1"
                  color={q.actif !== false ? "green" : "gray"}
                  variant="soft"
                >
                  {q.actif !== false ? "Active" : "Inactive"}
                </Badge>
              </Flex>
            </Card>
          ))}
        </Flex>
      )}
    </Box>
  );
}

// ============================================================================
// Onglet "Réponses"
// ============================================================================

function ReponsesTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAvis, setSelectedAvis] = useState<AvisAvecReponse | null>(null);

  // Récupérer les avis sans réponse publiée
  const { data, isLoading } = useQuery({
    queryKey: avisKeys.enAttente(),
    queryFn: () => getAvisAction(user?.etablissementId || "", { limit: 50 }),
    enabled: !!user?.etablissementId,
    staleTime: 30_000,
  });

  // Filtrer uniquement les avis sans réponse
  const avisEnAttente = ((data?.data as AvisAvecReponse[]) ?? []).filter(
    (a) => !a.reponse
  );

  const handleGenerate = useCallback(
    async (avisId: string, ton: TonReponse) => {
      const result = await repondreAvisAction(avisId, ton);
      if (result.success && result.data) {
        return { success: true, contenu: result.data.contenu };
      }
      return { success: false, error: result.error };
    },
    []
  );

  const handlePublish = useCallback(
    async (avisId: string, contenu: string) => {
      // On a besoin du reponse_id, pas du avis_id
      // La réponse a été créée par repondreAvisAction, récupérons-la
      // Pour simplifier, on utilise publierReponseAction avec le bon ID
      // Le contenu est déjà sauvé en base par repondreAvisAction
      // On doit publier la réponse via son ID

      // Chercher la réponse correspondante dans le cache ou refetch
      const freshData = await getAvisAction(user?.etablissementId || "", { limit: 50 });
      const avisWithReponse = (freshData.data as AvisAvecReponse[])?.find(
        (a) => a.id === avisId && a.reponse
      );

      if (avisWithReponse?.reponse?.id) {
        const result = await publierReponseAction(avisWithReponse.reponse.id);
        if (result.success) {
          queryClient.invalidateQueries({ queryKey: avisKeys.enAttente() });
          queryClient.invalidateQueries({ queryKey: avisKeys.list({}) });
          return { success: true };
        }
        return { success: false, error: result.error };
      }

      return { success: false, error: "Réponse non trouvée" };
    },
    [user?.etablissementId, queryClient]
  );

  const handleCancel = useCallback(() => {
    setSelectedAvis(null);
  }, []);

  // Si un avis est sélectionné, afficher l'éditeur de réponse
  if (selectedAvis) {
    return (
      <Box>
        <Button
          variant="ghost"
          color="gray"
          mb="4"
          onClick={handleCancel}
        >
          <CaretLeft size={16} />
          Retour aux avis en attente
        </Button>
        <ResponseEditor
          avis={selectedAvis}
          onGenerate={handleGenerate}
          onPublish={handlePublish}
          onCancel={handleCancel}
        />
      </Box>
    );
  }

  return (
    <Box>
      {/* Info */}
      <Card mb="4">
        <Flex justify="between" align="center">
          <Box>
            <Text size="3" weight="medium">
              Réponses aux avis
            </Text>
            <Text size="2" color="gray">
              Répondez aux avis de vos clients avec l&apos;aide de l&apos;IA
            </Text>
          </Box>
          <Badge size="2" color={avisEnAttente.length > 0 ? "orange" : "green"}>
            {avisEnAttente.length} en attente
          </Badge>
        </Flex>
      </Card>

      {/* Liste des avis en attente */}
      {isLoading ? (
        <Flex direction="column" gap="4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="120px" style={{ borderRadius: 12 }} />
          ))}
        </Flex>
      ) : avisEnAttente.length === 0 ? (
        <Card>
          <Flex direction="column" align="center" justify="center" py="9" gap="3">
            <ArrowBendUpLeft size={48} weight="duotone" color="var(--gray-8)" />
            <Text size="4" weight="medium" color="gray">
              Aucun avis en attente de réponse
            </Text>
            <Text size="2" color="gray">
              Tous les avis ont été traités
            </Text>
          </Flex>
        </Card>
      ) : (
        <Flex direction="column" gap="4">
          {avisEnAttente.map((a) => (
            <ReviewCard
              key={a.id}
              avis={a}
              onRepondre={(avis) => setSelectedAvis(avis)}
            />
          ))}
        </Flex>
      )}
    </Box>
  );
}
