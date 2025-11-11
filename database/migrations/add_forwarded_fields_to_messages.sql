-- Add fields to track forwarded messages

-- Add is_forwarded flag
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_forwarded BOOLEAN DEFAULT FALSE;

-- Add original sender reference
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS forwarded_from_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add index for forwarded messages queries
CREATE INDEX IF NOT EXISTS idx_messages_is_forwarded 
ON public.messages(is_forwarded) 
WHERE is_forwarded = TRUE;

-- Add comment
COMMENT ON COLUMN public.messages.is_forwarded IS 'Indicates if this message was forwarded from another conversation';
COMMENT ON COLUMN public.messages.forwarded_from_user_id IS 'Original sender of the message before it was forwarded';

