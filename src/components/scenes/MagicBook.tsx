/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";

interface MagicBookProps {
  photos: string[];
  message: string;
  name: string;
  onComplete: () => void;
  themeColor?: string;
  onBookOpen?: () => void;
}

type PageSide =
  | { type: "cover"; name: string }
  | { type: "photo"; src: string }
  | { type: "text"; content: string }
  | { type: "backcover" };

function darkenHex(hex: string, amount = 0.3): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `#${Math.round(r * (1 - amount)).toString(16).padStart(2, "0")}${Math.round(g * (1 - amount)).toString(16).padStart(2, "0")}${Math.round(b * (1 - amount)).toString(16).padStart(2, "0")}`;
}

function buildBookSides(
  photos: string[],
  message: string,
  name: string
): PageSide[] {
  const sides: PageSide[] = [];
  sides.push({ type: "cover", name });

  for (const src of photos || []) {
    sides.push({ type: "photo", src });
  }

  if (message) {
    // Keep message as one page unless very long
    if (message.length > 500) {
      const mid = Math.ceil(message.length / 2);
      const br = message.indexOf(" ", mid);
      if (br > 0) {
        sides.push({ type: "text", content: message.substring(0, br).trim() });
        sides.push({ type: "text", content: message.substring(br).trim() });
      } else {
        sides.push({ type: "text", content: message });
      }
    } else {
      sides.push({ type: "text", content: message });
    }
  }

  sides.push({ type: "backcover" });

  if (sides.length % 2 !== 0) {
    sides.splice(sides.length - 1, 0, {
      type: "text",
      content: `مع كل حبي لك يا ${name}`,
    });
  }

  return sides;
}

