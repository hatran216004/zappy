-- Migration to ensure friendships are NOT deleted when blocking a user
-- This allows blocked users to remain visible in the friends list

-- Check if there's a trigger that deletes friendships on block
-- If such a trigger exists, we need to remove it

-- First, check for any triggers on the blocks table
DO $$
DECLARE
    trig_name TEXT;
BEGIN
    -- Find triggers on blocks table
    FOR trig_name IN
        SELECT t.trigger_name
        FROM information_schema.triggers t
        WHERE t.event_object_table = 'blocks'
    LOOP
        RAISE NOTICE 'Found trigger on blocks table: %', trig_name;
    END LOOP;
END $$;

-- Check if block_user RPC function deletes friendships
-- If it does, we'll need to create a new version that doesn't

-- Note: This migration is informational
-- The actual fix is in the frontend code (friendServices.ts)
-- which now inserts directly into blocks table instead of calling block_user RPC

COMMENT ON TABLE blocks IS 'Blocks table - friendships should NOT be deleted when blocking';

