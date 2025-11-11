-- Pinned messages: allow up to 3 pinned per conversation
create table if not exists public.pinned_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  pinned_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (conversation_id, message_id)
);

create index if not exists idx_pinned_messages_convo on public.pinned_messages(conversation_id, created_at desc);

-- Optional server-side guard: prevent more than 3 per conversation
create or replace function public.enforce_max_three_pins()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*) from public.pinned_messages
    where conversation_id = new.conversation_id
  ) >= 3 then
    raise exception 'Maximum 3 pinned messages per conversation'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_pins_max3 on public.pinned_messages;
create trigger trg_pins_max3
before insert on public.pinned_messages
for each row execute function public.enforce_max_three_pins();


