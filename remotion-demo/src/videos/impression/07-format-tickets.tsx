import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>';

export const formatTicketsConfig: DocVideoConfig = {
  id: "doc-impression-format-tickets",
  category: "Impression",
  categoryIcon: CATEGORY_ICON,
  title: "Format des tickets",
  subtitle: "Personnalisez la mise en page de vos impressions",
  accentColor: COLORS.rose,
  steps: [
    {
      // Step 1 : Ouvrir Paramètres > Tickets
      screenshot: "screenshots/tickets-parametres.png",
      cursorPath: [
        { x: 4, y: 78 },
        { x: 12, y: 72 },
        { x: 18, y: 68 },
      ],
      clickAt: { x: 18, y: 68 },
      annotation: {
        text: "Ouvrez Paramètres puis Format ticket",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Choisir la largeur du ticket
      screenshot: "screenshots/tickets-largeur.png",
      cursorPath: [
        { x: 42, y: 22 },
        { x: 48, y: 28 },
        { x: 55, y: 32 },
      ],
      clickAt: { x: 55, y: 32 },
      zoomTo: { x: 52, y: 28, scale: 1.5 },
      annotation: {
        text: "Choisissez la largeur : 80 ou 58mm",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Aperçu du ticket
      screenshot: "screenshots/tickets-apercu.png",
      cursorPath: [
        { x: 42, y: 42 },
        { x: 48, y: 50 },
        { x: 52, y: 55 },
      ],
      zoomTo: { x: 50, y: 50, scale: 1.4 },
      annotation: {
        text: "Aperçu : logo, en-tête, TVA, pied",
        position: "left",
      },
      duration: FPS * 6,
    },
    {
      // Step 4 : Activer/désactiver les éléments
      screenshot: "screenshots/tickets-options.png",
      cursorPath: [
        { x: 62, y: 38 },
        { x: 68, y: 45 },
        { x: 72, y: 52 },
      ],
      clickAt: { x: 72, y: 52 },
      annotation: {
        text: "Activez ou désactivez chaque section",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
  ],
};
