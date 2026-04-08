import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { SPRING_CONFIGS } from "../types";

interface CursorPoint {
  x: number;
  y: number;
}

interface AnimatedCursorProps {
  /** Points de passage du curseur */
  path: CursorPoint[];
  /** Position du clic (déclenche ripple + bounce) */
  clickAt?: CursorPoint;
  /** Frame à laquelle le clic se produit (relatif au début) */
  clickFrame?: number;
  /** Couleur du curseur et des effets */
  accentColor?: string;
}

// Interpolation cubique de Bézier entre 4 points de contrôle
function cubicBezier(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number
): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

// Calcule la position sur une courbe de Bézier à travers plusieurs points
function getPositionOnPath(
  points: CursorPoint[],
  progress: number
): CursorPoint {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];

  const clampedProgress = Math.max(0, Math.min(1, progress));

  if (points.length === 2) {
    // Ajouter un léger arc pour éviter le mouvement linéaire
    const midX = (points[0].x + points[1].x) / 2;
    const midY = (points[0].y + points[1].y) / 2;
    const offsetX = (points[1].y - points[0].y) * 0.15;
    const offsetY = -(points[1].x - points[0].x) * 0.15;

    const t = clampedProgress;
    return {
      x: cubicBezier(t, points[0].x, midX + offsetX, midX + offsetX, points[1].x),
      y: cubicBezier(t, points[0].y, midY + offsetY, midY + offsetY, points[1].y),
    };
  }

  // Pour 3+ points : passer par chaque segment avec courbe
  const segments = points.length - 1;
  const segmentProgress = clampedProgress * segments;
  const segmentIndex = Math.min(Math.floor(segmentProgress), segments - 1);
  const t = segmentProgress - segmentIndex;

  const p0 = points[segmentIndex];
  const p3 = points[segmentIndex + 1];

  // Points de contrôle pour courbe lisse
  const prev = points[Math.max(0, segmentIndex - 1)];
  const next = points[Math.min(points.length - 1, segmentIndex + 2)];

  const cp1: CursorPoint = {
    x: p0.x + (p3.x - prev.x) * 0.25,
    y: p0.y + (p3.y - prev.y) * 0.25,
  };
  const cp2: CursorPoint = {
    x: p3.x - (next.x - p0.x) * 0.25,
    y: p3.y - (next.y - p0.y) * 0.25,
  };

  return {
    x: cubicBezier(t, p0.x, cp1.x, cp2.x, p3.x),
    y: cubicBezier(t, p0.y, cp1.y, cp2.y, p3.y),
  };
}

