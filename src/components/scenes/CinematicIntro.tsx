"use client";

import { useEffect, useRef } from "react";

interface CinematicIntroProps {
  words: string[];
  name: string;
  onComplete: () => void;
  themeColor?: string;
}

export default function CinematicIntro({
  words,
  name,
  onComplete,
  themeColor = "#ff69b4",
}: CinematicIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
        : { r: 255, g: 105, b: 180 };
    };
    const rgb = hexToRgb(themeColor);

    // ── Responsive parameters ──
    const isMobile = W < 640;
    const isTablet = W >= 640 && W < 1024;
    const GAP = isMobile ? 4 : isTablet ? 6 : 8;
    const BASE_DOT = isMobile ? 2.5 : isTablet ? 3 : 4;

    // ── ShapeBuilder ──
    const shapeCanvas = document.createElement("canvas");
    const shapeCtx = shapeCanvas.getContext("2d")!;
    const FONT_FAMILY = `"Noto Kufi Arabic", Avenir, Helvetica Neue, Helvetica, Arial, sans-serif`;

    function fitShapeCanvas() {
      shapeCanvas.width = Math.floor(W / GAP) * GAP;
      shapeCanvas.height = Math.floor(H / GAP) * GAP;
      shapeCtx.fillStyle = "red";
      shapeCtx.textBaseline = "middle";
      shapeCtx.textAlign = "center";
    }
    fitShapeCanvas();

    function processShapeCanvas(): { x: number; y: number }[] {
      const pixels = shapeCtx.getImageData(0, 0, shapeCanvas.width, shapeCanvas.height).data;
      const dots: { x: number; y: number }[] = [];
      const bpr = shapeCanvas.width * 4; // bytes per row

      for (let row = 0; row < shapeCanvas.height; row += GAP) {
        for (let col = 0; col < shapeCanvas.width; col += GAP) {
          const idx = row * bpr + col * 4;
          if (pixels[idx + 3] > 0) {
            dots.push({ x: col, y: row });
          }
        }
      }
      return dots;
    }

    function isNumber(n: string) {
      return !isNaN(parseFloat(n)) && isFinite(Number(n));
    }

    function buildShape(text: string): { x: number; y: number }[] {
      const BASE_FONT_SIZE = 500;
      shapeCtx.font = `bold ${BASE_FONT_SIZE}px ${FONT_FAMILY}`;
      const measured = shapeCtx.measureText(text).width;

      const heightFactor = isNumber(text) ? 0.8 : isMobile ? 0.5 : 0.4;
      const widthUsage = isMobile ? 0.9 : 0.8;

      const s = Math.min(
        BASE_FONT_SIZE,
        (shapeCanvas.width / measured) * widthUsage * BASE_FONT_SIZE,
        (shapeCanvas.height / BASE_FONT_SIZE) * heightFactor * BASE_FONT_SIZE
      );

      shapeCtx.font = `bold ${s}px ${FONT_FAMILY}`;
      shapeCtx.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
      shapeCtx.fillText(text, shapeCanvas.width / 2, shapeCanvas.height / 2);
      return processShapeCanvas();
    }

    // ── Dot class ──────────────────────────────────────────────────
    interface DotPoint {
      x: number; y: number; z: number; a: number; h: number;
    }
    interface DotObj {
      p: DotPoint;
      t: DotPoint;
      e: number;
      s: boolean;
      q: DotPoint[];
    }

    const DOT_SIZE = BASE_DOT;

    function createDot(x: number, y: number): DotObj {
      return {
        p: { x, y, z: DOT_SIZE, a: 1, h: 0 },
        t: { x, y, z: DOT_SIZE, a: 1, h: 0 },
        e: 0.07,
        s: true,
        q: [],
      };
    }

    function dotDistanceTo(dot: DotObj, n: { x: number; y: number }) {
      const dx = dot.p.x - n.x;
      const dy = dot.p.y - n.y;
      return { dx, dy, d: Math.sqrt(dx * dx + dy * dy) };
    }

    function dotMoveTowards(dot: DotObj): boolean {
      const { dx, dy, d } = dotDistanceTo(dot, dot.t);
      const e = dot.e * d;

      if (dot.p.h === -1) {
        dot.p.x = dot.t.x;
        dot.p.y = dot.t.y;
        return true;
      }

      if (d > 1) {
        dot.p.x -= (dx / d) * e;
        dot.p.y -= (dy / d) * e;
      } else {
        if (dot.p.h > 0) {
          dot.p.h--;
        } else {
          return true;
        }
      }
      return false;
    }

    function dotUpdate(dot: DotObj) {
      if (dotMoveTowards(dot)) {
        const p = dot.q.shift();
        if (p) {
          dot.t.x = p.x || dot.p.x;
          dot.t.y = p.y || dot.p.y;
          dot.t.z = p.z || dot.p.z;
          dot.t.a = p.a || dot.p.a;
          dot.p.h = p.h || 0;
        } else {
          if (dot.s) {
            // Wandering jiggle when in position
            dot.p.x -= Math.sin(Math.random() * 3.142);
            dot.p.y -= Math.sin(Math.random() * 3.142);
          } else {
            // Scatter drift
            dot.q.push({
              x: dot.p.x + (Math.random() * 50) - 25,
              y: dot.p.y + (Math.random() * 50) - 25,
              z: dot.p.z, a: dot.p.a, h: 0,
            });
          }
        }
      }
      // Smooth alpha and size transitions
      const dA = dot.p.a - dot.t.a;
      dot.p.a = Math.max(0.1, dot.p.a - dA * 0.05);
      const dZ = dot.p.z - dot.t.z;
      dot.p.z = Math.max(1, dot.p.z - dZ * 0.05);
    }

    function dotDraw(dot: DotObj) {
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${dot.p.a})`;
      ctx.beginPath();
      ctx.arc(dot.p.x, dot.p.y, dot.p.z, 0, 2 * Math.PI, true);
      ctx.closePath();
      ctx.fill();
    }

    // ── Shape switcher ─────────────────────────────────────────────
    let dots: DotObj[] = [];
    let shapeW = 0, shapeH = 0;

    function switchShape(shapeDots: { x: number; y: number }[], fast?: boolean) {
      // Clear existing queues for clean shape transition
      for (const dot of dots) {
        dot.q = [];
      }
      const n = { dots: [...shapeDots], w: 0, h: 0 };
      // Compute bounding box
      let fx = W, fy = H, mw = 0, mh = 0;
      for (const d of n.dots) {
        mw = d.x > mw ? d.x : mw;
        mh = d.y > mh ? d.y : mh;
        fx = d.x < fx ? d.x : fx;
        fy = d.y < fy ? d.y : fy;
      }
      n.w = mw + fx;
      n.h = mh + fy;
      shapeW = n.w;
      shapeH = n.h;

      const cx = W / 2 - shapeW / 2;
      const cy = H / 2 - shapeH / 2;

      // Add new dots if needed
      if (n.dots.length > dots.length) {
        const size = n.dots.length - dots.length;
        for (let d = 0; d < size; d++) {
          dots.push(createDot(W / 2, H / 2));
        }
      }

      // Assign targets to existing dots
      let d = 0;
      const remaining = [...n.dots];
      while (remaining.length > 0) {
        const i = Math.floor(Math.random() * remaining.length);
        dots[d].e = 0.11;

        if (dots[d].s) {
          dots[d].q.push({ x: 0, y: 0, z: Math.random() * 9 + 3, a: Math.random(), h: 18 });
        } else {
          dots[d].q.push({ x: 0, y: 0, z: Math.random() * 4 + 4, a: 0, h: fast ? 18 : 30 });
        }

        dots[d].s = true;
        dots[d].q.push({
          x: remaining[i].x + cx,
          y: remaining[i].y + cy,
          a: 1,
          z: 4,
          h: 0,
        });

        remaining.splice(i, 1);
        d++;
      }

      // Scatter excess dots
      for (let i = d; i < dots.length; i++) {
        if (dots[i].s) {
          dots[i].q.push({ x: 0, y: 0, z: Math.random() * 9 + 3, a: Math.random(), h: 20 });
          dots[i].s = false;
          dots[i].e = 0.04;
          dots[i].q.push({
            x: Math.random() * W,
            y: Math.random() * H,
            a: 0.3,
            z: Math.random() * 4,
            h: 0,
          });
        }
      }
    }

    // ── Sequence controller ────────────────────────────────────────
    const countdown = 3;
    const sequence: string[] = [];

    // Build sequence: countdown → words → name → full sentence
    sequence.push(`#countdown_${countdown}`);
    for (const w of words) {
      sequence.push(w);
    }
    sequence.push(name);
    sequence.push([...words, name].join(" "));
    sequence.push("#done");

    let seqIndex = 0;
    let seqTimer: ReturnType<typeof setInterval> | null = null;
    let countdownTimer: ReturnType<typeof setInterval> | null = null;
    let doneTimerId: ReturnType<typeof setTimeout> | null = null;

    function getDynamicDelay(str: string): number {
      const base = 1900;
      if (!str || str.startsWith("#")) return base;
      const extra = Math.max(0, (str.length - 5) * 100);
      return base + extra;
    }

    function runCountdown(value: number, callback: () => void) {
      let current = value;
      switchShape(buildShape(String(current)), true);
      countdownTimer = setInterval(() => {
        current--;
        if (current <= 0) {
          if (countdownTimer) clearInterval(countdownTimer);
          callback();
        } else {
          switchShape(buildShape(String(current)), true);
        }
      }, 1400);
    }

    function processSequence() {
      if (seqIndex >= sequence.length) return;

      const current = sequence[seqIndex];
      seqIndex++;

      if (current.startsWith("#countdown_")) {
        const val = parseInt(current.split("_")[1]);
        runCountdown(val, () => {
          processNext();
        });
        return;
      }

      if (current === "#done") {
        // Sequence complete — transition to next scene
        doneTimerId = setTimeout(onComplete, 500);
        return;
      }

      // Regular text
      switchShape(buildShape(current));
      const delay = getDynamicDelay(current);
      seqTimer = setTimeout(() => {
        processNext();
      }, delay);
    }

    function processNext() {
      processSequence();
    }

    // ── Render loop ────────────────────────────────────────────────
    function render() {
      rafRef.current = requestAnimationFrame(render);
      ctx.clearRect(0, 0, W, H);
      for (const dot of dots) {
        dotUpdate(dot);
        dotDraw(dot);
      }
    }

    // Start after fonts loaded
    document.fonts.ready.then(() => {
      processSequence();
    });

    // Fallback: if fonts never resolve, start after 2s
    const fontFallback = setTimeout(() => {
      if (seqIndex === 0) processSequence();
    }, 2000);

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (seqTimer) clearTimeout(seqTimer);
      if (countdownTimer) clearInterval(countdownTimer);
      if (doneTimerId) clearTimeout(doneTimerId);
      clearTimeout(fontFallback);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  );
}
