import {
  Navbar,
  Hero,
  HowItWorks,
  Features,
  DemoSection,
  PaymentMarquee,
  Stats,
  Pricing,
  Testimonials,
  FAQ,
  Footer,
} from "@/components/landing";
import "@/components/landing/landing-animations.css";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Oréma N+",
    url: "https://orema-nplus.ga",
    logo: "https://orema-nplus.ga/logo.png",
    description:
      "Système de point de vente moderne pour restaurants, bars et commerces en Afrique.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Libreville",
      addressCountry: "GA",
    },
    sameAs: [],
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Oréma N+",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Logiciel de caisse (POS) conçu pour les restaurants, bars, fast-foods et commerces au Gabon et en Afrique. Paiements Mobile Money, impression thermique, gestion des stocks et rapports.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "XAF",
      description: "Essai gratuit de 14 jours",
    },
    featureList: [
      "Gestion des ventes et encaissements",
      "Paiements Mobile Money (Airtel Money, Moov Money)",
      "Impression thermique ESC/POS",
      "Gestion des stocks",
      "Rapports et statistiques",
      "Mode hors-ligne",
      "Gestion de salle et tables",
    ],
    availableOnDevice: ["Desktop", "Tablet", "Mobile"],
    inLanguage: "fr",
  },
];

export default function LandingPage() {
  return (
    <main id="main-content" className="landing-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <DemoSection />
      <PaymentMarquee />
      <Stats />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
