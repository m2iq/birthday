"use client";

import { useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";

interface HeartQRProps {
  url: string;
  color?: string;
  size?: number;
}

export default function HeartQR({ url, color = "#d7265a", size = 280 }: HeartQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const totalSize = size;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = totalSize * dpr;
    canvas.height = totalSize * dpr;
    canvas.style.width = `${totalSize}px`;
    canvas.style.height = `${totalSize}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, totalSize, totalSize);

    // Draw the full scannable QR code
    const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
    const modules = qr.modules;
    const modCount = modules.size;

    const qrSize = size * 0.86;
    const qrOffsetX = (totalSize - qrSize) / 2;
    const qrOffsetY = (totalSize - qrSize) / 2;
    const moduleSize = qrSize / modCount;

    // Subtle background for QR area
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.beginPath();
    ctx.roundRect(qrOffsetX - 6, qrOffsetY - 6, qrSize + 12, qrSize + 12, 12);
    ctx.fill();

    // Draw QR modules in the standard square style
    ctx.fillStyle = color;
    for (let row = 0; row < modCount; row++) {
      for (let col = 0; col < modCount; col++) {
        if (!modules.get(row, col)) continue;

        const x = qrOffsetX + col * moduleSize;
        const y = qrOffsetY + row * moduleSize;
        ctx.fillRect(x, y, moduleSize, moduleSize);
      }
    }

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
