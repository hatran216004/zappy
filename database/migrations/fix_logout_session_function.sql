-- Fix: Update logout_session_by_token function to ensure it works properly
-- Run this if the function is not working

-- Drop and recreate function with proper settings
DROP FUNCTION IF EXISTS public.logout_session_by_token(UUID);

CREATE OR REPLACE FUNCTION public.logout_session_by_token(p_logout_token UUID)
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
    RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_session_id, v_user_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.logout_session_by_token(UUID) TO authenticated, anon;

-- Comment
COMMENT ON FUNCTION public.logout_session_by_token IS 'Logout session bằng logout_token (từ email). Function này bypass RLS vì là SECURITY DEFINER.';

