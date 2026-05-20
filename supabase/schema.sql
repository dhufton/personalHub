create extension if not exists vector with schema extensions;
create extension if not exists supabase_vault with schema vault;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email text,
  role text not null default 'member' check (role in ('admin', 'member')),
  timezone text not null default 'Europe/London',
  home_currency text not null default 'GBP' check (home_currency in ('GBP', 'USD', 'EUR')),
  week_starts_on text not null default 'Monday' check (week_starts_on in ('Monday', 'Sunday')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  kind text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  urgency text not null default 'someday' check (urgency in ('today', 'this_week', 'this_month', 'someday')),
  key boolean not null default false,
  priority_score numeric not null default 0,
  time_estimate_min integer,
  tags text[] not null default '{}',
  due_date date,
  owner text,
  entity_id uuid references public.entities (id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  location text,
  source text not null default 'placeholder' check (source in ('placeholder', 'apple')),
  external_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habit_definitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  target_per_week integer not null default 7,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habit_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  habit_id uuid not null references public.habit_definitions (id) on delete cascade,
  log_date date not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, habit_id, log_date)
);

create table if not exists public.finance_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  as_of timestamptz not null default now(),
  currency text not null default 'GBP' check (currency in ('GBP', 'USD', 'EUR')),
  net_worth numeric not null default 0,
  categories jsonb not null default '[]'::jsonb,
  notes text[] not null default '{}',
  source text not null default 'placeholder' check (source in ('placeholder', 'manual', 'openai_import')),
  raw_extract jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('apple_calendar', 'manual_finance', 'openai')),
  display_name text,
  status text not null default 'needs_setup' check (status in ('connected', 'needs_setup', 'disabled', 'error')),
  access_mode text not null default 'manual' check (access_mode in ('public_ical', 'caldav_vault', 'server_secret', 'manual')),
  public_config jsonb not null default '{}'::jsonb,
  vault_secret_id uuid,
  last_synced_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_integrations_calendar_url_idx
  on public.user_integrations (user_id, provider, access_mode, (public_config->>'ical_url'))
  where provider = 'apple_calendar' and access_mode = 'public_ical';

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  entry_date date not null,
  title text,
  body text not null,
  mood text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  body text not null,
  tags text[] not null default '{}',
  entity_id uuid references public.entities (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  context text,
  decision text not null,
  status text not null default 'active' check (status in ('active', 'reversed', 'archived')),
  decided_at timestamptz not null default now(),
  entity_id uuid references public.entities (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.raw_captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source text not null default 'web',
  raw_text text not null,
  classification jsonb not null default '{}'::jsonb,
  llm_source text not null default 'openai',
  routed_to text,
  routed_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.memory_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  text text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_open_priority_idx
  on public.tasks (user_id, completed_at, priority_score desc);

create index if not exists calendar_events_user_date_idx
  on public.calendar_events (user_id, event_date, start_time);

create index if not exists habit_entries_user_date_idx
  on public.habit_entries (user_id, log_date desc);

create index if not exists finance_snapshots_user_as_of_idx
  on public.finance_snapshots (user_id, as_of desc);

create index if not exists user_integrations_user_provider_idx
  on public.user_integrations (user_id, provider, status);

create index if not exists journal_entries_user_date_idx
  on public.journal_entries (user_id, entry_date desc);

create index if not exists notes_user_created_idx
  on public.notes (user_id, created_at desc);

create index if not exists decisions_user_decided_idx
  on public.decisions (user_id, decided_at desc);

create index if not exists memory_chunks_embedding_idx
  on public.memory_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

alter table public.profiles enable row level security;
alter table public.entities enable row level security;
alter table public.tasks enable row level security;
alter table public.calendar_events enable row level security;
alter table public.habit_definitions enable row level security;
alter table public.habit_entries enable row level security;
alter table public.finance_snapshots enable row level security;
alter table public.user_integrations enable row level security;
alter table public.journal_entries enable row level security;
alter table public.notes enable row level security;
alter table public.decisions enable row level security;
alter table public.raw_captures enable row level security;
alter table public.memory_chunks enable row level security;
alter table public.audit_log enable row level security;

create policy "Profiles are owner-readable" on public.profiles
  for select using (auth.uid() = id);

create policy "Users read own entities" on public.entities
  for select using (auth.uid() = user_id);

create policy "Users read own tasks" on public.tasks
  for select using (auth.uid() = user_id);

create policy "Users read own calendar events" on public.calendar_events
  for select using (auth.uid() = user_id);

create policy "Users read own habit definitions" on public.habit_definitions
  for select using (auth.uid() = user_id);

create policy "Users read own habit entries" on public.habit_entries
  for select using (auth.uid() = user_id);

create policy "Users read own finance snapshots" on public.finance_snapshots
  for select using (auth.uid() = user_id);

create policy "Users read own integrations" on public.user_integrations
  for select using (auth.uid() = user_id);

create policy "Users read own journal entries" on public.journal_entries
  for select using (auth.uid() = user_id);

create policy "Users read own notes" on public.notes
  for select using (auth.uid() = user_id);

create policy "Users read own decisions" on public.decisions
  for select using (auth.uid() = user_id);

create policy "Users read own raw captures" on public.raw_captures
  for select using (auth.uid() = user_id);

create policy "Users read own memory chunks" on public.memory_chunks
  for select using (auth.uid() = user_id);

create policy "Users read own audit log" on public.audit_log
  for select using (auth.uid() = user_id);
