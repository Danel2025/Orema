/**
 * Intégration Anthropic SDK pour le module d'avis Oréma N+
 *
 * 3 modes :
 * - analyse : analyse un ensemble d'avis pour dégager des tendances
 * - questions : génère des questions personnalisées pour collecter des avis
 * - reponse : rédige une réponse à un avis client au nom de l'établissement
 */

import Anthropic from "@anthropic-ai/sdk";

// ============================================================================
// Types
// ============================================================================

export type AvisMode = "analyse" | "questions" | "reponse";

/** Données d'un avis pour l'analyse */
export interface AvisData {
  id: string;
  note: number;
  contenu: string;
  date: string;
  prenom_client?: string | null;
  source?: string | null;
}

/** Résultat du mode analyse */
export interface AnalyseResult {
  periode: string;
  total_avis: number;
  note_moyenne: number;
  points_forts: string[];
  points_faibles: string[];
  tendance: "positive" | "stable" | "négative";
  avis_notables: {
    extrait: string;
    type: "positif" | "négatif";
    raison: string;
  }[];
  actions_recommandees: string[];
}

/** Paramètres pour la génération de questions */
export interface QuestionsParams {
  cible: "client_restaurant" | "gerant_outil";
  contexte: string;
  ton: "formel" | "decontracte" | "chaleureux";
  nb_questions: number;
}

/** Résultat du mode questions */
export interface QuestionGeneree {
  id: number;
  question: string;
  type: "note" | "choix_multiple" | "texte_libre" | "nps";
  options: string[] | null;
}

export type QuestionsResult = QuestionGeneree[];

/** Paramètres pour la réponse à un avis */
export interface ReponseParams {
  nom_etablissement: string;
  prenom_client: string;
  note: number;
  contenu_avis: string;
  ton_reponse: "professionnel" | "chaleureux" | "empathique";
}

/** Résultat du mode réponse */
export interface ReponseResult {
  reponse: string;
  ton_detecte: "positif" | "mitige" | "negatif";
}

/** Union des payloads selon le mode */
export type AvisPayload =
  | { mode: "analyse"; avis: AvisData[]; periode?: string }
  | { mode: "questions"; params: QuestionsParams }
  | { mode: "reponse"; params: ReponseParams };

/** Union des résultats selon le mode */
export type AvisResult<M extends AvisMode> = M extends "analyse"
  ? AnalyseResult
  : M extends "questions"
    ? QuestionsResult
    : M extends "reponse"
      ? ReponseResult
      : never;

// ============================================================================
// Constantes
// ============================================================================

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `Tu es l'assistant IA intégré à Oréma N+, une application de gestion de restaurant et de point de vente conçue pour le marché gabonais.

Ton rôle est de gérer le module de collecte et d'analyse des avis au sein d'Oréma. Tu interagis avec deux types d'utilisateurs :
1. LES CLIENTS DU RESTAURANT — personnes ayant vécu une expérience de repas dans un établissement utilisant Oréma.
2. LES GÉRANTS / MANAGERS — responsables d'établissement qui utilisent l'outil Oréma au quotidien.

CONTEXTE CULTUREL
Tu opères dans un contexte gabonais et centrafricain. Adopte un ton chaleureux, humain et respectueux, fidèle à la culture de l'hospitalité locale. L'application s'appelle "Oréma", ce qui signifie "cœur" dans une langue locale.

LANGUE
Réponds toujours en français. Adapte ton niveau de langage à l'interlocuteur.

CONFIDENTIALITÉ
Ne partage jamais les avis individuels d'un client avec d'autres clients. Les données d'analyse sont réservées aux gérants de l'établissement concerné.`;

// ============================================================================
// Prompts par mode
// ============================================================================

function buildAnalysePrompt(avis: AvisData[], periode?: string): string {
  const periodeStr = periode || "période récente";
  const avisFormatted = avis
    .map(
      (a, i) =>
        `Avis ${i + 1} (note: ${a.note}/5, date: ${a.date}${a.prenom_client ? `, client: ${a.prenom_client}` : ""}): "${a.contenu}"`
    )
    .join("\n");

  return `Analyse les avis clients suivants pour la ${periodeStr}.

${avisFormatted}

Retourne UNIQUEMENT un objet JSON valide (sans texte avant ou après) avec cette structure exacte :
{
  "periode": "${periodeStr}",
  "total_avis": ${avis.length},
  "note_moyenne": <nombre décimal>,
  "points_forts": ["<point fort 1>", "<point fort 2>", ...],
  "points_faibles": ["<point faible 1>", "<point faible 2>", ...],
  "tendance": "<positive | stable | négative>",
  "avis_notables": [
    { "extrait": "<citation courte>", "type": "<positif | négatif>", "raison": "<pourquoi cet avis est notable>" }
  ],
  "actions_recommandees": ["<action 1>", "<action 2>", ...]
}`;
}

