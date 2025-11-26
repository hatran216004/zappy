-- Fix post mentions trigger to ensure notifications are created properly

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trg_post_mentions_notify ON public.post_mentions;
DROP FUNCTION IF EXISTS public.create_notification_for_post_mention();

-- Create improved function with better error handling
CREATE OR REPLACE FUNCTION public.create_notification_for_post_mention()
RETURNS TRIGGER AS $$
DECLARE
  post_record RECORD;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'Post mention trigger fired for post_id: %, mentioned_user_id: %', NEW.post_id, NEW.mentioned_user_id;
  
  -- Get post details with author info
  SELECT 
    p.id,
    p.author_id,
    p.content,
    pr.display_name as author_name, 
    pr.avatar_url as author_avatar
  INTO post_record
  FROM public.posts p
  JOIN public.profiles pr ON p.author_id = pr.id
  WHERE p.id = NEW.post_id;
  
  -- Check if post was found
  IF NOT FOUND THEN
    RAISE LOG 'Post not found for post_id: %', NEW.post_id;
    RETURN NEW;
  END IF;
  
  -- Don't create notification if post author is mentioning themselves
  IF post_record.author_id = NEW.mentioned_user_id THEN
    RAISE LOG 'Skipping self-mention for user: %', NEW.mentioned_user_id;
    RETURN NEW;
  END IF;
  
  -- Create notification for mentioned user
  BEGIN
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
    
    RAISE LOG 'Notification created for user: % from post: %', NEW.mentioned_user_id, NEW.post_id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating notification: %', SQLERRM;
    -- Don't fail the insert, just log the error
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER trg_post_mentions_notify
  AFTER INSERT ON public.post_mentions
  FOR EACH ROW EXECUTE FUNCTION public.create_notification_for_post_mention();

-- Enable logging for debugging (optional - can be disabled later)
-- SET log_min_messages = 'log';