// Forme SVG du curseur (style macOS/Windows)
const CursorSVG: React.FC<{ color: string; glowing: boolean }> = ({
  color,
  glowing,
}) => (
  <svg
    width="28"
    height="34"
    viewBox="0 0 28 34"
    fill="none"
    style={{
      filter: glowing
        ? `drop-shadow(0 0 8px ${color}80) drop-shadow(0 2px 4px rgba(0,0,0,0.5))`
        : "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
      transition: "filter 0.15s",
    }}
  >
    <path
      d="M2 1L2 26.5L8.5 20L14 31L19 28.5L13.5 18L22 18L2 1Z"
      fill="white"
      stroke="#1a1a1a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const AnimatedCursor: React.FC<AnimatedCursorProps> = ({
  path,
  clickAt,
  clickFrame = -1,
  accentColor = "#f97316",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  if (path.length === 0) return null;

  // Conversion des coordonnées % (0-100) en pixels
  const toPixel = (pt: CursorPoint): CursorPoint => ({
    x: (pt.x / 100) * width,
    y: (pt.y / 100) * height,
  });

  const pixelPath = path.map(toPixel);
  const pixelClickAt = clickAt ? toPixel(clickAt) : undefined;

  // Durée du mouvement : 70% de la durée totale
  const moveDuration = Math.floor(durationInFrames * 0.7);
  const moveStartFrame = Math.floor(durationInFrames * 0.05);

  // Progression du mouvement avec easing
  const rawMoveProgress = interpolate(
    frame,
    [moveStartFrame, moveStartFrame + moveDuration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }
  );

  // Appliquer un spring pour adoucir le départ/arrêt
  const moveSpring = spring({
    frame: frame - moveStartFrame,
    fps,
    config: SPRING_CONFIGS.cursor,
    durationInFrames: moveDuration,
  });

  const moveProgress = rawMoveProgress * 0.6 + moveSpring * 0.4;
  const position = getPositionOnPath(pixelPath, Math.min(moveProgress, 1));

  // Animation de clic
  const isClicking = clickFrame > 0 && frame >= clickFrame;
  const clickAge = isClicking ? frame - clickFrame : -10;

  const clickBounce = isClicking
    ? spring({
        frame: clickAge,
        fps,
        config: { damping: 8, stiffness: 300 },
      })
    : 0;

  const cursorScale = isClicking
    ? interpolate(clickBounce, [0, 0.5, 1], [1, 0.85, 1])
    : 1;

  // Ripple effect au clic
  const rippleProgress = isClicking
    ? spring({
        frame: clickAge,
        fps,
        config: { damping: 20, stiffness: 100 },
      })
    : 0;

  const rippleScale = interpolate(rippleProgress, [0, 1], [0, 3]);
  const rippleOpacity = interpolate(rippleProgress, [0, 0.3, 1], [0.6, 0.3, 0]);

  // Glow au hover (quand le curseur est stationnaire)
  const isStationary = moveProgress >= 0.98 || moveProgress <= 0.02;

  // Micro-mouvement de respiration
  const breatheX =
    Math.sin(frame * 0.08) * 1.5 * (isStationary ? 1 : 0.3);
  const breatheY =
    Math.cos(frame * 0.06) * 1 * (isStationary ? 1 : 0.3);

  // Trail (traînée) : positions précédentes
  const trailCount = 5;
  const trailPositions: CursorPoint[] = [];
  for (let i = 1; i <= trailCount; i++) {
    const trailProgress = Math.max(
      0,
      moveProgress - i * 0.015
    );
    trailPositions.push(getPositionOnPath(pixelPath, Math.min(trailProgress, 1)));
  }

  // Position du clic (convertie en pixels) ou position actuelle du curseur
  const clickPosition = pixelClickAt || position;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Trail / traînée */}
      {trailPositions.map((pos, i) => {
        const trailOpacity = interpolate(
          i,
          [0, trailCount],
          [0.2, 0],
        );
        // Cacher le trail quand le curseur ne bouge pas
        const movingAmount = Math.abs(moveProgress - (moveProgress - 0.01));
        const trailVisible = rawMoveProgress > 0.02 && rawMoveProgress < 0.98;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pos.x - 4,
              top: pos.y - 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: accentColor,
              opacity: trailVisible ? trailOpacity : 0,
              transform: `scale(${1 - i * 0.15})`,
            }}
          />
        );
      })}

      {/* Ripple effect au clic */}
      {isClicking && (
        <>
          <div
            style={{
              position: "absolute",
              left: clickPosition.x - 20,
              top: clickPosition.y - 20,
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: `2px solid ${accentColor}`,
              opacity: rippleOpacity,
              transform: `scale(${rippleScale})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: clickPosition.x - 20,
              top: clickPosition.y - 20,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: `${accentColor}30`,
              opacity: rippleOpacity * 0.5,
              transform: `scale(${rippleScale * 0.7})`,
            }}
          />
        </>
      )}

      {/* Curseur principal */}
      <div
        style={{
          position: "absolute",
          left: position.x + breatheX,
          top: position.y + breatheY,
          transform: `scale(${cursorScale})`,
          transformOrigin: "top left",
          zIndex: 9999,
        }}
      >
        <CursorSVG color={accentColor} glowing={isStationary} />
      </div>
    </AbsoluteFill>
  );
};
