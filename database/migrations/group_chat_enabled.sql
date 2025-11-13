-- Migration: Add chat_enabled field to conversations table
-- Description: Allow admins to enable/disable chat in group conversations
-- When enabled, only admins can send messages; members can only view

-- Add chat_enabled column to conversations table
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.conversations.chat_enabled IS 'When true, only admins can send messages in group. When false, all members can chat. Default is false.';

-- Create index for faster queries (if needed)
CREATE INDEX IF NOT EXISTS idx_conversations_chat_enabled ON public.conversations(chat_enabled) WHERE type = 'group';

