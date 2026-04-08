"use client";

/**
 * RotationHandle - Poignée de rotation libre style Illustrator/Figma
 *
 * Rendu au niveau du CANVAS (sibling de l'élément, PAS enfant)
 * pour éviter les problèmes de hit-testing avec CSS transform: rotate().
 *
 * La poignée tourne AVEC l'élément en utilisant une transformation
 * de coordonnées trigonométrique.
 */

import { ArrowClockwise } from "@phosphor-icons/react";

export interface RotationHandleProps {
  elementX: number;
  elementY: number;
  elementWidth: number;
  elementHeight: number;
  elementRotation: number;
  zoom: number;
  onRotationStart: (e: React.MouseEvent) => void;
  isRotating: boolean;
}

/** Distance en pixels entre le bord supérieur de l'élément et le centre de la poignée */
const HANDLE_OFFSET = 25;
/** Diamètre de la poignée en pixels */
const HANDLE_SIZE = 18;

export function RotationHandle({
  elementX,
  elementY,
  elementWidth,
  elementHeight,
  elementRotation,
  zoom,
  onRotationStart,
  isRotating,
}: RotationHandleProps) {
  const rotationRad = (elementRotation * Math.PI) / 180;

  // Centre de l'élément
  const centerX = elementX + elementWidth / 2;
  const centerY = elementY + elementHeight / 2;

  // Point d'ancrage : centre du bord supérieur (avant rotation)
  // Distance du centre au bord top = elementHeight / 2
  // Distance totale du centre à la poignée = elementHeight / 2 + HANDLE_OFFSET
  const totalOffset = elementHeight / 2 + HANDLE_OFFSET;

  // Position de la poignée en tenant compte de la rotation de l'élément
  // On fait tourner le point (0, -totalOffset) autour du centre
  const handleX = centerX + totalOffset * Math.sin(rotationRad);
  const handleY = centerY - totalOffset * Math.cos(rotationRad);

  // Point d'ancrage de la ligne : centre du bord supérieur (avec rotation)
  const edgeOffset = elementHeight / 2;
  const edgeX = centerX + edgeOffset * Math.sin(rotationRad);
  const edgeY = centerY - edgeOffset * Math.cos(rotationRad);

  // Taille ajustée au zoom pour que la poignée reste lisible
  const adjustedSize = HANDLE_SIZE / zoom;
  const halfSize = adjustedSize / 2;

  return (
    <>
      {/* Ligne de connexion entre le bord supérieur et la poignée */}
      <svg
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          overflow: "visible",
          zIndex: 99,
        }}
      >
        <line
          x1={edgeX}
          y1={edgeY}
          x2={handleX}
          y2={handleY}
          stroke="var(--accent-9)"
          strokeWidth={1 / zoom}
          strokeDasharray={`${3 / zoom} ${2 / zoom}`}
          opacity={0.7}
        />
      </svg>

      {/* Poignée de rotation (cercle interactif) */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRotationStart(e);
        }}
        style={{
          position: "absolute",
          left: handleX - halfSize,
          top: handleY - halfSize,
          width: adjustedSize,
          height: adjustedSize,
          borderRadius: "50%",
          backgroundColor: isRotating ? "var(--accent-11)" : "var(--accent-9)",
          border: `${2 / zoom}px solid white`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isRotating ? "grabbing" : "grab",
          zIndex: 100,
          boxShadow: isRotating
            ? "0 3px 10px rgba(0,0,0,0.4)"
            : "0 2px 6px rgba(0,0,0,0.25)",
          transition: isRotating ? "none" : "background-color 0.12s, box-shadow 0.12s",
          pointerEvents: "auto",
        }}
      >
        <ArrowClockwise
          size={Math.max(8, 10 / zoom)}
          color="white"
          weight="bold"
        />
      </div>

      {/* Badge d'angle affiché pendant la rotation */}
      {isRotating ? (
        <div
          style={{
            position: "absolute",
            left: handleX,
            top: handleY - adjustedSize - (12 / zoom),
            transform: "translateX(-50%)",
            padding: `${1 / zoom}px ${4 / zoom}px`,
            backgroundColor: "var(--gray-12)",
            color: "var(--gray-1)",
            fontSize: Math.max(9, 11 / zoom),
            fontWeight: 700,
            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            borderRadius: 3 / zoom,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            whiteSpace: "nowrap",
            zIndex: 101,
            pointerEvents: "none",
            letterSpacing: "-0.02em",
          }}
        >
          {Math.round(((elementRotation % 360) + 360) % 360)}°
        </div>
      ) : null}
    </>
  );
}
