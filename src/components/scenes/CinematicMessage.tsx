"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CinematicMessageProps {
  words: string[];
  name: string;
  onComplete: () => void;
  themeColor?: string;
}

const IMPORTANT_WORDS = new Set(["عيد", "ميلاد", "سعيد", "مبارك"]);

export default function CinematicMessage({
  words,
  name,
  onComplete,
  themeColor = "#ff2e88",
}: CinematicMessageProps) {
  // Phases: "words" → show each word one by one, "name" → show name, "full" → show all together, "exit" → fade out
  const [phase, setPhase] = useState<"words" | "name" | "full" | "exit">("words");
  const [wordIdx, setWordIdx] = useState(0);
  const [showCurrent, setShowCurrent] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isImportant = useCallback(
    (word: string) => IMPORTANT_WORDS.has(word),
    []
  );

  // Word-by-word phase
  useEffect(() => {
    if (phase !== "words") return;
    timerRef.current = setTimeout(() => {
      setShowCurrent(false);
      setTimeout(() => {
        if (wordIdx < words.length - 1) {
          setWordIdx((i) => i + 1);
          setShowCurrent(true);
        } else {
          setPhase("name");
          setShowCurrent(true);
        }
      }, 400);
    }, 1600);
    return () => clearTimeout(timerRef.current);
  }, [phase, wordIdx, words.length]);

  // Name phase
  useEffect(() => {
    if (phase !== "name") return;
    timerRef.current = setTimeout(() => {
      setShowCurrent(false);
      setTimeout(() => {
        setPhase("full");
        setShowCurrent(true);
      }, 400);
    }, 2000);
    return () => clearTimeout(timerRef.current);
  }, [phase]);

  // Full message phase → then exit
  useEffect(() => {
    if (phase !== "full") return;
    timerRef.current = setTimeout(() => {
      setShowCurrent(false);
      setTimeout(() => onComplete(), 600);
    }, 3000);
    return () => clearTimeout(timerRef.current);
  }, [phase, onComplete]);

  const fullMessage = [...words, name].join(" ");

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none"
      dir="rtl"
    >
      <AnimatePresence mode="wait">
        {/* Individual words */}
        {phase === "words" && showCurrent && (
          <motion.div
            key={`word-${wordIdx}`}
            initial={{ opacity: 0, filter: "blur(18px)", scale: 0.8, y: 30 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1, y: 0 }}
            exit={{ opacity: 0, filter: "blur(12px)", scale: 1.1, y: -20 }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className={`font-arabic select-none text-center ${
              isImportant(words[wordIdx])
                ? "text-cinematic-strong text-shimmer"
                : "text-cinematic"
            }`}
            style={{
              fontSize: isImportant(words[wordIdx])
                ? "clamp(4rem, 14vw, 10rem)"
                : "clamp(3rem, 10vw, 7rem)",
              fontWeight: isImportant(words[wordIdx]) ? 900 : 700,
              color: isImportant(words[wordIdx]) ? themeColor : "#fff",
              textShadow: isImportant(words[wordIdx])
                ? `0 0 30px ${themeColor}, 0 0 60px ${themeColor}88, 0 0 100px ${themeColor}44`
                : `0 0 15px ${themeColor}88, 0 0 40px ${themeColor}44`,
            }}
          >
            {words[wordIdx]}
          </motion.div>
        )}

        {/* Name */}
        {phase === "name" && showCurrent && (
          <motion.div
            key="name"
            initial={{ opacity: 0, filter: "blur(20px)", scale: 0.6 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(14px)", scale: 1.15 }}
            transition={{
              duration: 1.0,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="font-arabic text-cinematic-gold text-shimmer select-none text-center"
            style={{
              fontSize: "clamp(4.5rem, 16vw, 12rem)",
              fontWeight: 900,
              textShadow: `
                0 0 30px ${themeColor},
                0 0 60px ${themeColor}aa,
                0 0 100px ${themeColor}66,
                0 0 150px ${themeColor}33
              `,
            }}
          >
            {name}
          </motion.div>
        )}

        {/* Full message */}
        {phase === "full" && showCurrent && (
          <motion.div
            key="full"
            initial={{ opacity: 0, filter: "blur(16px)", y: 20 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, filter: "blur(10px)", y: -15 }}
            transition={{
              duration: 1.2,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="font-arabic text-cinematic select-none text-center px-8 max-w-4xl"
            style={{
              fontSize: "clamp(2rem, 6vw, 4.5rem)",
              fontWeight: 700,
              lineHeight: 1.4,
              color: "#fff",
              textShadow: `0 0 20px ${themeColor}88, 0 0 50px ${themeColor}44`,
            }}
          >
            {fullMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
