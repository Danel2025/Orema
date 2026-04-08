import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>';

export const divisionTransfertConfig: DocVideoConfig = {
  id: "doc-plan-salle-division-transfert",
  category: "Plan de salle",
  categoryIcon: CATEGORY_ICON,
  title: "Division et transfert",
  subtitle: "Divisez l'addition ou transférez vers une autre table",
  accentColor: COLORS.mint,
  steps: [
    {
      // Step 1 : Ouvrir la table occupée
      screenshot: "screenshots/division-ouvrir-table.png",
      cursorPath: [
        { x: 35, y: 40 },
        { x: 42, y: 48 },
        { x: 48, y: 55 },
      ],
      clickAt: { x: 48, y: 55 },
      annotation: {
        text: "Ouvrez la table à diviser",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Cliquer sur Diviser
      screenshot: "screenshots/division-menu.png",
      cursorPath: [
        { x: 55, y: 15 },
        { x: 65, y: 18 },
        { x: 72, y: 22 },
      ],
      clickAt: { x: 72, y: 22 },
      zoomTo: { x: 70, y: 20, scale: 1.6 },
      annotation: {
        text: "Cliquez sur Diviser l'addition",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Assigner les produits
      screenshot: "screenshots/division-parts.png",
      cursorPath: [
        { x: 40, y: 35 },
        { x: 48, y: 48 },
        { x: 55, y: 58 },
      ],
      clickAt: { x: 55, y: 58 },
      annotation: {
        text: "Assignez les produits par convive",
        position: "left",
        arrow: true,
      },
      duration: FPS * 6,
    },
    {
      // Step 4 : Transférer vers une autre table
      screenshot: "screenshots/transfert-select.png",
      cursorPath: [
        { x: 35, y: 45 },
        { x: 50, y: 45 },
        { x: 65, y: 45 },
      ],
      clickAt: { x: 65, y: 45 },
      annotation: {
        text: "Sélectionnez la table destination",
        position: "top",
        arrow: true,
      },
      duration: FPS * 5,
    },
  ],
};
