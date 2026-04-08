import { registerDocVideo } from "../../registry";
import {
  configurerImprimanteConfig,
  impressionCuisineBarConfig,
  formatTicketsConfig,
  depannageImpressionConfig,
} from "./index";

// Enregistrement des vidéos Impression
registerDocVideo(configurerImprimanteConfig);
registerDocVideo(impressionCuisineBarConfig);
registerDocVideo(formatTicketsConfig);
registerDocVideo(depannageImpressionConfig);
