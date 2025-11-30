-- Migration: Create functions for session management and email notifications
-- Description: Tạo các functions để xử lý logic đăng nhập, kiểm tra sessions cũ và gửi email cảnh báo

-- Function để kiểm tra và gửi email cảnh báo khi có đăng nhập mới
-- Function này sẽ được gọi từ Edge Function hoặc trigger
CREATE OR REPLACE FUNCTION check_and_notify_new_login(
  p_user_id UUID,
  p_session_id TEXT,
  p_device_info JSONB
)
RETURNS TABLE(
  has_other_sessions BOOLEAN,
  other_sessions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_other_sessions JSONB;
  v_has_other_sessions BOOLEAN := false;
BEGIN
  -- Lấy tất cả sessions active khác (trừ session hiện tại)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'device_name', device_name,
      'browser_name', browser_name,
      'os_name', os_name,
      'device_type', device_type,
      'created_at', created_at,
      'logout_token', logout_token
    )
  ), '[]'::jsonb)
  INTO v_other_sessions
  FROM user_sessions
  WHERE user_id = p_user_id
    AND is_active = true
    AND session_id != p_session_id;

  -- Kiểm tra có sessions khác không
  IF v_other_sessions IS NOT NULL AND jsonb_array_length(v_other_sessions) > 0 THEN
    v_has_other_sessions := true;
  END IF;

  RETURN QUERY SELECT v_has_other_sessions, v_other_sessions;
END;
$$;

-- Function để lấy thông tin user email từ user_id
CREATE OR REPLACE FUNCTION get_user_email(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Lấy email từ auth.users (Supabase Auth)
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = p_user_id;

  RETURN v_email;
END;
$$;

-- Function để logout session bằng logout_token
CREATE OR REPLACE FUNCTION logout_session_by_token(p_logout_token UUID)
RETURNS TABLE(
  success BOOLEAN,
  session_id TEXT,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id TEXT;
  v_user_id UUID;
  v_found_count INTEGER;
BEGIN
  -- Lấy thông tin session (SECURITY DEFINER bypass RLS)
  SELECT user_sessions.session_id, user_sessions.user_id
  INTO v_session_id, v_user_id
  FROM public.user_sessions
  WHERE logout_token = p_logout_token
    AND is_active = true;

  -- Nếu không tìm thấy session
  IF v_session_id IS NULL THEN
    -- Log để debug
    RAISE NOTICE 'Session not found for token: %', p_logout_token;
    RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Deactivate session (SECURITY DEFINER bypass RLS)
  UPDATE public.user_sessions
  SET is_active = false,
      last_active_at = NOW()
  WHERE logout_token = p_logout_token
    AND is_active = true;

  -- Kiểm tra xem có update được không
  GET DIAGNOSTICS v_found_count = ROW_COUNT;
  
  IF v_found_count = 0 THEN
    RAISE NOTICE 'Failed to update session for token: %', p_logout_token;
    RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_session_id, v_user_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_and_notify_new_login(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email(UUID) TO authenticated;
-- Grant cho cả authenticated và anon để có thể gọi từ email (user chưa đăng nhập)
GRANT EXECUTE ON FUNCTION logout_session_by_token(UUID) TO authenticated, anon;

-- Function để gửi email thông qua Supabase SMTP (nếu đã config)
-- Note: Supabase không có direct function để gửi custom email
-- Cần dùng Edge Function hoặc external service
-- Function này chỉ để trigger email notification (có thể dùng với webhook)

CREATE OR REPLACE FUNCTION send_login_notification_email(
  p_user_id UUID,
  p_email TEXT,
  p_subject TEXT,
  p_html_content TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Lưu email vào bảng notifications để xử lý sau (nếu cần)
  -- Hoặc trigger webhook để gửi email
  -- Hoặc gọi Edge Function
  
  -- Tạm thời return true, thực tế email sẽ được gửi từ Edge Function
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION send_login_notification_email(UUID, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION send_login_notification_email IS 'Trigger email notification (thực tế email được gửi từ Edge Function)';

-- Comments
COMMENT ON FUNCTION check_and_notify_new_login IS 'Kiểm tra xem user có sessions active khác không và trả về thông tin để gửi email cảnh báo';
COMMENT ON FUNCTION get_user_email IS 'Lấy email của user từ auth.users';
COMMENT ON FUNCTION logout_session_by_token IS 'Logout session bằng logout_token (từ email)';

