-- Migration: Create triggers to notify users when their report status changes
-- Description: Automatically create notifications when report status changes from 'pending' to 'reviewed', 'resolved', or 'dismissed'

-- Function to create notification for user report status change
CREATE OR REPLACE FUNCTION public.create_notification_for_user_report_status()
RETURNS TRIGGER AS $$
DECLARE
  notification_type TEXT;
  reported_user_name TEXT;
  admin_name TEXT;
BEGIN
  -- Only create notification if status changed from 'pending' to something else
  IF OLD.status = 'pending' AND NEW.status != 'pending' AND NEW.status IN ('reviewed', 'resolved', 'dismissed') THEN
    -- Determine notification type based on new status
    notification_type := 'user_report_' || NEW.status;
    
    -- Get reported user's name
    SELECT display_name INTO reported_user_name
    FROM public.profiles
    WHERE id = NEW.reported_user_id;
    
    -- Get admin's name if reviewed_by exists
    IF NEW.reviewed_by IS NOT NULL THEN
      SELECT display_name INTO admin_name
      FROM public.profiles
      WHERE id = NEW.reviewed_by;
    END IF;
    
    -- Create notification for the user who made the report
    BEGIN
      INSERT INTO public.notifications (user_id, type, data)
      VALUES (
        NEW.reported_by,
        notification_type,
        jsonb_build_object(
          'report_id', NEW.id,
          'reported_user_id', NEW.reported_user_id,
          'reported_user_name', COALESCE(reported_user_name, 'Người dùng'),
          'reason', NEW.reason,
          'description', NEW.description,
          'status', NEW.status,
          'reviewed_by', NEW.reviewed_by,
          'reviewed_by_name', COALESCE(admin_name, 'Admin'),
          'reviewed_at', NEW.reviewed_at,
          'created_at', NEW.created_at
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the update
      RAISE WARNING 'Error creating notification for user report %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for post report status change
CREATE OR REPLACE FUNCTION public.create_notification_for_post_report_status()
RETURNS TRIGGER AS $$
DECLARE
  notification_type TEXT;
  post_content TEXT;
  admin_name TEXT;
BEGIN
  -- Only create notification if status changed from 'pending' to something else
  IF OLD.status = 'pending' AND NEW.status != 'pending' AND NEW.status IN ('reviewed', 'resolved', 'dismissed') THEN
    -- Determine notification type based on new status
    notification_type := 'post_report_' || NEW.status;
    
    -- Get post content preview
    SELECT LEFT(content_text, 100) INTO post_content
    FROM public.posts
    WHERE id = NEW.post_id;
    
    -- Get admin's name if reviewed_by exists
    IF NEW.reviewed_by IS NOT NULL THEN
      SELECT display_name INTO admin_name
      FROM public.profiles
      WHERE id = NEW.reviewed_by;
    END IF;
    
    -- Create notification for the user who made the report
    BEGIN
      INSERT INTO public.notifications (user_id, type, data)
      VALUES (
        NEW.reported_by,
        notification_type,
        jsonb_build_object(
          'report_id', NEW.id,
          'post_id', NEW.post_id,
          'post_preview', COALESCE(post_content, 'Bài viết'),
          'reason', NEW.reason,
          'description', NEW.description,
          'status', NEW.status,
          'reviewed_by', NEW.reviewed_by,
          'reviewed_by_name', COALESCE(admin_name, 'Admin'),
          'reviewed_at', NEW.reviewed_at,
          'created_at', NEW.created_at
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the update
      RAISE WARNING 'Error creating notification for post report %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for message report status change
CREATE OR REPLACE FUNCTION public.create_notification_for_message_report_status()
RETURNS TRIGGER AS $$
DECLARE
  notification_type TEXT;
  message_content TEXT;
  conversation_id UUID;
  admin_name TEXT;
BEGIN
  -- Only create notification if status changed from 'pending' to something else
  IF OLD.status = 'pending' AND NEW.status != 'pending' AND NEW.status IN ('reviewed', 'resolved', 'dismissed') THEN
    -- Determine notification type based on new status
    notification_type := 'message_report_' || NEW.status;
    
    -- Get message content and conversation_id
    SELECT m.content_text, m.conversation_id INTO message_content, conversation_id
    FROM public.messages m
    WHERE m.id = NEW.message_id;
    
    -- Get admin's name if reviewed_by exists
    IF NEW.reviewed_by IS NOT NULL THEN
      SELECT display_name INTO admin_name
      FROM public.profiles
      WHERE id = NEW.reviewed_by;
    END IF;
    
    -- Create notification for the user who made the report
    BEGIN
      INSERT INTO public.notifications (user_id, type, data)
      VALUES (
        NEW.reported_by,
        notification_type,
        jsonb_build_object(
          'report_id', NEW.id,
          'message_id', NEW.message_id,
          'conversation_id', conversation_id,
          'message_preview', COALESCE(LEFT(message_content, 100), 'Tin nhắn'),
          'reason', NEW.reason,
          'description', NEW.description,
          'status', NEW.status,
          'reviewed_by', NEW.reviewed_by,
          'reviewed_by_name', COALESCE(admin_name, 'Admin'),
          'reviewed_at', NEW.reviewed_at,
          'created_at', NEW.created_at
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the update
      RAISE WARNING 'Error creating notification for message report %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trg_user_reports_status_notify ON public.user_reports;
DROP TRIGGER IF EXISTS trg_post_reports_status_notify ON public.post_reports;
DROP TRIGGER IF EXISTS trg_message_reports_status_notify ON public.message_reports;

-- Create triggers
CREATE TRIGGER trg_user_reports_status_notify
  AFTER UPDATE ON public.user_reports
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.create_notification_for_user_report_status();

CREATE TRIGGER trg_post_reports_status_notify
  AFTER UPDATE ON public.post_reports
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.create_notification_for_post_report_status();

CREATE TRIGGER trg_message_reports_status_notify
  AFTER UPDATE ON public.message_reports
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.create_notification_for_message_report_status();

-- Add comments
COMMENT ON FUNCTION public.create_notification_for_user_report_status() IS 'Creates notification when user report status changes';
COMMENT ON FUNCTION public.create_notification_for_post_report_status() IS 'Creates notification when post report status changes';
COMMENT ON FUNCTION public.create_notification_for_message_report_status() IS 'Creates notification when message report status changes';

