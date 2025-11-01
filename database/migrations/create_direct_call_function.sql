-- Migration: Create initiate_direct_call function
-- Description: Creates a direct call between the current user and another user
-- This is a new function to avoid modifying existing create_direct_call in database

-- Create new function (don't drop old one to avoid conflicts)
CREATE OR REPLACE FUNCTION public.initiate_direct_call(
  _user_id UUID,
  _is_video_enabled BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_conversation_id UUID;
  v_call_id UUID;
  v_direct_pair RECORD;
BEGIN
  -- Get current user ID
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF _user_id IS NULL OR _user_id = v_current_user_id THEN
    RAISE EXCEPTION 'Invalid user_id';
  END IF;
  
  -- Find existing direct conversation
  SELECT conversation_id INTO v_conversation_id
  FROM public.direct_pairs
  WHERE (user_a = v_current_user_id AND user_b = _user_id)
     OR (user_a = _user_id AND user_b = v_current_user_id)
  LIMIT 1;
  
  -- If no conversation exists, create one
  IF v_conversation_id IS NULL THEN
    -- Create conversation
    INSERT INTO public.conversations (type, created_by)
    VALUES ('direct', v_current_user_id)
    RETURNING id INTO v_conversation_id;
    
    -- Create direct pair
    INSERT INTO public.direct_pairs (conversation_id, user_a, user_b)
    VALUES (v_conversation_id, v_current_user_id, _user_id);
    
    -- Add participants
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES 
      (v_conversation_id, v_current_user_id),
      (v_conversation_id, _user_id);
  END IF;
  
  -- Create call record
  INSERT INTO public.calls (
    conversation_id,
    started_by,
    type,
    participants
  )
  VALUES (
    v_conversation_id,
    v_current_user_id,
    CASE WHEN _is_video_enabled THEN 'video'::call_type ELSE 'audio'::call_type END,
    ARRAY[v_current_user_id, _user_id]
  )
  RETURNING id INTO v_call_id;
  
  -- Create call_participants records
  -- For the caller (current user): set joined_at immediately
  INSERT INTO public.call_participants (
    call_id,
    user_id,
    joined_at,
    token,
    url
  )
  VALUES (
    v_call_id,
    v_current_user_id,
    NOW(),
    gen_random_uuid()::TEXT, -- Placeholder token, should be replaced with actual LiveKit token
    '' -- Placeholder URL, should be replaced with actual LiveKit URL
  );
  
  -- For the callee (other user): don't set joined_at yet (they will join when they answer)
  INSERT INTO public.call_participants (
    call_id,
    user_id,
    token,
    url
  )
  VALUES (
    v_call_id,
    _user_id,
    gen_random_uuid()::TEXT, -- Placeholder token, should be replaced with actual LiveKit token
    '' -- Placeholder URL, should be replaced with actual LiveKit URL
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.initiate_direct_call(UUID, BOOLEAN) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.initiate_direct_call(UUID, BOOLEAN) IS 'Creates a direct call between the current user and another user. The caller is automatically joined (joined_at is set).';

