-- Fix poll_participants RLS policy
-- Run this to update the existing policy

-- Drop old policy
DROP POLICY IF EXISTS "Poll creator can add participants" ON public.poll_participants;

-- Create new policy that allows inserting participants if they are members of the conversation
CREATE POLICY "Allow poll participants insert"
  ON public.poll_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls p
      JOIN public.conversation_participants cp 
        ON cp.conversation_id = p.conversation_id
      WHERE p.id = poll_participants.poll_id
        AND cp.user_id = poll_participants.user_id
        AND cp.left_at IS NULL
    )
  );

