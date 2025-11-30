-- Migration: Create user_sessions table
-- Description: Lưu thông tin sessions/devices để theo dõi đăng nhập trên nhiều thiết bị và gửi cảnh báo

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- Supabase session ID (access_token hoặc refresh_token)
  device_name TEXT, -- Tên thiết bị (tự động detect hoặc user đặt)
  browser_name TEXT, -- Tên browser (Chrome, Firefox, Safari, etc.)
  browser_version TEXT, -- Version của browser
  os_name TEXT, -- Tên OS (Windows, macOS, Linux, iOS, Android)
  os_version TEXT, -- Version của OS
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')), -- Loại thiết bị
  ip_address TEXT, -- IP address (nếu có thể lấy được)
  user_agent TEXT, -- Full user agent string
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Thời gian hoạt động cuối
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Thời gian tạo session
  is_active BOOLEAN NOT NULL DEFAULT true, -- Session còn active không
  logout_token UUID UNIQUE DEFAULT gen_random_uuid(), -- Token để logout từ email
  expires_at TIMESTAMPTZ -- Thời gian hết hạn session (optional, có thể dùng để cleanup)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON public.user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_logout_token ON public.user_sessions(logout_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON public.user_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON public.user_sessions(last_active_at DESC);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert their own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete their own sessions" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.user_sessions IS 'Lưu thông tin sessions/devices của user để theo dõi đăng nhập trên nhiều thiết bị';
COMMENT ON COLUMN public.user_sessions.session_id IS 'Supabase session ID (access_token hoặc refresh_token)';
COMMENT ON COLUMN public.user_sessions.logout_token IS 'Token duy nhất để logout session từ email';
COMMENT ON COLUMN public.user_sessions.device_type IS 'Loại thiết bị: desktop, mobile, tablet, unknown';

