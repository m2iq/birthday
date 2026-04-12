"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import {
  Cake,
  Sparkles,
  Camera,
  Palette,
  Rocket,
  Music,
  Eye,
  CheckCircle,
  X,
  Copy,
  Share2,
  Check,
} from "lucide-react";
import type { BirthdayConfig } from "@/lib/types";
import { DEFAULT_CONFIG } from "@/lib/types";
import {
  saveBirthdayConfig,
  saveBirthdayConfigToSupabase,
  supabaseConfigured,
} from "@/lib/storage";
import HeartQR from "@/components/HeartQR";

const COLOR_PRESETS = [
  { label: "Rose", value: "#ff2d75" },
  { label: "Purple", value: "#a855f7" },
  { label: "Gold", value: "#ffd700" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Emerald", value: "#10b981" },
  { label: "Orange", value: "#f97316" },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Compress image to max dimension and JPEG quality to keep base64 small */
function compressImage(file: File, maxDim = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function CreatorPage() {
  const [config, setConfig] = useState<BirthdayConfig>({
    ...DEFAULT_CONFIG,
    id: "",
  });
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareModal, setShareModal] = useState<{
    url: string;
    id: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicRef = useRef<HTMLInputElement>(null);

  const updateConfig = useCallback(
    (partial: Partial<BirthdayConfig>) => {
      setConfig((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos: string[] = [];
    for (let i = 0; i < Math.min(files.length, 10); i++) {
      const compressed = await compressImage(files[i]);
      newPhotos.push(compressed);
    }
    updateConfig({ photos: [...config.photos, ...newPhotos].slice(0, 10) });
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    updateConfig({ musicUrl: base64 });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const id = uuidv4().slice(0, 8);
    const finalConfig = { ...config, id, createdAt: Date.now() };

    // Always save to localStorage
    saveBirthdayConfig(finalConfig);

    // Also save to Supabase if configured
    if (supabaseConfigured) {
      try {
        await saveBirthdayConfigToSupabase(finalConfig);
      } catch (err) {
        console.warn("Supabase save failed, using localStorage only:", err);
      }
    }

    const shareUrl = `${window.location.origin}/birthday/${id}`;
    setIsGenerating(false);
    setShareModal({ url: shareUrl, id });
  };

  const handlePreview = () => {
    const id = "preview_" + Date.now();
    const finalConfig = { ...config, id, createdAt: Date.now() };
    saveBirthdayConfig(finalConfig);
    window.open(`/birthday/${id}`, "_blank");
  };

  const handleCopyLink = async () => {
    if (!shareModal) return;
    try {
      await navigator.clipboard.writeText(shareModal.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = shareModal.url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stepIcons = [
    <Sparkles key="s" className="w-4 h-4" />,
    <Camera key="c" className="w-4 h-4" />,
    <Palette key="p" className="w-4 h-4" />,
    <Rocket key="r" className="w-4 h-4" />,
  ];
  const steps = [
    { title: "الاسم والرسالة", icon: stepIcons[0] },
    { title: "الصور", icon: stepIcons[1] },
    { title: "الألوان والموسيقى", icon: stepIcons[2] },
    { title: "معاينة ونشر", icon: stepIcons[3] },
  ];

  return (
    <div className="min-h-screen bg-[#050510] text-white">
      {/* Header */}
      <motion.header
        className="relative py-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="flex items-center justify-center gap-3 text-2xl sm:text-4xl font-bold text-glow-accent font-arabic">
          <Cake className="w-7 h-7 sm:w-9 sm:h-9 text-[#ff2d75]" strokeWidth={1.5} />
          صانع عيد الميلاد
        </h1>
        <p className="text-white/50 mt-2 text-sm font-arabic" dir="rtl">
          صمم تجربة عيد ميلاد سينمائية
        </p>
      </motion.header>

      {/* Step indicator */}
      <div className="max-w-2xl mx-auto px-4 mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`flex flex-col items-center gap-1 transition-all ${
                i === step
                  ? "text-white scale-110"
                  : i < step
                    ? "text-white/60"
                    : "text-white/30"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  i === step
                    ? "border-[var(--accent)] bg-[var(--accent)]/20"
                    : i < step
                      ? "border-white/30 bg-white/5"
                      : "border-white/10 bg-transparent"
                }`}
              >
                {i < step ? <CheckCircle className="w-4 h-4" /> : s.icon}
              </div>
              <span className="text-[10px] sm:text-xs hidden sm:block">
                {s.title}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: config.themeColor }}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-2xl mx-auto px-4 pb-24">
        <AnimatePresence mode="wait">
          {/* Step 0: Name & Message */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Field label="اسم الشخص" hint="الاسم الذي سيظهر في التجربة">
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => updateConfig({ name: e.target.value })}
                  className="input-field"
                  dir="rtl"
                  placeholder="حبيبي"
                />
              </Field>

              <Field
                label="كلمات التهنئة"
                hint="الكلمات التي تظهر كل واحدة على حدة (مفصولة بفاصلة)"
              >
                <input
                  type="text"
                  value={config.messageWords.join(", ")}
                  onChange={(e) =>
                    updateConfig({
                      messageWords: e.target.value
                        .split(",")
                        .map((w) => w.trim())
                        .filter(Boolean),
                    })
                  }
                  className="input-field"
                  dir="rtl"
                  placeholder="عيد, ميلاد, سعيد, يا"
                />
              </Field>

              <Field label="رسالة الحب" hint="رسالتك الخاصة داخل الكتاب والظرف">
                <textarea
                  value={config.letterMessage}
                  onChange={(e) =>
                    updateConfig({ letterMessage: e.target.value })
                  }
                  className="input-field min-h-[120px] resize-none"
                  dir="rtl"
                  placeholder="اكتب رسالتك هنا..."
                />
              </Field>
            </motion.div>
          )}

          {/* Step 1: Photos */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Field
                label="الصور"
                hint="الصور تظهر في صفحات الكتاب وشكل القلب (حتى ١٠ صور)"
              >
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {config.photos.map((photo, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group"
                    >
                      <img
                        src={photo}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() =>
                          updateConfig({
                            photos: config.photos.filter((_, j) => j !== i),
                          })
                        }
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {config.photos.length < 10 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/40 transition-all"
                    >
                      +
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </Field>
            </motion.div>
          )}

          {/* Step 2: Colors & Music */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Field label="لون السمة" hint="اختر اللون الرئيسي">
                <div className="flex gap-3 flex-wrap">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => updateConfig({ themeColor: color.value })}
                      className={`w-12 h-12 rounded-full border-2 transition-all ${
                        config.themeColor === color.value
                          ? "border-white scale-110 shadow-lg"
                          : "border-white/20 hover:border-white/40"
                      }`}
                      style={{
                        backgroundColor: color.value,
                        boxShadow:
                          config.themeColor === color.value
                            ? `0 0 20px ${color.value}66`
                            : undefined,
                      }}
                      title={color.label}
                    />
                  ))}
                  <div className="relative">
                    <input
                      type="color"
                      value={config.themeColor}
                      onChange={(e) =>
                        updateConfig({ themeColor: e.target.value })
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer w-12 h-12"
                    />
                    <div
                      className="w-12 h-12 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center text-white/50 text-xs"
                    >
                      <Palette className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Field>

              <Field label="موسيقى خلفية" hint="ارفع ملف موسيقى (MP3)">
                <button
                  onClick={() => musicRef.current?.click()}
                  className="w-full py-4 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center gap-2 text-white/50 hover:text-white/70 hover:border-white/40 transition-all"
                >
                  {config.musicUrl ? (
                    <>
                      <Music className="w-5 h-5" />
                      <span className="text-sm font-arabic">تم رفع الموسيقى</span>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </>
                  ) : (
                    <>
                      <Music className="w-5 h-5" />
                      <span className="text-sm font-arabic">رفع ملف موسيقى</span>
                    </>
                  )}
                </button>
                <input
                  ref={musicRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleMusicUpload}
                />
              </Field>
            </motion.div>
          )}

          {/* Step 3: Preview & Publish */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Summary card */}
              <div
                className="rounded-xl p-6 border"
                style={{
                  borderColor: `${config.themeColor}33`,
                  background: `linear-gradient(145deg, ${config.themeColor}08, transparent)`,
                }}
              >
                <h3 className="text-lg font-semibold mb-4" dir="rtl">
                  ملخص الإعدادات
                </h3>
                <div className="space-y-3 text-sm text-white/70" dir="rtl">
                  <div className="flex justify-between">
                    <span>الاسم:</span>
                    <span className="text-white">{config.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>كلمات التهنئة:</span>
                    <span className="text-white">
                      {config.messageWords.join(" ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>عدد الصور:</span>
                    <span className="text-white">{config.photos.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>اللون:</span>
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: config.themeColor }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>موسيقى:</span>
                    <span className="text-white">
                      {config.musicUrl ? <CheckCircle className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-white/30" />}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePreview}
                  className="flex-1 py-3 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm font-arabic flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" /> معاينة
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 py-3 rounded-lg font-semibold text-white transition-all text-sm disabled:opacity-50 font-arabic flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: config.themeColor,
                    boxShadow: `0 0 30px ${config.themeColor}44`,
                  }}
                >
                  {isGenerating ? "جاري الإنشاء..." : <><Rocket className="w-4 h-4" /> إنشاء الرابط</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#050510] via-[#050510] to-transparent">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm font-arabic"
            >
              السابق ←
            </motion.button>
          )}
          {step < steps.length - 1 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setStep(step + 1)}
              className="ml-auto px-6 py-3 rounded-lg font-medium text-white transition-all text-sm font-arabic"
              style={{
                backgroundColor: config.themeColor,
                boxShadow: `0 0 20px ${config.themeColor}33`,
              }}
            >
              التالي →
            </motion.button>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {shareModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShareModal(null)}
          >
            <motion.div
              className="relative w-full max-w-sm rounded-2xl p-6 border border-white/10"
              style={{
                background: `linear-gradient(145deg, #0a0a1a, #050510)`,
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 text-white/40 hover:text-white"
                onClick={() => setShareModal(null)}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-5">
                <Share2
                  className="w-8 h-8 mx-auto mb-2"
                  style={{ color: config.themeColor }}
                />
                <h3 className="text-lg font-bold text-white font-arabic" dir="rtl">
                  تم إنشاء التجربة!
                </h3>
                <p className="text-white/50 text-xs mt-1 font-arabic" dir="rtl">
                  شارك الرابط أو رمز QR
                </p>
              </div>

              {/* Heart QR Code */}
              <div className="flex justify-center mb-5">
                <HeartQR
                  url={shareModal.url}
                  color={config.themeColor}
                  size={220}
                />
              </div>

              {/* URL display + copy */}
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs truncate"
                  dir="ltr"
                >
                  {shareModal.url}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-white text-xs font-medium transition-all"
                  style={{ backgroundColor: config.themeColor }}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> تم
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> نسخ
                    </>
                  )}
                </button>
              </div>

              {/* Open link */}
              <a
                href={shareModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 rounded-lg text-center font-medium text-white text-sm font-arabic transition-all"
                style={{
                  backgroundColor: config.themeColor,
                  boxShadow: `0 0 20px ${config.themeColor}33`,
                }}
              >
                فتح التجربة
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: white;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .input-field:focus {
          border-color: ${config.themeColor}66;
          box-shadow: 0 0 20px ${config.themeColor}11;
        }
        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block mb-2">
        <span className="text-sm font-medium text-white/90">{label}</span>
        {hint && (
          <span className="block text-xs text-white/40 mt-0.5">{hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}
