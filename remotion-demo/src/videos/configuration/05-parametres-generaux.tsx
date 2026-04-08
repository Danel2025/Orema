import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

/**
 * Video 5 : Paramètres généraux
 * Configuration des options globales : devise, fuseau horaire, options de caisse.
 */
export const parametresGenerauxConfig: DocVideoConfig = {
  id: "doc-config-05-parametres-generaux",
  category: "Configuration",
  categoryIcon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  title: "Paramètres généraux",
  subtitle: "Configurez devise, fuseau horaire et options de caisse",
  accentColor: COLORS.violet,
  steps: [
    {
      // Step 1 : Ouvrir le menu Paramètres > Général
      screenshot: "screenshots/config-05-step1.png",
      cursorPath: [
        { x: 3, y: 37 },
        { x: 4, y: 75 },
        { x: 15, y: 19 },
      ],
      clickAt: { x: 15, y: 19 },
      annotation: {
        text: "Ouvrez Paramètres > Général",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Section Informations établissement
      screenshot: "screenshots/config-05-step2.png",
      cursorPath: [
        { x: 35, y: 19 },
        { x: 40, y: 32 },
      ],
      zoomTo: { x: 40, y: 28, scale: 1.5 },
      annotation: {
        text: "Vérifiez les infos établissement",
        position: "right",
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Section Localisation (devise, fuseau horaire)
      screenshot: "screenshots/config-05-step3.png",
      cursorPath: [
        { x: 40, y: 32 },
        { x: 40, y: 48 },
      ],
      zoomTo: { x: 40, y: 46, scale: 1.6 },
      annotation: {
        text: "Devise FCFA et fuseau horaire",
        position: "left",
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Options de caisse et sauvegarde
      screenshot: "screenshots/config-05-step4.png",
      cursorPath: [
        { x: 40, y: 48 },
        { x: 40, y: 65 },
        { x: 50, y: 85 },
      ],
      clickAt: { x: 50, y: 85 },
      zoomTo: { x: 47, y: 63, scale: 1.5 },
      annotation: {
        text: "Réglez les options puis sauvegardez",
        position: "top",
        arrow: true,
      },
      duration: FPS * 6,
    },
  ],
};
