-- Migration: Create post_mentions table for tagging friends in posts
-- Description: Allow users to tag friends in posts and send notifications

-- Create post_mentions table
CREATE TABLE IF NOT EXISTS public.post_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique mentions per post
  UNIQUE(post_id, mentioned_user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_mentions_post_id ON public.post_mentions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_mentions_user_id ON public.post_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_post_mentions_created_at ON public.post_mentions(created_at);

-- Add RLS policies
ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see mentions in posts they can see
CREATE POLICY "Users can view post mentions for visible posts" ON public.post_mentions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_mentions.post_id
      -- Add your post visibility logic here if needed
    )
  );

-- Policy: Users can create mentions when creating/editing their own posts
CREATE POLICY "Users can create mentions in their own posts" ON public.post_mentions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_mentions.post_id 
      AND posts.author_id = auth.uid()
    )
  );

-- Policy: Users can delete mentions from their own posts
CREATE POLICY "Users can delete mentions from their own posts" ON public.post_mentions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_mentions.post_id 
      AND posts.author_id = auth.uid()
    )
  );

-- Function to create notifications for post mentions
CREATE OR REPLACE FUNCTION public.create_notification_for_post_mention()
RETURNS TRIGGER AS $$
DECLARE
  post_record RECORD;
  author_profile RECORD;
BEGIN
  -- Get post details
  SELECT p.*, pr.display_name as author_name, pr.avatar_url as author_avatar
  INTO post_record
  FROM public.posts p
  JOIN public.profiles pr ON p.author_id = pr.id
  WHERE p.id = NEW.post_id;
  
  -- Don't create notification if post author is mentioning themselves
  IF post_record.author_id = NEW.mentioned_user_id THEN
    RETURN NEW;
  END IF;
  
  -- Create notification for mentioned user
  INSERT INTO public.notifications (user_id, type, data)
  VALUES (
    NEW.mentioned_user_id,
    'post_mention',
    jsonb_build_object(
      'post_id', NEW.post_id,
      'author_id', post_record.author_id,
      'author_name', post_record.author_name,
      'author_avatar', post_record.author_avatar,
      'post_content', LEFT(post_record.content, 100),
      'mentioned_user_id', NEW.mentioned_user_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for post mention notifications
DROP TRIGGER IF EXISTS trg_post_mentions_notify ON public.post_mentions;
CREATE TRIGGER trg_post_mentions_notify
  AFTER INSERT ON public.post_mentions
  FOR EACH ROW EXECUTE FUNCTION public.create_notification_for_post_mention();

-- Add comment
COMMENT ON TABLE public.post_mentions IS 'User mentions/tags in social media posts';
