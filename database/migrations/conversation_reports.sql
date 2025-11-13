-- Migration: Create conversation_reports table
-- Description: Allow users to report inappropriate group conversations

-- Reuse existing report_reason enum (created in message_reports.sql)
-- If enum doesn't exist, create it
DO $$ BEGIN
  CREATE TYPE report_reason AS ENUM (
    'spam',
    'harassment',
    'inappropriate_content',
    'violence',
    'hate_speech',
    'fake_news',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create conversation_reports table
CREATE TABLE IF NOT EXISTS public.conversation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason report_reason NOT NULL,
  description TEXT, -- Additional details from user
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate reports from same user for same conversation
  UNIQUE(conversation_id, reported_by)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversation_reports_conversation ON public.conversation_reports(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_reports_reported_by ON public.conversation_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_conversation_reports_status ON public.conversation_reports(status);
CREATE INDEX IF NOT EXISTS idx_conversation_reports_created_at ON public.conversation_reports(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.conversation_reports IS 'Reports of inappropriate group conversations by users';
COMMENT ON COLUMN public.conversation_reports.reason IS 'Reason for reporting the conversation';
COMMENT ON COLUMN public.conversation_reports.description IS 'Additional details provided by the reporter';
COMMENT ON COLUMN public.conversation_reports.status IS 'Status of the report: pending, reviewed, resolved, dismissed';
COMMENT ON COLUMN public.conversation_reports.reviewed_by IS 'Admin who reviewed the report';

-- Enable Row Level Security
ALTER TABLE public.conversation_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create reports (only for group conversations they are part of)
CREATE POLICY "Users can create conversation reports"
  ON public.conversation_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reported_by AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversation_reports.conversation_id
      AND user_id = auth.uid()
      AND left_at IS NULL
    ) AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_reports.conversation_id
      AND type = 'group'
    )
  );

-- Policy: Users can view their own reports
CREATE POLICY "Users can view their own conversation reports"
  ON public.conversation_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reported_by);

-- Note: Admin policies can be added later if needed
-- For now, only users can create and view their own reports

