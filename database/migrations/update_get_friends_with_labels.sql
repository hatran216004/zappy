-- Update get_friends function to include label_id
-- This migration adds label_id array to the get_friends function return

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.get_friends();

-- Create updated function
CREATE OR REPLACE FUNCTION public.get_friends()
RETURNS TABLE (
  id uuid,
  display_name text,
  username text,
  avatar_url text,
  status text,
  last_seen_at timestamp with time zone,
  label_id text[]
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.username,
    p.avatar_url,
    p.status,
    p.last_seen_at,
    -- Get array of label IDs (convert UUID to TEXT)
    COALESCE(
      ARRAY_AGG(clm.label_id::text) FILTER (WHERE clm.label_id IS NOT NULL),
      ARRAY[]::text[]
    ) as label_id
  FROM friends f
  INNER JOIN profiles p ON p.id = f.friend_id
  LEFT JOIN contact_label_map clm ON clm.friend_id = f.friend_id
  WHERE f.user_id = auth.uid()
  GROUP BY p.id, p.display_name, p.username, p.avatar_url, p.status, p.last_seen_at
  ORDER BY p.display_name;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_friends() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_friends() IS 'Returns list of friends for the current user with their assigned labels';

