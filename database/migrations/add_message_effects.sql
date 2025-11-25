-- Add message effects metadata field
-- This allows storing special effects like :fire:, :clap:, etc.

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS effect VARCHAR(50) NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.messages.effect IS 'Special effect for message (fire, clap, etc.)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_effect ON public.messages(effect) WHERE effect IS NOT NULL;

