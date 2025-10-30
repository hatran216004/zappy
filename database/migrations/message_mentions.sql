-- Message mentions: store which users were mentioned in which message
create table if not exists public.message_mentions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  mentioned_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_message_mentions_message on public.message_mentions(message_id);
create index if not exists idx_message_mentions_user on public.message_mentions(mentioned_user_id);


