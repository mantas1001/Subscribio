-- Subscribio: one shared workspace for everyone who signs in, with an activity log.
--
-- Run once in Supabase → SQL Editor (it is safe to re-run: it drops and recreates the objects
-- it owns, and re-seeds the example data only when the workspace is empty).
--
-- Security model
--   * Every signed-in Google user becomes a member the first time the app calls join_workspace().
--   * Members can READ employees, subscriptions, requests and the activity log (RLS).
--   * Nobody writes to the tables directly. Every change goes through a SECURITY DEFINER function
--     below, which checks the caller, makes the change and writes one activity row, in a single
--     transaction. So the log cannot be skipped or forged from the browser.
--   * Admins (seeded from admin_emails) can reset/clear the workspace, block or unblock people
--     and make others admin. Blocked members can read and change nothing.

-- ── Tables ──────────────────────────────────────────────────────────────────────────────────

create table if not exists public.admin_emails (
  email text primary key
);

create table if not exists public.members (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text,
  role       text not null default 'member' check (role in ('admin', 'member')),
  blocked    boolean not null default false,
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);

create table if not exists public.employees (
  id         text primary key,
  name       text not null check (length(name) between 1 and 200),
  email      text not null check (length(email) between 3 and 320),
  role       text check (role is null or length(role) <= 100),
  created_at timestamptz not null default now()
);
create unique index if not exists employees_email_lower on public.employees (lower(email));

create table if not exists public.subscriptions (
  id               text primary key,
  tool             text not null check (length(tool) between 1 and 60),
  plan             text check (plan is null or length(plan) <= 60),
  seats            integer not null check (seats between 1 and 9999),
  monthly_cost_eur numeric(12, 2) not null check (monthly_cost_eur > 0 and monthly_cost_eur < 1000000),
  renewal_date     date not null,
  status           text not null default 'active' check (status in ('active', 'cancelled')),
  employee_id      text references public.employees (id) on delete set null,
  created_at       timestamptz not null default now()
);

create table if not exists public.requests (
  id               text primary key,
  employee_id      text not null references public.employees (id) on delete cascade,
  tool             text not null,
  monthly_cost_eur numeric(12, 2) not null check (monthly_cost_eur > 0),
  reason           text,
  status           text not null default 'pending'
                   check (status in ('pending', 'approved', 'purchased', 'declined')),
  requested_at     date,
  created_at       timestamptz not null default now()
);

create table if not exists public.activity (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor_id    uuid,
  actor_email text,
  actor_name  text,
  action      text not null,
  summary     text not null
);
create index if not exists activity_at on public.activity (at desc);

insert into public.admin_emails (email) values ('mantasdainauskas22@gmail.com')
on conflict do nothing;

-- ── Row Level Security: read-only for members, no direct writes for anyone ───────────────────

alter table public.admin_emails  enable row level security;
alter table public.members       enable row level security;
alter table public.employees     enable row level security;
alter table public.subscriptions enable row level security;
alter table public.requests      enable row level security;
alter table public.activity      enable row level security;

create or replace function public.is_active_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where user_id = auth.uid() and not blocked);
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where user_id = auth.uid() and role = 'admin' and not blocked);
$$;

drop policy if exists "members read employees" on public.employees;
create policy "members read employees" on public.employees
  for select to authenticated using (public.is_active_member());

drop policy if exists "members read subscriptions" on public.subscriptions;
create policy "members read subscriptions" on public.subscriptions
  for select to authenticated using (public.is_active_member());

drop policy if exists "members read requests" on public.requests;
create policy "members read requests" on public.requests
  for select to authenticated using (public.is_active_member());

drop policy if exists "members read activity" on public.activity;
create policy "members read activity" on public.activity
  for select to authenticated using (public.is_active_member());

-- Your own row, or everyone's if you are an admin (Team access page).
drop policy if exists "read own or all as admin" on public.members;
create policy "read own or all as admin" on public.members
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- ── Internal helpers (not callable from the browser) ─────────────────────────────────────────

create or replace function public._require_member() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if not public.is_active_member() then
    raise exception 'no_access' using errcode = '42501';
  end if;
end;
$$;

create or replace function public._require_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  perform public._require_member();
  if not public.is_admin() then
    raise exception 'admin_only' using errcode = '42501';
  end if;
end;
$$;

create or replace function public._log(p_action text, p_summary text) returns void
language sql security definer set search_path = public as $$
  insert into activity (actor_id, actor_email, actor_name, action, summary)
  select auth.uid(), m.email, coalesce(m.name, m.email), p_action, p_summary
  from members m where m.user_id = auth.uid();
$$;

