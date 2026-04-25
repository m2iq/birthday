-- Run this SQL in Supabase SQL Editor to set up the database

-- 1. Create the birthday configs table
CREATE TABLE IF NOT EXISTS birthday_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'حبيبي',
  message_words JSONB NOT NULL DEFAULT '[]'::jsonb,
  letter_message TEXT DEFAULT '',
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  music_url TEXT DEFAULT '',
  theme_color TEXT NOT NULL DEFAULT '#ff2d75',
  created_at BIGINT NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE birthday_configs ENABLE ROW LEVEL SECURITY;

-- 3. Allow anyone to read (shared links)
CREATE POLICY "Anyone can read configs" ON birthday_configs
  FOR SELECT USING (true);

-- 4. Allow anyone to insert
CREATE POLICY "Anyone can insert configs" ON birthday_configs
  FOR INSERT WITH CHECK (true);

-- 5. Allow anyone to delete
CREATE POLICY "Anyone can delete configs" ON birthday_configs
  FOR DELETE USING (true);

-- 6. Create a public storage bucket for assets (photos & music)
INSERT INTO storage.buckets (id, name, public)
VALUES ('birthday-assets', 'birthday-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage policies
CREATE POLICY "Anyone can upload birthday assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'birthday-assets');

CREATE POLICY "Anyone can read birthday assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'birthday-assets');

CREATE POLICY "Anyone can delete birthday assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'birthday-assets');

-- 8. TikTok follow gate tracking table (one follow count per device)
CREATE TABLE IF NOT EXISTS tiktok_follow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'birthday-site',
  account_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'followed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tiktok_follow_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert follow events" ON tiktok_follow_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read follow events" ON tiktok_follow_events
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_tiktok_follow_events_created_at
  ON tiktok_follow_events(created_at DESC);
