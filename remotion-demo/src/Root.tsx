import { Composition } from "remotion";
import { DemoVideo } from "./DemoVideo";
import { DocVideoTemplate, calculateDocVideoDuration } from "./templates/DocVideoTemplate";
import { docVideoRegistry, registerDocVideo } from "./registry";

// ---- Import des vidéos : Démarrage rapide ----
import {
  installationConfig,
  premierEtablissementConfig,
  ajouterProduitsConfig,
  configurerPaiementsConfig,
} from "./videos/demarrage";

// ---- Import des vidéos : Configuration ----
import {
  parametresGenerauxConfig,
  gestionCategoriesConfig,
  configurationTaxesConfig,
  personnalisationTicketsConfig,
} from "./videos/configuration";

// Configuration globale
const FPS = 30;
const DURATION_IN_SECONDS = 185; // Intro (3.5s) + Démo vidéo (175s) + Outro (5s) ≈ 185s

// ---- Vidéo placeholder pour tester les composants ----
registerDocVideo({
  id: "doc-test-placeholder",
  category: "Démarrage",
  categoryIcon: "",
  title: "Connexion rapide",
  subtitle: "Accédez à votre espace en quelques secondes",
  accentColor: "#f97316",
  steps: [
    {
      screenshot: "screenshots/login.png",
      cursorPath: [
        { x: 960, y: 300 },
        { x: 960, y: 500 },
        { x: 960, y: 620 },
      ],
      clickAt: { x: 960, y: 620 },
      annotation: {
        text: "Entrez votre code PIN pour vous connecter",
        position: "right",
        arrow: true,
      },
      duration: FPS * 6,
    },
    {
      screenshot: "screenshots/dashboard.png",
      cursorPath: [
        { x: 200, y: 400 },
        { x: 500, y: 400 },
      ],
      zoomTo: { x: 350, y: 400, scale: 1.8 },
      annotation: {
        text: "Votre tableau de bord s'affiche",
        position: "bottom",
      },
      duration: FPS * 5,
    },
  ],
});

// ---- Vidéos Démarrage rapide (VIDEO-GROUP-1) ----
registerDocVideo(installationConfig);
registerDocVideo(premierEtablissementConfig);
registerDocVideo(ajouterProduitsConfig);
registerDocVideo(configurerPaiementsConfig);

// ---- Vidéos Configuration (VIDEO-GROUP-1) ----
registerDocVideo(parametresGenerauxConfig);
registerDocVideo(gestionCategoriesConfig);
registerDocVideo(configurationTaxesConfig);
registerDocVideo(personnalisationTicketsConfig);

// ---- Vidéos Caisse & Ventes + Produits & Stocks (VIDEO-GROUP-2) ----
import "./videos/caisse-ventes/register";
import "./videos/produits-stocks/register";

// ---- Vidéos Plan de salle + Impression + Rapports + Sécurité (VIDEO-GROUP-3) ----
import "./videos/plan-salle/register";
import "./videos/impression/register";
import "./videos/rapports/register";
import "./videos/securite/register";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Composition de la démo vidéo principale (dimensions = vidéo source 1920x900) */}

      {/* Compositions de documentation générées dynamiquement */}
      {docVideoRegistry.map((config) => (
        <Composition
          key={config.id}
          id={config.id}
          component={() => <DocVideoTemplate config={config} />}
          durationInFrames={calculateDocVideoDuration(config, FPS)}
          fps={FPS}
          width={1920}
          height={1080}
        />
      ))}
    </>
  );
};
