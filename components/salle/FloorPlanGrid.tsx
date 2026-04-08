"use client";

/**
 * FloorPlanGrid - Renders a dot grid on the floor plan canvas
 *
 * Uses CSS background-image with radial-gradient for performance:
 * no individual DOM elements, just a repeating pattern.
 *
 * The grid follows zoom and pan transforms and is only visible
 * when snap-to-grid is enabled in edit mode.
 */

interface FloorPlanGridProps {
  gridSize: number;
  zoom: number;
  pan: { x: number; y: number };
  canvasWidth: number;
  canvasHeight: number;
  visible: boolean;
}

export function FloorPlanGrid({
  gridSize,
  zoom,
  pan,
  canvasWidth,
  canvasHeight,
  visible,
}: FloorPlanGridProps) {
  if (!visible) return null;

  // Scaled grid size accounting for zoom
  const scaledSize = gridSize * zoom;

  // Dot size scales with zoom but stays subtle (1-2px visual)
  const dotSize = Math.max(1, 1.5 * zoom);

  // Offset the pattern to follow panning
  const offsetX = pan.x % scaledSize;
  const offsetY = pan.y % scaledSize;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: canvasWidth,
        height: canvasHeight,
        pointerEvents: "none",
        zIndex: 1,
        backgroundImage: `radial-gradient(circle, var(--gray-8) ${dotSize}px, transparent ${dotSize}px)`,
        backgroundSize: `${scaledSize}px ${scaledSize}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
        opacity: 0.25,
      }}
    />
  );
}
