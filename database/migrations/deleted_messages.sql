-- Migration: Add deleted_messages table for user-specific message deletion
-- This allows users to delete messages "for me" without affecting others

-- Create deleted_messages table
CREATE TABLE IF NOT EXISTS deleted_messages (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_deleted_messages_user_id ON deleted_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_messages_message_id ON deleted_messages(message_id);

-- Add RLS policies
ALTER TABLE deleted_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own deleted messages
CREATE POLICY "Users can view their own deleted messages"
  ON deleted_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can delete messages for themselves
CREATE POLICY "Users can delete messages for themselves"
  ON deleted_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can un-delete their own deleted messages
CREATE POLICY "Users can remove their deleted messages"
  ON deleted_messages
  FOR DELETE
  USING (auth.uid() = user_id);

