-- Check storage bucket configuration
-- Run this in Supabase SQL Editor to debug

-- 1. Check if bucket exists
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'playlist-audio';

-- 2. Check bucket policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%audio%';

-- 3. Check if any files exist in bucket
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'playlist-audio'
ORDER BY created_at DESC
LIMIT 10;
