"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CinematicTextProps {
  text: string;
  visible: boolean;
  /** "word" animates word by word; "letter" animates letter by letter */
  mode?: "word" | "letter" | "block";
  /** Extra emphasis: bigger glow + shimmer */
  emphasis?: boolean;
  /** Custom className for the text container */
  className?: string;
  /** Delay before the animation starts (seconds) */
  delay?: number;
  /** Duration of each unit's reveal (seconds) */
  unitDuration?: number;
  /** Stagger between units (seconds) */
  stagger?: number;
  onComplete?: () => void;
}

const containerVariants = {
  hidden: {},
  visible: (custom: { stagger: number; delay: number }) => ({
    transition: {
      staggerChildren: custom.stagger,
      delayChildren: custom.delay,
    },
  }),
  exit: {
    opacity: 0,
    transition: { duration: 0.5 },
  },
};

const blockVariants = {
  hidden: {
    opacity: 0,
    filter: "blur(18px)",
    scale: 0.85,
    y: 30,
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    y: 0,
    transition: {
      duration: 1.2,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    filter: "blur(12px)",
    scale: 1.05,
    y: -20,
    transition: { duration: 0.6 },
  },
};

const unitVariants = {
  hidden: {
    opacity: 0,
    filter: "blur(14px)",
    y: 20,
  },
  visible: (custom: { duration: number }) => ({
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: {
      duration: custom.duration,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

export default function CinematicText({
  text,
  visible,
  mode = "block",
  emphasis = false,
  className = "",
  delay = 0,
  unitDuration = 0.8,
  stagger = 0.15,
  onComplete,
}: CinematicTextProps) {
  const emphasisClass = emphasis
    ? "text-cinematic-strong text-shimmer"
    : "text-cinematic";

  if (mode === "block") {
    return (
      <AnimatePresence mode="wait" onExitComplete={onComplete}>
        {visible && (
          <motion.div
            key={text}
            variants={blockVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ delay }}
            className={`font-arabic ${emphasisClass} ${className}`}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const units =
    mode === "word"
      ? text.split(/\s+/).filter(Boolean)
      : text.split("");

  return (
    <AnimatePresence mode="wait" onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key={text}
          className={`flex flex-wrap justify-center gap-x-3 gap-y-1 font-arabic ${className}`}
          variants={containerVariants}
          custom={{ stagger, delay }}
          initial="hidden"
          animate="visible"
          exit="exit"
          onAnimationComplete={() => onComplete?.()}
          dir="rtl"
        >
          {units.map((unit, i) => (
            <motion.span
              key={`${unit}-${i}`}
              variants={unitVariants}
              custom={{ duration: unitDuration }}
              className={emphasisClass}
            >
              {unit}
            </motion.span>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
