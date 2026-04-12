import { create } from "zustand";
import type { BirthdayConfig, SceneName } from "./types";
import { DEFAULT_CONFIG } from "./types";

interface BirthdayState {
  config: BirthdayConfig;
  currentScene: SceneName;
  sceneProgress: number;
  isPlaying: boolean;
  isMuted: boolean;
  setConfig: (config: Partial<BirthdayConfig>) => void;
  setScene: (scene: SceneName) => void;
  setSceneProgress: (progress: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMuted: (muted: boolean) => void;
  nextScene: () => void;
}

const SCENE_ORDER: SceneName[] = [
  "intro",
  "book",
  "heart",
];

export const useBirthdayStore = create<BirthdayState>((set, get) => ({
  config: DEFAULT_CONFIG,
  currentScene: "intro",
  sceneProgress: 0,
  isPlaying: false,
  isMuted: false,
  setConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),
  setScene: (scene) => set({ currentScene: scene, sceneProgress: 0 }),
  setSceneProgress: (progress) => set({ sceneProgress: progress }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsMuted: (muted) => set({ isMuted: muted }),
  nextScene: () => {
    const { currentScene } = get();
    const idx = SCENE_ORDER.indexOf(currentScene);
    if (idx < SCENE_ORDER.length - 1) {
      set({ currentScene: SCENE_ORDER[idx + 1], sceneProgress: 0 });
    }
  },
}));
