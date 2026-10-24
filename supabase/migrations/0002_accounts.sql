-- Kavala accounts and saved progress (Phase 1, items 1 and 2).
-- Links a users row to a Supabase Auth user (Google or anonymous), stores the
-- profile fields the app keeps, and records one row per person per daily.
-- Privacy rule unchanged: people are located only by H3 cells. The home cell is
-- resolution 9 (about 0.1 sq km); nothing finer is stored.

alter table users
  add column auth_user_id uuid unique references auth.users(id) on delete cascade,
  add column provider text check (provider in ('google', 'anonymous')),
  add column mask_style text not null default 'classic'
    check (mask_style in ('classic', 'web', 'kathakali', 'pulikali', 'owl')),
  add column best_streak integer not null default 0,
  add column updated_at timestamptz not null default now();

create table daily_plays (
  user_id uuid not null references users(id) on delete cascade,
  day date not null,                       -- the 6 AM IST daily key
  spot_points integer check (spot_points between 0 and 1000),
  spot_distance_m integer check (spot_distance_m >= 0),  -- best guess distance; the guess itself is never stored
  spot_skipped boolean not null default false,
  help text check (help in ('marked', 'answered', 'skipped')),
  step text check (step in ('done', 'checked-in', 'later')),
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);
create index daily_plays_day on daily_plays (day);

alter table daily_plays enable row level security;

-- People read and write only their own rows. The app writes through
-- /api/me (service role) after validating the body; these policies let a
-- signed-in browser read its own data directly and nothing else.
create policy users_select_own on users for select to authenticated
  using (auth_user_id = auth.uid());
create policy users_update_own on users for update to authenticated
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
create policy users_insert_own on users for insert to authenticated
  with check (auth_user_id = auth.uid());

create policy daily_plays_select_own on daily_plays for select to authenticated
  using (user_id in (select id from users where auth_user_id = auth.uid()));
create policy daily_plays_write_own on daily_plays for insert to authenticated
  with check (user_id in (select id from users where auth_user_id = auth.uid()));
create policy daily_plays_update_own on daily_plays for update to authenticated
  using (user_id in (select id from users where auth_user_id = auth.uid()));

-- Neighbourhood-scoped read: the masks of people in the caller's own
-- neighbourhood. Never real names, emails, home cells or auth IDs.
create or replace function my_neighbourhood_members()
returns table (mask_name text, mask_color text, mask_style text, trust_level text, streak integer)
language sql security definer stable set search_path = public as $$
  select u.mask_name, u.mask_color, u.mask_style, u.trust_level, u.streak
  from users u
  where u.neighbourhood_id is not null
    and u.neighbourhood_id = (select neighbourhood_id from users where auth_user_id = auth.uid())
  order by u.streak desc, u.mask_name;
$$;
revoke all on function my_neighbourhood_members() from public;
grant execute on function my_neighbourhood_members() to authenticated;
