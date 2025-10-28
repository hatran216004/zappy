-- Create group_invites table for managing invite links
CREATE TABLE IF NOT EXISTS public.group_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  max_uses INT DEFAULT NULL, -- NULL means unlimited
  used_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_invites_code ON public.group_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_invites_conversation ON public.group_invites(conversation_id);

-- Enable RLS
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read active invites (to join)
CREATE POLICY "Anyone can read active invites"
  ON public.group_invites
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Only group admins can create invites
CREATE POLICY "Group admins can create invites"
  ON public.group_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = group_invites.conversation_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND left_at IS NULL
    )
  );

-- Only group admins can update/delete invites
CREATE POLICY "Group admins can update invites"
  ON public.group_invites
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = group_invites.conversation_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND left_at IS NULL
    )
  );

CREATE POLICY "Group admins can delete invites"
  ON public.group_invites
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = group_invites.conversation_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND left_at IS NULL
    )
  );

-- Function to join group via invite code
CREATE OR REPLACE FUNCTION public.join_group_via_invite(
  _invite_code TEXT
)
RETURNS UUID -- Returns conversation_id
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
  v_conversation_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get and validate invite
  SELECT * INTO v_invite
  FROM public.group_invites
  WHERE invite_code = _invite_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR used_count < max_uses);
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;
  
  v_conversation_id := v_invite.conversation_id;
  
  -- Check if user is already in the group
  IF EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = v_conversation_id
      AND user_id = v_user_id
      AND left_at IS NULL
  ) THEN
    RETURN v_conversation_id; -- Already a member, just return
  END IF;
  
  -- Add user to group as member
  INSERT INTO public.conversation_participants (
    conversation_id,
    user_id,
    role
  ) VALUES (
    v_conversation_id,
    v_user_id,
    'member'
  );
  
  -- Increment used_count
  UPDATE public.group_invites
  SET used_count = used_count + 1
  WHERE id = v_invite.id;
  
  -- Create system message about user joining
  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    type,
    content_text
  ) VALUES (
    v_conversation_id,
    v_user_id,
    'system',
    (SELECT display_name FROM public.profiles WHERE id = v_user_id) || ' đã tham gia nhóm'
  );
  
  RETURN v_conversation_id;
END;
$$;

