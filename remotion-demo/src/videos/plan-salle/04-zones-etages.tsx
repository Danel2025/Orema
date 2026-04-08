import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>';

export const zonesEtagesConfig: DocVideoConfig = {
  id: "doc-plan-salle-zones-etages",
  category: "Plan de salle",
  categoryIcon: CATEGORY_ICON,
  title: "Zones et étages",
  subtitle: "Organisez votre établissement par sections et niveaux",
  accentColor: COLORS.mint,
  steps: [
    {
      // Step 1 : Accéder aux zones
      screenshot: "screenshots/zones-menu.png",
      cursorPath: [
        { x: 4, y: 48 },
        { x: 4, y: 52 },
        { x: 4, y: 56 },
      ],
      clickAt: { x: 4, y: 56 },
      annotation: {
        text: "Ouvrez Salle puis Gérer zones",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Créer une zone
      screenshot: "screenshots/zones-nouvelle.png",
      cursorPath: [
        { x: 50, y: 10 },
        { x: 70, y: 8 },
        { x: 88, y: 7 },
      ],
      clickAt: { x: 88, y: 7 },
      zoomTo: { x: 85, y: 7, scale: 1.5 },
      annotation: {
        text: "Créez une zone : Terrasse, VIP...",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Assigner les tables
      screenshot: "screenshots/zones-assign-tables.png",
      cursorPath: [
        { x: 35, y: 40 },
        { x: 45, y: 48 },
        { x: 55, y: 55 },
      ],
      clickAt: { x: 55, y: 55 },
      annotation: {
        text: "Assignez les tables par glisser-déposer",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Naviguer entre les zones
      screenshot: "screenshots/zones-onglets.png",
      cursorPath: [
        { x: 25, y: 12 },
        { x: 40, y: 12 },
        { x: 55, y: 12 },
      ],
      clickAt: { x: 55, y: 12 },
      zoomTo: { x: 40, y: 12, scale: 1.8 },
      annotation: {
        text: "Naviguez entre zones via les onglets",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 5 : Créer des étages
      screenshot: "screenshots/etages-config.png",
      cursorPath: [
        { x: 65, y: 20 },
        { x: 70, y: 28 },
        { x: 75, y: 35 },
      ],
      clickAt: { x: 75, y: 35 },
      annotation: {
        text: "Créez des étages avec leurs zones",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
  ],
};
