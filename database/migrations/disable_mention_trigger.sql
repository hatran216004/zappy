-- Disable the mention notification trigger to prevent duplicate notifications
-- We only want notifications from chatService.ts (type: 'message_mention')
-- Not from database trigger (type: 'mention')

DROP TRIGGER IF EXISTS trg_message_mentions_notify ON public.message_mentions;
DROP FUNCTION IF EXISTS public.create_notification_for_mention();
