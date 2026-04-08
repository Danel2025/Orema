import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>';

export const depannageImpressionConfig: DocVideoConfig = {
  id: "doc-impression-depannage",
  category: "Impression",
  categoryIcon: CATEGORY_ICON,
  title: "Dépannage impression",
  subtitle: "Résolvez les problèmes d'impression courants",
  accentColor: COLORS.rose,
  steps: [
    {
      // Step 1 : Checklist de vérification
      screenshot: "screenshots/depannage-checklist.png",
      cursorPath: [
        { x: 35, y: 25 },
        { x: 50, y: 40 },
        { x: 55, y: 55 },
      ],
      annotation: {
        text: "Vérifiez câble, papier et alimentation",
        position: "bottom",
      },
      duration: FPS * 5,
    },
    {
      // Step 2 : Page de test physique
      screenshot: "screenshots/depannage-test.png",
      cursorPath: [
        { x: 50, y: 35 },
        { x: 58, y: 42 },
        { x: 65, y: 48 },
      ],
      clickAt: { x: 65, y: 48 },
      annotation: {
        text: "Lancez une page de test",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Corriger l'encodage
      screenshot: "screenshots/depannage-encodage.png",
      cursorPath: [
        { x: 45, y: 52 },
        { x: 50, y: 58 },
        { x: 55, y: 62 },
      ],
      clickAt: { x: 55, y: 62 },
      zoomTo: { x: 52, y: 58, scale: 1.6 },
      annotation: {
        text: "Changez l'encodage si nécessaire",
        position: "top",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Stabiliser le réseau
      screenshot: "screenshots/depannage-reseau.png",
      cursorPath: [
        { x: 42, y: 38 },
        { x: 50, y: 45 },
        { x: 55, y: 50 },
      ],
      annotation: {
        text: "Assignez une IP fixe au besoin",
        position: "bottom",
      },
      duration: FPS * 5,
    },
    {
      // Step 5 : Contacter le support
      screenshot: "screenshots/depannage-support.png",
      cursorPath: [
        { x: 42, y: 65 },
        { x: 48, y: 72 },
        { x: 55, y: 78 },
      ],
      clickAt: { x: 55, y: 78 },
      annotation: {
        text: "Contactez le support Oréma N+",
        position: "top",
        arrow: true,
      },
      duration: FPS * 4,
    },
  ],
};
