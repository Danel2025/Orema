import { registerDocVideo } from "../../registry";
import {
  tableauBordConfig,
  rapportZConfig,
  statistiquesVenteConfig,
  exportDonneesConfig,
} from "./index";

// Enregistrement des vidéos Rapports & Statistiques
registerDocVideo(tableauBordConfig);
registerDocVideo(rapportZConfig);
registerDocVideo(statistiquesVenteConfig);
registerDocVideo(exportDonneesConfig);
