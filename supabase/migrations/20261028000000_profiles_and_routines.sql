create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now()
);

create function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(new.email, 'Glow Guide member'), '@', 1)), 40)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

create table public.scan_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  outcome text not null check (outcome = 'face_in_frame'),
  created_at timestamptz not null default now()
);

create table public.routine_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  product_ids text[] not null check (
    cardinality(product_ids) between 1 and 6
    and product_ids <@ array['vitc', 'night', 'micellar', 'pure', 'skin', 'superuv']::text[]
  ),
  created_at timestamptz not null default now()
);

create table public.community_routines (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  description text not null check (char_length(description) between 10 and 300),
  product_ids text[] not null check (
    cardinality(product_ids) between 1 and 6
    and product_ids <@ array['vitc', 'night', 'micellar', 'pure', 'skin', 'superuv']::text[]
  ),
  steps text[] not null check (cardinality(steps) between 2 and 8),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.scan_history enable row level security;
alter table public.routine_history enable row level security;
alter table public.community_routines enable row level security;

revoke all on public.profiles, public.scan_history, public.routine_history, public.community_routines from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, delete on public.scan_history to authenticated;
grant select, insert, delete on public.routine_history to authenticated;
grant select on public.community_routines to anon, authenticated;
grant insert, delete on public.community_routines to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy scan_history_select_own on public.scan_history
  for select to authenticated using (user_id = (select auth.uid()));
create policy scan_history_insert_own on public.scan_history
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy scan_history_delete_own on public.scan_history
  for delete to authenticated using (user_id = (select auth.uid()));

create policy routine_history_select_own on public.routine_history
  for select to authenticated using (user_id = (select auth.uid()));
create policy routine_history_insert_own on public.routine_history
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy routine_history_delete_own on public.routine_history
  for delete to authenticated using (user_id = (select auth.uid()));

create policy community_routines_read_approved_or_own on public.community_routines
  for select to anon, authenticated
  using (status = 'approved' or author_id = (select auth.uid()));
create policy community_routines_submit_pending on public.community_routines
  for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'pending');
create policy community_routines_delete_own_pending on public.community_routines
  for delete to authenticated
  using (author_id = (select auth.uid()) and status = 'pending');

create index scan_history_user_created_idx on public.scan_history (user_id, created_at desc);
create index routine_history_user_created_idx on public.routine_history (user_id, created_at desc);
create index community_routines_approved_created_idx on public.community_routines (created_at desc) where status = 'approved';
