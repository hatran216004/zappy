-- Add poll participants table to restrict who can vote in polls
-- If no participants are specified, all group members can vote
-- If participants are specified, only those users can vote

create table if not exists public.poll_participants (
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

-- Add RLS policies for poll_participants
alter table public.poll_participants enable row level security;

-- Anyone in the conversation can view poll participants
create policy "Anyone in conversation can view poll participants"
  on public.poll_participants for select
  using (
    exists (
      select 1 from public.polls p
      join public.conversation_participants cp on cp.conversation_id = p.conversation_id
      where p.id = poll_participants.poll_id
        and cp.user_id = auth.uid()
        and cp.left_at is null
    )
  );

-- Allow inserting participants if they are members of the conversation
-- and the poll exists in that conversation
create policy "Allow poll participants insert"
  on public.poll_participants for insert
  with check (
    exists (
      select 1 from public.polls p
      join public.conversation_participants cp 
        on cp.conversation_id = p.conversation_id
      where p.id = poll_participants.poll_id
        and cp.user_id = poll_participants.user_id
        and cp.left_at is null
    )
  );

-- Modify poll_votes trigger to check if user is allowed to vote
create or replace function public.check_poll_vote_permission()
returns trigger
language plpgsql
as $$
declare
  participant_count int;
  is_allowed boolean;
begin
  -- Check if there are any participants restrictions for this poll
  select count(*) into participant_count
  from public.poll_participants
  where poll_id = new.poll_id;
  
  -- If no participants specified, anyone in the group can vote
  if participant_count = 0 then
    return new;
  end if;
  
  -- Check if user is in the allowed participants list
  select exists(
    select 1 from public.poll_participants
    where poll_id = new.poll_id
      and user_id = new.user_id
  ) into is_allowed;
  
  if not is_allowed then
    raise exception 'Bạn không được phép tham gia bình chọn này' using errcode = 'P0002';
  end if;
  
  return new;
end;
$$;

drop trigger if exists trg_check_poll_vote_permission on public.poll_votes;
create trigger trg_check_poll_vote_permission
before insert on public.poll_votes
for each row execute function public.check_poll_vote_permission();

-- Add index for better performance
create index if not exists idx_poll_participants_poll_id on public.poll_participants(poll_id);
create index if not exists idx_poll_participants_user_id on public.poll_participants(user_id);

