import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

/**
 * Video 1 : Installation et configuration
 * Guide l'utilisateur de l'inscription au premier login.
 */
export const installationConfig: DocVideoConfig = {
  id: "doc-demarrage-01-installation",
  category: "Démarrage rapide",
  categoryIcon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
  title: "Installation et configuration",
  subtitle: "Installez et configurez Oréma N+ en quelques minutes",
  accentColor: COLORS.mint,
  steps: [
    {
      // Step 1 : Page d'accueil - cliquer sur Commencer
      screenshot: "screenshots/demarrage-01-step1.png",
      cursorPath: [
        { x: 50, y: 18 },
        { x: 50, y: 42 },
        { x: 50, y: 57 },
      ],
      clickAt: { x: 50, y: 57 },
      annotation: {
        text: "Cliquez sur Commencer",
        position: "right",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 2 : Remplir le formulaire d'inscription
      screenshot: "screenshots/demarrage-01-step2.png",
      cursorPath: [
        { x: 50, y: 28 },
        { x: 50, y: 35 },
        { x: 50, y: 43 },
        { x: 50, y: 50 },
      ],
      clickAt: { x: 50, y: 50 },
      zoomTo: { x: 50, y: 39, scale: 1.6 },
      annotation: {
        text: "Remplissez vos informations",
        position: "left",
        arrow: true,
      },
      duration: FPS * 6,
    },
    {
      // Step 3 : Validation email
      screenshot: "screenshots/demarrage-01-step3.png",
      cursorPath: [
        { x: 50, y: 37 },
        { x: 50, y: 46 },
      ],
      annotation: {
        text: "Vérifiez votre boîte mail",
        position: "bottom",
      },
      duration: FPS * 4,
    },
    {
      // Step 4 : Premier login - tableau de bord
      screenshot: "screenshots/demarrage-01-step4.png",
      cursorPath: [
        { x: 10, y: 28 },
        { x: 26, y: 37 },
        { x: 42, y: 32 },
      ],
      zoomTo: { x: 26, y: 37, scale: 1.5 },
      annotation: {
        text: "Bienvenue sur votre tableau de bord",
        position: "bottom",
      },
      duration: FPS * 5,
    },
  ],
};
