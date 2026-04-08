import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>';

export const tableauBordConfig: DocVideoConfig = {
  id: "doc-rapports-tableau-bord",
  category: "Rapports & Statistiques",
  categoryIcon: CATEGORY_ICON,
  title: "Tableau de bord",
  subtitle: "Vue d'ensemble de votre activité en temps réel",
  accentColor: COLORS.orange,
  steps: [
    {
      // Step 1 : Accéder au tableau de bord
      screenshot: "screenshots/dashboard-vue-globale.png",
      cursorPath: [
        { x: 4, y: 12 },
        { x: 4, y: 18 },
        { x: 4, y: 22 },
      ],
      clickAt: { x: 4, y: 22 },
      annotation: {
        text: "Ouvrez le tableau de bord",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Indicateurs clés en haut
      screenshot: "screenshots/dashboard-indicateurs.png",
      cursorPath: [
        { x: 20, y: 15 },
        { x: 45, y: 15 },
        { x: 75, y: 15 },
      ],
      zoomTo: { x: 50, y: 15, scale: 1.4 },
      annotation: {
        text: "Indicateurs : CA, tickets, panier moyen",
        position: "bottom",
      },
      duration: FPS * 6,
    },
    {
      // Step 3 : Graphiques de vente
      screenshot: "screenshots/dashboard-graphiques.png",
      cursorPath: [
        { x: 30, y: 40 },
        { x: 50, y: 48 },
        { x: 65, y: 52 },
      ],
      zoomTo: { x: 50, y: 48, scale: 1.3 },
      annotation: {
        text: "Graphiques ventes et top produits",
        position: "top",
      },
      duration: FPS * 6,
    },
    {
      // Step 4 : Comparer les périodes
      screenshot: "screenshots/dashboard-comparaison.png",
      cursorPath: [
        { x: 70, y: 8 },
        { x: 78, y: 10 },
        { x: 85, y: 12 },
      ],
      clickAt: { x: 85, y: 12 },
      zoomTo: { x: 82, y: 10, scale: 1.5 },
      annotation: {
        text: "Comparez avec la période précédente",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
  ],
};
