import type { Metadata } from "next";
import { Navbar, Footer } from "@/components/landing";

export const metadata: Metadata = {
  openGraph: {
    type: "website",
    siteName: "Oréma N+",
    locale: "fr_FR",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-page">
      <a href="#main-content" className="skip-to-content">
        Aller au contenu principal
      </a>
      <Navbar />
      <main id="main-content" style={{ paddingTop: "80px" }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
