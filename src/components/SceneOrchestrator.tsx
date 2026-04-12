"use client";

import { useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useBirthdayStore } from "@/lib/store";
import type { BirthdayConfig } from "@/lib/types";
import MatrixRain from "./scenes/MatrixRain";
import CinematicIntro from "./scenes/CinematicIntro";
import MagicBook from "./scenes/MagicBook";
import HeartMosaic from "./scenes/HeartMosaic";
import AmbientParticles from "./AmbientParticles";

interface SceneOrchestratorProps {
  config: BirthdayConfig;
  onBookOpen?: () => void;
}

const FULLSCREEN_SCENES = new Set(["book", "heart"]);

function lightenHex(hex: string, amount = 0.35): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.min(255, Math.round(r + (255 - r) * amount));
  const lg = Math.min(255, Math.round(g + (255 - g) * amount));
  const lb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

export default function SceneOrchestrator({ config, onBookOpen }: SceneOrchestratorProps) {
  const { currentScene, nextScene } = useBirthdayStore();

  const handleSceneComplete = useCallback(() => {
    nextScene();
  }, [nextScene]);

  const isFullscreen = FULLSCREEN_SCENES.has(currentScene);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* ── Layer 0: Persistent Matrix Rain ── */}
      {!isFullscreen && (
        <MatrixRain
          themeColor={config.themeColor}
          themeColor2={lightenHex(config.themeColor)}
          intensity={1}
        />
      )}

      {/* ── Layer 1: Ambient particles ── */}
      <AmbientParticles themeColor={config.themeColor} />

      {/* ── Layer 2: Shapeshifter particle text (intro scene) ── */}
      {currentScene === "intro" && (
        <CinematicIntro
          words={config.messageWords}
          name={config.name}
          onComplete={handleSceneComplete}
          themeColor={config.themeColor}
        />
      )}

      {/* ── Layer 4: Full-screen scenes ── */}
      <AnimatePresence mode="wait">
        {currentScene === "book" && (
          <MagicBook
            key="book"
            photos={config.photos}
            message={config.letterMessage}
            name={config.name}
            onComplete={handleSceneComplete}
            themeColor={config.themeColor}
            onBookOpen={onBookOpen}
          />
        )}

        {currentScene === "heart" && (
          <HeartMosaic
            key="heart"
            photos={config.photos}
            onComplete={handleSceneComplete}
            themeColor={config.themeColor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
