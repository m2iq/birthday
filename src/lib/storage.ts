import type { BirthdayConfig } from "./types";
import { supabase, supabaseConfigured } from "./supabase";

const STORAGE_PREFIX = "birthday_";

/* ─── localStorage helpers ─────────────────────────────── */

export function saveBirthdayConfig(config: BirthdayConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${config.id}`,
      JSON.stringify(config)
    );
    const index = getConfigIndex();
    if (!index.includes(config.id)) {
      index.push(config.id);
      localStorage.setItem(`${STORAGE_PREFIX}index`, JSON.stringify(index));
    }
  } catch {
    console.warn("Failed to save birthday config to localStorage");
  }
}

export function loadBirthdayConfig(id: string): BirthdayConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as BirthdayConfig;
  } catch {
    return null;
  }
}

export function getConfigIndex(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}index`);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function deleteBirthdayConfig(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
  const index = getConfigIndex().filter((i) => i !== id);
  localStorage.setItem(`${STORAGE_PREFIX}index`, JSON.stringify(index));
}

/* ─── Supabase helpers ─────────────────────────────────── */

/** Convert a base64 data-URL to a Blob */
function base64ToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "application/octet-stream";
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/** Upload a base64 photo to Supabase Storage and return its public URL */
async function uploadAsset(
  bucket: string,
  path: string,
  dataUrl: string
): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");
  const blob = base64ToBlob(dataUrl);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { upsert: true, contentType: blob.type });
  if (error) throw error;
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}

/**
 * Save a birthday config to Supabase.
 * Photos & music are uploaded to Storage; metadata goes into the DB table.
 */
export async function saveBirthdayConfigToSupabase(
  config: BirthdayConfig
): Promise<BirthdayConfig> {
  if (!supabase) throw new Error("Supabase not configured");

  // Upload photos
  const photoUrls: string[] = [];
  for (let i = 0; i < config.photos.length; i++) {
    const photo = config.photos[i];
    if (photo.startsWith("data:")) {
      const url = await uploadAsset(
        "birthday-assets",
        `photos/${config.id}/${i}.jpg`,
        photo
      );
      photoUrls.push(url);
    } else {
      photoUrls.push(photo); // already a URL
    }
  }

  // Upload music
  let musicUrl = config.musicUrl;
  if (musicUrl && musicUrl.startsWith("data:")) {
    musicUrl = await uploadAsset(
      "birthday-assets",
      `music/${config.id}/track`,
      musicUrl
    );
  }

  const row = {
    id: config.id,
    name: config.name,
    message_words: config.messageWords,
    letter_message: config.letterMessage,
    photos: photoUrls,
    music_url: musicUrl,
    theme_color: config.themeColor,
    created_at: config.createdAt,
  };

  const { error } = await supabase
    .from("birthday_configs")
    .upsert(row, { onConflict: "id" });
  if (error) throw error;

  // Return the config with URLs (instead of base64)
  return {
    ...config,
    photos: photoUrls,
    musicUrl,
  };
}

/** Load a birthday config from Supabase */
export async function loadBirthdayConfigFromSupabase(
  id: string
): Promise<BirthdayConfig | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("birthday_configs")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    messageWords: data.message_words,
    letterMessage: data.letter_message,
    photos: data.photos,
    musicUrl: data.music_url,
    themeColor: data.theme_color,
    createdAt: data.created_at,
  };
}

/** Delete a birthday config from both Supabase and localStorage */
export async function deleteBirthdayConfigFull(id: string): Promise<void> {
  // localStorage
  deleteBirthdayConfig(id);

  // Supabase
  if (supabase) {
    await supabase.from("birthday_configs").delete().eq("id", id);
    // Clean up storage assets (best-effort)
    const { data: photos } = await supabase.storage
      .from("birthday-assets")
      .list(`photos/${id}`);
    if (photos?.length) {
      await supabase.storage
        .from("birthday-assets")
        .remove(photos.map((f) => `photos/${id}/${f.name}`));
    }
    const { data: music } = await supabase.storage
      .from("birthday-assets")
      .list(`music/${id}`);
    if (music?.length) {
      await supabase.storage
        .from("birthday-assets")
        .remove(music.map((f) => `music/${id}/${f.name}`));
    }
  }
}

export { supabaseConfigured };
