"use client";

/**
 * Page de connexion par email et mot de passe
 * Design split-screen moderne avec illustration
 */

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Box, Button, Flex, Text, TextField, Separator } from "@radix-ui/themes";
import {
  LockIcon,
  MailIcon,
  AlertCircleIcon,
  UtensilsCrossed,
  ShoppingCart,
  BarChart3,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/schemas/auth";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getDefaultRedirectRoute } from "@/actions/auth-supabase";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      toast.success("Compte créé avec succès ! Connectez-vous pour accéder à votre établissement.");
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error("[Login] Supabase Auth error:", error.message);
        toast.error("Email ou mot de passe incorrect");
        setIsLoading(false);
      } else {
        toast.success("Connexion réussie");
        const redirectResult = await getDefaultRedirectRoute();
        const redirectPath =
          redirectResult.success && redirectResult.data ? redirectResult.data : "/caisse";
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 500);
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
      console.error("[Login] Unexpected error:", error);
      setIsLoading(false);
    }
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
        .login-container {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }
        .left-panel {
          flex: 1;
          display: none;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%);
        }
        @media (min-width: 1024px) {
          .left-panel {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 4rem;
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
            radial-gradient(circle at 20% 80%, rgba(251, 146, 60, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(254, 215, 170, 0.2) 0%, transparent 40%),
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
          color: rgba(255, 255, 255, 0.15);
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
          background: radial-gradient(circle, rgba(251, 146, 60, 0.4) 0%, transparent 70%);
          animation: pulse-glow 4s ease-in-out infinite;
        }
        .hero-content {
          position: relative;
          z-index: 10;
          text-align: center;
          max-width: 500px;
          animation: slide-up 0.8s ease-out;
        }
        .hero-logo {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .hero-title {
          font-family: var(--font-gabarito), system-ui, sans-serif;
          font-size: 3rem;
          font-weight: 700;
          color: white;
          margin-bottom: 1rem;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
          letter-spacing: -0.02em;
        }
        .hero-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 3rem;
          line-height: 1.6;
          font-weight: 300;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 2rem;
        }
        .feature-item {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
          text-align: left;
          transition: all 0.3s ease;
        }
        .feature-item:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }
        .feature-icon {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.75rem;
        }
        .feature-title {
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }
        .feature-desc {
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
        }
        @media (min-width: 1024px) {
          .right-panel {
            max-width: 600px;
          }
        }
        .login-form-container {
          width: 100%;
          max-width: 400px;
          animation: fade-in 0.6s ease-out;
          animation-delay: 0.2s;
          animation-fill-mode: both;
        }
        .form-header {
          text-align: center;
          margin-bottom: 2.5rem;
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
        .input-group {
          margin-bottom: 1.25rem;
        }
        .input-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--gray-12);
          margin-bottom: 0.5rem;
        }
        .submit-button {
          width: 100%;
          height: 48px;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
          margin-top: 0.5rem;
        }
        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
        }
        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }
        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .divider {
          display: flex;
          align-items: center;
          margin: 2rem 0;
          gap: 1rem;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--gray-a6);
        }
        .divider-text {
          color: var(--gray-10);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .link-section {
          text-align: center;
          padding: 1.25rem;
          background: var(--gray-a2);
          border-radius: 12px;
          margin-bottom: 1rem;
        }
        .link-section:last-child {
          margin-bottom: 0;
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
        }
      `}</style>

      <div className="login-container">
        {/* Left Panel - Illustration */}
        <div className="left-panel">
          {/* Floating decorative icons */}
          <div className="floating-icon" style={{ top: "10%", left: "10%" }}>
            <UtensilsCrossed size={48} />
          </div>
          <div className="floating-icon" style={{ top: "20%", right: "15%" }}>
            <ShoppingCart size={40} />
          </div>
          <div className="floating-icon" style={{ bottom: "25%", left: "20%" }}>
            <BarChart3 size={44} />
          </div>
          <div className="floating-icon" style={{ bottom: "15%", right: "10%" }}>
            <Users size={36} />
          </div>

          {/* Glow effects */}
          <div
            className="glow-circle"
            style={{ width: "300px", height: "300px", top: "-50px", right: "-50px" }}
          />
          <div
            className="glow-circle"
            style={{
              width: "400px",
              height: "400px",
              bottom: "-100px",
              left: "-100px",
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
                style={{ objectFit: "contain", width: "auto", height: "auto" }}
              />
            </div>
            <h1 className="hero-title">Oréma N+</h1>
            <p className="hero-subtitle">
              Le système de caisse moderne conçu pour les restaurants, bars et commerces du Gabon
            </p>

            {/* Features Grid */}
            <div className="feature-grid">
              <div className="feature-item">
                <div className="feature-icon">
                  <ShoppingCart size={18} color="white" />
                </div>
                <div className="feature-title">Caisse intuitive</div>
                <div className="feature-desc">Interface tactile optimisée</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <UtensilsCrossed size={18} color="white" />
                </div>
                <div className="feature-title">Gestion de salle</div>
                <div className="feature-desc">Plans de table interactifs</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <BarChart3 size={18} color="white" />
                </div>
                <div className="feature-title">Rapports détaillés</div>
                <div className="feature-desc">Statistiques en temps réel</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <Users size={18} color="white" />
                </div>
                <div className="feature-title">Multi-utilisateurs</div>
                <div className="feature-desc">Rôles et permissions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="right-panel">
          <div className="theme-toggle">
            <ThemeToggle />
          </div>

          <div className="login-form-container">
            <div className="form-header">
              <div className="form-logo-mobile">
                <Image
                  src="/images/logos/ic-lg.webp"
                  alt="Oréma N+"
                  width={36}
                  height={36}
                  style={{ objectFit: "contain", width: "auto", height: "auto" }}
                />
              </div>
              <h2 className="form-title">Connexion</h2>
              <p className="form-subtitle">Accédez à votre espace administrateur</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <div className="input-group">
                <label htmlFor="email" className="input-label">
                  Adresse email
                </label>
                <TextField.Root
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  autoComplete="email"
                  size="3"
                  {...register("email")}
                  disabled={isLoading}
                  style={{ width: "100%" }}
                >
                  <TextField.Slot side="left">
                    <MailIcon size={18} style={{ color: "var(--gray-9)" }} />
                  </TextField.Slot>
                </TextField.Root>
                {errors.email ? (
                  <Flex gap="1" align="center" mt="1">
                    <AlertCircleIcon size={14} color="var(--red-9)" />
                    <Text size="1" color="red">
                      {errors.email.message}
                    </Text>
                  </Flex>
                ) : null}
              </div>

              {/* Password */}
              <div className="input-group">
                <label htmlFor="password" className="input-label">
                  Mot de passe
                </label>
                <TextField.Root
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  size="3"
                  {...register("password")}
                  disabled={isLoading}
                  style={{ width: "100%" }}
                >
                  <TextField.Slot side="left">
                    <LockIcon size={18} style={{ color: "var(--gray-9)" }} />
                  </TextField.Slot>
                </TextField.Root>
                {errors.password ? (
                  <Flex gap="1" align="center" mt="1">
                    <AlertCircleIcon size={14} color="var(--red-9)" />
                    <Text size="1" color="red">
                      {errors.password.message}
                    </Text>
                  </Flex>
                ) : null}
              </div>

              {/* Submit Button */}
              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">ou</span>
              <div className="divider-line" />
            </div>

            {/* Links */}
            <div className="link-section">
              <p className="link-text">Vous êtes caissier ou serveur ?</p>
              <Link href="/login/pin" className="link-action">
                Connexion rapide par PIN →
              </Link>
            </div>

            <div className="link-section">
              <p className="link-text">Pas encore de compte ?</p>
              <Link href="/register" className="link-action">
                Créer mon établissement →
              </Link>
            </div>

          </div>

          <div className="footer">
            <Link href="/" style={{ color: "var(--accent-9)", textDecoration: "none", fontWeight: 500 }}>
              Découvrir la plateforme
            </Link>
            <span style={{ margin: "0 0.5rem" }}>·</span>
            Oréma N+ © 2026
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
