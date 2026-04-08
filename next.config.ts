import type { NextConfig } from "next";

/**
 * Mode Tauri : quand TAURI_ENV est défini, Next.js produit un export statique
 * compatible avec le shell Tauri (pas de serveur Node.js).
 * Les Server Actions, API Routes et headers custom sont désactivés en mode export.
 */
const isTauri = !!process.env.TAURI_ENV;

/**
 * Headers de securite pour l'application
 * @security Protection contre diverses attaques web (OWASP Top 10 aligned)
 */
const isDev = process.env.NODE_ENV === "development";

// CSP conditionnel : 'unsafe-eval' uniquement en dev (necessaire pour Next.js hot reload)
// En production, seul 'unsafe-inline' est conserve (necessaire pour Radix UI Themes)
const scriptSrc = isDev
  ? "'self' 'unsafe-eval' 'unsafe-inline' https://storage.googleapis.com"
  : "'self' 'unsafe-inline' https://storage.googleapis.com";

const securityHeaders = [
  // Prefetch DNS pour ameliorer les performances
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  // Force HTTPS pendant 2 ans + preload
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Empeche le clickjacking en interdisant l'affichage dans des iframes (DENY plus strict que SAMEORIGIN)
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Empeche le sniffing MIME (protection XSS)
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Controle les informations envoyees dans le header Referer
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Content Security Policy - Protection XSS et injection
  // 'unsafe-eval' retire en production (garde en dev pour Next.js hot reload)
  // 'unsafe-inline' conserve pour style-src (necessaire pour Radix UI Themes)
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Autoriser le CDN Workbox pour le Service Worker
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // img-src restreint aux domaines Supabase specifiques (pas https: generique)
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      // Permettre au Service Worker de charger Workbox
      "worker-src 'self' blob:",
      // frame-ancestors 'none' plus strict que X-Frame-Options DENY (defense en profondeur)
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  // Controle les fonctionnalites du navigateur
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()", // Desactive FLoC
    ].join(", "),
  },
  // Protection XSS supplementaire (deprecie mais encore utile pour vieux navigateurs)
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
];

const nextConfig: NextConfig = {
  // Export statique pour Tauri (génère un dossier `out/` sans serveur Node.js)
  ...(isTauri && { output: "export" }),

  // Routes typees desactivees (certaines routes dynamiques ne sont pas compatibles)
  // typedRoutes: true,

  // Configuration des images
  // En mode Tauri, désactiver l'optimisation (pas de serveur Node.js pour traiter les images)
  images: isTauri
    ? { unoptimized: true }
    : {
        remotePatterns: [
          {
            protocol: "http",
            hostname: "localhost",
          },
          {
            protocol: "https",
            hostname: "*.supabase.co",
          },
        ],
      },

  // Configuration pour la production
  reactStrictMode: true,

  // Timezone pour les dates (Gabon)
  env: {
    TZ: "Africa/Libreville",
  },

  // Headers de securite appliques a toutes les routes
  // Désactivé en mode Tauri (incompatible avec output: 'export')
  ...(!isTauri && {
    async headers() {
      const headers = [
        {
          // Appliquer les headers de sécurité à toutes les routes
          source: "/(.*)",
          headers: securityHeaders,
        },
      ];

      // En développement, désactiver le cache pour éviter les problèmes de Server Actions
      if (process.env.NODE_ENV === "development") {
        headers.push({
          source: "/(.*)",
          headers: [
            {
              key: "Cache-Control",
              value: "no-store, no-cache, must-revalidate, proxy-revalidate",
            },
            {
              key: "Pragma",
              value: "no-cache",
            },
            {
              key: "Expires",
              value: "0",
            },
          ],
        });
      }

      return headers;
    },
  }),

  // Redirections de securite (désactivé temporairement pour debug)
  // async redirects() {
  //   return [
  //     // Forcer la suppression du trailing slash pour coherence
  //     {
  //       source: "/:path*(/)",
  //       destination: "/:path*",
  //       permanent: true,
  //     },
  //   ];
  // },

  // Configuration experimentale
  // Server Actions désactivées en mode Tauri (incompatible avec output: 'export')
  ...(!isTauri && {
    experimental: {
      serverActions: {
        bodySizeLimit: "2mb",
      },
    },
  }),
};

export default nextConfig;
