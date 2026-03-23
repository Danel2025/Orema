/**
 * Service Worker minimal pour Oréma N+ POS
 *
 * Ce service worker est volontairement minimal pour éviter les 404.
 * Il peut être étendu plus tard pour le mode hors-ligne.
 */

// Installation - met en cache les ressources essentielles si nécessaire
self.addEventListener("install", (event) => {
  // Force l'activation immédiate
  self.skipWaiting();
});

// Activation - nettoyage des anciens caches si besoin
self.addEventListener("activate", (event) => {
  // Prend le contrôle de toutes les pages immédiatement
  event.waitUntil(self.clients.claim());
});

// Fetch - stratégie network-first (pas de mise en cache pour l'instant)
self.addEventListener("fetch", (event) => {
  // Laisse le navigateur gérer normalement
  // Pour activer le mode offline, implémenter une stratégie de cache ici
});
