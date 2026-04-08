import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Img,
  staticFile,
} from "remotion";
import { COLORS, SPRING_CONFIGS } from "../types";

interface BrowserFrameProps {
  /** URL affichée dans la barre d'adresse */
  url?: string;
  /** Chemin vers le screenshot affiché dans le browser */
  screenshotSrc?: string;
  /** Enfants rendus à la place du screenshot */
  children?: React.ReactNode;
  /** Activer l'animation de typing pour l'URL */
  animateUrl?: boolean;
  /** Couleur d'accent */
  accentColor?: string;
}

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  url = "app.orema-nplus.ga",
  screenshotSrc,
  children,
  animateUrl = true,
  accentColor = COLORS.orange,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation d'entrée du frame
  const enterScale = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.enterSoft,
  });

  const frameScale = interpolate(enterScale, [0, 1], [0.95, 1]);
  const frameOpacity = interpolate(enterScale, [0, 1], [0, 1]);

  // Typing animation pour l'URL
  const urlLength = url.length;
  const typingProgress = animateUrl
    ? interpolate(frame, [10, 10 + urlLength * 1.5], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : 1;

  const displayedUrl = url.substring(
    0,
    Math.floor(typingProgress * urlLength)
  );

  // Blink du curseur texte
  const cursorBlink = typingProgress < 1
    ? 1
    : Math.sin(frame * 0.3) > 0
    ? 1
    : 0;

  // Reflet glass en haut
  const reflectX = interpolate(frame, [0, 60], [-100, 200], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
        transform: `scale(${frameScale})`,
        opacity: frameOpacity,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 16,
          overflow: "hidden",
          background: "#1e1e2e",
          boxShadow: `0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08), 0 0 60px ${accentColor}15`,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Barre de titre */}
        <div
          style={{
            height: 52,
            background: "linear-gradient(180deg, #2a2a3e 0%, #242438 100%)",
            display: "flex",
            alignItems: "center",
            paddingLeft: 20,
            paddingRight: 20,
            gap: 12,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {/* Reflet glass */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: reflectX,
              width: 80,
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
              transform: "skewX(-15deg)",
            }}
          />

          {/* Traffic lights */}
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#ff5f57",
                boxShadow: "0 0 6px #ff5f5740",
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#ffbd2e",
                boxShadow: "0 0 6px #ffbd2e40",
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#28c840",
                boxShadow: "0 0 6px #28c84040",
              }}
            />
          </div>

          {/* Onglet actif */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: "6px 14px",
              marginLeft: 12,
            }}
          >
            {/* Favicon Oréma (mini coeur) */}
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: `linear-gradient(135deg, ${accentColor}, ${COLORS.orangeDark})`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 8,
                fontWeight: 900,
                color: "white",
              }}
            >
              O
            </div>
            <span
              style={{
                fontSize: 12,
                color: "#a0a0b8",
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                whiteSpace: "nowrap",
              }}
            >
              Orema N+
            </span>
          </div>

          {/* Barre d'adresse */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: 8,
                padding: "6px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 300,
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {/* Cadenas HTTPS */}
              <svg
                width="12"
                height="14"
                viewBox="0 0 12 14"
                fill="none"
              >
                <rect
                  x="1"
                  y="6"
                  width="10"
                  height="7"
                  rx="2"
                  fill="#28c840"
                  opacity="0.8"
                />
                <path
                  d="M3 6V4C3 2.34 4.34 1 6 1C7.66 1 9 2.34 9 4V6"
                  stroke="#28c840"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </svg>
              <span
                style={{
                  fontSize: 13,
                  color: "#8888a0",
                  fontFamily: "monospace",
                  letterSpacing: 0.3,
                }}
              >
                {displayedUrl}
                {typingProgress < 1 && (
                  <span
                    style={{
                      opacity: cursorBlink,
                      color: accentColor,
                      fontWeight: 100,
                    }}
                  >
                    |
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Contenu du navigateur */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            background: "#0f0f1a",
          }}
        >
          {screenshotSrc ? (
            <img
              src={(() => { try { return staticFile(screenshotSrc); } catch { return ""; } })()}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top left",
              }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : children ? (
            children
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#4a4a5a",
                fontSize: 18,
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Chargement...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
