-- C-ROB Smart Key Locker — initial schema
-- Run this once against your own Supabase project (SQL Editor, or save it as
-- supabase/migrations/<timestamp>_init_key_locker.sql in your Supabase CLI repo).
-- Contains: profiles, bookings, RLS policies, role helpers, and the
-- server-side @tkmce.ac.in registration restriction.

-- 1. Profiles -----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'member' check (role in ('member', 'execom', 'admin')),
  created_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

-- Security-definer role helpers (avoid recursive RLS on profiles).
create or replace function public.has_role(_user_id uuid, _role text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = _user_id and p.role = _role);
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p where p.id = _user_id and p.role in ('execom', 'admin')
  );
$$;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "Staff can read all profiles" on public.profiles;
create policy "Staff can read all profiles" on public.profiles
  for select to authenticated using (public.is_staff(auth.uid()));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile" on public.profiles
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Privilege-escalation guard: only admins may change the role column.
create or replace function public.prevent_role_self_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only administrators can change user roles';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- New signups get a profile with the default 'member' role.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone',
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Institutional email restriction (server-side, cannot be bypassed) -------
create or replace function public.enforce_college_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is null or lower(new.email) !~ '@tkmce\.ac\.in$' then
    raise exception 'Registration is restricted to @tkmce.ac.in email addresses';
  end if;
  return new;
end;
$$;

drop trigger if exists check_college_email on auth.users;
create trigger check_college_email before insert on auth.users
  for each row execute function public.enforce_college_email();

-- 3. Bookings ----------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  start_time timestamptz not null,
  duration_hours int not null check (duration_hours between 1 and 5),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);

create index if not exists bookings_user_id_idx on public.bookings(user_id);
create index if not exists bookings_start_time_idx on public.bookings(start_time);

grant select, insert, update, delete on public.bookings to authenticated;
grant all on public.bookings to service_role;

alter table public.bookings enable row level security;

drop policy if exists "Users can read own bookings" on public.bookings;
create policy "Users can read own bookings" on public.bookings
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Staff can read all bookings" on public.bookings;
create policy "Staff can read all bookings" on public.bookings
  for select to authenticated using (public.is_staff(auth.uid()));

drop policy if exists "Users can create own bookings" on public.bookings;
create policy "Users can create own bookings" on public.bookings
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own bookings" on public.bookings;
create policy "Users can update own bookings" on public.bookings
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Staff can update all bookings" on public.bookings;
create policy "Staff can update all bookings" on public.bookings
  for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists "Users can delete own bookings" on public.bookings;
create policy "Users can delete own bookings" on public.bookings
  for delete to authenticated
  using (auth.uid() = user_id or public.is_staff(auth.uid()));

-- 4. Booking Constraints & Overlap Prevention --------------------------------
create or replace function public.check_booking_overlap()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_new_end timestamptz := new.start_time + (new.duration_hours || ' hours')::interval;
  v_conflict boolean;
begin
  -- Only check overlap if the booking is active
  if new.status in ('pending', 'confirmed') then
    -- Enforce future start time with a 5-minute grace period for network delay
    if new.start_time < (now() - interval '5 minutes') then
      raise exception 'Start time cannot be in the past.';
    end if;

    -- Check for overlap
    select exists (
      select 1 from public.bookings
      where id != new.id
        and status in ('pending', 'confirmed')
        and start_time < v_new_end
        and (start_time + (duration_hours || ' hours')::interval) > new.start_time
    ) into v_conflict;

    if v_conflict then
      raise exception 'The requested time slot overlaps with an existing booking.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_booking_overlap on public.bookings;
create trigger prevent_booking_overlap before insert or update on public.bookings
  for each row execute function public.check_booking_overlap();

-- 5. OTP System --------------------------------------------------------------
create table if not exists public.otps (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  otp_hash text not null,
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  used_at timestamptz,
  attempts int not null default 0,
  last_attempt timestamptz,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists otps_booking_id_idx on public.otps(booking_id);

-- Explicitly enable RLS.
alter table public.otps enable row level security;

-- Allow users to read their own OTP records (to check used_at status on the dashboard)
create policy "Users can read own otps" on public.otps
  for select to authenticated
  using (
    exists (
      select 1 from public.bookings
      where bookings.id = otps.booking_id
        and bookings.user_id = auth.uid()
    )
  );

-- 6. Hardware Events & Key Sessions ------------------------------------------

create table if not exists public.key_sessions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  current_holder uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'active' check (status in ('active', 'completed'))
);

create index if not exists key_sessions_booking_id_idx on public.key_sessions(booking_id);

alter table public.key_sessions enable row level security;
create policy "Users can read own key sessions" on public.key_sessions
  for select to authenticated
  using (current_holder = auth.uid());

create table if not exists public.hardware_events (
  id uuid primary key default gen_random_uuid(),
  esp32_id text not null,
  event_type text not null check (event_type in ('locker_opened', 'key_removed', 'key_returned', 'authentication_success', 'authentication_failure', 'power_restored')),
  booking_id uuid references public.bookings(id) on delete cascade,
  session_id uuid references public.key_sessions(id) on delete cascade,
  esp32_timestamp timestamptz not null,
  server_timestamp timestamptz not null default now(),
  idempotency_key text not null unique
);

create index if not exists hardware_events_booking_id_idx on public.hardware_events(booking_id);
create index if not exists hardware_events_esp32_id_idx on public.hardware_events(esp32_id);

-- Explicitly enable RLS but do NOT grant permissions to authenticated or anon users.
alter table public.hardware_events enable row level security;

-- 7. Notifications & Escalation System ---------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  type text not null check (type in ('reminder', 'escalation', 'system')),
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_booking_type_idx on public.notifications(booking_id, type);

alter table public.notifications enable row level security;

create policy "Users can read own notifications" on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

create policy "Users can update own notifications" on public.notifications
  for update to authenticated
  using (user_id = auth.uid());

-- 8. Key Handovers & Delegation ----------------------------------------------

create table if not exists public.handovers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.key_sessions(id) on delete cascade,
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending_acceptance', 'completed', 'expired', 'cancelled', 'rejected')),
  initiated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz
);

create unique index only_one_pending_handover on public.handovers (session_id) where status = 'pending_acceptance';
create index handovers_to_user_idx on public.handovers(to_user_id);
create index handovers_from_user_idx on public.handovers(from_user_id);

alter table public.handovers enable row level security;

create policy "Users can read related handovers" on public.handovers
  for select to authenticated
  using (
    auth.uid() in (from_user_id, to_user_id) or 
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'execom'))
  );

create policy "Users can insert handovers" on public.handovers
  for insert to authenticated
  with check (
    from_user_id = auth.uid() or 
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'execom'))
  );

create policy "Users can update handovers" on public.handovers
  for update to authenticated
  using (
    auth.uid() in (from_user_id, to_user_id) or 
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'execom'))
  );

/*
-- INSTRUCTIONS FOR SETUP:
-- To enable the cron scheduler, run this manually in the Supabase SQL Editor:

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'process-locker-notifications',
  '*/5 * * * *',
  $$
  select net.http_post(
      url:='https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/functions/v1/cron-notifier',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb
  );
  $$
);
*/
