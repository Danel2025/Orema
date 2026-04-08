import { registerDocVideo } from "../../registry";
import {
  creerPlanConfig,
  gestionTablesConfig,
  divisionTransfertConfig,
  zonesEtagesConfig,
} from "./index";

// Enregistrement des vidéos Plan de salle
registerDocVideo(creerPlanConfig);
registerDocVideo(gestionTablesConfig);
registerDocVideo(divisionTransfertConfig);
registerDocVideo(zonesEtagesConfig);
