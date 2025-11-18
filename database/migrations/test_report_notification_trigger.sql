-- Test script to verify report notification triggers are working
-- Run this in Supabase SQL Editor after applying create_report_status_notifications.sql

-- 1. Check if triggers exist
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN (
  'trg_user_reports_status_notify',
  'trg_post_reports_status_notify',
  'trg_message_reports_status_notify'
)
ORDER BY trigger_name;

-- 2. Check if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'create_notification_for_user_report_status',
    'create_notification_for_post_report_status',
    'create_notification_for_message_report_status'
  )
ORDER BY routine_name;

-- 3. Test: Find a pending report to test with
-- Replace 'your-user-id' with actual user_id who made a report
SELECT 
  id,
  reported_by,
  status,
  created_at
FROM public.user_reports
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 1;

-- 4. Test: Update a report status (replace 'report-id-here' with actual report id)
-- This should create a notification
/*
UPDATE public.user_reports 
SET 
  status = 'reviewed',
  reviewed_by = 'admin-user-id',  -- Replace with actual admin user_id
  reviewed_at = NOW()
WHERE id = 'report-id-here';  -- Replace with actual report id
*/

-- 5. Check if notification was created
-- Replace 'reported-by-user-id' with the user_id from step 3
/*
SELECT 
  id,
  user_id,
  type,
  data,
  created_at
FROM public.notifications
WHERE user_id = 'reported-by-user-id'
  AND type LIKE 'user_report_%'
ORDER BY created_at DESC
LIMIT 5;
*/

-- 6. Verify notification data structure
/*
SELECT 
  id,
  type,
  data->>'report_id' as report_id,
  data->>'status' as status,
  data->>'reviewed_by_name' as reviewed_by_name,
  created_at
FROM public.notifications
WHERE type LIKE '%_report_%'
ORDER BY created_at DESC
LIMIT 10;
*/

