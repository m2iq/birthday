"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Cake, Sparkles, Eye, CloudRain, BookOpen, Heart, FolderOpen } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center overflow-hidden relative">
      {/* Background ambient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#ff2d75] opacity-[0.04] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#a855f7] opacity-[0.04] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#ffd700] opacity-[0.03] blur-[100px]" />
      </div>

      {/* Floating background particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[2px] h-[2px] rounded-full"
          style={{
            backgroundColor:
              i % 3 === 0 ? "#ff2d75" : i % 3 === 1 ? "#a855f7" : "#ffd700",
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [800, -20],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 6 + Math.random() * 8,
            delay: Math.random() * 6,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Content */}
      <motion.div
        className="text-center z-10 px-4 max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Logo/Icon */}
        <motion.div
          className="flex justify-center mb-8"
          animate={{
            y: [0, -10, 0],
            rotateZ: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Cake className="w-16 h-16 sm:w-20 sm:h-20 text-[#ff2d75]" strokeWidth={1.5} />
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-[#ff2d75] via-[#a855f7] to-[#ffd700] bg-clip-text text-transparent font-arabic"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          dir="rtl"
        >
          تجربة عيد ميلاد
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-white/50 text-base sm:text-xl mb-2 font-arabic"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          dir="rtl"
        >
          صمم تجربة عيد ميلاد سينمائية مذهلة
        </motion.p>

        <motion.p
          className="text-white/30 text-xs sm:text-sm mb-10 font-arabic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          dir="rtl"
        >
          اصنع لحظات لا تُنسى لأحبائك
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <Link href="/create">
            <motion.span
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#ff2d75] to-[#a855f7] text-white font-semibold text-base sm:text-lg shadow-lg cursor-pointer font-arabic"
              style={{
                boxShadow: "0 0 40px rgba(255, 45, 117, 0.3)",
              }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(255, 45, 117, 0.4)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-5 h-5" />
              إنشاء تجربة
            </motion.span>
          </Link>

          <Link href="/birthday/demo">
            <motion.span
              className="flex items-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white/70 font-medium text-base sm:text-lg hover:text-white hover:bg-white/5 transition-all cursor-pointer font-arabic"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye className="w-5 h-5" />
              عرض تجريبي
            </motion.span>
          </Link>

          <Link href="/projects">
            <motion.span
              className="flex items-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white/70 font-medium text-base sm:text-lg hover:text-white hover:bg-white/5 transition-all cursor-pointer font-arabic"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FolderOpen className="w-5 h-5" />
              مشاريعي
            </motion.span>
          </Link>
        </motion.div>

        {/* Features */}
        <motion.div
          className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          {[
            { icon: <CloudRain className="w-6 h-6" />, label: "مطر النجوم" },
            { icon: <Sparkles className="w-6 h-6" />, label: "تأثيرات جسيمية" },
            { icon: <BookOpen className="w-6 h-6" />, label: "كتاب الذكريات" },
            { icon: <Heart className="w-6 h-6" />, label: "رسالة حب" },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center flex flex-col items-center"
              whileHover={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.12)",
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-[#ff2d75] mb-2">{feature.icon}</div>
              <div className="text-[10px] sm:text-xs text-white/40">{feature.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="absolute bottom-4 flex items-center gap-1 text-white/20 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        صنع بكل <Heart className="w-3 h-3 text-[#ff2d75]" fill="#ff2d75" /> حب
      </motion.footer>
    </div>
  );
}
