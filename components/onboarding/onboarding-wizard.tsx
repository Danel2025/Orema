"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Box, Flex, Text, Button } from "@radix-ui/themes";
import { ArrowRight, ArrowLeft, X } from "@phosphor-icons/react";
import { onboardingSlides } from "./slides";

const STORAGE_KEY = "orema_onboarded";

const slideTransition = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function OnboardingWizard() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      router.replace("/login");
    } else {
      setIsReady(true);
    }
  }, [router]);

  const totalSlides = onboardingSlides.length;
  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === totalSlides - 1;

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    router.replace("/register");
  }, [router]);

  const goNext = useCallback(() => {
    if (isLastSlide) {
      completeOnboarding();
      return;
    }
    setDirection(1);
    setCurrentIndex((prev) => prev + 1);
  }, [isLastSlide, completeOnboarding]);

  const goPrev = useCallback(() => {
    if (isFirstSlide) return;
    setDirection(-1);
    setCurrentIndex((prev) => prev - 1);
  }, [isFirstSlide]);

  const skip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  if (!isReady) return null;

  const CurrentSlideComponent = onboardingSlides[currentIndex].component;

  return (
    <>
      <style>{`
        .onboarding-root {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          background: var(--color-background);
          overflow: hidden;
          z-index: 50;
        }
        .onboarding-root::before {
          content: '';
          position: absolute;
          top: -40%;
          right: -20%;
          width: 60%;
          height: 80%;
          border-radius: 50%;
          background: radial-gradient(circle, var(--accent-a3) 0%, transparent 70%);
          pointer-events: none;
        }
        .onboarding-root::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -15%;
          width: 50%;
          height: 70%;
          border-radius: 50%;
          background: radial-gradient(circle, var(--accent-a2) 0%, transparent 70%);
          pointer-events: none;
        }
        .onboarding-header {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: flex-end;
          padding: 1.25rem 1.5rem;
        }
        .onboarding-skip {
          background: none;
          border: none;
          color: var(--gray-9);
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: color 0.2s ease, background 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        .onboarding-skip:hover {
          color: var(--gray-11);
          background: var(--gray-a3);
        }
        .onboarding-content {
          position: relative;
          z-index: 5;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .onboarding-slide-wrapper {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .onboarding-footer {
          position: relative;
          z-index: 10;
          padding: 1.5rem 2rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }
        .onboarding-dots {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: center;
        }
        .onboarding-dot {
          border-radius: 50%;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          cursor: pointer;
          border: none;
          padding: 0;
        }
        .onboarding-dot--active {
          width: 12px;
          height: 12px;
          background: var(--accent-9);
        }
        .onboarding-dot--inactive {
          width: 8px;
          height: 8px;
          background: var(--gray-a5);
        }
        .onboarding-dot--inactive:hover {
          background: var(--gray-a7);
        }
        .onboarding-nav {
          display: flex;
          gap: 0.75rem;
          width: 100%;
          max-width: 420px;
          justify-content: center;
        }
        .onboarding-btn-prev {
          flex: 1;
          max-width: 180px;
          height: 48px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: transparent;
          border: 1.5px solid var(--gray-a6);
          color: var(--gray-11);
          transition: all 0.2s ease;
        }
        .onboarding-btn-prev:hover {
          border-color: var(--gray-a8);
          background: var(--gray-a2);
        }
        .onboarding-btn-next {
          flex: 1;
          max-width: 240px;
          height: 48px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: var(--accent-9);
          border: none;
          color: white;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px var(--accent-a5);
        }
        .onboarding-btn-next:hover {
          background: var(--accent-10);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px var(--accent-a6);
        }
        .onboarding-btn-next:active {
          transform: translateY(0);
        }
      `}</style>

      <div className="onboarding-root">
        {/* Header with skip button */}
        <div className="onboarding-header">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <button
              type="button"
              className="onboarding-skip"
              onClick={skip}
              aria-label="Passer l'introduction"
            >
              Passer
              <X size={16} weight="bold" />
            </button>
          </motion.div>
        </div>

        {/* Slide content */}
        <div className="onboarding-content">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={onboardingSlides[currentIndex].id}
              className="onboarding-slide-wrapper"
              initial={{ x: direction * 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -100, opacity: 0 }}
              transition={slideTransition}
            >
              <CurrentSlideComponent />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer: dots + navigation */}
        <div className="onboarding-footer">
          {/* Progress dots */}
          <div className="onboarding-dots" role="tablist" aria-label="Étapes de l'introduction">
            {onboardingSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={`onboarding-dot ${
                  index === currentIndex ? "onboarding-dot--active" : "onboarding-dot--inactive"
                }`}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                role="tab"
                aria-selected={index === currentIndex}
                aria-label={`Étape ${index + 1} sur ${totalSlides}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="onboarding-nav">
            <AnimatePresence>
              {!isFirstSlide && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ flex: 1, maxWidth: 180 }}
                >
                  <button
                    type="button"
                    className="onboarding-btn-prev"
                    onClick={goPrev}
                    aria-label="Slide précédent"
                    style={{ width: "100%" }}
                  >
                    <ArrowLeft size={18} weight="bold" />
                    Précédent
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              layout
              transition={{ duration: 0.2 }}
              style={{ flex: 1, maxWidth: isLastSlide ? 240 : 240 }}
            >
              <button
                type="button"
                className="onboarding-btn-next"
                onClick={goNext}
                aria-label={isLastSlide ? "Commencer" : "Slide suivant"}
                style={{ width: "100%" }}
              >
                {isLastSlide ? "Commencer" : "Suivant"}
                <ArrowRight size={18} weight="bold" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
