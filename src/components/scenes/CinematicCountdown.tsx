"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CinematicCountdownProps {
  onComplete: () => void;
  themeColor?: string;
}

const numbers = [3, 2, 1];

export default function CinematicCountdown({
  onComplete,
  themeColor = "#ff2e88",
}: CinematicCountdownProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showNumber, setShowNumber] = useState(true);

  const advance = useCallback(() => {
    if (currentIdx < numbers.length - 1) {
      setShowNumber(false);
      setTimeout(() => {
        setCurrentIdx((i) => i + 1);
        setShowNumber(true);
      }, 400);
    } else {
      setShowNumber(false);
      setTimeout(() => onComplete(), 500);
    }
  }, [currentIdx, onComplete]);

  useEffect(() => {
    const timer = setTimeout(advance, 1400);
    return () => clearTimeout(timer);
  }, [currentIdx, advance]);

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none">
      <AnimatePresence mode="wait">
        {showNumber && (
          <motion.div
            key={numbers[currentIdx]}
            initial={{
              opacity: 0,
              scale: 0.5,
              filter: "blur(20px)",
            }}
            animate={{
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
            }}
            exit={{
              opacity: 0,
              scale: 1.8,
              filter: "blur(16px)",
            }}
            transition={{
              duration: 0.7,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="text-pulse-glow select-none"
            style={{
              fontSize: "clamp(6rem, 20vw, 14rem)",
              fontWeight: 900,
              fontFamily: "var(--font-noto-kufi)",
              color: "#fff",
              textShadow: `
                0 0 20px ${themeColor},
                0 0 40px ${themeColor},
                0 0 80px ${themeColor}88,
                0 0 120px ${themeColor}44
              `,
            }}
          >
            {numbers[currentIdx]}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
