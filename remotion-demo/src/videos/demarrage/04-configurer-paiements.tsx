import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

/**
 * Video 4 : Configurer vos modes de paiement
 * Activation des moyens de paiement : espèces, carte, Mobile Money, crédit client.
 */
export const configurerPaiementsConfig: DocVideoConfig = {
  id: "doc-demarrage-04-configurer-paiements",
  category: "Démarrage rapide",
  categoryIcon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>',
  title: "Configurer les paiements",
  subtitle: "Activez espèces, Mobile Money et carte bancaire",
  accentColor: COLORS.mint,
  steps: [
    {
      // Step 1 : Naviguer vers Paramètres > Paiements
      screenshot: "screenshots/demarrage-04-step1.png",
      cursorPath: [
        { x: 3, y: 37 },
        { x: 4, y: 75 },
        { x: 15, y: 40 },
      ],
      clickAt: { x: 15, y: 40 },
      annotation: {
        text: "Ouvrez Paramètres > Paiements",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Activer Airtel Money
      screenshot: "screenshots/demarrage-04-step2.png",
      cursorPath: [
        { x: 36, y: 28 },
        { x: 55, y: 28 },
        { x: 65, y: 28 },
      ],
      clickAt: { x: 65, y: 28 },
      zoomTo: { x: 52, y: 28, scale: 1.6 },
      annotation: {
        text: "Activez Airtel Money",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Entrer le numéro marchand Airtel
      screenshot: "screenshots/demarrage-04-step3.png",
      cursorPath: [
        { x: 47, y: 35 },
        { x: 57, y: 35 },
      ],
      clickAt: { x: 57, y: 35 },
      zoomTo: { x: 52, y: 35, scale: 1.8 },
      annotation: {
        text: "Entrez votre numéro marchand",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Activer Moov Money
      screenshot: "screenshots/demarrage-04-step4.png",
      cursorPath: [
        { x: 36, y: 46 },
        { x: 55, y: 46 },
        { x: 65, y: 46 },
      ],
      clickAt: { x: 65, y: 46 },
      annotation: {
        text: "Répétez pour Moov Money",
        position: "left",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 5 : Configurer le crédit client
      screenshot: "screenshots/demarrage-04-step5.png",
      cursorPath: [
        { x: 36, y: 60 },
        { x: 55, y: 60 },
        { x: 65, y: 60 },
      ],
      clickAt: { x: 65, y: 60 },
      annotation: {
        text: "Activez le crédit client",
        position: "top",
        arrow: true,
      },
      duration: FPS * 4,
    },
  ],
};
