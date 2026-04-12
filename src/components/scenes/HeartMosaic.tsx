"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

interface HeartMosaicProps {
  photos: string[];
  onComplete: () => void;
  themeColor?: string;
}

function generateHeartPoints(
  count: number,
  scale: number,
  cx: number,
  cy: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)
    );
    points.push({ x: cx + x * scale, y: cy + y * scale });
  }
  return points;
}

export default function HeartMosaic({
  photos,
  onComplete,
  themeColor = "#ff2d75",
}: HeartMosaicProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t1 = setTimeout(() => setVisible(true), 500);
    const t2 = setTimeout(() => onComplete(), 8000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  const { heartPoints, photoSize, centerX, centerY } = useMemo(() => {
    if (!mounted)
      return { heartPoints: [], photoSize: 50, centerX: 400, centerY: 300 };
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isMobile = w < 640;
    const isTablet = w >= 640 && w < 1024;
    const scale = Math.min(w, h) * (isMobile ? 0.014 : isTablet ? 0.016 : 0.018);
    const size = isMobile ? 32 : isTablet ? 42 : 55;
    const count = isMobile
      ? Math.max(16, Math.floor((w * h) / 25000))
      : Math.max(20, Math.min(50, Math.floor((w * h) / 15000)));
    return {
      heartPoints: generateHeartPoints(count, scale, w / 2, h / 2 - 20),
      photoSize: size,
      centerX: w / 2,
      centerY: h / 2,
    };
  }, [mounted]);

  const effectivePhotos =
    photos.length > 0
      ? photos
      : [
          `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${themeColor}"/></svg>`)}`,
          `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#a855f7"/></svg>`)}`,
          `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#ffd700"/></svg>`)}`,
        ];

  // Pre-generate confetti data to avoid hydration issues
  const confettiData = useMemo(() => {
    if (!mounted) return [];
    const colors = ["#ff6f91", "#ff9671", "#ffc75f", "#f9f871", "#ff3c78"];
    return Array.from({ length: 30 }, (_, i) => ({
      color: colors[i % colors.length],
      x: (Math.random() - 0.5) * 500,
      y: Math.random() * -500 - 100,
      delay: i * 0.04,
      size: Math.random() * 6 + 4,
    }));
  }, [mounted]);

  return (
    <motion.div
      className="fixed inset-0 z-20 bg-[#050510] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Glow center */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-15 blur-[80px]"
        style={{ backgroundColor: themeColor }}
      />

      {/* Heart photos */}
      {mounted &&
        visible &&
        heartPoints.map((point, i) => {
          const photo = effectivePhotos[i % effectivePhotos.length];
          return (
            <motion.div
              key={i}
              className="absolute rounded-[12px] overflow-hidden"
              style={{
                width: photoSize,
                height: photoSize,
                boxShadow: `0 0 20px ${themeColor}88`,
                border: "3px solid white",
                background: "white",
                left: 0,
                top: 0,
                zIndex: 300,
              }}
              initial={{
                x: centerX - photoSize / 2,
                y: centerY - photoSize / 2,
                opacity: 0,
                scale: 0,
              }}
              animate={{
                x: point.x - photoSize / 2,
                y: point.y - photoSize / 2,
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.08,
                ease: "easeOut",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </motion.div>
          );
        })}

      {/* Confetti burst */}
      {mounted &&
        visible &&
        confettiData.map((c, i) => (
          <motion.div
            key={`confetti-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: c.size,
              height: c.size,
              backgroundColor: c.color,
              left: "50%",
              top: "50%",
              zIndex: 400,
            }}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              x: c.x,
              y: c.y,
            }}
            transition={{
              duration: 1.2,
              delay: c.delay,
              ease: "easeOut",
            }}
          />
        ))}

      {/* Pulse glow on heart */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full pointer-events-none"
        style={{ backgroundColor: themeColor }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}
