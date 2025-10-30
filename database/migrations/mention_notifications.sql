-- Notifications table to deliver mention alerts
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_notifications_user on public.notifications(user_id);

-- Function and trigger to create a notification when a mention is inserted
create or replace function public.create_notification_for_mention()
returns trigger as $$
begin
  insert into public.notifications (user_id, type, data)
  values (
    new.mentioned_user_id,
    'mention',
    jsonb_build_object(
      'message_id', new.message_id,
      'mentioned_user_id', new.mentioned_user_id
    )
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_message_mentions_notify on public.message_mentions;
create trigger trg_message_mentions_notify
after insert on public.message_mentions
for each row execute function public.create_notification_for_mention();


