"use client";

import { useEffect, useRef } from "react";

interface MatrixRainProps {
  themeColor?: string;
  themeColor2?: string;
  matrixText?: string;
  intensity?: number;
}

/**
 * Matrix Rain — dual-color alternating columns with staggered start,
 * long trails via rgba(0,0,0,0.05) fade, shadowBlur glow on each character.
 * Matches the reference site's rendering approach.
 */
export default function MatrixRain({
  themeColor = "#ff69b4",
  themeColor2 = "#ff1493",
  matrixText = "HAPPYBIRTHDAY",
  intensity = 1,
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intRef = useRef(intensity);

  useEffect(() => { intRef.current = intensity; }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const chars = matrixText.split("");
    const fontSize = 25;
    const intervalTime = 50;

    let columns = 0;
    let drops: number[] = [];
    let columnColors: string[] = [];
    let delays: number[] = [];
    let started: boolean[] = [];
    let maxLength = 0;
    let startTime = Date.now();

    const setup = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      maxLength = Math.floor(canvas.height / fontSize) + 2;

      drops = [];
      columnColors = [];
      delays = [];
      started = [];

      for (let x = 0; x < columns; x++) {
        drops[x] = 0;
        columnColors[x] = x % 2 === 0 ? themeColor : themeColor2;
        delays[x] = Math.random() * 2000;
        started[x] = false;
      }
      startTime = Date.now();
    };

    setup();

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${fontSize}px Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace`;

      const currentTime = Date.now();

      for (let i = 0; i < drops.length; i++) {
        if (!started[i] && currentTime - startTime >= delays[i]) {
          started[i] = true;
        }

        if (started[i] && drops[i] < maxLength) {
          const text = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          const color = columnColors[i];
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.fillText(text, x, y);
          ctx.shadowBlur = 0;
        }

        if (started[i]) {
          drops[i]++;
        }

        if (drops[i] >= maxLength) {
          drops[i] = 0;
          delays[i] = Math.random() * 1000;
          started[i] = false;
        }
      }
    };

    intervalRef.current = setInterval(draw, intervalTime);

    const onResize = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setup();
      intervalRef.current = setInterval(draw, intervalTime);
    };
    window.addEventListener("resize", onResize);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [themeColor, themeColor2, matrixText]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 w-full h-full"
      style={{ background: "#000" }}
    />
  );
}