export default function MagicBook({
  photos = [],
  message,
  name,
  onComplete,
  themeColor = "#ff2d75",
  onBookOpen,
}: MagicBookProps) {
  const [flippedPages, setFlippedPages] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [bookOpened, setBookOpened] = useState(false);
  const [bookDims, setBookDims] = useState({ w: 600, h: 400, pw: 300, scale: 1 });
  const isFlippingRef = useRef(false);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const autoFlipRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const sides = useMemo(
    () => buildBookSides(photos, message, name),
    [photos, message, name]
  );

  const totalPhysicalPages = Math.ceil(sides.length / 2);
  const darkColor = darkenHex(themeColor, 0.3);

  // Responsive dimensions
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 640;
      const isTablet = vw >= 640 && vw < 1024;

      let bw: number, bh: number;
      if (isMobile) {
        // 90% of viewport width on mobile
        bw = Math.round(vw * 0.9);
        bh = Math.round(vh * 0.6);
      } else if (isTablet) {
        bw = Math.round(vw * 0.8);
        bh = Math.round(bw * 0.65);
      } else {
        bw = Math.min(900, Math.round(vw * 0.6));
        bh = Math.round(bw * 0.65);
      }

      // Ensure we don't exceed viewport
      const maxH = vh - 80;
      if (bh > maxH) {
        bh = maxH;
        bw = Math.round(bh / 0.65);
      }

      setBookDims({
        w: bw,
        h: bh,
        pw: Math.round(bw / 2),
        scale: 1,
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const nextPage = useCallback(() => {
    if (isFlippingRef.current || currentPage >= totalPhysicalPages) return;
    isFlippingRef.current = true;
    const pg = currentPage;
    setTimeout(() => {
      setFlippedPages((prev) => new Set([...prev, pg]));
      setCurrentPage((p) => p + 1);
      isFlippingRef.current = false;
      if (pg >= totalPhysicalPages - 1) {
        setTimeout(onComplete, 2500);
      }
    }, 400);
  }, [currentPage, totalPhysicalPages, onComplete]);

  const prevPage = useCallback(() => {
    if (isFlippingRef.current || currentPage <= 0) return;
    isFlippingRef.current = true;
    const pg = currentPage - 1;
    setTimeout(() => {
      setFlippedPages((prev) => {
        const n = new Set(prev);
        n.delete(pg);
        return n;
      });
      setCurrentPage((p) => p - 1);
      isFlippingRef.current = false;
    }, 400);
  }, [currentPage]);

  const nextPageRef = useRef(nextPage);
  nextPageRef.current = nextPage;

  useEffect(() => {
    // Don't auto-flip the first page — wait for user tap (which plays music)
    if (!bookOpened) return;
    if (currentPage >= totalPhysicalPages) return;
    autoFlipRef.current = setTimeout(
      () => nextPageRef.current(),
      4000
    );
    return () => {
      if (autoFlipRef.current) clearTimeout(autoFlipRef.current);
    };
  }, [currentPage, totalPhysicalPages, bookOpened]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === " ") {
        e.preventDefault();
        if (e.key === "ArrowLeft") prevPage();
        else nextPage();
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [nextPage, prevPage]);

  const handleStart = (cx: number) => {
    startXRef.current = cx;
    isDraggingRef.current = true;
  };
  const handleEnd = (cx: number) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const dx = cx - startXRef.current;
    if (Math.abs(dx) > 50) {
      if (autoFlipRef.current) clearTimeout(autoFlipRef.current);
      dx < 0 ? nextPage() : prevPage();
    }
  };

  useEffect(
    () => () => {
      if (autoFlipRef.current) clearTimeout(autoFlipRef.current);
    },
    []
  );

  const { w: BOOK_W, h: BOOK_H, pw: PAGE_W } = bookDims;

  function renderSide(side: PageSide) {
    switch (side.type) {
      case "cover":
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6"
            style={{
              background: `linear-gradient(145deg, ${themeColor}, ${darkColor})`,
            }}
          >
            <h2
              className="text-lg sm:text-xl font-bold text-white font-arabic text-center"
              dir="rtl"
            >
              ذكريات جميلة
            </h2>
            <p className="text-white/70 mt-2 font-arabic text-xs sm:text-sm" dir="rtl">
              {side.name}
            </p>
          </div>
        );
      case "photo":
        return (
          <img
            src={side.src}
            alt=""
            className="w-full h-full object-cover block"
          />
        );
      case "text":
        return (
          <div className="w-full h-full flex items-center justify-center p-3 sm:p-5 bg-[#fffaf5] overflow-y-auto">
            <p
              className="text-[#2c1810] text-center font-arabic leading-[1.9]"
              dir="rtl"
              style={{
                fontSize:
                  side.content.length > 350
                    ? "clamp(9px, 1.6vw, 12px)"
                    : side.content.length > 200
                      ? "clamp(10px, 2vw, 14px)"
                      : "clamp(12px, 2.5vw, 18px)",
              }}
            >
              {side.content}
            </p>
          </div>
        );
      case "backcover":
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6"
            style={{
              background: `linear-gradient(145deg, ${darkColor}, ${themeColor})`,
            }}
          >
            <h2
              className="text-base sm:text-lg font-bold text-white font-arabic"
              dir="rtl"
            >
              النهاية
            </h2>
            <p className="text-white/60 mt-2 text-[10px] sm:text-xs font-arabic" dir="rtl">
              كل عام وأنت بخير
            </p>
          </div>
        );
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-[#050510]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div
        style={{
          perspective: 2000,
        }}
      >
        <div
          className="absolute -inset-5 -z-10 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
            filter: "blur(15px)",
          }}
        />

        <div
          className="relative select-none"
          style={{
            width: BOOK_W,
            height: BOOK_H,
            transformStyle: "preserve-3d",
            cursor: "grab",
          }}
          onClick={() => {
            if (!bookOpened) {
              setBookOpened(true);
              onBookOpen?.();
            }
            if (autoFlipRef.current) clearTimeout(autoFlipRef.current);
            nextPage();
          }}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
          onMouseDown={(e) => {
            handleStart(e.clientX);
            e.preventDefault();
          }}
          onMouseUp={(e) => handleEnd(e.clientX)}
        >
          {Array.from({ length: totalPhysicalPages }, (_, i) => {
            const flipped = flippedPages.has(i);
            const frontSide = sides[i * 2];
            const backSide = sides[i * 2 + 1];
            return (
              <div
                key={i}
                className="absolute top-0 right-0"
                style={{
                  width: PAGE_W,
                  height: BOOK_H,
                  transformOrigin: "left center",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)",
                  transform: flipped ? "rotateY(-180deg)" : "rotateY(0deg)",
                  zIndex: flipped ? i + 1 : totalPhysicalPages - i,
                  boxShadow: flipped
                    ? "0 0 0 1px rgba(255,255,255,0.08),-10px 10px 20px rgba(0,0,0,0.3)"
                    : "0 0 0 1px rgba(255,255,255,0.08),0 10px 20px rgba(0,0,0,0.2)",
                }}
              >
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    background: "white",
                    border: "1px solid #e5e5e5",
                    borderRadius: "0 6px 6px 0",
                    zIndex: 2,
                  }}
                >
                  {frontSide && renderSide(frontSide)}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg,rgba(0,0,0,0.08) 0%,rgba(0,0,0,0.03) 2%,transparent 10%)",
                    }}
                  />
                </div>

                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    background: "white",
                    border: "1px solid #e5e5e5",
                    borderRadius: "6px 0 0 6px",
                  }}
                >
                  {backSide && renderSide(backSide)}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg,transparent 90%,rgba(0,0,0,0.03) 98%,rgba(0,0,0,0.08) 100%)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-4 rounded-full"
          style={{ background: "rgba(0,0,0,0.4)", filter: "blur(16px)" }}
        />
      </div>

      {currentPage < totalPhysicalPages && (
        <p
          className="mt-6 sm:mt-8 text-white/40 text-xs sm:text-sm animate-pulse select-none font-arabic"
          dir="rtl"
        >
          {!bookOpened ? "اضغط لفتح الكتاب" : "اسحب أو انقر لقلب الصفحة"}
        </p>
      )}
    </motion.div>
  );
}
