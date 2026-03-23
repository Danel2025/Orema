"use client";

import { motion, useInView, animate } from "motion/react";
import type { ReactNode } from "react";
import { useRef, useEffect } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
  once?: boolean;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  direction = "up",
  className = "",
  once = false,
}: FadeInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-50px" });

  const directions = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 30 },
    right: { x: -30 },
    none: {},
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...directions[direction] }}
      transition={{
        duration,
        delay: isInView ? delay : 0,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className = "",
}: StaggerContainerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {
          transition: {
            staggerChildren: staggerDelay / 2,
            staggerDirection: -1,
          },
        },
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({
  children,
  className = "",
  style,
}: StaggerItemProps & { style?: React.CSSProperties }) {
  return (
    <motion.div
      style={style}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.21, 0.47, 0.32, 0.98],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ScaleOnHoverProps {
  children: ReactNode;
  scale?: number;
  className?: string;
}

export function ScaleOnHover({
  children,
  scale = 1.02,
  className = "",
  style,
}: ScaleOnHoverProps & { style?: React.CSSProperties }) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

interface CountUpProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
}

export function CountUp({
  value,
  suffix = "",
  prefix = "",
  duration = 2,
  decimals = 0,
}: CountUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });

  return (
    <motion.span
      ref={ref}
      className="price-fcfa"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
    >
      {isInView ? (
        <motion.span initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
          <CountUpAnimation
            value={value}
            duration={duration}
            decimals={decimals}
            isInView={isInView}
          />
          {suffix}
        </motion.span>
      ) : (
        `${prefix}0${suffix}`
      )}
    </motion.span>
  );
}

function CountUpAnimation({
  value,
  duration,
  decimals,
  isInView,
}: {
  value: number;
  duration: number;
  decimals: number;
  isInView: boolean;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isInView) {
      if (nodeRef.current) {
        nodeRef.current.textContent = "0";
      }
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest: number) => {
        if (nodeRef.current) {
          nodeRef.current.textContent =
            decimals > 0 ? latest.toFixed(decimals) : Math.floor(latest).toLocaleString("fr-FR");
        }
      },
    });

    return () => controls.stop();
  }, [value, duration, decimals, isInView]);

  return <span ref={nodeRef}>0</span>;
}
