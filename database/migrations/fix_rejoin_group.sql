-- Fix: Allow users to rejoin group after being removed
-- This update modifies the join_group_via_invite function to handle rejoining

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
  
  -- Check if user is already an active member
  IF EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = v_conversation_id
      AND user_id = v_user_id
      AND left_at IS NULL
  ) THEN
    RETURN v_conversation_id; -- Already a member, just return
  END IF;
  
  -- Check if user was previously in the group (and left)
  IF EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = v_conversation_id
      AND user_id = v_user_id
      AND left_at IS NOT NULL
  ) THEN
    -- Rejoin: reset left_at to NULL
    UPDATE public.conversation_participants
    SET left_at = NULL,
        joined_at = NOW(),
        role = 'member'
    WHERE conversation_id = v_conversation_id
      AND user_id = v_user_id;
  ELSE
    -- First time joining: insert new record
    INSERT INTO public.conversation_participants (
      conversation_id,
      user_id,
      role
    ) VALUES (
      v_conversation_id,
      v_user_id,
      'member'
    );
  END IF;
  
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

