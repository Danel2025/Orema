import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>';

export const configurerImprimanteConfig: DocVideoConfig = {
  id: "doc-impression-configurer-imprimante",
  category: "Impression",
  categoryIcon: CATEGORY_ICON,
  title: "Configurer une imprimante",
  subtitle: "Installez et configurez vos imprimantes thermiques ESC/POS",
  accentColor: COLORS.rose,
  steps: [
    {
      // Step 1 : Ouvrir Paramètres > Imprimantes
      screenshot: "screenshots/imprimante-parametres.png",
      cursorPath: [
        { x: 4, y: 75 },
        { x: 4, y: 82 },
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
      // Step 2 : Choisir le type de connexion
      screenshot: "screenshots/imprimante-type-connexion.png",
      cursorPath: [
        { x: 40, y: 28 },
        { x: 48, y: 32 },
        { x: 55, y: 38 },
      ],
      clickAt: { x: 55, y: 38 },
      zoomTo: { x: 52, y: 35, scale: 1.6 },
      annotation: {
        text: "Choisissez USB, Réseau ou Bluetooth",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Configurer l'adresse réseau
      screenshot: "screenshots/imprimante-config-reseau.png",
      cursorPath: [
        { x: 45, y: 42 },
        { x: 52, y: 50 },
        { x: 58, y: 58 },
      ],
      clickAt: { x: 58, y: 55 },
      zoomTo: { x: 55, y: 50, scale: 1.5 },
      annotation: {
        text: "Entrez l'adresse IP et le port",
        position: "left",
        arrow: true,
      },
      duration: FPS * 6,
    },
    {
      // Step 4 : Tester la connexion
      screenshot: "screenshots/imprimante-test.png",
      cursorPath: [
        { x: 50, y: 65 },
        { x: 58, y: 72 },
        { x: 65, y: 78 },
      ],
      clickAt: { x: 65, y: 78 },
      annotation: {
        text: "Testez la connexion imprimante",
        position: "top",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 5 : Vérifier le ticket de test
      screenshot: "screenshots/imprimante-succes.png",
      cursorPath: [
        { x: 45, y: 45 },
        { x: 50, y: 50 },
        { x: 52, y: 55 },
      ],
      annotation: {
        text: "Vérifiez le ticket de test imprimé",
        position: "bottom",
      },
      duration: FPS * 4,
    },
  ],
};
