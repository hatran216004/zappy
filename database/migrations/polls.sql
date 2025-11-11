-- Polls for group conversations
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  question text not null,
  multiple boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(message_id)
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_text text not null,
  idx int not null,
  unique(poll_id, idx)
);

create table if not exists public.poll_votes (
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, option_id, user_id)
);

-- Enforce single choice when multiple = false
create or replace function public.enforce_single_choice_vote()
returns trigger
language plpgsql
as $$
declare
  is_multiple boolean;
begin
  select multiple into is_multiple from public.polls where id = new.poll_id;
  if not is_multiple then
    -- ensure user has no other votes in this poll
    if exists (
      select 1 from public.poll_votes
      where poll_id = new.poll_id and user_id = new.user_id
    ) then
      raise exception 'Only one option allowed in this poll' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_poll_single_choice on public.poll_votes;
create trigger trg_poll_single_choice
before insert on public.poll_votes
for each row execute function public.enforce_single_choice_vote();


