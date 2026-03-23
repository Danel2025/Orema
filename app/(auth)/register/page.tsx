"use client";

/**
 * Page d'inscription - Wizard en 2 étapes
 * Design split-screen moderne avec illustration
 *
 * Étape 1: Informations utilisateur (email, mot de passe, nom, prénom)
 * Étape 2: Informations établissement (nom, téléphone, adresse, etc.)
 */

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Box, Flex, Text } from "@radix-ui/themes";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { RegisterStepUser } from "@/components/auth/register-step-user";
import { RegisterStepEtablissement } from "@/components/auth/register-step-etablissement";
import { registerWithEtablissement } from "@/actions/register";
import type { RegisterUserInput, RegisterEtablissementInput } from "@/schemas/register.schema";
import {
  Store,
  CreditCard,
  Smartphone,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2>(1);
  const [userData, setUserData] = useState<RegisterUserInput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStepUserSubmit = (data: RegisterUserInput) => {
    setUserData(data);
    setStep(2);
  };

  const handleFinalSubmit = async (etablissementData: RegisterEtablissementInput) => {
    if (!userData) {
      toast.error("Données utilisateur manquantes");
      setStep(1);
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerWithEtablissement(userData, etablissementData);

      if (result.success) {
        toast.success("Inscription réussie ! Vous pouvez maintenant vous connecter.");
        router.push("/login?registered=true");
      } else {
        toast.error(result.error || "Une erreur est survenue");
        if (result.error?.includes("email")) {
          setStep(1);
        }
      }
    } catch (error) {
      console.error("[Register] Erreur:", error);
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes check-appear {
          0% { opacity: 0; transform: scale(0.5); }
          50% { transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        .register-container {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }
        .left-panel {
          flex: 1;
          display: none;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%);
        }
        @media (min-width: 1024px) {
          .left-panel {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 3rem;
          }
        }
        .left-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(circle at 20% 80%, rgba(52, 211, 153, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(167, 243, 208, 0.2) 0%, transparent 40%),
            radial-gradient(circle at 40% 40%, rgba(0, 0, 0, 0.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .left-panel::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
        }
        .floating-icon {
          position: absolute;
          color: rgba(255, 255, 255, 0.12);
          animation: float 6s ease-in-out infinite;
        }
        .floating-icon:nth-child(2) {
          animation: float-delayed 7s ease-in-out infinite;
          animation-delay: 1s;
        }
        .floating-icon:nth-child(3) {
          animation: float 8s ease-in-out infinite;
          animation-delay: 2s;
        }
        .floating-icon:nth-child(4) {
          animation: float-delayed 5s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        .glow-circle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(52, 211, 153, 0.3) 0%, transparent 70%);
          animation: pulse-glow 4s ease-in-out infinite;
        }
        .hero-content {
          position: relative;
          z-index: 10;
          text-align: center;
          max-width: 480px;
          animation: slide-up 0.8s ease-out;
        }
        .hero-logo {
          width: 72px;
          height: 72px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .hero-title {
          font-family: var(--font-gabarito), system-ui, sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.75rem;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
          letter-spacing: -0.02em;
        }
        .hero-subtitle {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 2.5rem;
          line-height: 1.6;
          font-weight: 300;
        }
        .benefits-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          text-align: left;
        }
        .benefit-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
          transition: all 0.3s ease;
        }
        .benefit-item:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateX(5px);
        }
        .benefit-icon {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .benefit-text {
          flex: 1;
        }
        .benefit-title {
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: 0.15rem;
        }
        .benefit-desc {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
        }
        .right-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          position: relative;
          background: var(--color-background);
          overflow-y: auto;
        }
        @media (min-width: 1024px) {
          .right-panel {
            max-width: 640px;
          }
        }
        .register-form-container {
          width: 100%;
          max-width: 440px;
          animation: fade-in 0.6s ease-out;
          animation-delay: 0.2s;
          animation-fill-mode: both;
        }
        .form-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .form-logo-mobile {
          width: 56px;
          height: 56px;
          background: var(--accent-9);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);
        }
        @media (min-width: 1024px) {
          .form-logo-mobile {
            display: none;
          }
        }
        .form-title {
          font-family: var(--font-gabarito), system-ui, sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--gray-12);
          margin-bottom: 0.5rem;
        }
        .form-subtitle {
          color: var(--gray-11);
          font-size: 0.95rem;
        }
        .steps-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }
        .step-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .step-number {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }
        .step-number.active {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
        }
        .step-number.completed {
          background: #059669;
          color: white;
        }
        .step-number.inactive {
          background: var(--gray-a4);
          color: var(--gray-10);
        }
        .step-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--gray-11);
        }
        .step-label.active {
          color: var(--gray-12);
        }
        .step-connector {
          width: 50px;
          height: 2px;
          background: var(--gray-a5);
          margin: 0 0.25rem;
          transition: background 0.3s ease;
        }
        .step-connector.completed {
          background: #059669;
        }
        .form-card {
          background: var(--color-panel-solid);
          border: 1px solid var(--gray-a5);
          border-radius: 16px;
          padding: 1.75rem;
        }
        .link-section {
          text-align: center;
          margin-top: 1.5rem;
          padding: 1.25rem;
          background: var(--gray-a2);
          border-radius: 12px;
        }
        .link-text {
          color: var(--gray-11);
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }
        .link-action {
          color: var(--accent-9);
          font-size: 0.95rem;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .link-action:hover {
          color: var(--accent-10);
        }
        .footer {
          position: absolute;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          color: var(--gray-10);
          font-size: 0.75rem;
        }
        .theme-toggle {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 20;
        }
      `}</style>

      <div className="register-container">
        {/* Left Panel - Illustration */}
        <div className="left-panel">
          {/* Floating decorative icons */}
          <div className="floating-icon" style={{ top: "8%", left: "8%" }}>
            <Store size={44} />
          </div>
          <div className="floating-icon" style={{ top: "15%", right: "12%" }}>
            <CreditCard size={38} />
          </div>
          <div className="floating-icon" style={{ bottom: "20%", left: "15%" }}>
            <Smartphone size={40} />
          </div>
          <div className="floating-icon" style={{ bottom: "12%", right: "8%" }}>
            <Shield size={36} />
          </div>

          {/* Glow effects */}
          <div
            className="glow-circle"
            style={{ width: "300px", height: "300px", top: "-50px", right: "-50px" }}
          />
          <div
            className="glow-circle"
            style={{
              width: "350px",
              height: "350px",
              bottom: "-80px",
              left: "-80px",
              animationDelay: "2s",
            }}
          />

          {/* Hero Content */}
          <div className="hero-content">
            <div className="hero-logo">
              <Image
                src="/images/logos/ic-lg.webp"
                alt="Oréma N+"
                width={56}
                height={56}
                style={{ objectFit: "contain" }}
              />
            </div>
            <h1 className="hero-title">Lancez votre activité</h1>
            <p className="hero-subtitle">
              Rejoignez des centaines de commerçants qui font confiance à Oréma N+ pour gérer leur
              établissement
            </p>

            {/* Benefits List */}
            <div className="benefits-list">
              <div className="benefit-item">
                <div className="benefit-icon">
                  <Zap size={20} color="white" />
                </div>
                <div className="benefit-text">
                  <div className="benefit-title">Installation en 5 minutes</div>
                  <div className="benefit-desc">Configurez votre caisse et commencez à vendre</div>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">
                  <CreditCard size={20} color="white" />
                </div>
                <div className="benefit-text">
                  <div className="benefit-title">Tous les paiements</div>
                  <div className="benefit-desc">Espèces, cartes, Airtel Money, Moov Money</div>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">
                  <Clock size={20} color="white" />
                </div>
                <div className="benefit-text">
                  <div className="benefit-title">Support 24/7</div>
                  <div className="benefit-desc">Une équipe dédiée pour vous accompagner</div>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">
                  <Shield size={20} color="white" />
                </div>
                <div className="benefit-text">
                  <div className="benefit-title">Données sécurisées</div>
                  <div className="benefit-desc">
                    Vos informations sont protégées et sauvegardées
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Registration Form */}
        <div className="right-panel">
          <div className="theme-toggle">
            <ThemeToggle />
          </div>

          <div className="register-form-container">
            <div className="form-header">
              <div className="form-logo-mobile">
                <Image
                  src="/images/logos/ic-lg.webp"
                  alt="Oréma N+"
                  width={36}
                  height={36}
                  style={{ objectFit: "contain" }}
                />
              </div>
              <h2 className="form-title">Créer un compte</h2>
              <p className="form-subtitle">
                {step === 1
                  ? "Commencez par vos informations personnelles"
                  : "Configurez votre établissement"}
              </p>
            </div>

            {/* Steps Indicator */}
            <div className="steps-indicator">
              <div className="step-item">
                <div className={`step-number ${step === 1 ? "active" : "completed"}`}>
                  {step > 1 ? <CheckCircle2 size={18} /> : "1"}
                </div>
                <span className={`step-label ${step === 1 ? "active" : ""}`}>Compte</span>
              </div>
              <div className={`step-connector ${step > 1 ? "completed" : ""}`} />
              <div className="step-item">
                <div className={`step-number ${step === 2 ? "active" : "inactive"}`}>2</div>
                <span className={`step-label ${step === 2 ? "active" : ""}`}>Établissement</span>
              </div>
            </div>

            {/* Form Card */}
            <div className="form-card">
              {step === 1 ? (
                <RegisterStepUser
                  onSubmit={handleStepUserSubmit}
                  defaultValues={userData || undefined}
                  isLoading={isLoading}
                />
              ) : (
                <RegisterStepEtablissement
                  onSubmit={handleFinalSubmit}
                  onBack={handleBack}
                  userEmail={userData?.email}
                  isLoading={isLoading}
                />
              )}
            </div>

            {/* Login Link */}
            {step === 1 && (
              <div className="link-section">
                <p className="link-text">Vous avez déjà un compte ?</p>
                <Link href="/login" className="link-action">
                  Se connecter →
                </Link>
              </div>
            )}
          </div>

          <div className="footer">Oréma N+ POS System © 2026</div>
        </div>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageContent />
    </Suspense>
  );
}
