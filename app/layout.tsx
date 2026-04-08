import type { Metadata, Viewport } from "next";
import { Gabarito, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Providers } from "./providers";
import "./globals.css";

// Font d'interface - Gabarito : titres, navigation, boutons (spécifications Oréma N+)
const gabarito = Gabarito({
  variable: "--font-gabarito",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

// Font de lecture - Source Sans 3 (ex Source Sans Pro) : texte courant, descriptions, paragraphes
// Conçue par Adobe pour la lisibilité écran, style neutre et professionnel
const sourceSans3 = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// Font monospace pour les prix, quantités et tickets
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-google-sans-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://orema-nplus.ga"),
  title: "Oréma N+ | Système de Caisse POS",
  description: "Système de point de vente moderne pour restaurants, bars et commerces en Afrique",
  keywords: ["POS", "caisse", "restaurant", "Gabon", "Afrique", "point de vente"],
  authors: [{ name: "Oréma N+" }],
  icons: {
    icon: "/favicon.ico",
    apple: [
      { url: "/images/logos/ic-lg.webp", type: "image/webp", sizes: "192x192" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Oréma N+" />
      </head>
      <body
        className={`${gabarito.variable} ${sourceSans3.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        {/* Enregistrement du Service Worker */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) {
                      console.log('[Orema] Service Worker enregistre, scope:', reg.scope);
                    })
                    .catch(function(err) {
                      console.warn('[Orema] Echec enregistrement Service Worker:', err);
                    });
                });
              }
            `,
          }}
        />
        {/* Protection contre les boucles de redirection infinies */}
        <Script
          id="redirect-loop-protection"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var REDIRECT_KEY = 'orema_redirect_count';
                var REDIRECT_LIMIT = 5;
                var RESET_DELAY = 5000;

                try {
                  var data = sessionStorage.getItem(REDIRECT_KEY);
                  var parsed = data ? JSON.parse(data) : { count: 0, timestamp: Date.now() };

                  if (Date.now() - parsed.timestamp > RESET_DELAY) {
                    parsed = { count: 0, timestamp: Date.now() };
                  }

                  if (document.referrer && document.referrer !== window.location.href) {
                    parsed.count++;
                    parsed.timestamp = Date.now();
                    sessionStorage.setItem(REDIRECT_KEY, JSON.stringify(parsed));
                  }

                  if (parsed.count >= REDIRECT_LIMIT) {
                    console.warn('[Orema] Boucle de redirection detectee, nettoyage de la session...');
                    document.cookie = 'orema_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
                    fetch('/api/clear-session', { method: 'POST' })
                      .then(function() {
                        sessionStorage.removeItem(REDIRECT_KEY);
                        window.location.href = '/login';
                      })
                      .catch(function() {
                        sessionStorage.removeItem(REDIRECT_KEY);
                        window.location.href = '/login';
                      });
                  }
                } catch (e) {
                  console.error('[Orema] Erreur protection redirections:', e);
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
