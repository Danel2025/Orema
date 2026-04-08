"use client";

/**
 * SmartGuides - Renders alignment guide lines on the floor plan canvas
 *
 * Displays thin colored lines when a dragged element aligns with other elements:
 * - Cyan (#00D4FF) for edge alignment (left, right, top, bottom)
 * - Magenta (#FF00FF) for center alignment (center-x, center-y)
 *
 * Lines span the full canvas and appear above elements but below handles.
 */

import { type AlignmentGuide, GUIDE_COLOR_EDGE, GUIDE_COLOR_CENTER } from "@/lib/floorplan/smart-guides";

interface SmartGuidesProps {
  guides: AlignmentGuide[];
  zoom: number;
  pan: { x: number; y: number };
  canvasWidth: number;
  canvasHeight: number;
}

function getGuideColor(alignType: AlignmentGuide["alignType"]): string {
  if (alignType === "center-x" || alignType === "center-y") {
    return GUIDE_COLOR_CENTER;
  }
  return GUIDE_COLOR_EDGE;
}

export function SmartGuides({ guides, zoom, pan, canvasWidth, canvasHeight }: SmartGuidesProps) {
  if (guides.length === 0) return null;

  // The SVG covers the entire canvas area and applies the same zoom/pan transform
  // so guide positions match element positions in canvas space
  const viewWidth = canvasWidth / zoom;
  const viewHeight = canvasHeight / zoom;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: canvasWidth,
        height: canvasHeight,
        pointerEvents: "none",
        zIndex: 50,
        overflow: "visible",
      }}
    >
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {guides.map((guide, i) => {
          const color = getGuideColor(guide.alignType);

          if (guide.type === "vertical") {
            return (
              <line
                key={`v-${guide.position}-${guide.alignType}-${i}`}
                x1={guide.position}
                y1={0}
                x2={guide.position}
                y2={viewHeight}
                stroke={color}
                strokeWidth={1 / zoom}
                opacity={0.8}
              />
            );
          }

          // horizontal
          return (
            <line
              key={`h-${guide.position}-${guide.alignType}-${i}`}
              x1={0}
              y1={guide.position}
              x2={viewWidth}
              y2={guide.position}
              stroke={color}
              strokeWidth={1 / zoom}
              opacity={0.8}
            />
          );
        })}
      </g>
    </svg>
  );
}
