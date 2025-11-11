-- Function: search users by email from auth.users, returning profiles rows
-- SECURITY: Using SECURITY DEFINER and limiting returned fields to public.profiles
-- Only authenticated users can execute

CREATE OR REPLACE FUNCTION public.search_users_by_email(
  _term text,
  _current_user_id uuid
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_term text := COALESCE(_term, '');
BEGIN
  -- Basic guard
  IF v_term IS NULL OR length(trim(v_term)) < 2 THEN
    RETURN;
  END IF;

  -- Return profiles that have matching email in auth.users
  RETURN QUERY
  SELECT p.*
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.is_disabled = false
    AND p.id <> _current_user_id
    AND (u.email ILIKE '%' || v_term || '%');
END;
$$;

REVOKE ALL ON FUNCTION public.search_users_by_email(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_users_by_email(text, uuid) TO authenticated;


