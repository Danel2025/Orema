import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>';

export const rapportZConfig: DocVideoConfig = {
  id: "doc-rapports-rapport-z",
  category: "Rapports & Statistiques",
  categoryIcon: CATEGORY_ICON,
  title: "Rapport Z",
  subtitle: "Effectuez la clôture quotidienne de votre caisse",
  accentColor: COLORS.orange,
  steps: [
    {
      // Step 1 : Accéder à Rapports > Rapport Z
      screenshot: "screenshots/rapport-z-menu.png",
      cursorPath: [
        { x: 4, y: 55 },
        { x: 4, y: 62 },
        { x: 4, y: 68 },
      ],
      clickAt: { x: 4, y: 68 },
      annotation: {
        text: "Ouvrez Rapports puis Rapport Z",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Générer la clôture
      screenshot: "screenshots/rapport-z-generer.png",
      cursorPath: [
        { x: 50, y: 12 },
        { x: 68, y: 14 },
        { x: 85, y: 7 },
      ],
      clickAt: { x: 85, y: 7 },
      annotation: {
        text: "Cliquez sur Générer la clôture",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Saisir les montants comptés
      screenshot: "screenshots/rapport-z-saisie.png",
      cursorPath: [
        { x: 40, y: 35 },
        { x: 48, y: 48 },
        { x: 55, y: 58 },
      ],
      clickAt: { x: 55, y: 58 },
      zoomTo: { x: 50, y: 48, scale: 1.4 },
      annotation: {
        text: "Saisissez les montants comptés",
        position: "left",
        arrow: true,
      },
      duration: FPS * 6,
    },
    {
      // Step 4 : Aperçu du rapport
      screenshot: "screenshots/rapport-z-apercu.png",
      cursorPath: [
        { x: 40, y: 35 },
        { x: 48, y: 48 },
        { x: 52, y: 60 },
      ],
      zoomTo: { x: 50, y: 50, scale: 1.3 },
      annotation: {
        text: "Aperçu : ventes, paiements, écarts",
        position: "right",
      },
      duration: FPS * 6,
    },
    {
      // Step 5 : Valider et imprimer
      screenshot: "screenshots/rapport-z-actions.png",
      cursorPath: [
        { x: 60, y: 80 },
        { x: 68, y: 85 },
        { x: 78, y: 88 },
      ],
      clickAt: { x: 78, y: 88 },
      annotation: {
        text: "Validez, imprimez ou exportez en PDF",
        position: "top",
        arrow: true,
      },
      duration: FPS * 5,
    },
  ],
};
