-- Migration: Create user_reports table
-- Description: Allow users to report inappropriate users

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

-- Create user_reports table
CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason report_reason NOT NULL,
  description TEXT, -- Additional details from user
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate reports from same user for same user
  UNIQUE(reported_user_id, reported_by)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user ON public.user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_by ON public.user_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON public.user_reports(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.user_reports IS 'Reports of inappropriate users by other users';
COMMENT ON COLUMN public.user_reports.reason IS 'Reason for reporting the user';
COMMENT ON COLUMN public.user_reports.description IS 'Additional details provided by the reporter';
COMMENT ON COLUMN public.user_reports.status IS 'Status of the report: pending, reviewed, resolved, dismissed';
COMMENT ON COLUMN public.user_reports.reviewed_by IS 'Admin who reviewed the report';

-- Enable Row Level Security
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create reports (but not report themselves)
CREATE POLICY "Users can create user reports"
  ON public.user_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reported_by AND
    auth.uid() != reported_user_id
  );

-- Policy: Users can view their own reports
CREATE POLICY "Users can view their own user reports"
  ON public.user_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reported_by);

-- Note: Admin policies can be added later if needed
-- For now, only users can create and view their own reports

