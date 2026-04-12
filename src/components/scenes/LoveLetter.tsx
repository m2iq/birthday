"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

interface LoveLetterProps {
  message: string;
  name: string;
  themeColor?: string;
}

export default function LoveLetter({
  message,
  name,
  themeColor = "#ff2d75",
}: LoveLetterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setIsOpen(true), 1000);
    const t2 = setTimeout(() => setShowMessage(true), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-20 flex items-center justify-center bg-[#050510] px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Ambient glow */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
        style={{ backgroundColor: themeColor }}
      />

      <div className="relative w-full max-w-[320px] sm:max-w-[400px] md:max-w-[460px]">
        {/* Envelope body */}
        <motion.div
          className="relative rounded-xl overflow-visible"
          style={{
            background: "linear-gradient(145deg, #1e1e3a 0%, #151530 100%)",
            border: `1px solid ${themeColor}22`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${themeColor}11`,
          }}
          initial={{ scale: 0.8, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Envelope flap */}
          <motion.div
            className="absolute -top-[1px] left-0 right-0 h-[100px] sm:h-[120px] md:h-[140px] origin-top z-10"
            style={{
              background: "linear-gradient(180deg, #252545 0%, #1e1e3a 100%)",
              clipPath: "polygon(0 0, 50% 100%, 100% 0)",
              borderTop: `1px solid ${themeColor}22`,
            }}
            animate={{
              rotateX: isOpen ? 180 : 0,
              opacity: isOpen ? 0 : 1,
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />

          {/* Triangle decoration behind flap */}
          <div
            className="absolute top-0 left-0 right-0 h-[100px] sm:h-[120px] md:h-[140px]"
            style={{
              clipPath: "polygon(0 0, 50% 100%, 100% 0)",
              background: `linear-gradient(180deg, ${themeColor}11 0%, transparent 100%)`,
            }}
          />

          {/* Letter content area */}
          <div className="pt-6 sm:pt-8 pb-6 sm:pb-8 px-5 sm:px-8 min-h-[260px] sm:min-h-[350px]">
            <AnimatePresence>
              {showMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-center"
                  dir="rtl"
                >
                  {/* Heart decoration */}
                  <motion.div
                    className="flex justify-center gap-3 mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          delay: i * 0.3,
                          repeat: Infinity,
                        }}
                      >
                        <Heart
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          style={{ color: themeColor }}
                          fill={themeColor}
                        />
                      </motion.span>
                    ))}
                  </motion.div>

                  {/* Greeting */}
                  <motion.h2
                    className="flex items-center justify-center gap-2 text-lg sm:text-2xl font-bold mb-4 font-arabic"
                    style={{ color: themeColor }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    إلى {name}
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5" fill={themeColor} />
                  </motion.h2>

                  {/* Message */}
                  <motion.p
                    className="text-xs sm:text-base leading-relaxed text-white/80 mb-6 font-arabic"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    {message}
                  </motion.p>

                  {/* Signature */}
                  <motion.div
                    className="mt-4 sm:mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                  >
                    <p className="text-xs text-white/40">مع كل الحب</p>
                    <Heart className="w-3 h-3 text-[#ff2d75]" fill="#ff2d75" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Envelope bottom fold */}
          <div
            className="absolute bottom-0 left-0 right-0 h-3"
            style={{
              background: `linear-gradient(to top, ${themeColor}11, transparent)`,
            }}
          />
        </motion.div>

        {/* Floating hearts */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{ color: themeColor }}
            initial={{
              x: Math.random() * 300 - 150,
              y: 50,
              opacity: 0,
            }}
            animate={{
              y: [50, -100 - Math.random() * 100],
              x: [null, (Math.random() - 0.5) * 100],
              opacity: [0, 0.6, 0],
              scale: [0.5, 1, 0.5],
              rotate: [0, (Math.random() - 0.5) * 40],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: 2 + Math.random() * 4,
              repeat: Infinity,
              repeatDelay: Math.random() * 3,
            }}
          >
            <Heart className="w-3 h-3" fill="currentColor" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
