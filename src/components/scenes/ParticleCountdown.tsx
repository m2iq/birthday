"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface ParticleCountdownProps {
  onComplete: () => void;
  themeColor?: string;
}

// ─── Noise helper (simplex-like) ─────────────────────────────────
// Cheap 2D hash-based noise for organic turbulence
function hash(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h ^ (h >> 16)) / 2147483648;
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const n00 = hash(ix, iy);
  const n10 = hash(ix + 1, iy);
  const n01 = hash(ix, iy + 1);
  const n11 = hash(ix + 1, iy + 1);
  const nx0 = n00 + (n10 - n00) * sx;
  const nx1 = n01 + (n11 - n01) * sx;
  return nx0 + (nx1 - nx0) * sy;
}

// ─── Pixel extraction ────────────────────────────────────────────
function getTextPixels(
  text: string,
  width: number,
  height: number,
  fontSize: number
): { x: number; y: number; brightness: number }[] {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const cx = c.getContext("2d");
  if (!cx) return [];

  cx.fillStyle = "#000";
  cx.fillRect(0, 0, width, height);
  cx.fillStyle = "#fff";
  cx.font = `900 ${fontSize}px "Arial Black", "Impact", Arial, sans-serif`;
  cx.textAlign = "center";
  cx.textBaseline = "middle";
  cx.fillText(text, width / 2, height / 2);

  const img = cx.getImageData(0, 0, width, height);
  const pixels: { x: number; y: number; brightness: number }[] = [];
  // Adaptive gap so we always get ~2500-4000 particles from the text
  const gap = Math.max(2, Math.floor(fontSize / 50));

  for (let y = 0; y < height; y += gap) {
    for (let x = 0; x < width; x += gap) {
      const i = (y * width + x) * 4;
      const v = img.data[i];
      if (v > 50) {
        pixels.push({ x, y, brightness: v / 255 });
      }
    }
  }
  return pixels;
}

// ─── Easing ──────────────────────────────────────────────────────
function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
function easeInExpo(t: number) {
  return t <= 0 ? 0 : Math.pow(2, 10 * t - 10);
}

// ─── Particle type ───────────────────────────────────────────────
interface P {
  x: number;
  y: number;
  tx: number;
  ty: number;
  ox: number;
  oy: number;
  size: number;
  alpha: number;
  brightness: number; // how bright its target position is (edge vs center)
  noiseOffX: number;
  noiseOffY: number;
  wanderAmp: number;
  // dissolve velocity
  dvx: number;
  dvy: number;
}

