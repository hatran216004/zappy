-- Migration: Create group call function
-- Description: Creates a group call in a conversation and notifies all participants

CREATE OR REPLACE FUNCTION public.create_group_call(
  _conversation_id UUID,
  _is_video_enabled BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_call_id UUID;
  v_participant_ids UUID[];
  v_participant_id UUID;
  v_conversation_type TEXT;
BEGIN
  -- Get current user ID
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF _conversation_id IS NULL THEN
    RAISE EXCEPTION 'Invalid conversation_id';
  END IF;
  
  -- Verify conversation exists and user is a participant
  SELECT type INTO v_conversation_type
  FROM public.conversations
  WHERE id = _conversation_id;
  
  IF v_conversation_type IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;
  
  IF v_conversation_type != 'group' THEN
    RAISE EXCEPTION 'Conversation is not a group';
  END IF;
  
  -- Check if user is a participant
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
    AND user_id = v_current_user_id
    AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'User is not a participant of this conversation';
  END IF;
  
  -- Get all active participants in the conversation
  SELECT ARRAY_AGG(user_id)
  INTO v_participant_ids
  FROM public.conversation_participants
  WHERE conversation_id = _conversation_id
  AND left_at IS NULL;
  
  -- Create call record
  INSERT INTO public.calls (
    conversation_id,
    started_by,
    type,
    participants
  )
  VALUES (
    _conversation_id,
    v_current_user_id,
    CASE WHEN _is_video_enabled THEN 'video'::call_type ELSE 'audio'::call_type END,
    v_participant_ids
  )
  RETURNING id INTO v_call_id;
  
  -- Create call_participants records for all participants
  -- TODO: Update to use real LiveKit tokens like create_direct_call
  -- For now, using same mechanism as existing direct call
  FOREACH v_participant_id IN ARRAY v_participant_ids
  LOOP
    -- Call the same edge function / logic that create_direct_call uses
    -- This ensures group calls work the same as direct calls
    IF v_participant_id = v_current_user_id THEN
      -- Caller joins immediately - use dummy values, will be replaced by trigger/webhook
      INSERT INTO public.call_participants (call_id, user_id, joined_at)
      VALUES (v_call_id, v_participant_id, NOW());
    ELSE
      -- Other participants receive incoming call
      INSERT INTO public.call_participants (call_id, user_id)
      VALUES (v_call_id, v_participant_id);
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Group call created with % participants', array_length(v_participant_ids, 1);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_group_call(UUID, BOOLEAN) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_group_call(UUID, BOOLEAN) IS 'Creates a group call in a conversation. All active participants will receive the call notification. The caller joins immediately.';

