-- Function to get or create a direct conversation with a user
-- This allows messaging strangers (users who are not friends yet)
-- Different from get_direct_conversation (which only gets existing conversations)

CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(
  _user_id UUID
)
RETURNS TABLE(
  id UUID,
  type TEXT,
  title TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_message_id UUID,
  participants UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_conversation_id UUID;
  v_pair_exists BOOLEAN;
BEGIN
  -- Get current authenticated user
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF v_current_user_id = _user_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;
  
  -- Check if a direct pair already exists
  SELECT EXISTS(
    SELECT 1 
    FROM public.direct_pairs dp
    WHERE (dp.user_a = v_current_user_id AND dp.user_b = _user_id)
       OR (dp.user_a = _user_id AND dp.user_b = v_current_user_id)
  ) INTO v_pair_exists;
  
  IF v_pair_exists THEN
    -- Return existing conversation
    RETURN QUERY
    SELECT 
      c.id,
      c.type::TEXT,
      c.title,
      c.photo_url,
      c.created_at,
      c.updated_at,
      c.last_message_id,
      ARRAY[v_current_user_id, _user_id] AS participants
    FROM public.conversations c
    JOIN public.direct_pairs dp ON dp.conversation_id = c.id
    WHERE (dp.user_a = v_current_user_id AND dp.user_b = _user_id)
       OR (dp.user_a = _user_id AND dp.user_b = v_current_user_id)
    LIMIT 1;
  ELSE
    -- Create new conversation
    INSERT INTO public.conversations (type, created_by)
    VALUES ('direct', v_current_user_id)
    RETURNING conversations.id INTO v_conversation_id;
    
    -- Create direct pair
    INSERT INTO public.direct_pairs (conversation_id, user_a, user_b)
    VALUES (v_conversation_id, v_current_user_id, _user_id);
    
    -- Add conversation participants
    INSERT INTO public.conversation_participants (conversation_id, user_id, role)
    VALUES 
      (v_conversation_id, v_current_user_id, 'member'),
      (v_conversation_id, _user_id, 'member');
    
    -- Return newly created conversation
    RETURN QUERY
    SELECT 
      c.id,
      c.type::TEXT,
      c.title,
      c.photo_url,
      c.created_at,
      c.updated_at,
      c.last_message_id,
      ARRAY[v_current_user_id, _user_id] AS participants
    FROM public.conversations c
    WHERE c.id = v_conversation_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_or_create_direct_conversation(UUID) IS 
'Gets an existing direct conversation or creates a new one with the specified user. Allows messaging strangers (non-friends).';

