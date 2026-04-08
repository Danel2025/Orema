import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { COLORS, SPRING_CONFIGS } from "../types";

interface StepAnnotationProps {
  /** Numéro de l'étape */
  stepNumber: number;
  /** Texte de l'annotation */
  text: string;
  /** Position de l'annotation sur l'écran */
  position: "top" | "bottom" | "left" | "right";
  /** Afficher une flèche pointant vers la cible */
  arrow?: boolean;
  /** Position cible de la flèche (x, y en POURCENTAGE 0-100) */
  arrowTarget?: { x: number; y: number };
  /** Position de l'annotation (x, y en pixels) */
  annotationPosition?: { x: number; y: number };
  /** Couleur d'accent */
  accentColor?: string;
}

// Animation typewriter : affiche le texte caractère par caractère
function useTypewriter(text: string, startFrame: number, speed: number = 1.5) {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const charsToShow = Math.floor(elapsed / speed);
  return text.substring(0, Math.min(charsToShow, text.length));
}

export const StepAnnotation: React.FC<StepAnnotationProps> = ({
  stepNumber,
  text,
  position,
  arrow = false,
  arrowTarget,
  annotationPosition,
  accentColor = COLORS.orange,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Conversion des coordonnées % (0-100) en pixels pour arrowTarget
  const arrowTargetPx = arrowTarget
    ? { x: (arrowTarget.x / 100) * width, y: (arrowTarget.y / 100) * height }
    : undefined;

  // Animation d'entrée
  const enterSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.enter,
  });

  // Animation de sortie (dernières 10 frames)
  const exitStart = durationInFrames - 10;
  const exitOpacity = interpolate(frame, [exitStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  // Slide direction selon la position
  const slideDirections = {
    top: { x: 0, y: -30 },
    bottom: { x: 0, y: 30 },
    left: { x: -30, y: 0 },
    right: { x: 30, y: 0 },
  };

  const slideDir = slideDirections[position];
  const slideX = interpolate(enterSpring, [0, 1], [slideDir.x, 0]);
  const slideY = interpolate(enterSpring, [0, 1], [slideDir.y, 0]);
  const enterOpacity = interpolate(enterSpring, [0, 1], [0, 1]);

  // Typewriter text
  const displayedText = useTypewriter(text, 12, 1.2);

  // Entrée animée du numéro d'étape
  const numberScale = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.bounce,
  });

  // Position par défaut selon la direction (adaptée au viewport)
  const defaultPositions = {
    top: { x: width * 0.5, y: height * 0.08 },
    bottom: { x: width * 0.5, y: height * 0.88 },
    left: { x: width * 0.15, y: height * 0.5 },
    right: { x: width * 0.85, y: height * 0.5 },
  };

  const pos = annotationPosition || defaultPositions[position];

  // Micro-animation de respiration
  const breathe = Math.sin(frame * 0.05) * 2;

  // Flèche SVG animée
  const arrowDashOffset = interpolate(frame, [8, 30], [200, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const arrowOpacity = interpolate(frame, [8, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Flèche animée */}
      {arrow && arrowTargetPx && (
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: arrowOpacity * exitOpacity,
          }}
        >
          <defs>
            <marker
              id={`arrowhead-${stepNumber}`}
              markerWidth="10"
              markerHeight="8"
              refX="9"
              refY="4"
              orient="auto"
            >
              <polygon
                points="0 0, 10 4, 0 8"
                fill={accentColor}
              />
            </marker>
          </defs>
          <path
            d={`M ${pos.x} ${pos.y} Q ${(pos.x + arrowTargetPx.x) / 2} ${
              Math.min(pos.y, arrowTargetPx.y) - 40
            } ${arrowTargetPx.x} ${arrowTargetPx.y}`}
            stroke={accentColor}
            strokeWidth="2"
            fill="none"
            strokeDasharray="200"
            strokeDashoffset={arrowDashOffset}
            markerEnd={`url(#arrowhead-${stepNumber})`}
            opacity="0.9"
          />
        </svg>
      )}

      {/* Annotation card */}
      <div
        style={{
          position: "absolute",
          left: pos.x - 160,
          top: pos.y - 30 + breathe,
          opacity: enterOpacity * exitOpacity,
          transform: `translate(${slideX}px, ${slideY}px)`,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Numéro d'étape */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 20,
            fontWeight: 800,
            color: "white",
            fontFamily:
              'Gabarito, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            transform: `scale(${numberScale})`,
            boxShadow: `0 4px 20px ${accentColor}60, 0 0 0 2px ${accentColor}30`,
            flexShrink: 0,
          }}
        >
          {stepNumber}
        </div>

        {/* Texte */}
        <div
          style={{
            background: "rgba(10, 10, 20, 0.85)",
            backdropFilter: "blur(20px)",
            borderRadius: 14,
            padding: "12px 20px",
            border: `1px solid ${accentColor}30`,
            boxShadow: `0 10px 40px rgba(0,0,0,0.4), 0 0 20px ${accentColor}10`,
            maxWidth: 420,
          }}
        >
          <span
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "white",
              fontFamily:
                'Gabarito, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              lineHeight: 1.4,
            }}
          >
            {displayedText}
            {displayedText.length < text.length && (
              <span
                style={{
                  opacity: Math.sin(frame * 0.4) > 0 ? 1 : 0,
                  color: accentColor,
                }}
              >
                |
              </span>
            )}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
