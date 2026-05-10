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

-- 1.1 Ensure schema is compatible with UPSERT(on_conflict=id) on existing databases
ALTER TABLE birthday_configs ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE birthday_configs ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'حبيبي';
ALTER TABLE birthday_configs ADD COLUMN IF NOT EXISTS message_words JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE birthday_configs ADD COLUMN IF NOT EXISTS letter_message TEXT DEFAULT '';
ALTER TABLE birthday_configs ADD COLUMN IF NOT EXISTS photos JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE birthday_configs ADD COLUMN IF NOT EXISTS music_url TEXT DEFAULT '';
ALTER TABLE birthday_configs ADD COLUMN IF NOT EXISTS theme_color TEXT NOT NULL DEFAULT '#ff2d75';
ALTER TABLE birthday_configs ADD COLUMN IF NOT EXISTS created_at BIGINT NOT NULL DEFAULT 0;

-- Remove unusable rows and duplicate ids before creating unique constraints
DELETE FROM birthday_configs
WHERE id IS NULL OR id = '';

DELETE FROM birthday_configs t
USING (
  SELECT ctid
  FROM (
    SELECT ctid, ROW_NUMBER() OVER (
      PARTITION BY id
      ORDER BY created_at DESC, ctid DESC
    ) AS rn
    FROM birthday_configs
  ) ranked
  WHERE ranked.rn > 1
) d
WHERE t.ctid = d.ctid;

ALTER TABLE birthday_configs ALTER COLUMN id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_birthday_configs_id_unique
  ON birthday_configs(id);

-- 2. Enable Row Level Security
ALTER TABLE birthday_configs ENABLE ROW LEVEL SECURITY;

-- 3. Grants for anon/authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.birthday_configs TO anon, authenticated;

-- 4. Recreate RLS policies safely (idempotent)
DROP POLICY IF EXISTS "Anyone can read configs" ON birthday_configs;
DROP POLICY IF EXISTS "Anyone can insert configs" ON birthday_configs;
DROP POLICY IF EXISTS "Anyone can update configs" ON birthday_configs;
DROP POLICY IF EXISTS "Anyone can delete configs" ON birthday_configs;

CREATE POLICY "Anyone can read configs" ON birthday_configs
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert configs" ON birthday_configs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update configs" ON birthday_configs
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete configs" ON birthday_configs
  FOR DELETE USING (true);

-- 6. Create a public storage bucket for assets (photos & music)
INSERT INTO storage.buckets (id, name, public)
VALUES ('birthday-assets', 'birthday-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage policies (idempotent)
DROP POLICY IF EXISTS "Anyone can upload birthday assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read birthday assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update birthday assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete birthday assets" ON storage.objects;

CREATE POLICY "Anyone can upload birthday assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'birthday-assets');

CREATE POLICY "Anyone can read birthday assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'birthday-assets');

CREATE POLICY "Anyone can update birthday assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'birthday-assets')
  WITH CHECK (bucket_id = 'birthday-assets');

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

DROP POLICY IF EXISTS "Anyone can insert follow events" ON tiktok_follow_events;
DROP POLICY IF EXISTS "Anyone can read follow events" ON tiktok_follow_events;

CREATE POLICY "Anyone can insert follow events" ON tiktok_follow_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read follow events" ON tiktok_follow_events
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_tiktok_follow_events_created_at
  ON tiktok_follow_events(created_at DESC);
