-- Add setting to block messages from strangers (non-friends)

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS block_messages_from_strangers BOOLEAN DEFAULT FALSE;

-- Add index for queries
CREATE INDEX IF NOT EXISTS idx_profiles_block_strangers 
ON public.profiles(block_messages_from_strangers) 
WHERE block_messages_from_strangers = TRUE;

-- Add comment
COMMENT ON COLUMN public.profiles.block_messages_from_strangers IS 
'If true, user will not receive messages from users who are not friends';

