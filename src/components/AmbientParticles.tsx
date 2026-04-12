"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface AmbientParticlesProps {
  themeColor?: string;
  count?: number;
}

export default function AmbientParticles({
  themeColor = "#ff2d75",
  count = 20,
}: AmbientParticlesProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 8 + Math.random() * 12,
        delay: Math.random() * 10,
        opacity: 0.1 + Math.random() * 0.3,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: themeColor,
            filter: `blur(${p.size / 2}px)`,
          }}
          animate={{
            y: [
              typeof window !== "undefined" ? window.innerHeight + 20 : 900,
              -20,
            ],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
