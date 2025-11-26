-- Update trigger to check notif_level before creating notification
create or replace function public.create_notification_for_mention()
returns trigger as $$
declare
  conversation_id_val uuid;
  notif_level_val text;
begin
  -- Get conversation_id from message
  select conversation_id into conversation_id_val
  from public.messages
  where id = new.message_id;
  
  -- If conversation_id not found, don't create notification
  if conversation_id_val is null then
    return new;
  end if;
  
  -- Get notif_level for this user in this conversation
  select notif_level into notif_level_val
  from public.conversation_participants
  where conversation_id = conversation_id_val
    and user_id = new.mentioned_user_id
    and left_at is null;
  
  -- Only create notification if notif_level is not 'none'
  -- If notif_level is null, default to 'all' (create notification)
  if notif_level_val is null or notif_level_val != 'none' then
    insert into public.notifications (user_id, type, data)
    values (
      new.mentioned_user_id,
      'mention',
      jsonb_build_object(
        'message_id', new.message_id,
        'mentioned_user_id', new.mentioned_user_id,
        'conversation_id', conversation_id_val
      )
    );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

