import {
  AbsoluteFill,
  Video,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Easing,
  Audio,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont } from "@remotion/google-fonts/Gabarito";

// Charger la police Gabarito
const { fontFamily: gabarito } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

// Couleurs Oréma N+
const ORANGE = "#f97316";
const ORANGE_DARK = "#ea580c";
const DARK_BG = "#0a0a0a";

// Configuration des scènes avec timestamps (en secondes)
const scenes = [
  { start: 0, end: 8, title: "Connexion", subtitle: "rapide par PIN", icon: "🔐" },
  { start: 8, end: 25, title: "Prise de commande", subtitle: "intuitive", icon: "🛒" },
  { start: 25, end: 45, title: "Encaissement", subtitle: "multi-paiements", icon: "💳" },
  { start: 45, end: 60, title: "Gestion des stocks", subtitle: "en temps réel", icon: "📦" },
  { start: 60, end: 75, title: "Équipe", subtitle: "& permissions", icon: "👥" },
  { start: 75, end: 100, title: "Rapports", subtitle: "& statistiques", icon: "📊" },
  { start: 100, end: 130, title: "Mode sombre", subtitle: "confort visuel", icon: "🌙" },
  { start: 130, end: 160, title: "Interface adaptée", subtitle: "à vos besoins", icon: "✨" },
];

// Composant cercle animé décoratif
const AnimatedCircle: React.FC<{
  size: number;
  color: string;
  delay?: number;
  x: number;
  y: number;
}> = ({ size, color, delay = 0, x, y }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  });

  const pulse = interpolate(frame, [0, 60, 120], [1, 1.1, 1], {
    extrapolateRight: "extend",
  });

  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
        transform: `scale(${scale * pulse})`,
        left: x,
        top: y,
      }}
    />
  );
};

