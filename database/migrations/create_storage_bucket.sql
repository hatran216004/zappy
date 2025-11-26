-- Create storage bucket for playlist audio files
-- Run this in Supabase SQL Editor

-- Create the bucket (public = true for direct access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'playlist-audio', 
  'playlist-audio', 
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket (with IF NOT EXISTS equivalent)
DO $$ 
BEGIN
  -- Policy for viewing audio files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view audio files'
  ) THEN
    CREATE POLICY "Anyone can view audio files" ON storage.objects
    FOR SELECT USING (bucket_id = 'playlist-audio');
  END IF;

  -- Policy for uploading audio files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload audio files'
  ) THEN
    CREATE POLICY "Authenticated users can upload audio files" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'playlist-audio' 
      AND auth.role() = 'authenticated'
    );
  END IF;

  -- Policy for updating audio files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own audio files'
  ) THEN
    CREATE POLICY "Users can update their own audio files" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'playlist-audio' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Policy for deleting audio files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own audio files'
  ) THEN
    CREATE POLICY "Users can delete their own audio files" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'playlist-audio' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;
