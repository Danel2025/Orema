import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
  Easing,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont } from "@remotion/google-fonts/Gabarito";
import type { DocVideoConfig, VideoStep } from "../types";
import { COLORS } from "../types";
import { AnimatedCursor } from "../components/AnimatedCursor";
import { BrowserFrame } from "../components/BrowserFrame";
import { StepAnnotation } from "../components/StepAnnotation";
import { ZoomHighlight } from "../components/ZoomHighlight";
import { DocVideoIntro } from "../components/DocVideoIntro";
import { DocVideoOutro } from "../components/DocVideoOutro";

const { fontFamily: gabarito } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

// Durées en secondes
const INTRO_DURATION_S = 2.5;
const OUTRO_DURATION_S = 3.5;
const TRANSITION_DURATION_S = 0.5;

interface DocVideoTemplateProps {
  config: DocVideoConfig;
}

// Composant pour une étape individuelle
const StepScene: React.FC<{
  step: VideoStep;
  stepIndex: number;
  totalSteps: number;
  accentColor: string;
}> = ({ step, stepIndex, totalSteps, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const content = (
    <AbsoluteFill>
      {/* Browser frame avec screenshot */}
      <BrowserFrame
        screenshotSrc={step.screenshot}
        accentColor={accentColor}
        animateUrl={stepIndex === 0}
      />

      {/* Curseur animé */}
      {step.cursorPath.length > 0 && (
        <AnimatedCursor
          path={step.cursorPath}
          clickAt={step.clickAt}
          clickFrame={step.clickAt ? Math.floor(step.duration * 0.6) : undefined}
          accentColor={accentColor}
        />
      )}

      {/* Annotation */}
      {step.annotation && (
        <StepAnnotation
          stepNumber={stepIndex + 1}
          text={step.annotation.text}
          position={step.annotation.position}
          arrow={step.annotation.arrow}
          arrowTarget={step.clickAt}
          accentColor={accentColor}
        />
      )}
    </AbsoluteFill>
  );

  // Avec ou sans zoom
  if (step.zoomTo) {
    return (
      <ZoomHighlight
        target={{ x: step.zoomTo.x, y: step.zoomTo.y }}
        scale={step.zoomTo.scale}
        zoomInFrame={Math.floor(step.duration * 0.2)}
        zoomOutFrame={step.duration - Math.floor(fps * 0.5)}
        accentColor={accentColor}
      >
        {content}
      </ZoomHighlight>
    );
  }

  return content;
};

// Barre de progression en bas
const ProgressBar: React.FC<{
  currentStep: number;
  totalSteps: number;
  accentColor: string;
}> = ({ currentStep, totalSteps, accentColor }) => {
  const frame = useCurrentFrame();

  const progress = (currentStep + 1) / totalSteps;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        background: "rgba(255,255,255,0.08)",
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress * 100}%`,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
          borderRadius: "0 2px 2px 0",
          boxShadow: `0 0 15px ${accentColor}40`,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
};

// Indicateur d'étape en haut à droite
const StepIndicator: React.FC<{
  currentStep: number;
  totalSteps: number;
  accentColor: string;
}> = ({ currentStep, totalSteps, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterOpacity = interpolate(frame, [5, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 24,
        right: 24,
        opacity: enterOpacity,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(10, 10, 20, 0.7)",
        backdropFilter: "blur(12px)",
        borderRadius: 10,
        padding: "8px 14px",
        border: "1px solid rgba(255,255,255,0.08)",
        zIndex: 100,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: accentColor,
          fontFamily: gabarito,
        }}
      >
        {currentStep + 1}
      </span>
      <span
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.3)",
          fontFamily: gabarito,
        }}
      >
        /
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "rgba(255,255,255,0.5)",
          fontFamily: gabarito,
        }}
      >
        {totalSteps}
      </span>
    </div>
  );
};

// Template principal
export const DocVideoTemplate: React.FC<DocVideoTemplateProps> = ({
  config,
}) => {
  const { fps } = useVideoConfig();

  const accentColor = config.accentColor || COLORS.orange;
  const introDuration = Math.round(INTRO_DURATION_S * fps);
  const outroDuration = Math.round(OUTRO_DURATION_S * fps);
  const transitionDuration = Math.round(TRANSITION_DURATION_S * fps);

  const totalSteps = config.steps.length;

  return (
    <AbsoluteFill style={{ background: COLORS.darkBg }}>
      <TransitionSeries>
        {/* Intro */}
        <TransitionSeries.Sequence durationInFrames={introDuration}>
          <DocVideoIntro
            title={config.title}
            subtitle={config.subtitle}
            category={config.category}
            categoryIcon={config.categoryIcon}
            accentColor={accentColor}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Étapes */}
        {config.steps.map((step, index) => (
          <React.Fragment key={index}>
            <TransitionSeries.Sequence durationInFrames={step.duration}>
              <AbsoluteFill>
                <StepScene
                  step={step}
                  stepIndex={index}
                  totalSteps={totalSteps}
                  accentColor={accentColor}
                />
                <StepIndicator
                  currentStep={index}
                  totalSteps={totalSteps}
                  accentColor={accentColor}
                />
                <ProgressBar
                  currentStep={index}
                  totalSteps={totalSteps}
                  accentColor={accentColor}
                />
              </AbsoluteFill>
            </TransitionSeries.Sequence>

            {/* Transition entre étapes, et avant l'outro */}
            <TransitionSeries.Transition
              presentation={fade()}
              timing={linearTiming({ durationInFrames: transitionDuration })}
            />
          </React.Fragment>
        ))}

        {/* Outro */}
        <TransitionSeries.Sequence durationInFrames={outroDuration}>
          <DocVideoOutro accentColor={accentColor} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

// Fonction utilitaire pour calculer la durée totale d'une vidéo en frames
export function calculateDocVideoDuration(
  config: DocVideoConfig,
  fps: number
): number {
  const introDuration = Math.round(INTRO_DURATION_S * fps);
  const outroDuration = Math.round(OUTRO_DURATION_S * fps);
  const transitionDuration = Math.round(TRANSITION_DURATION_S * fps);

  const stepsDuration = config.steps.reduce(
    (sum, step) => sum + step.duration,
    0
  );

  // Transitions : intro->step1 + entre chaque step + lastStep->outro
  const transitionsCount = config.steps.length + 1;
  const totalTransitions = transitionsCount * transitionDuration;

  return introDuration + stepsDuration + outroDuration + totalTransitions;
}
