"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Cake,
  Trash2,
  ExternalLink,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import type { BirthdayConfig } from "@/lib/types";
import {
  getConfigIndex,
  loadBirthdayConfig,
  deleteBirthdayConfigFull,
} from "@/lib/storage";

interface ProjectItem {
  id: string;
  name: string;
  themeColor: string;
  createdAt: number;
  photoCount: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const ids = getConfigIndex();
    const items: ProjectItem[] = [];
    for (const id of ids) {
      const cfg = loadBirthdayConfig(id);
      if (cfg) {
        items.push({
          id: cfg.id,
          name: cfg.name,
          themeColor: cfg.themeColor,
          createdAt: cfg.createdAt,
          photoCount: cfg.photos.length,
        });
      }
    }
    // Sort newest first
    items.sort((a, b) => b.createdAt - a.createdAt);
    setProjects(items);
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await deleteBirthdayConfigFull(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white">
      <motion.header
        className="relative py-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="flex items-center justify-center gap-3 text-2xl sm:text-4xl font-bold font-arabic">
          <FolderOpen
            className="w-7 h-7 sm:w-9 sm:h-9 text-[#ff2d75]"
            strokeWidth={1.5}
          />
          مشاريعي
        </h1>
        <p className="text-white/50 mt-2 text-sm font-arabic" dir="rtl">
          قائمة تجارب عيد الميلاد التي أنشأتها
        </p>
      </motion.header>

      <div className="max-w-2xl mx-auto px-4 pb-24">
        {projects.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Cake
              className="w-16 h-16 mx-auto mb-4 text-white/20"
              strokeWidth={1}
            />
            <p className="text-white/40 font-arabic mb-6" dir="rtl">
              لم تنشئ أي تجربة بعد
            </p>
            <Link href="/create">
              <motion.span
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#ff2d75] text-white font-medium text-sm cursor-pointer font-arabic"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                إنشاء تجربة جديدة
              </motion.span>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  className="rounded-xl border border-white/10 p-4 flex items-center gap-4"
                  style={{
                    background: `linear-gradient(135deg, ${project.themeColor}08, transparent)`,
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {/* Color dot */}
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: project.themeColor,
                      boxShadow: `0 0 15px ${project.themeColor}44`,
                    }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0" dir="rtl">
                    <h3 className="text-white font-medium font-arabic truncate">
                      {project.name}
                    </h3>
                    <p className="text-white/40 text-xs font-arabic">
                      {formatDate(project.createdAt)} · {project.photoCount}{" "}
                      صور
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`/birthday/${project.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={deleting === project.id}
                      className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50"
                    >
                      {deleting === project.id ? (
                        <motion.div
                          className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Back to home */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#050510] via-[#050510] to-transparent">
        <div className="max-w-2xl mx-auto">
          <Link href="/">
            <motion.span
              className="flex items-center justify-center gap-2 text-white/50 hover:text-white text-sm font-arabic cursor-pointer transition-colors"
              whileHover={{ x: -5 }}
            >
              <ArrowRight className="w-4 h-4" />
              العودة للرئيسية
            </motion.span>
          </Link>
        </div>
      </div>
    </div>
  );
}
