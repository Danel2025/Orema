import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Gabarito";
import { COLORS, SPRING_CONFIGS } from "../types";

const { fontFamily: gabarito } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

interface DocVideoOutroProps {
  /** Couleur d'accent */
  accentColor?: string;
}

// Logo coeur Oréma N+ (polygones SVG depuis ic-lg.svg)
const OrémaLogo: React.FC<{ scale: number; opacity: number }> = ({
  scale,
  opacity,
}) => (
  <svg
    width={120}
    height={103}
    viewBox="0 0 831.46 710.47"
    style={{
      transform: `scale(${scale})`,
      opacity,
      filter: `drop-shadow(0 8px 30px ${COLORS.yellow}40)`,
    }}
  >
    {/* Jaune - fond gauche haut */}
    <polygon
      fill={COLORS.yellow}
      points="415.73 144.17 239.98 0 0 175.86 415.73 144.17"
    />
    {/* Vert menthe - côté gauche */}
    <polygon
      fill={COLORS.mint}
      points="0 358.42 0 175.86 415.73 144.17 0 358.42"
    />
    {/* Rose - face gauche bas */}
    <polygon
      fill={COLORS.rose}
      points="0 358.42 415.73 144.17 415.73 710.47 0 358.42"
    />
    {/* Vert menthe - fond droit haut */}
    <polygon
      fill={COLORS.mint}
      points="415.73 144.17 591.49 0 831.46 175.86 415.73 144.17"
    />
    {/* Violet - côté droit */}
    <polygon
      fill={COLORS.violet}
      points="831.46 358.42 831.46 175.86 415.73 144.17 831.46 358.42"
    />
    {/* Jaune - face droite bas */}
    <polygon
      fill={COLORS.yellow}
      points="831.46 358.42 415.73 144.17 415.73 710.47 831.46 358.42"
    />
  </svg>
);

export const DocVideoOutro: React.FC<DocVideoOutroProps> = ({
  accentColor = COLORS.orange,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Logo : entrée avec spring bounce
  const logoEnter = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.bounce,
  });

  const logoScale = interpolate(logoEnter, [0, 1], [0.3, 1]);
  const logoOpacity = interpolate(logoEnter, [0, 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Texte "Oréma N+"
  const brandOpacity = interpolate(frame, [15, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const brandY = spring({
    frame: frame - 15,
    fps,
    config: SPRING_CONFIGS.enterSoft,
  });

  // CTA "Essayer gratuitement"
  const ctaScale = spring({
    frame: frame - 25,
    fps,
    config: SPRING_CONFIGS.enter,
  });

  // Pulse subtil du CTA
  const ctaPulse = interpolate(
    frame,
    [35, 50, 65, 80],
    [1, 1.03, 1, 1.03],
    { extrapolateRight: "extend" }
  );

  // URL
  const urlOpacity = interpolate(frame, [35, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Shine sur le CTA
  const shineX = interpolate(frame, [30, 70], [-150, 400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Animation de sortie globale
  const exitStart = durationInFrames - 12;
  const exitOpacity = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    }
  );

  const exitScale = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0.95],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Background gradient
  const gradientAngle = interpolate(frame, [0, 60], [135, 140], {
    extrapolateRight: "extend",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, ${COLORS.darkBg} 0%, ${COLORS.darkBgAlt} 50%, ${COLORS.darkBgDeep} 100%)`,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Cercles décoratifs en fond */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.yellow}15 0%, transparent 70%)`,
          left: -150,
          top: -150,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.violet}12 0%, transparent 70%)`,
          right: -100,
          bottom: -100,
        }}
      />

      {/* Grille subtile */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${accentColor}05 1px, transparent 1px),
            linear-gradient(90deg, ${accentColor}05 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: 0.5,
        }}
      />

      {/* Contenu */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Logo coeur géométrique */}
        <OrémaLogo scale={logoScale} opacity={logoOpacity} />

        {/* Nom de marque */}
        <h2
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: "white",
            fontFamily: gabarito,
            letterSpacing: -1,
            marginTop: 24,
            opacity: brandOpacity,
            transform: `translateY(${(1 - brandY) * 15}px)`,
          }}
        >
          Orema{" "}
          <span style={{ color: accentColor }}>N+</span>
        </h2>

        {/* CTA */}
        <div
          style={{
            marginTop: 40,
            transform: `scale(${ctaScale * ctaPulse})`,
          }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${COLORS.orangeDark})`,
              padding: "18px 44px",
              borderRadius: 14,
              boxShadow: `0 12px 40px ${accentColor}40, 0 0 60px ${accentColor}15`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Shine effect */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: shineX,
                width: 50,
                height: "100%",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                transform: "skewX(-15deg)",
              }}
            />
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "white",
                fontFamily: gabarito,
                position: "relative",
                zIndex: 1,
              }}
            >
              Essayer gratuitement
            </span>
          </div>
        </div>

        {/* URL */}
        <p
          style={{
            fontSize: 18,
            color: COLORS.textDim,
            fontFamily: gabarito,
            fontWeight: 500,
            marginTop: 24,
            opacity: urlOpacity,
            letterSpacing: 0.5,
          }}
        >
          orema-nplus.ga
        </p>
      </div>
    </AbsoluteFill>
  );
};
