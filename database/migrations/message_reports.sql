-- Migration: Create message_reports table
-- Description: Allow users to report inappropriate messages

-- Create enum for report reasons
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

-- Create message_reports table
CREATE TABLE IF NOT EXISTS public.message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason report_reason NOT NULL,
  description TEXT, -- Additional details from user
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate reports from same user for same message
  UNIQUE(message_id, reported_by)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_reports_message ON public.message_reports(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_reported_by ON public.message_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_message_reports_status ON public.message_reports(status);
CREATE INDEX IF NOT EXISTS idx_message_reports_created_at ON public.message_reports(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.message_reports IS 'Reports of inappropriate messages by users';
COMMENT ON COLUMN public.message_reports.reason IS 'Reason for reporting the message';
COMMENT ON COLUMN public.message_reports.description IS 'Additional details provided by the reporter';
COMMENT ON COLUMN public.message_reports.status IS 'Status of the report: pending, reviewed, resolved, dismissed';
COMMENT ON COLUMN public.message_reports.reviewed_by IS 'Admin who reviewed the report';

-- Enable Row Level Security
ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create reports
CREATE POLICY "Users can create reports"
  ON public.message_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

-- Policy: Users can view their own reports
CREATE POLICY "Users can view their own reports"
  ON public.message_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reported_by);

-- Note: Admin policies can be added later if needed
-- For now, only users can create and view their own reports

