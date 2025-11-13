-- Migration: Create threads and thread_participants tables
-- Description: Allow users to create threads (chủ đề) within conversations for focused discussions

-- Create threads table
CREATE TABLE IF NOT EXISTS public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT, -- Optional description
  root_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL, -- Optional: message that started the thread
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_closed BOOLEAN NOT NULL DEFAULT false, -- When closed, no new messages allowed
  closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ,
  last_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  message_count INT NOT NULL DEFAULT 0,
  participant_count INT NOT NULL DEFAULT 0
);

-- Create thread_participants table
CREATE TABLE IF NOT EXISTS public.thread_participants (
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (thread_id, user_id)
);

-- Create thread_messages table (messages within threads)
-- Note: We'll reuse the messages table but add thread_id column
-- First, add thread_id to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_threads_conversation ON public.threads(conversation_id);
CREATE INDEX IF NOT EXISTS idx_threads_created_by ON public.threads(created_by);
CREATE INDEX IF NOT EXISTS idx_threads_is_pinned ON public.threads(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_threads_is_closed ON public.threads(is_closed) WHERE is_closed = false;
CREATE INDEX IF NOT EXISTS idx_threads_updated_at ON public.threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_thread_participants_thread ON public.thread_participants(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_participants_user ON public.thread_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(thread_id) WHERE thread_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE public.threads IS 'Threads (chủ đề) created within conversations for focused discussions';
COMMENT ON COLUMN public.threads.root_message_id IS 'Optional: The message that started this thread';
COMMENT ON COLUMN public.threads.is_closed IS 'When true, no new messages can be sent to this thread';
COMMENT ON COLUMN public.threads.message_count IS 'Cached count of messages in this thread';
COMMENT ON COLUMN public.threads.participant_count IS 'Cached count of participants in this thread';
COMMENT ON COLUMN public.messages.thread_id IS 'If set, this message belongs to a thread';

-- Enable Row Level Security
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for threads
-- Users can view threads in conversations they participate in
CREATE POLICY "Users can view threads in their conversations"
  ON public.threads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = threads.conversation_id
        AND user_id = auth.uid()
        AND left_at IS NULL
    )
  );

-- Users can create threads in conversations they participate in
CREATE POLICY "Users can create threads"
  ON public.threads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = threads.conversation_id
        AND user_id = auth.uid()
        AND left_at IS NULL
    )
  );

-- Users can update threads they created (for title, description, pin/unpin)
CREATE POLICY "Users can update their threads"
  ON public.threads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Admins can close threads in group conversations
CREATE POLICY "Admins can close threads"
  ON public.threads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      JOIN public.conversations c ON c.id = cp.conversation_id
      WHERE cp.conversation_id = threads.conversation_id
        AND cp.user_id = auth.uid()
        AND cp.role = 'admin'
        AND cp.left_at IS NULL
        AND c.type = 'group'
    )
  );

-- RLS Policies for thread_participants
-- Users can view participants of threads they can see
CREATE POLICY "Users can view thread participants"
  ON public.thread_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.threads t
      JOIN public.conversation_participants cp ON cp.conversation_id = t.conversation_id
      WHERE t.id = thread_participants.thread_id
        AND cp.user_id = auth.uid()
        AND cp.left_at IS NULL
    )
  );

-- Users can join threads in conversations they participate in
CREATE POLICY "Users can join threads"
  ON public.thread_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.threads t
      JOIN public.conversation_participants cp ON cp.conversation_id = t.conversation_id
      WHERE t.id = thread_participants.thread_id
        AND cp.user_id = auth.uid()
        AND cp.left_at IS NULL
        AND t.is_closed = false
    )
  );

-- Users can update their own participation (last_read_at)
CREATE POLICY "Users can update their participation"
  ON public.thread_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update thread message_count and participant_count
CREATE OR REPLACE FUNCTION update_thread_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- New message in thread
    IF NEW.thread_id IS NOT NULL THEN
      UPDATE public.threads
      SET 
        message_count = message_count + 1,
        last_message_id = NEW.id,
        updated_at = NOW()
      WHERE id = NEW.thread_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Message deleted from thread
    IF OLD.thread_id IS NOT NULL THEN
      UPDATE public.threads
      SET message_count = GREATEST(0, message_count - 1)
      WHERE id = OLD.thread_id;
    END IF;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update thread counts when messages are added/deleted
CREATE TRIGGER update_thread_message_count
  AFTER INSERT OR DELETE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_counts();

-- Function to update thread participant_count
CREATE OR REPLACE FUNCTION update_thread_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.threads
    SET participant_count = participant_count + 1
    WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.threads
    SET participant_count = GREATEST(0, participant_count - 1)
    WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update participant count
CREATE TRIGGER update_thread_participant_count
  AFTER INSERT OR DELETE ON public.thread_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_participant_count();