export default function ParticleCountdown({
  onComplete,
  themeColor = "#ff2e88",
}: ParticleCountdownProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Parse color
    const cr = parseInt(themeColor.slice(1, 3), 16);
    const cg = parseInt(themeColor.slice(3, 5), 16);
    const cb = parseInt(themeColor.slice(5, 7), 16);

    const fontSize = Math.min(w, h) * 0.55;
    const PARTICLE_COUNT = Math.min(4000, Math.max(1500, Math.floor((w * h) / 250)));

    // Create particles scattered
    const particles: P[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        tx: Math.random() * w,
        ty: Math.random() * h,
        ox: 0,
        oy: 0,
        size: 0.8 + Math.random() * 2.0,
        alpha: 0,
        brightness: 0.5 + Math.random() * 0.5,
        noiseOffX: Math.random() * 1000,
        noiseOffY: Math.random() * 1000,
        wanderAmp: 0.5 + Math.random() * 1.5,
        dvx: 0,
        dvy: 0,
      });
    }

    const numbers = ["3", "2", "1"];
    let curNum = 0;
    type Phase = "forming" | "holding" | "dissolving";
    let phase: Phase = "forming";
    let phaseTime = performance.now();

    const FORM_MS = 1100;
    const HOLD_MS = 700;
    const DISSOLVE_MS = 800;

    // Assign particle targets from text pixels
    const assignTargets = (text: string) => {
      const pixels = getTextPixels(text, w, h, fontSize);
      if (pixels.length === 0) return;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const tgt = pixels[i % pixels.length];
        p.ox = p.x;
        p.oy = p.y;
        p.tx = tgt.x + (Math.random() - 0.5) * 4;
        p.ty = tgt.y + (Math.random() - 0.5) * 4;
        p.brightness = tgt.brightness;
      }
    };

    // Prepare dissolve: give each particle a random outward velocity + noise angle
    const prepareDissolve = () => {
      const cx = w / 2;
      const cy = h / 2;
      for (const p of particles) {
        p.ox = p.x;
        p.oy = p.y;
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 150 + Math.random() * 350;
        // Mostly outward, with a noise twist
        const noiseAngle = (Math.random() - 0.5) * 1.2;
        const angle = Math.atan2(dy, dx) + noiseAngle;
        p.dvx = Math.cos(angle) * speed;
        p.dvy = Math.sin(angle) * speed;
        p.tx = p.x + p.dvx;
        p.ty = p.y + p.dvy;
      }
    };

    assignTargets(numbers[0]);

    // Pre-create an offscreen small radial gradient image for particle glow
    // This is a huge perf win vs createRadialGradient per particle per frame
    const glowSize = 32;
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = glowSize * 2;
    glowCanvas.height = glowSize * 2;
    const glowCtx = glowCanvas.getContext("2d")!;
    const grad = glowCtx.createRadialGradient(glowSize, glowSize, 0, glowSize, glowSize, glowSize);
    grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 1)`);
    grad.addColorStop(0.2, `rgba(${cr}, ${cg}, ${cb}, 0.6)`);
    grad.addColorStop(0.5, `rgba(${cr}, ${cg}, ${cb}, 0.15)`);
    grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
    glowCtx.fillStyle = grad;
    glowCtx.fillRect(0, 0, glowSize * 2, glowSize * 2);

    // White core dot
    const coreCanvas = document.createElement("canvas");
    const coreSize = 8;
    coreCanvas.width = coreSize * 2;
    coreCanvas.height = coreSize * 2;
    const coreCtx = coreCanvas.getContext("2d")!;
    const cGrad = coreCtx.createRadialGradient(coreSize, coreSize, 0, coreSize, coreSize, coreSize);
    cGrad.addColorStop(0, "rgba(255,255,255,1)");
    cGrad.addColorStop(0.3, "rgba(255,240,250,0.7)");
    cGrad.addColorStop(1, "rgba(255,220,240,0)");
    coreCtx.fillStyle = cGrad;
    coreCtx.fillRect(0, 0, coreSize * 2, coreSize * 2);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    const animate = (time: number) => {
      const elapsed = time - phaseTime;

      // Semi-transparent black overlay — creates soft trail / glow persistence
      ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
      ctx.fillRect(0, 0, w, h);

      // Enable additive blending for that neon look
      ctx.globalCompositeOperation = "lighter";

      let t = 0;
      if (phase === "forming") {
        t = easeOutExpo(Math.min(elapsed / FORM_MS, 1));
        if (elapsed >= FORM_MS) {
          phase = "holding";
          phaseTime = time;
        }
      } else if (phase === "holding") {
        t = 1;
        if (elapsed >= HOLD_MS) {
          phase = "dissolving";
          phaseTime = time;
          prepareDissolve();
          t = 0;
        }
      } else if (phase === "dissolving") {
        t = easeInExpo(Math.min(elapsed / DISSOLVE_MS, 1));
        if (elapsed >= DISSOLVE_MS) {
          curNum++;
          if (curNum >= numbers.length) {
            ctx.globalCompositeOperation = "source-over";
            onComplete();
            return;
          }
          phase = "forming";
          phaseTime = time;
          for (const p of particles) {
            p.ox = p.x;
            p.oy = p.y;
          }
          assignTargets(numbers[curNum]);
          t = 0;
        }
      }

      const timeSec = time * 0.001;

      for (const p of particles) {
        if (phase === "forming" || phase === "holding") {
          const lerpT = phase === "holding" ? 1 : t;
          p.x = p.ox + (p.tx - p.ox) * lerpT;
          p.y = p.oy + (p.ty - p.oy) * lerpT;
          p.alpha = phase === "forming" ? t : 1;

          // Organic wander when formed
          if (phase === "holding" || t > 0.7) {
            const wander = p.wanderAmp * (phase === "holding" ? 1 : (t - 0.7) / 0.3);
            p.x += Math.sin(timeSec * 1.5 + p.noiseOffX) * wander;
            p.y += Math.cos(timeSec * 1.3 + p.noiseOffY) * wander;
          }
        } else {
          // Dissolve: interpolate outward + fade
          p.x = p.ox + (p.tx - p.ox) * t;
          p.y = p.oy + (p.ty - p.oy) * t;
          // Add noise turbulence during dissolve
          const noiseStr = t * 30;
          p.x += smoothNoise(p.noiseOffX + timeSec, p.noiseOffY) * noiseStr;
          p.y += smoothNoise(p.noiseOffY + timeSec, p.noiseOffX) * noiseStr;
          p.alpha = Math.max(0, 1 - t * 1.3);
        }

        if (p.alpha <= 0.01) continue;

        const a = p.alpha * p.brightness;

        // Draw glow sprite (big soft halo)
        const gs = p.size * 7;
        ctx.globalAlpha = a * 0.35;
        ctx.drawImage(glowCanvas, p.x - gs, p.y - gs, gs * 2, gs * 2);

        // Draw core sprite (bright center)
        const cs = p.size * 1.8;
        ctx.globalAlpha = a * 0.9;
        ctx.drawImage(coreCanvas, p.x - cs, p.y - cs, cs * 2, cs * 2);
      }

      // Reset composite
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [onComplete, themeColor]);

  return (
    <motion.div
      className="fixed inset-0 z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <canvas ref={canvasRef} className="w-full h-full" style={{ background: "#000" }} />
    </motion.div>
  );
}
