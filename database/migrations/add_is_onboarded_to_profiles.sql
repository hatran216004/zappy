-- Migration: Add is_onboarded column to profiles table
-- Description: Thêm cột is_onboarded để theo dõi trạng thái onboarding của user

-- Thêm cột is_onboarded với giá trị mặc định là false
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT false;

-- Tạo index để tối ưu query (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_is_onboarded ON profiles(is_onboarded);

-- Comment cho cột
COMMENT ON COLUMN profiles.is_onboarded IS 'Đánh dấu user đã hoàn thành onboarding tour hay chưa';

