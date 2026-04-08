import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>';

export const statistiquesVenteConfig: DocVideoConfig = {
  id: "doc-rapports-statistiques-vente",
  category: "Rapports & Statistiques",
  categoryIcon: CATEGORY_ICON,
  title: "Statistiques de vente",
  subtitle: "Analysez vos performances en détail par période et dimension",
  accentColor: COLORS.orange,
  steps: [
    {
      // Step 1 : Ouvrir Rapports > Statistiques
      screenshot: "screenshots/stats-menu.png",
      cursorPath: [
        { x: 4, y: 58 },
        { x: 4, y: 65 },
        { x: 4, y: 70 },
      ],
      clickAt: { x: 4, y: 70 },
      annotation: {
        text: "Ouvrez Rapports puis Statistiques",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Filtrer par période
      screenshot: "screenshots/stats-periode.png",
      cursorPath: [
        { x: 50, y: 8 },
        { x: 60, y: 10 },
        { x: 70, y: 12 },
      ],
      clickAt: { x: 70, y: 12 },
      zoomTo: { x: 65, y: 10, scale: 1.5 },
      annotation: {
        text: "Filtrez par jour, semaine ou mois",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Top produits
      screenshot: "screenshots/stats-top-produits.png",
      cursorPath: [
        { x: 25, y: 35 },
        { x: 35, y: 45 },
        { x: 42, y: 52 },
      ],
      zoomTo: { x: 35, y: 45, scale: 1.4 },
      annotation: {
        text: "Identifiez vos meilleures ventes",
        position: "right",
      },
      duration: FPS * 6,
    },
    {
      // Step 4 : Ventes par heure
      screenshot: "screenshots/stats-heures.png",
      cursorPath: [
        { x: 48, y: 42 },
        { x: 58, y: 48 },
        { x: 65, y: 52 },
      ],
      zoomTo: { x: 58, y: 48, scale: 1.3 },
      annotation: {
        text: "Repérez les pics d'activité",
        position: "top",
      },
      duration: FPS * 6,
    },
    {
      // Step 5 : Analyse clients
      screenshot: "screenshots/stats-clients.png",
      cursorPath: [
        { x: 42, y: 58 },
        { x: 50, y: 62 },
        { x: 55, y: 68 },
      ],
      annotation: {
        text: "Analysez fréquence et panier moyen",
        position: "top",
      },
      duration: FPS * 5,
    },
  ],
};
