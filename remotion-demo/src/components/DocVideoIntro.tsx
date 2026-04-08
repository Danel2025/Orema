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

interface DocVideoIntroProps {
  /** Titre de la vidéo */
  title: string;
  /** Sous-titre */
  subtitle: string;
  /** Nom de la catégorie */
  category: string;
  /** SVG inline ou caractère pour l'icône de catégorie */
  categoryIcon?: string;
  /** Couleur d'accent */
  accentColor?: string;
}

// Particules décoratives en arrière-plan
const FloatingParticle: React.FC<{
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
}> = ({ x, y, size, delay, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 30, stiffness: 40 },
  });

  const floatY = Math.sin((frame - delay) * 0.04) * 8;
  const floatX = Math.cos((frame - delay) * 0.03) * 5;

  return (
    <div
      style={{
        position: "absolute",
        left: x + floatX,
        top: y + floatY,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
        opacity: enter * 0.6,
        transform: `scale(${enter})`,
      }}
    />
  );
};

export const DocVideoIntro: React.FC<DocVideoIntroProps> = ({
  title,
  subtitle,
  category,
  categoryIcon,
  accentColor = COLORS.orange,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Icône de catégorie : bounce d'entrée
  const iconScale = spring({
    frame: frame - 5,
    fps,
    config: SPRING_CONFIGS.bounce,
  });

  const iconRotate = interpolate(
    spring({ frame: frame - 5, fps, config: { damping: 200, stiffness: 100 } }),
    [0, 1],
    [-15, 0]
  );

  // Titre : animation lettre par lettre (stagger)
  const titleChars = title.split("");
  const titleStartFrame = 15;

  // Sous-titre : fade in
  const subtitleOpacity = interpolate(frame, [35, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleY = spring({
    frame: frame - 35,
    fps,
    config: SPRING_CONFIGS.enterSoft,
  });

  // Barre de catégorie
  const barWidth = spring({
    frame: frame - 8,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  // Catégorie label
  const categoryOpacity = interpolate(frame, [20, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Background gradient animé
  const gradientAngle = interpolate(frame, [0, 90], [135, 145], {
    extrapolateRight: "extend",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, ${COLORS.darkBg} 0%, ${COLORS.darkBgAlt} 40%, ${COLORS.darkBgDeep} 100%)`,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Particules décoratives */}
      <FloatingParticle x={150} y={200} size={300} delay={0} color={accentColor} />
      <FloatingParticle x={1500} y={700} size={250} delay={5} color={COLORS.violet} />
      <FloatingParticle x={1600} y={100} size={200} delay={10} color={COLORS.mint} />
      <FloatingParticle x={100} y={800} size={180} delay={8} color={COLORS.rose} />

      {/* Grille subtile */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${accentColor}06 1px, transparent 1px),
            linear-gradient(90deg, ${accentColor}06 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          opacity: interpolate(frame, [0, 20], [0, 0.5], {
            extrapolateRight: "clamp",
          }),
        }}
      />

      {/* Contenu central */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        {/* Logo coeur Oréma N+ */}
        <div
          style={{
            transform: `scale(${iconScale}) rotate(${iconRotate}deg)`,
            marginBottom: 20,
            filter: `drop-shadow(0 12px 40px ${COLORS.yellow}40)`,
          }}
        >
          <svg
            width={90}
            height={77}
            viewBox="0 0 831.46 710.47"
          >
            <polygon fill={COLORS.yellow} points="415.73 144.17 239.98 0 0 175.86 415.73 144.17" />
            <polygon fill={COLORS.mint} points="0 358.42 0 175.86 415.73 144.17 0 358.42" />
            <polygon fill={COLORS.rose} points="0 358.42 415.73 144.17 415.73 710.47 0 358.42" />
            <polygon fill={COLORS.mint} points="415.73 144.17 591.49 0 831.46 175.86 415.73 144.17" />
            <polygon fill={COLORS.violet} points="831.46 358.42 831.46 175.86 415.73 144.17 831.46 358.42" />
            <polygon fill={COLORS.yellow} points="831.46 358.42 415.73 144.17 415.73 710.47 831.46 358.42" />
          </svg>
        </div>

        {/* Nom de marque */}
        <h2
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "white",
            fontFamily: gabarito,
            letterSpacing: -0.5,
            marginBottom: 24,
            opacity: interpolate(
              spring({ frame: frame - 10, fps, config: SPRING_CONFIGS.enterSoft }),
              [0, 1],
              [0, 1]
            ),
          }}
        >
          Oréma <span style={{ color: accentColor }}>N+</span>
        </h2>

        {/* Label catégorie */}
        <div
          style={{
            opacity: categoryOpacity,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: accentColor,
              fontFamily: gabarito,
              textTransform: "uppercase",
              letterSpacing: 3,
            }}
          >
            {category}
          </span>
        </div>

        {/* Barre colorée */}
        <div
          style={{
            width: interpolate(barWidth, [0, 1], [0, 80]),
            height: 4,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}60)`,
            marginBottom: 24,
            boxShadow: `0 0 20px ${accentColor}40`,
          }}
        />

        {/* Titre avec animation lettre par lettre */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            fontFamily: gabarito,
            letterSpacing: -2,
            lineHeight: 1.1,
            textAlign: "center",
            maxWidth: 1000,
            margin: 0,
          }}
        >
          {titleChars.map((char, i) => {
            const charDelay = titleStartFrame + i * 1.2;
            const charSpring = spring({
              frame: frame - charDelay,
              fps,
              config: { damping: 15, stiffness: 200 },
            });

            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: charSpring,
                  transform: `translateY(${(1 - charSpring) * 25}px)`,
                  whiteSpace: char === " " ? "pre" : undefined,
                }}
              >
                {char}
              </span>
            );
          })}
        </h1>

        {/* Sous-titre */}
        <p
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: COLORS.textMuted,
            fontFamily: gabarito,
            marginTop: 16,
            opacity: subtitleOpacity,
            transform: `translateY(${(1 - subtitleY) * 15}px)`,
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          {subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
};
