-- Create trigger to auto-generate LiveKit tokens for call_participants
-- This ensures both direct and group calls get tokens

-- First, create a helper function to generate room name
CREATE OR REPLACE FUNCTION generate_room_name(_call_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'call-' || _call_id::TEXT;
END;
$$;

-- Trigger function to set token and url before insert
CREATE OR REPLACE FUNCTION auto_generate_call_tokens()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_room_name TEXT;
  v_livekit_url TEXT;
BEGIN
  -- Generate room name from call_id
  v_room_name := generate_room_name(NEW.call_id);
  
  -- TODO: Replace with your LiveKit server URL
  -- For now, use empty or placeholder
  v_livekit_url := '';
  
  -- If token is null or empty, generate placeholder
  -- In production, this should call an edge function to generate real JWT
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := gen_random_uuid()::TEXT;
  END IF;
  
  -- If url is null or empty, set to LiveKit URL
  IF NEW.url IS NULL OR NEW.url = '' THEN
    NEW.url := v_livekit_url;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS call_participants_auto_token ON call_participants;

CREATE TRIGGER call_participants_auto_token
  BEFORE INSERT ON call_participants
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_call_tokens();

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_room_name(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_generate_call_tokens() TO authenticated;

COMMENT ON FUNCTION auto_generate_call_tokens() IS 'Auto-generate LiveKit tokens for call participants. TODO: Replace placeholder with real JWT generation.';

-- Note: To generate real LiveKit tokens, you need to:
-- 1. Create a Supabase Edge Function that generates JWT using livekit-server-sdk
-- 2. Modify this trigger to call that edge function via http_post
-- 3. Or use database extension if available

