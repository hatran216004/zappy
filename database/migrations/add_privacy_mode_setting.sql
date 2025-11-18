-- Add privacy mode setting to block friend requests from strangers

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- Add index for queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_private 
ON public.profiles(is_private) 
WHERE is_private = TRUE;

-- Add comment
COMMENT ON COLUMN public.profiles.is_private IS 
'If true, user will not receive friend requests from other users';

