-- 0002: stop emails leaking through the activity log.
-- Run once in the Supabase SQL editor (after 0001).
--
-- 1. Members can no longer read activity.actor_email (column-level grant: every column but that).
--    A column revoke alone does nothing while a table-wide grant exists, so the table grant is
--    replaced with one that lists the allowed columns.
revoke select on public.activity from anon, authenticated;
grant select (id, at, actor_id, actor_name, action, summary) on public.activity to authenticated;

-- 2. "Added an employee" log lines no longer include the employee's email.
create or replace function public.add_employee(p_id text, p_name text, p_email text, p_role text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public._require_member();
  begin
    insert into employees (id, name, email, role)
      values (p_id, trim(p_name), trim(p_email), nullif(trim(coalesce(p_role, '')), ''));
  exception when unique_violation then
    raise exception 'duplicate_email';
  end;
  perform public._log('employee.added', format('Added %s to the team', trim(p_name)));
end;
$$;
revoke all on function public.add_employee(text, text, text, text) from public, anon;
grant execute on function public.add_employee(text, text, text, text) to authenticated;

-- 3. Remove emails from log lines already written ("Added Ana (ana@x.com) to the team").
update public.activity
   set summary = regexp_replace(summary, ' \([^()]*@[^()]*\)', '', 'g')
 where action = 'employee.added' and summary ~ '\([^()]*@[^()]*\)';
