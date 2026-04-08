/**
 * Service Worker pour Orema N+ POS
 *
 * Strategies :
 * - Cache-first pour les assets statiques (/_next/static/, icones, polices)
 * - Network-first pour les appels API (/api/)
 * - Network-first par defaut (pages HTML)
 * - Fallback offline basique
 *
 * NE gere PAS le cache de donnees metier (IndexedDB s'en occupe)
 */

const CACHE_NAME = "orema-pos-v1";

const PRECACHE_URLS = ["/offline.html"];

// Installation : pre-cache la page offline
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch : routage des requetes
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requetes non-GET
  if (request.method !== "GET") return;

  // Ignorer les requetes vers d'autres origines (Supabase, etc.)
  if (url.origin !== self.location.origin) return;

  // Strategy cache-first pour les assets statiques Next.js
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(/\.(svg|png|jpg|jpeg|webp|ico|woff2?)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Strategy network-first pour les appels API
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Network-first pour les pages HTML (navigation)
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Par defaut : network-first
  event.respondWith(networkFirst(request));
});

/**
 * Cache-first : cherche dans le cache, sinon reseau et mise en cache
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 503, statusText: "Service Unavailable" });
  }
}

/**
 * Network-first : essaie le reseau, sinon le cache
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response("", { status: 503, statusText: "Service Unavailable" });
  }
}

/**
 * Network-first avec fallback vers la page offline
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback : page offline
    const offlinePage = await caches.match("/offline.html");
    if (offlinePage) return offlinePage;

    return new Response(
      "<html><body><h1>Hors connexion</h1><p>Verifiez votre connexion internet.</p></body></html>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
