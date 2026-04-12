"use client";

import { useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";

interface HeartQRProps {
  url: string;
  color?: string;
  size?: number;
}

/** Check if a point (px, py) is inside a heart shape centered at (cx, cy) */
function isInsideHeart(
  px: number,
  py: number,
  cx: number,
  cy: number,
  scale: number
): boolean {
  const x = (px - cx) / scale;
  // Shift y so heart center appears visually centered
  const y = -(py - cy) / scale + 0.4;
  const eq = x * x + (y - Math.sqrt(Math.abs(x))) ** 2;
  return eq <= 1.1;
}

export default function HeartQR({ url, color = "#ff2d75", size = 280 }: HeartQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Generate QR data matrix
    const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
    const modules = qr.modules;
    const modCount = modules.size; // e.g. 25, 29, 33 etc.

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const padding = size * 0.08;
    const qrAreaSize = size - padding * 2;
    const moduleSize = qrAreaSize / modCount;

    const cx = size / 2;
    const cy = size / 2;
    const heartScale = size * 0.38;

    // Draw glow behind heart
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.45);
    gradient.addColorStop(0, color + "22");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Helper to check if module is part of a finder pattern
    function isFinderPattern(row: number, col: number): boolean {
      // Top-left
      if (row < 7 && col < 7) return true;
      // Top-right
      if (row < 7 && col >= modCount - 7) return true;
      // Bottom-left
      if (row >= modCount - 7 && col < 7) return true;
      return false;
    }

    // Draw modules
    for (let row = 0; row < modCount; row++) {
      for (let col = 0; col < modCount; col++) {
        if (!modules.get(row, col)) continue;

        const x = padding + col * moduleSize;
        const y = padding + row * moduleSize;
        const centerModX = x + moduleSize / 2;
        const centerModY = y + moduleSize / 2;

        const inside = isInsideHeart(centerModX, centerModY, cx, cy, heartScale);
        const isFinder = isFinderPattern(row, col);

        if (!inside && !isFinder) continue;

        const radius = moduleSize * 0.42;

        if (isFinder) {
          // Finder patterns: solid rounded squares with theme color
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(x + 0.5, y + 0.5, moduleSize - 1, moduleSize - 1, 2);
          ctx.fill();
        } else {
          // Regular modules: circles
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(centerModX, centerModY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw a small heart in the center (logo area)
    const logoSize = size * 0.14;
    ctx.save();
    ctx.translate(cx, cy - logoSize * 0.1);
    ctx.scale(logoSize / 32, logoSize / 32);
    ctx.beginPath();
    // Heart path
    ctx.moveTo(0, -6);
    ctx.bezierCurveTo(-14, -22, -30, -4, 0, 14);
    ctx.moveTo(0, -6);
    ctx.bezierCurveTo(14, -22, 30, -4, 0, 14);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }, [url, color, size]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto"
      style={{ width: size, height: size }}
    />
  );
}
