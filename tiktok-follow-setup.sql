-- TikTok follow gate tracking table
-- Run in Supabase SQL Editor

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