// Composant d'intro
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const logoRotate = interpolate(
    spring({ frame, fps, config: { damping: 200 } }),
    [0, 1],
    [-10, 0]
  );

  const titleText = "Oréma N+";
  const titleProgress = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const subtitleOpacity = interpolate(frame, [45, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleY = spring({
    frame: frame - 45,
    fps,
    config: { damping: 200 },
  });

  const features = ["Simple", "Rapide", "Fiable"];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${DARK_BG} 0%, #1a1a2e 50%, #0f172a 100%)`,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <AnimatedCircle size={800} color={ORANGE} delay={0} x={-200} y={-200} />
      <AnimatedCircle size={600} color="#f59e0b" delay={10} x={1400} y={600} />
      <AnimatedCircle size={400} color={ORANGE} delay={20} x={1600} y={-100} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${ORANGE}08 1px, transparent 1px),
            linear-gradient(90deg, ${ORANGE}08 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: interpolate(frame, [0, 30], [0, 0.5], { extrapolateRight: "clamp" }),
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 32,
            background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 70,
            fontWeight: 900,
            color: "white",
            fontFamily: gabarito,
            boxShadow: `0 20px 60px ${ORANGE}50, 0 0 100px ${ORANGE}30`,
            position: "relative",
          }}
        >
          O+
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              right: 30,
              height: 30,
              background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)",
              borderRadius: "20px 20px 50% 50%",
            }}
          />
        </div>

        <h1
          style={{
            fontSize: 90,
            fontWeight: 800,
            color: "white",
            marginTop: 40,
            fontFamily: gabarito,
            letterSpacing: -2,
            overflow: "hidden",
          }}
        >
          {titleText.split("").map((char, i) => {
            const charProgress = interpolate(
              titleProgress,
              [i / titleText.length, (i + 1) / titleText.length],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: charProgress,
                  transform: `translateY(${(1 - charProgress) * 30}px)`,
                  color: char === "+" ? ORANGE : "white",
                }}
              >
                {char}
              </span>
            );
          })}
        </h1>

        <p
          style={{
            fontSize: 32,
            color: "#94a3b8",
            marginTop: 15,
            fontFamily: gabarito,
            fontWeight: 500,
            opacity: subtitleOpacity,
            transform: `translateY(${(1 - subtitleY) * 20}px)`,
          }}
        >
          Le cœur de votre commerce
        </p>

        <div style={{ display: "flex", gap: 20, marginTop: 50 }}>
          {features.map((feature, i) => {
            const featureDelay = 60 + i * 10;
            const featureScale = spring({
              frame: frame - featureDelay,
              fps,
              config: { damping: 15, stiffness: 150 },
            });

            return (
              <div
                key={feature}
                style={{
                  background: `${ORANGE}20`,
                  border: `1px solid ${ORANGE}40`,
                  borderRadius: 30,
                  padding: "12px 28px",
                  transform: `scale(${featureScale})`,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    color: ORANGE,
                    fontFamily: gabarito,
                    fontWeight: 600,
                  }}
                >
                  {feature}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Composant d'overlay pour la vidéo
const VideoOverlay: React.FC<{
  title: string;
  subtitle: string;
  icon: string;
  sceneIndex: number;
}> = ({ title, subtitle, icon, sceneIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation d'entrée
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const slideX = interpolate(enterProgress, [0, 1], [-100, 0]);
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Animation de sortie (dernières 15 frames)
  const exitOpacity = interpolate(frame, [fps * 2 - 15, fps * 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const finalOpacity = Math.min(opacity, exitOpacity);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Badge en haut à gauche */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          opacity: finalOpacity,
          transform: `translateX(${slideX}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(20px)",
            borderRadius: 20,
            padding: "16px 28px",
            boxShadow: `0 10px 40px rgba(0,0,0,0.3), 0 0 0 1px ${ORANGE}30`,
          }}
        >
          {/* Icône */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 28,
              boxShadow: `0 4px 15px ${ORANGE}50`,
            }}
          >
            {icon}
          </div>

          {/* Texte */}
          <div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "white",
                fontFamily: gabarito,
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: ORANGE,
                fontFamily: gabarito,
              }}
            >
              {subtitle}
            </div>
          </div>

          {/* Numéro de scène */}
          <div
            style={{
              marginLeft: 16,
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${ORANGE}20`,
              border: `1px solid ${ORANGE}40`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 16,
              fontWeight: 700,
              color: ORANGE,
              fontFamily: gabarito,
            }}
          >
            {sceneIndex + 1}
          </div>
        </div>
      </div>

      {/* Barre de progression en bas */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: 40,
          right: 40,
          height: 6,
          background: "rgba(255,255,255,0.15)",
          borderRadius: 3,
          overflow: "hidden",
          opacity: finalOpacity * 0.8,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${((sceneIndex + 1) / scenes.length) * 100}%`,
            background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_DARK})`,
            borderRadius: 3,
            boxShadow: `0 0 20px ${ORANGE}50`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Composant vidéo avec overlays
const DemoVideoSection: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Trouver la scène actuelle basée sur le frame
  const currentSecond = frame / fps;
  const currentSceneIndex = scenes.findIndex(
    (scene) => currentSecond >= scene.start && currentSecond < scene.end
  );
  const currentScene = scenes[currentSceneIndex] || scenes[0];

  // Frame relatif à la scène actuelle
  const sceneStartFrame = currentScene.start * fps;
  const relativeFrame = frame - sceneStartFrame;

  return (
    <AbsoluteFill>
      {/* Vidéo de fond */}
      <Video
        src={staticFile("demo-video.webm")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Overlay avec titre de la scène */}
      {currentSceneIndex >= 0 && (
        <Sequence
          from={sceneStartFrame}
          durationInFrames={(currentScene.end - currentScene.start) * fps}
        >
          <VideoOverlay
            title={currentScene.title}
            subtitle={currentScene.subtitle}
            icon={currentScene.icon}
            sceneIndex={currentSceneIndex}
          />
        </Sequence>
      )}

      {/* Vignette subtile sur les bords */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.3) 100%)
          `,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// Composant Outro
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const ctaScale = spring({
    frame: frame - 40,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const urlOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaPulse = interpolate(frame, [50, 70, 90, 110], [1, 1.05, 1, 1.05], {
    extrapolateRight: "extend",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${DARK_BG} 0%, #1a1a2e 50%, #0f172a 100%)`,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <AnimatedCircle size={1000} color={ORANGE} delay={0} x={-300} y={-300} />
      <AnimatedCircle size={700} color="#f59e0b" delay={10} x={1300} y={500} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${ORANGE}08 1px, transparent 1px),
            linear-gradient(90deg, ${ORANGE}08 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: 0.5,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `scale(${scale})`,
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "white",
            textAlign: "center",
            fontFamily: gabarito,
            lineHeight: 1.2,
            maxWidth: 900,
          }}
        >
          Transformez votre <span style={{ color: ORANGE }}>commerce</span>
          <br />
          dès aujourd'hui
        </h1>

        <p
          style={{
            fontSize: 26,
            color: "#94a3b8",
            marginTop: 25,
            textAlign: "center",
            fontFamily: gabarito,
            fontWeight: 500,
          }}
        >
          Simple, rapide, fiable — même sans internet
        </p>

        <div style={{ marginTop: 60, transform: `scale(${ctaScale * ctaPulse})` }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
              padding: "22px 50px",
              borderRadius: 16,
              boxShadow: `0 15px 40px ${ORANGE}50, 0 0 80px ${ORANGE}20`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: -100,
                width: 60,
                height: "100%",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                transform: `translateX(${frame * 3}px)`,
              }}
            />
            <span
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "white",
                fontFamily: gabarito,
              }}
            >
              Essayer gratuitement
            </span>
          </div>
        </div>

        <p
          style={{
            fontSize: 20,
            color: "#64748b",
            marginTop: 30,
            fontFamily: gabarito,
            fontWeight: 500,
            opacity: urlOpacity,
          }}
        >
          orema-nplus.ga
        </p>

        <div style={{ display: "flex", gap: 40, marginTop: 50, opacity: urlOpacity }}>
          {["14 jours d'essai", "Sans engagement", "Support 24/7"].map((text) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: ORANGE,
                }}
              />
              <span style={{ fontSize: 16, color: "#94a3b8", fontFamily: gabarito }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Composition principale
export const DemoVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  const transitionDuration = Math.round(0.8 * fps);

  // Durée de la vidéo enregistrée (environ 2:55 = 175 secondes)
  const videoDuration = Math.round(175 * fps);

  return (
    <AbsoluteFill style={{ background: DARK_BG }}>
      <TransitionSeries>
        {/* Intro - 3.5 secondes */}
        <TransitionSeries.Sequence durationInFrames={Math.round(3.5 * fps)}>
          <IntroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Vidéo principale avec overlays */}
        <TransitionSeries.Sequence durationInFrames={videoDuration}>
          <DemoVideoSection />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Outro - 5 secondes */}
        <TransitionSeries.Sequence durationInFrames={Math.round(5 * fps)}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
