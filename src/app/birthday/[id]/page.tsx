"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { loadBirthdayConfig, loadBirthdayConfigFromSupabase } from "@/lib/storage";
import { useBirthdayStore } from "@/lib/store";
import type { BirthdayConfig } from "@/lib/types";
import { DEFAULT_CONFIG } from "@/lib/types";
import SceneOrchestrator from "@/components/SceneOrchestrator";

export default function BirthdayPage() {
  const params = useParams();
  const id = params.id as string;
  const [config, setConfig] = useState<BirthdayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { setConfig: setStoreConfig, setScene } = useBirthdayStore();

  // Load config from localStorage first, then Supabase
  useEffect(() => {
    async function load() {
      let loaded = loadBirthdayConfig(id);
      if (!loaded) {
        loaded = await loadBirthdayConfigFromSupabase(id);
      }
      if (loaded) {
        setConfig(loaded);
        setStoreConfig(loaded);
      } else {
        const demo = { ...DEFAULT_CONFIG, id };
        setConfig(demo);
        setStoreConfig(demo);
      }
      // Auto-start: go directly to intro scene
      setScene("intro");
      setLoading(false);
    }
    load();
  }, [id, setStoreConfig, setScene]);

  // Create audio element once config is available
  useEffect(() => {
    if (!config?.musicUrl) return;
    const audio = new Audio();
    audio.src = config.musicUrl;
    audio.loop = true;
    audio.volume = 0.3;
    audio.preload = "auto";
    audio.oncanplaythrough = () => setAudioReady(true);
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [config?.musicUrl]);

  // Sync mute state
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  /** Called by MagicBook on the user's first tap — plays music */
  const handleBookOpen = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full"
        />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center text-white/60">
        <p className="font-arabic" dir="rtl">لم يتم العثور على تجربة عيد الميلاد</p>
      </div>
    );
  }

  return (
    <>
      <SceneOrchestrator config={config} onBookOpen={handleBookOpen} />
      {/* Mute/unmute button — always visible when audio exists */}
      {config.musicUrl && (
        <motion.button
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          onClick={() => setMuted((m) => !m)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          {muted ? <VolumeX className="w-[18px] h-[18px]" /> : <Volume2 className="w-[18px] h-[18px]" />}
        </motion.button>
      )}
    </>
  );
}
