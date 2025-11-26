-- Simple bucket creation (skip if policies already exist)
-- Run this in Supabase SQL Editor

-- Just create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'playlist-audio', 
  'playlist-audio', 
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac']
)
ON CONFLICT (id) DO NOTHING;

-- Check if bucket was created successfully
SELECT * FROM storage.buckets WHERE id = 'playlist-audio';
