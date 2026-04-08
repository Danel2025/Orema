import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>';

export const impressionCuisineBarConfig: DocVideoConfig = {
  id: "doc-impression-cuisine-bar",
  category: "Impression",
  categoryIcon: CATEGORY_ICON,
  title: "Impression cuisine/bar",
  subtitle: "Envoyez automatiquement les commandes aux bons postes",
  accentColor: COLORS.rose,
  steps: [
    {
      // Step 1 : Accéder aux imprimantes
      screenshot: "screenshots/impression-parametres-imprimantes.png",
      cursorPath: [
        { x: 4, y: 78 },
        { x: 4, y: 84 },
        { x: 4, y: 88 },
      ],
      clickAt: { x: 4, y: 88 },
      annotation: {
        text: "Ouvrez Paramètres puis Imprimantes",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Définir le rôle de chaque imprimante
      screenshot: "screenshots/impression-role-imprimante.png",
      cursorPath: [
        { x: 45, y: 32 },
        { x: 52, y: 38 },
        { x: 60, y: 42 },
      ],
      clickAt: { x: 60, y: 42 },
      zoomTo: { x: 55, y: 38, scale: 1.5 },
      annotation: {
        text: "Définissez le rôle : Cuisine ou Bar",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Assigner les catégories
      screenshot: "screenshots/impression-categories-assign.png",
      cursorPath: [
        { x: 35, y: 48 },
        { x: 45, y: 52 },
        { x: 55, y: 58 },
      ],
      clickAt: { x: 55, y: 58 },
      annotation: {
        text: "Assignez catégories aux imprimantes",
        position: "right",
        arrow: true,
      },
      duration: FPS * 6,
    },
    {
      // Step 4 : Aperçu du bon de commande
      screenshot: "screenshots/impression-bon-commande.png",
      cursorPath: [
        { x: 42, y: 38 },
        { x: 48, y: 45 },
        { x: 52, y: 50 },
      ],
      zoomTo: { x: 50, y: 45, scale: 1.6 },
      annotation: {
        text: "Aperçu du bon de commande",
        position: "bottom",
      },
      duration: FPS * 5,
    },
    {
      // Step 5 : Réimprimer un bon
      screenshot: "screenshots/impression-reimprimer.png",
      cursorPath: [
        { x: 60, y: 18 },
        { x: 68, y: 22 },
        { x: 75, y: 28 },
      ],
      clickAt: { x: 75, y: 28 },
      annotation: {
        text: "Réimprimez un bon si nécessaire",
        position: "left",
        arrow: true,
      },
      duration: FPS * 4,
    },
  ],
};
