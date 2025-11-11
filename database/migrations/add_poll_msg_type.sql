-- Add 'poll' to msg_type enum for messages.type
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'msg_type' and e.enumlabel = 'poll'
  ) then
    alter type public.msg_type add value 'poll';
  end if;
end$$;


