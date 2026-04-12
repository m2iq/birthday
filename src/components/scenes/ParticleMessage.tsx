"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface ParticleMessageProps {
  words: string[];
  name: string;
  onComplete: () => void;
  themeColor?: string;
}

interface Dot {
  x: number;
  y: number;
  tx: number;
  ty: number;
  ox: number;
  oy: number;
  size: number;
  alpha: number;
}

function getTextPixels(
  text: string,
  width: number,
  height: number,
  fontSize: number
): { x: number; y: number }[] {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "rtl";
  ctx.fillText(text, width / 2, height / 2);

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels: { x: number; y: number }[] = [];
  const gap = Math.max(3, Math.floor(fontSize / 25));

  for (let y = 0; y < height; y += gap) {
    for (let x = 0; x < width; x += gap) {
      const i = (y * width + x) * 4;
      if (imageData.data[i] > 128) {
        pixels.push({ x, y });
      }
    }
  }
  return pixels;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function ParticleMessage({
  words,
  name,
  onComplete,
  themeColor = "#ff2d75",
}: ParticleMessageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const initParticles = useCallback(
    (count: number, w: number, h: number): Dot[] => {
      const particles: Dot[] = [];
      for (let i = 0; i < count; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        particles.push({
          x,
          y,
          tx: x,
          ty: y,
          ox: x,
          oy: y,
          size: 1.5 + Math.random() * 2,
          alpha: 0,
        });
      }
      return particles;
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const w = canvas.width;
    const h = canvas.height;
    const fontSize = Math.min(w * 0.25, h * 0.2, 180);
    const particleCount = Math.min(1800, Math.floor((w * h) / 500));

    const particles = initParticles(particleCount, w, h);
    const allWords = [...words, name];
    let currentWord = 0;
    let phase: "forming" | "holding" | "dissolving" = "forming";
    let phaseStart = performance.now();

    const FORM_DUR = 800;
    const HOLD_DUR = 800;
    const DISSOLVE_DUR = 600;

    const setTargets = (text: string) => {
      const pixels = getTextPixels(text, w, h, fontSize);
      if (pixels.length === 0) return;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const target = pixels[i % pixels.length];
        p.tx = target.x + (Math.random() - 0.5) * 2;
        p.ty = target.y + (Math.random() - 0.5) * 2;
        p.ox = p.x;
        p.oy = p.y;
      }
    };

    const dissolve = () => {
      for (const p of particles) {
        p.ox = p.x;
        p.oy = p.y;
        const angle = Math.random() * Math.PI * 2;
        const dist = 80 + Math.random() * 250;
        p.tx = p.x + Math.cos(angle) * dist;
        p.ty = p.y + Math.sin(angle) * dist;
      }
    };

    setTargets(allWords[0]);

    const r = parseInt(themeColor.slice(1, 3), 16);
    const g = parseInt(themeColor.slice(3, 5), 16);
    const b = parseInt(themeColor.slice(5, 7), 16);

    // Use gold for the name
    const isName = (idx: number) => idx === allWords.length - 1;

    const animate = (time: number) => {
      const elapsed = time - phaseStart;
      ctx.fillStyle = "rgba(5, 5, 16, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let t = 0;
      if (phase === "forming") {
        t = easeInOutCubic(Math.min(elapsed / FORM_DUR, 1));
        if (elapsed >= FORM_DUR) {
          phase = "holding";
          phaseStart = time;
        }
      } else if (phase === "holding") {
        t = 1;
        if (elapsed >= HOLD_DUR) {
          phase = "dissolving";
          phaseStart = time;
          dissolve();
          t = 0;
        }
      } else if (phase === "dissolving") {
        t = easeInOutCubic(Math.min(elapsed / DISSOLVE_DUR, 1));
        if (elapsed >= DISSOLVE_DUR) {
          currentWord++;
          if (currentWord >= allWords.length) {
            // Small delay before completing
            setTimeout(onComplete, 300);
            return;
          }
          phase = "forming";
          phaseStart = time;
          for (const p of particles) {
            p.ox = p.x;
            p.oy = p.y;
          }
          setTargets(allWords[currentWord]);
          t = 0;
        }
      }

      const nameMode = isName(currentWord);
      const cr = nameMode ? 255 : r;
      const cg = nameMode ? 215 : g;
      const cb = nameMode ? 0 : b;

      for (const p of particles) {
        p.x = lerp(p.ox, p.tx, t);
        p.y = lerp(p.oy, p.ty, t);
        p.alpha = phase === "dissolving" ? 1 - t : t;

        const glowSize = p.size * 3;
        const gradient = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          glowSize
        );
        gradient.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${p.alpha * 0.8})`);
        gradient.addColorStop(0.5, `rgba(${cr}, ${cg}, ${cb}, ${p.alpha * 0.2})`);
        gradient.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.9})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, w, h);
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [words, name, initParticles, onComplete, themeColor]);

  return (
    <motion.div
      className="fixed inset-0 z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </motion.div>
  );
}
