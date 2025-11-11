-- Migration: Add support for multiple images and video to posts
-- Description: Add image_urls (JSON array) and video_url columns to posts table

-- Add image_urls column (JSON array to store multiple image URLs)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Add video_url column
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Migrate existing image_url to image_urls array (if image_url exists and is not null)
UPDATE public.posts 
SET image_urls = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL 
  AND (image_urls IS NULL OR image_urls = '[]'::jsonb);

-- Add comments
COMMENT ON COLUMN public.posts.image_urls IS 'Array of image URLs (JSON) for multiple images';
COMMENT ON COLUMN public.posts.video_url IS 'URL of the post video if any';

