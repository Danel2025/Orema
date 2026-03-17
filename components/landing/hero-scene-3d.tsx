"use client";

import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";

// Forme pyramidale (motif africain)
function Pyramid({
  position,
  scale = 1,
  color = "#7c3aed",
  speed = 1,
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005 * speed;
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.1;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <coneGeometry args={[0.5, 1, 4]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>
    </Float>
  );
}

// Losange flottant
function Diamond({
  position,
  scale = 1,
  color = "#8b5cf6",
  speed = 1,
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.003 * speed;
      meshRef.current.rotation.z += 0.005 * speed;
    }
  });

  return (
    <Float speed={speed * 0.8} rotationIntensity={0.8} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <octahedronGeometry args={[0.4]} />
        <meshStandardMaterial
          color={color}
          metalness={0.5}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>
    </Float>
  );
}

// Sphère avec distorsion
function GlowingSphere({
  position,
  scale = 1,
  color = "#6d28d9",
  speed = 1,
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
  speed?: number;
}) {
  return (
    <Float speed={speed * 0.6} rotationIntensity={0.3} floatIntensity={0.8}>
      <Sphere args={[0.3, 32, 32]} position={position} scale={scale}>
        <MeshDistortMaterial
          color={color}
          speed={2}
          distort={0.3}
          radius={1}
          metalness={0.2}
          roughness={0.5}
        />
      </Sphere>
    </Float>
  );
}

// Anneau (inspiration africaine)
function Ring({
  position,
  scale = 1,
  color = "#d97706",
  speed = 1,
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.3;
      meshRef.current.rotation.y += 0.01 * speed;
    }
  });

  return (
    <Float speed={speed * 0.5} rotationIntensity={0.4} floatIntensity={0.4}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <torusGeometry args={[0.4, 0.1, 16, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.3}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>
    </Float>
  );
}

// Générateur pseudo-aléatoire avec seed (déterministe)
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Génère les particules une seule fois (hors composant)
function generateParticles(count: number) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 5;
    particles.push({
      position: [
        (seededRandom(seed) - 0.5) * 15,
        (seededRandom(seed + 1) - 0.5) * 10,
        (seededRandom(seed + 2) - 0.5) * 8 - 2,
      ] as [number, number, number],
      scale: seededRandom(seed + 3) * 0.03 + 0.01,
      speed: seededRandom(seed + 4) * 0.5 + 0.2,
    });
  }
  return particles;
}

// Particules pré-générées
const PARTICLES_DATA = generateParticles(40);

// Particules flottantes avec positions déterministes
function Particles() {
  return (
    <group>
      {PARTICLES_DATA.map((particle, i) => (
        <FloatingParticle
          key={i}
          position={particle.position}
          scale={particle.scale}
          speed={particle.speed}
        />
      ))}
    </group>
  );
}

function FloatingParticle({
  position,
  scale,
  speed,
}: {
  position: [number, number, number];
  scale: number;
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialY = position[1];

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        initialY + Math.sin(state.clock.elapsedTime * speed + position[0]) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[scale, 8, 8]} />
      <meshBasicMaterial color="#7c3aed" transparent opacity={0.6} />
    </mesh>
  );
}

// Composant principal qui suit la souris
function Scene() {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (groupRef.current) {
      // Légère rotation basée sur la position de la souris
      const x = (state.pointer.x * viewport.width) / 50;
      const y = (state.pointer.y * viewport.height) / 50;

      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        x * 0.1,
        0.05
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -y * 0.1,
        0.05
      );
    }
  });

  return (
    <group ref={groupRef}>
      {/* Lumières */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#fff5eb" />
      <pointLight position={[-5, 3, 0]} intensity={0.5} color="#7c3aed" />
      <pointLight position={[5, -2, 2]} intensity={0.3} color="#8b5cf6" />

      {/* Formes géométriques - côté gauche */}
      <Pyramid position={[-4, 1, -2]} scale={1.2} color="#7c3aed" speed={0.8} />
      <Diamond position={[-3, -1.5, -1]} scale={0.9} color="#8b5cf6" speed={1.2} />
      <Ring position={[-5, 0, -3]} scale={1} color="#6d28d9" speed={0.6} />

      {/* Formes géométriques - côté droit */}
      <Pyramid position={[4, -1, -2]} scale={1} color="#6d28d9" speed={1} />
      <Diamond position={[3.5, 1.5, -1.5]} scale={1.1} color="#d97706" speed={0.9} />
      <GlowingSphere position={[5, 0.5, -2]} scale={1.3} color="#7c3aed" speed={0.7} />

      {/* Formes centrales (plus petites, en arrière-plan) */}
      <Pyramid position={[0, 2.5, -4]} scale={0.6} color="#8b5cf6" speed={1.1} />
      <Diamond position={[-1, -2, -3]} scale={0.5} color="#7c3aed" speed={1.3} />
      <Ring position={[1.5, -2.5, -3.5]} scale={0.7} color="#8b5cf6" speed={0.8} />

      {/* Formes supplémentaires pour profondeur */}
      <GlowingSphere position={[-2, 2, -5]} scale={0.8} color="#6d28d9" speed={0.5} />
      <Pyramid position={[2, 3, -6]} scale={0.5} color="#d97706" speed={0.9} />

      {/* Particules */}
      <Particles />
    </group>
  );
}

// Fallback CSS pour navigateurs sans WebGL
function CSSFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Cercles animés en CSS pur */}
      <div
        className="absolute animate-pulse rounded-full opacity-20 blur-3xl"
        style={{
          width: 400,
          height: 400,
          background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
          top: "10%",
          right: "-5%",
          animation: "float 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute animate-pulse rounded-full opacity-15 blur-3xl"
        style={{
          width: 300,
          height: 300,
          background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
          bottom: "20%",
          left: "-5%",
          animation: "float 10s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute animate-pulse rounded-full opacity-10 blur-2xl"
        style={{
          width: 200,
          height: 200,
          background: "#8b5cf6",
          top: "40%",
          left: "30%",
          animation: "float 6s ease-in-out infinite",
        }}
      />
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

export function HeroScene3D() {
  const [hasError, setHasError] = useState(false);

  // Si erreur WebGL, afficher le fallback CSS
  if (hasError) {
    return <CSSFallback />;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <Suspense fallback={<CSSFallback />}>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 45 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false,
          }}
          style={{ background: "transparent" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
          onError={() => setHasError(true)}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
