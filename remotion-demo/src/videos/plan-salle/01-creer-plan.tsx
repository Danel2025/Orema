import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>';

export const creerPlanConfig: DocVideoConfig = {
  id: "doc-plan-salle-creer-plan",
  category: "Plan de salle",
  categoryIcon: CATEGORY_ICON,
  title: "Créer votre plan de salle",
  subtitle: "Configurez la disposition de vos tables visuellement",
  accentColor: COLORS.mint,
  steps: [
    {
      // Step 1 : Ouvrir le menu Plan de salle
      screenshot: "screenshots/plan-salle-menu.png",
      cursorPath: [
        { x: 4, y: 35 },
        { x: 4, y: 42 },
        { x: 4, y: 48 },
      ],
      clickAt: { x: 4, y: 48 },
      annotation: {
        text: "Ouvrez le menu Plan de salle",
        position: "right",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 2 : Entrer en mode édition
      screenshot: "screenshots/plan-salle-edit.png",
      cursorPath: [
        { x: 50, y: 10 },
        { x: 70, y: 7 },
        { x: 88, y: 7 },
      ],
      clickAt: { x: 88, y: 7 },
      annotation: {
        text: "Cliquez sur Modifier le plan",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Glisser-déposer une table
      screenshot: "screenshots/plan-salle-drag.png",
      cursorPath: [
        { x: 20, y: 25 },
        { x: 40, y: 40 },
        { x: 50, y: 50 },
      ],
      clickAt: { x: 50, y: 50 },
      zoomTo: { x: 45, y: 45, scale: 1.5 },
      annotation: {
        text: "Glissez une table sur le plan",
        position: "left",
        arrow: true,
      },
      duration: FPS * 6,
    },
    {
      // Step 4 : Configurer la table
      screenshot: "screenshots/plan-salle-config-table.png",
      cursorPath: [
        { x: 60, y: 35 },
        { x: 68, y: 42 },
        { x: 72, y: 48 },
      ],
      clickAt: { x: 72, y: 48 },
      zoomTo: { x: 70, y: 45, scale: 1.8 },
      annotation: {
        text: "Configurez numéro, places et forme",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 5 : Enregistrer le plan
      screenshot: "screenshots/plan-salle-save.png",
      cursorPath: [
        { x: 50, y: 50 },
        { x: 70, y: 80 },
        { x: 88, y: 88 },
      ],
      clickAt: { x: 88, y: 88 },
      annotation: {
        text: "Enregistrez votre plan de salle",
        position: "top",
        arrow: true,
      },
      duration: FPS * 4,
    },
  ],
};