function buildQuestionsPrompt(params: QuestionsParams): string {
  const cibleLabel =
    params.cible === "client_restaurant"
      ? "clients du restaurant"
      : "gérants utilisant l'outil Oréma";

  return `Génère ${params.nb_questions} questions pour collecter les avis des ${cibleLabel}.

Contexte : ${params.contexte}
Ton souhaité : ${params.ton}

Types de questions disponibles :
- "note" : une évaluation sur une échelle (1-5 étoiles)
- "choix_multiple" : choix parmi plusieurs options
- "texte_libre" : réponse ouverte
- "nps" : Net Promoter Score (0-10)

Retourne UNIQUEMENT un tableau JSON valide (sans texte avant ou après) avec cette structure :
[
  {
    "id": 1,
    "question": "<la question>",
    "type": "<note | choix_multiple | texte_libre | nps>",
    "options": ["<option1>", "<option2>"] ou null si pas de choix
  }
]

Varie les types de questions pour un bon équilibre. Les questions doivent être pertinentes, claires et adaptées au contexte gabonais.`;
}

function buildReponsePrompt(params: ReponseParams): string {
  const tonDescription =
    params.note >= 4 ? "positif et reconnaissant" : params.note === 3 ? "empathique et constructif" : "empathique, sincère et orienté solution";

  return `Rédige une réponse au nom de l'établissement "${params.nom_etablissement}" à l'avis suivant :

Client : ${params.prenom_client}
Note : ${params.note}/5
Avis : "${params.contenu_avis}"
Ton souhaité : ${params.ton_reponse}

Le ton détecté de l'avis est ${tonDescription}.

Règles :
- Personnalise la réponse en utilisant le prénom du client
- Adapte le ton selon la note (${params.note >= 4 ? "remerciement chaleureux" : params.note === 3 ? "remerciement + engagement d'amélioration" : "excuses sincères + actions concrètes"})
- Signe "L'équipe de ${params.nom_etablissement}"
- Reste concis (3-5 phrases maximum)
- Adopte un ton chaleureux adapté au contexte gabonais

Retourne UNIQUEMENT un objet JSON valide (sans texte avant ou après) :
{
  "reponse": "<la réponse rédigée>",
  "ton_detecte": "<positif | mitige | negatif>"
}`;
}

// ============================================================================
// Fonction principale
// ============================================================================

/**
 * Exécute une requête IA pour le module d'avis
 *
 * @param payload - Le mode et les données associées
 * @returns Le résultat typé selon le mode
 *
 * @example
 * ```ts
 * const analyse = await runAvisAI({
 *   mode: 'analyse',
 *   avis: [...],
 *   periode: 'Mars 2026'
 * });
 * ```
 */
export async function runAvisAI<M extends AvisMode>(
  payload: Extract<AvisPayload, { mode: M }>
): Promise<AvisResult<M>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY manquante. Configurez la variable d'environnement."
    );
  }

  const client = new Anthropic({ apiKey });

  // Construire le prompt utilisateur selon le mode
  let userPrompt: string;

  switch (payload.mode) {
    case "analyse": {
      const p = payload as Extract<AvisPayload, { mode: "analyse" }>;
      if (!p.avis || p.avis.length === 0) {
        throw new Error("Aucun avis fourni pour l'analyse");
      }
      userPrompt = buildAnalysePrompt(p.avis, p.periode);
      break;
    }
    case "questions": {
      const p = payload as Extract<AvisPayload, { mode: "questions" }>;
      userPrompt = buildQuestionsPrompt(p.params);
      break;
    }
    case "reponse": {
      const p = payload as Extract<AvisPayload, { mode: "reponse" }>;
      userPrompt = buildReponsePrompt(p.params);
      break;
    }
    default:
      throw new Error(`Mode inconnu : ${(payload as AvisPayload).mode}`);
  }

  // Appel à l'API Anthropic
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  // Extraire le texte de la réponse
  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Réponse IA vide ou format inattendu");
  }

  const rawText = textBlock.text.trim();

  // Parser le JSON de la réponse
  try {
    // Nettoyer le texte si l'IA a ajouté des backticks markdown
    const cleanJson = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanJson);
    return parsed as AvisResult<M>;
  } catch {
    throw new Error(
      `Impossible de parser la réponse IA en JSON. Réponse brute : ${rawText.substring(0, 200)}...`
    );
  }
}
