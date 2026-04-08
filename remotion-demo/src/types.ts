// Types pour la configuration des vidéos de documentation Oréma N+

export interface VideoStep {
  /** Chemin vers le screenshot (via staticFile) */
  screenshot: string;
  /**
   * Points de passage du curseur (interpolation Bézier).
   * Coordonnées en POURCENTAGE (0-100) :
   * - x=0 : bord gauche, x=100 : bord droit
   * - y=0 : bord haut, y=100 : bord bas
   * - x=50, y=50 : centre de l'écran
   */
  cursorPath: { x: number; y: number }[];
  /**
   * Position du clic (déclenche l'animation ripple).
   * Coordonnées en POURCENTAGE (0-100), même système que cursorPath.
   */
  clickAt?: { x: number; y: number };
  /**
   * Zoom cinématique sur une zone.
   * x, y en POURCENTAGE (0-100), scale en multiplicateur (ex: 2 = 200%).
   */
  zoomTo?: { x: number; y: number; scale: number };
  /** Annotation/callout affiché pendant l'étape */
  annotation?: {
    text: string;
    position: "top" | "bottom" | "left" | "right";
    arrow?: boolean;
  };
  /** Durée de l'étape en frames */
  duration: number;
}

export interface DocVideoConfig {
  /** Identifiant unique de la vidéo */
  id: string;
  /** Catégorie (ex: "demarrage", "caisse", "produits") */
  category: string;
  /** Icône SVG de la catégorie (chemin ou inline SVG) */
  categoryIcon: string;
  /** Titre principal de la vidéo */
  title: string;
  /** Sous-titre descriptif */
  subtitle: string;
  /** Étapes de la vidéo */
  steps: VideoStep[];
  /** Couleur d'accent (défaut : orange Oréma) */
  accentColor?: string;
}

// Couleurs du projet Oréma N+
export const COLORS = {
  yellow: "#fed112",
  mint: "#6bfdc0",
  rose: "#f54f6d",
  violet: "#a855f7",
  orange: "#f97316",
  orangeDark: "#ea580c",
  darkBg: "#0a0a0a",
  darkBgAlt: "#1a1a2e",
  darkBgDeep: "#0f172a",
  textMuted: "#94a3b8",
  textDim: "#64748b",
} as const;

// Configuration spring par défaut pour le motion design
export const SPRING_CONFIGS = {
  /** Entrée d'éléments UI (bounce naturel) */
  enter: { damping: 14, stiffness: 150 },
  /** Entrée douce */
  enterSoft: { damping: 20, stiffness: 100 },
  /** Sortie rapide */
  exit: { damping: 200, stiffness: 200 },
  /** Bounce prononcé (icônes, boutons) */
  bounce: { damping: 10, stiffness: 180 },
  /** Mouvement de curseur */
  cursor: { damping: 18, stiffness: 120 },
  /** Micro-animation (respiration) */
  breathe: { damping: 30, stiffness: 60 },
} as const;
