import type { Metadata, Viewport } from "next";
import { Gabarito , JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// Font principale pour l'interface - Gabarito (spécifications Oréma N+)
const gabarito = Gabarito({
  variable: "--font-gabarito",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

// Font monospace pour les prix, quantités et tickets
// Note: Google Sans Code n'est pas disponible sur Google Fonts, JetBrains Mono est un excellent substitut
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
    icon: [
      { url: "/images/logos/ic-lg.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: { url: "/images/logos/ic-lg.webp", type: "image/webp" },
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
        {/* Protection contre les boucles de redirection infinies */}
        <script
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
                    console.warn('[Oréma] Boucle de redirection détectée, nettoyage de la session...');
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
                  console.error('[Oréma] Erreur protection redirections:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${gabarito.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
