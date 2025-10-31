-- Migration: Create posts, post_reactions, and post_comments tables
-- Description: Add support for social media posts feature with reactions and comments

-- Create enum for post reaction types
DO $$ BEGIN
  CREATE TYPE post_reaction_type AS ENUM ('like', 'love', 'haha', 'wow', 'sad', 'angry');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.posts IS 'Social media posts created by users';
COMMENT ON COLUMN public.posts.content IS 'Text content of the post';
COMMENT ON COLUMN public.posts.image_url IS 'URL of the post image if any';
COMMENT ON COLUMN public.posts.author_id IS 'User who created the post';

-- Create post_reactions table
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type post_reaction_type NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- One reaction per user per post
);

-- Create indexes for post_reactions
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON public.post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_type ON public.post_reactions(reaction_type);

-- Add comment for documentation
COMMENT ON TABLE public.post_reactions IS 'Reactions (like, love, etc.) on posts';
COMMENT ON COLUMN public.post_reactions.reaction_type IS 'Type of reaction: like, love, haha, wow, sad, angry';

-- Create post_comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for post_comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON public.post_comments(created_at ASC);

-- Add comment for documentation
COMMENT ON TABLE public.post_comments IS 'Comments on posts';
COMMENT ON COLUMN public.post_comments.content IS 'Text content of the comment';

-- Enable Row Level Security (RLS) for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see posts from their friends or their own posts
CREATE POLICY "Users can view posts from friends or own posts"
  ON public.posts
  FOR SELECT
  USING (
    author_id = auth.uid() OR
    author_id IN (
      SELECT friend_id FROM public.friends WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can only create their own posts
CREATE POLICY "Users can create their own posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- Policy: Users can only update their own posts
CREATE POLICY "Users can update their own posts"
  ON public.posts
  FOR UPDATE
  USING (author_id = auth.uid());

-- Policy: Users can only delete their own posts
CREATE POLICY "Users can delete their own posts"
  ON public.posts
  FOR DELETE
  USING (author_id = auth.uid());

-- Enable RLS for post_reactions
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reactions on posts they can see
CREATE POLICY "Users can view reactions on visible posts"
  ON public.post_reactions
  FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM public.posts
      WHERE author_id = auth.uid() OR
      author_id IN (
        SELECT friend_id FROM public.friends WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can add their own reactions
CREATE POLICY "Users can add their own reactions"
  ON public.post_reactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own reactions
CREATE POLICY "Users can update their own reactions"
  ON public.post_reactions
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON public.post_reactions
  FOR DELETE
  USING (user_id = auth.uid());

-- Enable RLS for post_comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view comments on posts they can see
CREATE POLICY "Users can view comments on visible posts"
  ON public.post_comments
  FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM public.posts
      WHERE author_id = auth.uid() OR
      author_id IN (
        SELECT friend_id FROM public.friends WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can add their own comments
CREATE POLICY "Users can add their own comments"
  ON public.post_comments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON public.post_comments
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.post_comments
  FOR DELETE
  USING (user_id = auth.uid());

-- Note: Storage bucket và policies nên được tạo thủ công trong Supabase Dashboard
-- Hoặc chạy các commands sau trong Supabase SQL Editor:

-- 1. Tạo storage bucket 'post-images'
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'post-images',
--   'post-images',
--   false,
--   5242880, -- 5MB limit
--   ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Authenticated users can upload post images
-- CREATE POLICY "Authenticated users can upload post images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'post-images' AND
--     auth.role() = 'authenticated'
--   );

-- 3. Policy: Authenticated users can view post images
-- CREATE POLICY "Authenticated users can view post images"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'post-images' AND
--     auth.role() = 'authenticated'
--   );

-- 4. Policy: Users can delete their own post images (by owner_id)
-- CREATE POLICY "Users can delete their own post images"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'post-images' AND
--     owner = auth.uid()
--   );

