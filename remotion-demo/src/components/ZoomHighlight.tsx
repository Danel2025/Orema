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

interface ZoomHighlightProps {
  /** Position cible du zoom (x, y en POURCENTAGE 0-100) */
  target: { x: number; y: number };
  /** Niveau de zoom (ex: 2 = 200%) */
  scale: number;
  /** Frame de début du zoom (relatif au composant) */
  zoomInFrame?: number;
  /** Frame de fin du zoom (retour au plan large) */
  zoomOutFrame?: number;
  /** Couleur d'accent pour le glow */
  accentColor?: string;
  /** Enfants (le contenu à zoomer, typiquement un BrowserFrame) */
  children: React.ReactNode;
}

export const ZoomHighlight: React.FC<ZoomHighlightProps> = ({
  target,
  scale,
  zoomInFrame = 10,
  zoomOutFrame,
  accentColor = COLORS.orange,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Conversion des coordonnées % (0-100) en pixels
  const targetPx = {
    x: (target.x / 100) * width,
    y: (target.y / 100) * height,
  };

  const effectiveZoomOut = zoomOutFrame ?? durationInFrames - 15;

  // Phase de zoom in
  const zoomInProgress = spring({
    frame: frame - zoomInFrame,
    fps,
    config: { damping: 16, stiffness: 80 },
  });

  // Phase de zoom out
  const zoomOutProgress = spring({
    frame: frame - effectiveZoomOut,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  // Interpolation du scale
  const currentScale = interpolate(
    zoomInProgress - zoomOutProgress,
    [0, 1],
    [1, scale]
  );

  // Interpolation du translate pour centrer sur la cible
  const centerX = width / 2;
  const centerY = height / 2;

  const translateX = interpolate(
    zoomInProgress - zoomOutProgress,
    [0, 1],
    [0, (centerX - targetPx.x) * (scale - 1)]
  );

  const translateY = interpolate(
    zoomInProgress - zoomOutProgress,
    [0, 1],
    [0, (centerY - targetPx.y) * (scale - 1)]
  );

  // Overlay sombre (spotlight effect)
  const overlayOpacity = interpolate(
    zoomInProgress - zoomOutProgress,
    [0, 1],
    [0, 0.5]
  );

  // Glow animé autour de la zone ciblée
  const glowPulse = interpolate(
    frame,
    [zoomInFrame, zoomInFrame + 30, zoomInFrame + 60],
    [0, 1, 0.7],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "extend",
    }
  );

  const isZoomed = zoomInProgress > 0.1 && zoomOutProgress < 0.9;

  // Taille de la zone highlight
  const highlightWidth = (width / scale) * 0.9;
  const highlightHeight = (height / scale) * 0.9;

  return (
    <AbsoluteFill>
      {/* Contenu zoomé */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${currentScale}) translate(${translateX / currentScale}px, ${translateY / currentScale}px)`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>

      {/* Overlay spotlight */}
      {isZoomed && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
          }}
        >
          {/* Overlay sombre */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse ${highlightWidth}px ${highlightHeight}px at ${targetPx.x * (currentScale) + translateX}px ${targetPx.y * (currentScale) + translateY}px, transparent 40%, rgba(0,0,0,${overlayOpacity}) 100%)`,
            }}
          />

          {/* Glow border autour de la zone */}
          <div
            style={{
              position: "absolute",
              left: targetPx.x * currentScale + translateX - highlightWidth / 2,
              top: targetPx.y * currentScale + translateY - highlightHeight / 2,
              width: highlightWidth,
              height: highlightHeight,
              borderRadius: 16,
              border: `2px solid ${accentColor}${Math.floor(glowPulse * 80)
                .toString(16)
                .padStart(2, "0")}`,
              boxShadow: `0 0 ${30 * glowPulse}px ${accentColor}${Math.floor(
                glowPulse * 40
              )
                .toString(16)
                .padStart(2, "0")}, inset 0 0 ${20 * glowPulse}px ${accentColor}${Math.floor(
                glowPulse * 15
              )
                .toString(16)
                .padStart(2, "0")}`,
              pointerEvents: "none",
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
