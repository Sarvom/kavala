-- Kavala initial schema.
-- Privacy rule: no table stores a person's latitude or longitude. People are
-- located only by H3 cell IDs. The places table holds public places only.
--
-- Row-level security is switched on for every table with no public policies,
-- so the browser (anon key) can read nothing directly. The server uses the
-- service-role key. Add narrow policies table by table as features need them.

create table neighbourhoods (
  id text primary key,
  cells text[] not null,
  resolution smallint not null check (resolution between 6 and 9),
  display_name text,
  member_count integer not null default 0,
  linked_kavala_id text references neighbourhoods(id),
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  mask_name text not null,
  mask_color text not null,
  real_name text,
  phone_verified boolean not null default false,
  trust_level text not null default 'masked' check (trust_level in ('masked', 'verified', 'vouched', 'watch')),
  trust_score real not null default 0,
  thanks integer not null default 0,
  home_cell text not null,            -- H3 resolution 9, about 0.1 sq km
  home_from_gps boolean not null,     -- false when picked on the map (lower trust)
  neighbourhood_id text references neighbourhoods(id),
  streak integer not null default 0,
  last_played_on date,
  is_synthetic boolean not null default false,
  created_at timestamptz not null default now()
);

-- Live presence: one row per device, deleted after 24 hours (see bottom).
create table presence (
  device_id uuid primary key,
  user_id uuid references users(id) on delete cascade,
  cell_r9 text not null,
  cell_fine text not null,
  resolution smallint not null check (resolution between 9 and 11),
  accuracy_m integer not null,
  seen_at timestamptz not null
);
create index presence_cell_r9 on presence (cell_r9);

create table places (
  id uuid primary key default gen_random_uuid(),
  neighbourhood_id text references neighbourhoods(id),
  name text not null,
  category text not null,
  lat double precision not null,      -- public places only, never homes
  lng double precision not null,
  hours text,
  source text not null check (source in ('osm', 'answer', 'submission', 'seed')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table small_steps (
  id serial primary key,
  text text not null,
  context_rule text
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  neighbourhood_id text not null references neighbourhoods(id),
  author_id uuid not null references users(id) on delete cascade,
  text text not null check (char_length(text) between 3 and 500),
  category text not null,
  reach text not null default 'own' check (reach in ('own', 'adjacent', 'kavala')),
  status text not null default 'open' check (status in ('open', 'answered')),
  created_at timestamptz not null default now()
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 1000),
  marked_useful boolean not null default false,
  place_id uuid references places(id),
  created_at timestamptz not null default now()
);

create table thanks_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  from_user_id uuid references users(id) on delete set null,
  answer_id uuid references answers(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table daily_rituals (
  id uuid primary key default gen_random_uuid(),
  neighbourhood_id text not null references neighbourhoods(id),
  day date not null,
  spot_place_id uuid references places(id),
  spot_clue text,
  help_question_id uuid references questions(id),
  small_step_id integer references small_steps(id),
  unique (neighbourhood_id, day)
);

create table ritual_plays (
  id uuid primary key default gen_random_uuid(),
  ritual_id uuid not null references daily_rituals(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  distance_m integer,                 -- the guess itself is not stored
  points integer,
  helped boolean not null default false,
  small_step_done boolean not null default false,
  finished_at timestamptz,
  unique (ritual_id, user_id)
);

create table reveals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  revealed_to_user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, revealed_to_user_id)
);

create table vouches (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references users(id) on delete cascade,
  vouchee_id uuid not null references users(id) on delete cascade,
  nonce text not null unique,         -- each handshake code works once
  voucher_cell text not null,
  vouchee_cell text not null,
  created_at timestamptz not null default now(),
  check (voucher_id <> vouchee_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references users(id) on delete cascade,
  target_type text not null check (target_type in ('user', 'question', 'answer')),
  target_id uuid not null,
  reason text not null,
  weight real not null default 1,
  verdict text check (verdict in ('upheld', 'dismissed')),
  jurors uuid[],
  created_at timestamptz not null default now()
);

alter table neighbourhoods enable row level security;
alter table users enable row level security;
alter table presence enable row level security;
alter table places enable row level security;
alter table small_steps enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;
alter table thanks_events enable row level security;
alter table daily_rituals enable row level security;
alter table ritual_plays enable row level security;
alter table reveals enable row level security;
alter table vouches enable row level security;
alter table reports enable row level security;

-- Presence older than 24 hours is deleted by a scheduled job (Phase 6).
-- Example for Supabase's pg_cron extension, once enabled:
--   select cron.schedule('purge-presence', '0 * * * *',
--     $$delete from presence where seen_at < now() - interval '24 hours'$$);
