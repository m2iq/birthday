"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

const STORAGE_KEY = "tiktok_follow_done";
const TRACKED_KEY = "tiktok_follow_counted";
const PENDING_KEY = "tiktok_follow_pending";
const DEVICE_KEY = "tiktok_follow_device_id";
const TIKTOK_URL = "https://www.tiktok.com/@irq.dv";

const VERIFICATION_STEPS = [
  { label: "جاري فتح TikTok...", duration: 800 },
  { label: "التحقق من حسابك...", duration: 1400 },
  { label: "التحقق من المتابعة...", duration: 1600 },
  { label: "جاري تأكيد الاشتراك...", duration: 800 },
  { label: "تم التحقق بنجاح ✓", duration: 400 },
] as const;

const TOTAL_DURATION = VERIFICATION_STEPS.reduce((sum, step) => sum + step.duration, 0);

interface TikTokFollowGateProps {
  children: React.ReactNode;
}

function getOrCreateDeviceId() {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;

  let nextId = "";
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    nextId = crypto.randomUUID();
  } else {
    nextId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  localStorage.setItem(DEVICE_KEY, nextId);
  return nextId;
}

async function markFollowInDatabaseOnce() {
  try {
    if (localStorage.getItem(TRACKED_KEY) === "1") return;
    if (!supabaseConfigured || !supabase) return;

    const deviceId = getOrCreateDeviceId();

    const { error } = await supabase.from("tiktok_follow_events").upsert(
      {
        device_id: deviceId,
        source: "birthday-site",
        account_url: TIKTOK_URL,
        status: "followed",
      },
      { onConflict: "device_id" }
    );

    if (!error) {
      localStorage.setItem(TRACKED_KEY, "1");
    }
  } catch {
    // Keep UX smooth even if analytics insert fails
  }
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getStepProgress(stepIndex: number, elapsedMs: number) {
  const start = VERIFICATION_STEPS
    .slice(0, stepIndex)
    .reduce((sum, step) => sum + step.duration, 0);
  const end = start + VERIFICATION_STEPS[stepIndex].duration;
  return clamp01((elapsedMs - start) / (end - start));
}

function TikTokLogo() {
  return (
    <div className="h-10 w-10 rounded-lg bg-black grid place-items-center border border-white/10 shrink-0">
      <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
        <path
          d="M31 7c.7 5.2 3.7 8.6 9 10.2v5.7c-3.1-.1-6.2-1.1-9-2.9v11.5c0 7.4-4.8 12.6-12.1 12.6-7 0-11.9-5-11.9-11.6 0-7 5.2-12 12.5-12 1 0 1.7.1 2.6.3v6.1a7.9 7.9 0 0 0-2.5-.4c-3.5 0-6 2.4-6 5.9 0 3.4 2.3 5.8 5.6 5.8 3.6 0 5.8-2.3 5.8-6V7h6z"
          fill="white"
        />
      </svg>
    </div>
  );
}

export default function TikTokFollowGate({ children }: TikTokFollowGateProps) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);
  const [progress, setProgress] = useState(0);

  const rafId = useRef<number | null>(null);
  const unlockTimeoutId = useRef<number | null>(null);

  useEffect(() => {
    try {
      const done = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
      if (done) {
        setUnlocked(true);
      }
    } catch {
      // Ignore storage failures and keep gate active
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      if (unlockTimeoutId.current !== null) {
        window.clearTimeout(unlockTimeoutId.current);
      }
    };
  }, []);

  const elapsedMs = progress * TOTAL_DURATION;

  const activeStepIndex = useMemo(() => {
    if (progress >= 1) return VERIFICATION_STEPS.length - 1;

    let acc = 0;
    for (let i = 0; i < VERIFICATION_STEPS.length; i++) {
      acc += VERIFICATION_STEPS[i].duration;
      if (elapsedMs < acc) return i;
    }
    return VERIFICATION_STEPS.length - 1;
  }, [elapsedMs, progress]);

  const startVerification = () => {
    if (verifying || unlocked) return;

    try {
      localStorage.setItem(PENDING_KEY, "1");
    } catch {
      // Ignore storage failures
    }

    window.open(TIKTOK_URL, "_blank", "noopener,noreferrer");

    setShowSuccessCheck(false);
    setProgress(0);
    setVerifying(true);

    const startTime = performance.now();

    const tick = (now: number) => {
      const nextProgress = clamp01((now - startTime) / TOTAL_DURATION);
      setProgress(nextProgress);

      if (nextProgress < 1) {
        rafId.current = requestAnimationFrame(tick);
        return;
      }

      setVerifying(false);
      setShowSuccessCheck(true);

      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // Ignore storage failures and continue to unlock in-memory state
      }

      unlockTimeoutId.current = window.setTimeout(() => {
        setUnlocked(true);
      }, 900);
    };

    rafId.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const handleBackToTab = () => {
      try {
        const pending = localStorage.getItem(PENDING_KEY) === "1";
        if (!pending) return;
        localStorage.removeItem(PENDING_KEY);
        void markFollowInDatabaseOnce();
      } catch {
        // Ignore storage failures
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        handleBackToTab();
      }
    };

    window.addEventListener("focus", handleBackToTab);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", handleBackToTab);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (ready && unlocked) {
    return <>{children}</>;
  }

  const percentage = Math.round(progress * 100);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative isolate">
      <div className="blur-sm opacity-40 pointer-events-none select-none">{children}</div>

      <div className="fixed inset-0 z-120 grid place-items-center p-4 bg-black/60 backdrop-blur-[3px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0b0b15]/95 p-6 shadow-2xl"
          dir="rtl"
        >
          <div className="flex items-center gap-3 mb-5">
            <TikTokLogo />
            <div>
              <h3 className="text-white text-lg font-bold font-arabic">المتابعة ضرورية للإكمال</h3>
              <p className="text-white/65 text-sm font-arabic">تابعنا على TikTok للإكمال ثم ارجع مباشرة</p>
            </div>
          </div>

          <button
            type="button"
            onClick={startVerification}
            disabled={verifying || showSuccessCheck}
            className="w-full mb-5 h-12 rounded-2xl bg-linear-to-r from-black to-[#121212] text-white border border-white/25 hover:border-white/45 hover:shadow-[0_0_24px_rgba(255,255,255,0.12)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold font-arabic">
              <TikTokLogo />
              <span>تابعنا على TikTok للإكمال</span>
            </span>
          </button>

          <div className="mb-4">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-[#25F4EE] via-[#FE2C55] to-[#25F4EE] transition-[width] duration-75"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
              {VERIFICATION_STEPS.map((_, i) => {
                const dotFill = getStepProgress(i, elapsedMs);
                return (
                  <span key={i} className="relative h-2.5 w-2.5 rounded-full bg-white/20 overflow-hidden">
                    <span
                      className="absolute inset-0 rounded-full bg-white"
                      style={{
                        transform: `scale(${0.25 + dotFill * 0.75})`,
                        opacity: 0.35 + dotFill * 0.65,
                      }}
                    />
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 grid place-items-center">
              <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
                <circle cx="40" cy="40" r={radius} stroke="rgba(255,255,255,0.16)" strokeWidth="7" fill="none" />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke={showSuccessCheck ? "#22c55e" : "#ffffff"}
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: "stroke 180ms ease" }}
                />
              </svg>

              <AnimatePresence mode="wait">
                {showSuccessCheck ? (
                  <motion.span
                    key="done"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    className="absolute text-2xl text-green-400"
                  >
                    ✓
                  </motion.span>
                ) : (
                  <motion.span
                    key="percent"
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    className="absolute text-white font-bold text-sm"
                  >
                    {percentage}%
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div className="min-w-0 flex-1">
              <AnimatePresence mode="wait">
                <motion.p
                  key={VERIFICATION_STEPS[activeStepIndex].label}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ duration: 0.24 }}
                  className="text-white text-sm sm:text-base font-medium font-arabic"
                >
                  {VERIFICATION_STEPS[activeStepIndex].label}
                </motion.p>
              </AnimatePresence>
              <p className="mt-1 text-xs text-white/55 font-arabic">جار التحقق... انتظر لحظات بسيطة</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