create or replace function public._seed_example() returns void
language sql security definer set search_path = public as $$
  insert into employees (id, name, email, role)
    values ('emp-drew', 'Drew Cooper', 'drew.cooper@example.com', 'Marketing');
  insert into subscriptions (id, tool, plan, seats, monthly_cost_eur, renewal_date, status, employee_id)
    values ('sub-ahrefs', 'Ahrefs', 'Standard', 1, 99, '2026-11-21', 'active', 'emp-drew');
  insert into requests (id, employee_id, tool, monthly_cost_eur, reason, status, requested_at)
    values ('req-chatgpt', 'emp-drew', 'ChatGPT Team', 30,
            'Draft campaign copy and summarize customer research faster.', 'pending', '2026-11-03');
$$;

create or replace function public._wipe() returns void
language sql security definer set search_path = public as $$
  delete from requests where true;
  delete from subscriptions where true;
  delete from employees where true;
$$;

-- ── Joining ─────────────────────────────────────────────────────────────────────────────────

create or replace function public.join_workspace() returns public.members
language plpgsql security definer set search_path = public as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_name  text := coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name',
                           auth.jwt() -> 'user_metadata' ->> 'name');
  v_new   boolean;
  r       members;
begin
  if auth.uid() is null or v_email is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  v_new := not exists (select 1 from members where user_id = auth.uid());
  insert into members (user_id, email, name, role)
  values (auth.uid(), v_email, v_name,
          case when exists (select 1 from admin_emails a where lower(a.email) = lower(v_email))
               then 'admin' else 'member' end)
  on conflict (user_id) do update
    set last_seen = now(), email = excluded.email, name = coalesce(excluded.name, members.name)
  returning * into r;
  if v_new then
    perform public._log('member.joined', 'Signed in to Subscribio for the first time');
  end if;
  return r;
end;
$$;

-- ── Workspace actions (each one writes one activity row) ─────────────────────────────────────

create or replace function public.approve_request(p_id text) returns void
language plpgsql security definer set search_path = public as $$
declare v_tool text; v_who text;
begin
  perform public._require_member();
  update requests r set status = 'approved'
    from employees e
   where r.id = p_id and r.status = 'pending' and e.id = r.employee_id
  returning r.tool, e.name into v_tool, v_who;
  if not found then raise exception 'request_not_pending'; end if;
  perform public._log('request.approved', format('Approved the %s request from %s', v_tool, v_who));
end;
$$;

create or replace function public.decline_request(p_id text) returns void
language plpgsql security definer set search_path = public as $$
declare v_tool text; v_who text;
begin
  perform public._require_member();
  update requests r set status = 'declined'
    from employees e
   where r.id = p_id and r.status = 'pending' and e.id = r.employee_id
  returning r.tool, e.name into v_tool, v_who;
  if not found then raise exception 'request_not_pending'; end if;
  perform public._log('request.declined', format('Declined the %s request from %s', v_tool, v_who));
end;
$$;

create or replace function public.record_purchase(p_id text, p_amount_eur numeric, p_renewal_date date)
returns void
language plpgsql security definer set search_path = public as $$
declare v_req requests; v_who text; v_amount numeric;
begin
  perform public._require_member();
  select * into v_req from requests where id = p_id and status = 'approved' for update;
  if not found then raise exception 'request_not_approved'; end if;
  v_amount := coalesce(p_amount_eur, v_req.monthly_cost_eur);
  insert into subscriptions (id, tool, seats, monthly_cost_eur, renewal_date, status, employee_id)
    values ('sub-' || v_req.id, v_req.tool, 1, v_amount, p_renewal_date, 'active', v_req.employee_id);
  update requests set status = 'purchased' where id = v_req.id;
  select name into v_who from employees where id = v_req.employee_id;
  perform public._log('request.purchased',
    format('Recorded the %s purchase for %s (€%s/month)', v_req.tool, v_who, to_char(v_amount, 'FM999999990.00')));
end;
$$;

create or replace function public.cancel_subscription(p_id text) returns void
language plpgsql security definer set search_path = public as $$
declare v_tool text;
begin
  perform public._require_member();
  update subscriptions set status = 'cancelled'
   where id = p_id and status = 'active'
  returning tool into v_tool;
  if not found then raise exception 'subscription_not_active'; end if;
  perform public._log('subscription.cancelled', format('Cancelled the %s subscription', v_tool));
end;
$$;

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
  perform public._log('employee.added', format('Added %s (%s) to the team', trim(p_name), trim(p_email)));
end;
$$;

