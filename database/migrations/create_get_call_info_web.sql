-- Create get_call_info_web function (for React app)
-- Separate from get_call_info (used by Flutter)

CREATE OR REPLACE FUNCTION public.get_call_info_web(_call_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  type TEXT,
  title TEXT,
  photo_url TEXT,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  is_video_enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE 
  _user_query UUID;
  _conversation RECORD;
BEGIN
  SELECT auth.uid() INTO _user_query;
  
  SELECT 
    conv.id,
    conv.type,
    conv.title,
    conv.photo_url,
    call.type as call_type 
  INTO _conversation 
  FROM public.conversations conv 
  JOIN public.calls call ON conv.id = call.conversation_id 
  WHERE call.id = _call_id;
  
  IF (_conversation.type = 'direct'::convo_type) THEN
    -- Direct conversation
    RETURN QUERY 
    SELECT 
      _conversation.id, 
      _conversation.type::TEXT, 
      NULL::TEXT, 
      NULL::TEXT, 
      profile.display_name, 
      profile.username, 
      profile.avatar_url, 
      (_conversation.call_type::TEXT = 'video')::BOOLEAN
    FROM public.direct_pairs direct 
    JOIN public.profiles profile ON (
      (profile.id = direct.user_a AND direct.user_b = _user_query) OR 
      (profile.id = direct.user_b AND direct.user_a = _user_query)
    )
    WHERE _conversation.id = direct.conversation_id;
    
  ELSE
    -- Group conversation - select from variable
    RETURN QUERY 
    SELECT 
      _conversation.id, 
      _conversation.type::TEXT, 
      _conversation.title, 
      _conversation.photo_url, 
      NULL::TEXT, 
      NULL::TEXT, 
      NULL::TEXT,
      (_conversation.call_type::TEXT = 'video')::BOOLEAN;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_call_info_web(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_call_info_web(UUID) IS 'Get call info for React app. Separate from get_call_info (used by Flutter).';

