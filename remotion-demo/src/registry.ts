import type { DocVideoConfig } from "./types";

// Registre des vidéos de documentation
export const docVideoRegistry: DocVideoConfig[] = [];

/**
 * Enregistre une vidéo de documentation dans le registre.
 * Les compositeurs utilisent cette fonction pour ajouter leurs vidéos.
 */
export function registerDocVideo(config: DocVideoConfig): void {
  if (!docVideoRegistry.find((v) => v.id === config.id)) {
    docVideoRegistry.push(config);
  }
}
