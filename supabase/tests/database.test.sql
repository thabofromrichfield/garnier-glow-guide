begin;
select plan(15);

insert into auth.users (id, aud, role, email, raw_user_meta_data, raw_app_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'user-a@example.test', '{"display_name":"User A"}', '{}'),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'user-b@example.test', '{"display_name":"User B"}', '{}');

insert into public.scan_history (user_id, outcome) values
  ('11111111-1111-4111-8111-111111111111', 'face_in_frame'),
  ('22222222-2222-4222-8222-222222222222', 'face_in_frame');
insert into public.routine_history (user_id, title, product_ids) values
  ('11111111-1111-4111-8111-111111111111', 'A routine', array['vitc']),
  ('22222222-2222-4222-8222-222222222222', 'B routine', array['skin']);
insert into public.community_routines (author_id, title, description, product_ids, steps, status) values
  ('11111111-1111-4111-8111-111111111111', 'A pending routine', 'A personal community routine.', array['vitc'], array['Cleanse gently', 'Moisturize'], 'pending'),
  ('22222222-2222-4222-8222-222222222222', 'B pending routine', 'Another community routine.', array['skin'], array['Apply gently', 'Use sun care'], 'pending'),
  ('22222222-2222-4222-8222-222222222222', 'B approved routine', 'An approved community routine.', array['skin'], array['Apply gently', 'Use sun care'], 'approved');

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'scan_history', 'scan history table exists');
select has_table('public', 'routine_history', 'routine history table exists');
select has_table('public', 'community_routines', 'community routines table exists');
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has row-level security');
select ok((select relrowsecurity from pg_class where oid = 'public.scan_history'::regclass), 'scan history has row-level security');
select ok((select relrowsecurity from pg_class where oid = 'public.routine_history'::regclass), 'routine history has row-level security');
select ok((select relrowsecurity from pg_class where oid = 'public.community_routines'::regclass), 'community routines has row-level security');
select ok(exists (
  select 1 from pg_policy
  where polrelid = 'public.community_routines'::regclass
    and polname = 'community_routines_submit_pending'
), 'community posts require pending status');
select ok(not exists (
  select 1 from information_schema.columns
  where table_schema = 'public'
    and table_name in ('scan_history', 'routine_history')
    and column_name in ('image', 'photo', 'landmarks', 'embedding', 'face_vector')
), 'account history schema stores no face images or biometric geometry');
select is((select count(*)::integer from public.profiles), 2, 'signup trigger creates a profile for each user');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select is((select count(*)::integer from public.profiles), 1, 'users can only read their own profile');
select is((select count(*)::integer from public.scan_history), 1, 'users can only read their own scan history');
select is((select count(*)::integer from public.routine_history), 1, 'users can only read their own routine history');
select is((select count(*)::integer from public.community_routines), 2, 'authors see own pending posts and the public approved feed only');

select * from finish();
rollback;
