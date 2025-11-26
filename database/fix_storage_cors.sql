-- Fix CORS for Supabase Storage
-- Run this in Supabase SQL Editor

-- Method 1: Update bucket to ensure it's properly configured
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac']
WHERE id = 'playlist-audio';

-- Method 2: Ensure RLS policies allow public access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create simple public read policy
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'playlist-audio');

-- Verify the setup
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'playlist-audio';