create or replace function public.add_subscription(
  p_id text, p_tool text, p_plan text, p_seats integer, p_monthly_cost_eur numeric,
  p_renewal_date date, p_employee_id text
) returns void
language plpgsql security definer set search_path = public as $$
declare v_who text;
begin
  perform public._require_member();
  select name into v_who from employees where id = p_employee_id;
  if not found then raise exception 'employee_not_found'; end if;
  insert into subscriptions (id, tool, plan, seats, monthly_cost_eur, renewal_date, status, employee_id)
    values (p_id, trim(p_tool), nullif(trim(coalesce(p_plan, '')), ''), p_seats,
            round(p_monthly_cost_eur, 2), p_renewal_date, 'active', p_employee_id);
  perform public._log('subscription.added',
    format('Added a %s subscription for %s (€%s/month)', trim(p_tool), v_who,
           to_char(round(p_monthly_cost_eur, 2), 'FM999999990.00')));
end;
$$;

create or replace function public.load_example_data() returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public._require_admin();
  perform public._wipe();
  perform public._seed_example();
  perform public._log('workspace.example_loaded', 'Replaced all data with the example data');
end;
$$;

create or replace function public.clear_all_data() returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public._require_admin();
  perform public._wipe();
  perform public._log('workspace.cleared', 'Reset all data to zero');
end;
$$;

-- ── Team access (admins) ────────────────────────────────────────────────────────────────────

create or replace function public.set_member_role(p_user_id uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  perform public._require_admin();
  if p_role not in ('admin', 'member') then raise exception 'invalid_role'; end if;
  if p_user_id = auth.uid() then raise exception 'cannot_change_self'; end if;
  update members set role = p_role where user_id = p_user_id returning email into v_email;
  if not found then raise exception 'member_not_found'; end if;
  perform public._log('member.role_changed',
    case when p_role = 'admin' then format('Made %s an admin', v_email)
         else format('Removed admin rights from %s', v_email) end);
end;
$$;

create or replace function public.set_member_blocked(p_user_id uuid, p_blocked boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  perform public._require_admin();
  if p_user_id = auth.uid() then raise exception 'cannot_change_self'; end if;
  update members set blocked = p_blocked where user_id = p_user_id returning email into v_email;
  if not found then raise exception 'member_not_found'; end if;
  perform public._log(case when p_blocked then 'member.blocked' else 'member.unblocked' end,
    case when p_blocked then format('Removed access for %s', v_email)
         else format('Restored access for %s', v_email) end);
end;
$$;

-- ── Who may call what ───────────────────────────────────────────────────────────────────────

revoke all on function public._require_member()  from public, anon, authenticated;
revoke all on function public._require_admin()   from public, anon, authenticated;
revoke all on function public._log(text, text)   from public, anon, authenticated;
revoke all on function public._seed_example()    from public, anon, authenticated;
revoke all on function public._wipe()            from public, anon, authenticated;

revoke all on function public.join_workspace() from public, anon;
revoke all on function public.approve_request(text) from public, anon;
revoke all on function public.decline_request(text) from public, anon;
revoke all on function public.record_purchase(text, numeric, date) from public, anon;
revoke all on function public.cancel_subscription(text) from public, anon;
revoke all on function public.add_employee(text, text, text, text) from public, anon;
revoke all on function public.add_subscription(text, text, text, integer, numeric, date, text) from public, anon;
revoke all on function public.load_example_data() from public, anon;
revoke all on function public.clear_all_data() from public, anon;
revoke all on function public.set_member_role(uuid, text) from public, anon;
revoke all on function public.set_member_blocked(uuid, boolean) from public, anon;

grant execute on function public.join_workspace() to authenticated;
grant execute on function public.approve_request(text) to authenticated;
grant execute on function public.decline_request(text) to authenticated;
grant execute on function public.record_purchase(text, numeric, date) to authenticated;
grant execute on function public.cancel_subscription(text) to authenticated;
grant execute on function public.add_employee(text, text, text, text) to authenticated;
grant execute on function public.add_subscription(text, text, text, integer, numeric, date, text) to authenticated;
grant execute on function public.load_example_data() to authenticated;
grant execute on function public.clear_all_data() to authenticated;
grant execute on function public.set_member_role(uuid, text) to authenticated;
grant execute on function public.set_member_blocked(uuid, boolean) to authenticated;

-- Tables: read through RLS only; no writes from the browser.
grant usage on schema public to authenticated;
revoke all on public.admin_emails, public.members, public.employees, public.subscriptions,
              public.requests, public.activity from anon, authenticated;
grant select on public.members, public.employees, public.subscriptions, public.requests,
                public.activity to authenticated;

-- ── Live updates: the app refreshes when a new activity row appears ──────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activity'
  ) then
    alter publication supabase_realtime add table public.activity;
  end if;
end;
$$;

-- ── Start with the same example data the app shows today (only if empty) ─────────────────────

do $$
begin
  if not exists (select 1 from public.employees) and not exists (select 1 from public.subscriptions)
     and not exists (select 1 from public.requests) then
    perform public._seed_example();
  end if;
end;
$$;
