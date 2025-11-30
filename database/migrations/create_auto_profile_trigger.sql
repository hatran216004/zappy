-- Migration: Create trigger to auto-create profile when user signs up
-- Description: Tự động tạo profile với username từ email khi user đăng ký (bao gồm OAuth)

-- Function để tự động tạo profile khi user được tạo trong auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_display_name TEXT;
  v_email_prefix TEXT;
BEGIN
  -- Lấy email prefix (phần trước @) để làm username
  IF NEW.email IS NOT NULL THEN
    v_email_prefix := SPLIT_PART(NEW.email, '@', 1);
    -- Loại bỏ ký tự đặc biệt không hợp lệ cho username (nếu cần)
    -- Giữ nguyên để user có thể có username như "john.doe"
    v_username := v_email_prefix;
  ELSE
    -- Fallback nếu không có email
    v_username := 'user_' || SUBSTRING(NEW.id::TEXT, 1, 8);
  END IF;

  -- Lấy display_name từ metadata hoặc email prefix
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->'profile'->>'display_name',
    v_email_prefix,
    'User'
  );

  -- Tạo profile với username từ email
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    gender,
    bio,
    status,
    is_disabled,
    created_at,
    status_updated_at
  ) VALUES (
    NEW.id,
    v_username,
    v_display_name,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      ''
    ),
    false, -- Default gender
    '',
    'offline',
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    -- Chỉ update username nếu chưa có (tránh ghi đè username đã set)
    username = COALESCE(profiles.username, EXCLUDED.username),
    -- Update display_name nếu chưa có
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    -- Update avatar nếu chưa có
    avatar_url = COALESCE(NULLIF(profiles.avatar_url, ''), EXCLUDED.avatar_url);

  RETURN NEW;
END;
$$;

-- Drop trigger nếu đã tồn tại
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Tạo trigger khi user được tạo trong auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Tự động tạo profile với username từ email khi user đăng ký (bao gồm OAuth)';

