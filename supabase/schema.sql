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

alter table public.profiles add column if not exists display_name text not null default 'User';
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text not null default 'member';
alter table public.profiles add column if not exists timezone text not null default 'Europe/London';
alter table public.profiles add column if not exists home_currency text not null default 'GBP';
alter table public.profiles add column if not exists week_starts_on text not null default 'Monday';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    email,
    role,
    timezone,
    home_currency,
    week_starts_on,
    avatar_url
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'User'),
    new.email,
    'admin',
    'Europe/London',
    'GBP',
    'Monday',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  kind text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.entities add column if not exists user_id uuid references public.profiles (id) on delete cascade;
alter table public.entities add column if not exists name text;
alter table public.entities add column if not exists kind text;
alter table public.entities add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.entities add column if not exists created_at timestamptz not null default now();

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

alter table public.tasks add column if not exists user_id uuid references public.profiles (id) on delete cascade;
alter table public.tasks add column if not exists title text;
alter table public.tasks add column if not exists description text;
alter table public.tasks add column if not exists urgency text not null default 'someday';
alter table public.tasks add column if not exists key boolean not null default false;
alter table public.tasks add column if not exists priority_score numeric not null default 0;
alter table public.tasks add column if not exists time_estimate_min integer;
alter table public.tasks add column if not exists tags text[] not null default '{}';
alter table public.tasks add column if not exists due_date date;
alter table public.tasks add column if not exists owner text;
alter table public.tasks add column if not exists entity_id uuid references public.entities (id) on delete set null;
alter table public.tasks add column if not exists completed_at timestamptz;
alter table public.tasks add column if not exists created_at timestamptz not null default now();
alter table public.tasks add column if not exists updated_at timestamptz not null default now();

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

alter table public.calendar_events add column if not exists user_id uuid references public.profiles (id) on delete cascade;
alter table public.calendar_events add column if not exists title text;
alter table public.calendar_events add column if not exists event_date date;
alter table public.calendar_events add column if not exists start_time time;
alter table public.calendar_events add column if not exists end_time time;
alter table public.calendar_events add column if not exists location text;
alter table public.calendar_events add column if not exists source text not null default 'placeholder';
alter table public.calendar_events add column if not exists external_id text;
alter table public.calendar_events add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.calendar_events add column if not exists created_at timestamptz not null default now();
alter table public.calendar_events add column if not exists updated_at timestamptz not null default now();
update public.calendar_events set source = 'apple' where source = 'google';

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

alter table public.habit_definitions add column if not exists user_id uuid references public.profiles (id) on delete cascade;
alter table public.habit_definitions add column if not exists name text;
alter table public.habit_definitions add column if not exists target_per_week integer not null default 7;
alter table public.habit_definitions add column if not exists sort_order integer not null default 0;
alter table public.habit_definitions add column if not exists active boolean not null default true;
alter table public.habit_definitions add column if not exists created_at timestamptz not null default now();
alter table public.habit_definitions add column if not exists updated_at timestamptz not null default now();

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

alter table public.habit_entries add column if not exists user_id uuid references public.profiles (id) on delete cascade;
alter table public.habit_entries add column if not exists habit_id uuid references public.habit_definitions (id) on delete cascade;
alter table public.habit_entries add column if not exists log_date date;
alter table public.habit_entries add column if not exists completed boolean not null default true;
alter table public.habit_entries add column if not exists created_at timestamptz not null default now();
alter table public.habit_entries add column if not exists updated_at timestamptz not null default now();

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

alter table public.finance_snapshots add column if not exists user_id uuid references public.profiles (id) on delete cascade;
alter table public.finance_snapshots add column if not exists as_of timestamptz not null default now();
alter table public.finance_snapshots add column if not exists currency text not null default 'GBP';
alter table public.finance_snapshots add column if not exists net_worth numeric not null default 0;
alter table public.finance_snapshots add column if not exists categories jsonb not null default '[]'::jsonb;
alter table public.finance_snapshots add column if not exists notes text[] not null default '{}';
alter table public.finance_snapshots add column if not exists source text not null default 'placeholder';
alter table public.finance_snapshots add column if not exists raw_extract jsonb not null default '{}'::jsonb;
alter table public.finance_snapshots add column if not exists created_at timestamptz not null default now();
update public.finance_snapshots set source = 'openai_import' where source = 'google_sheet';

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

alter table public.user_integrations add column if not exists user_id uuid references public.profiles (id) on delete cascade;
alter table public.user_integrations add column if not exists provider text;
alter table public.user_integrations add column if not exists display_name text;
alter table public.user_integrations add column if not exists status text not null default 'needs_setup';
alter table public.user_integrations add column if not exists access_mode text not null default 'manual';
alter table public.user_integrations add column if not exists public_config jsonb not null default '{}'::jsonb;
alter table public.user_integrations add column if not exists vault_secret_id uuid;
alter table public.user_integrations add column if not exists last_synced_at timestamptz;
alter table public.user_integrations add column if not exists error_message text;
alter table public.user_integrations add column if not exists created_at timestamptz not null default now();
alter table public.user_integrations add column if not exists updated_at timestamptz not null default now();
alter table public.user_integrations drop constraint if exists user_integrations_user_id_provider_access_mode_key;

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

alter table public.journal_entries add column if not exists user_id uuid references public.profiles (id) on delete cascade;
alter table public.journal_entries add column if not exists entry_date date;
alter table public.journal_entries add column if not exists title text;
alter table public.journal_entries add column if not exists body text;
alter table public.journal_entries add column if not exists mood text;
alter table public.journal_entries add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.journal_entries add column if not exists created_at timestamptz not null default now();
alter table public.journal_entries add column if not exists updated_at timestamptz not null default now();

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

alter table public.notes add column if not exists user_id uuid references public.profiles (id) on delete cascade;
alter table public.notes add column if not exists title text;
alter table public.notes add column if not exists body text;
alter table public.notes add column if not exists tags text[] not null default '{}';
alter table public.notes add column if not exists entity_id uuid references public.entities (id) on delete set null;
alter table public.notes add column if not exists created_at timestamptz not null default now();
alter table public.notes add column if not exists updated_at timestamptz not null default now();

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

alter table public.decisions add column if not exists user_id uuid references public.profiles (id) on delete cascade;
alter table public.decisions add column if not exists title text;
alter table public.decisions add column if not exists context text;
alter table public.decisions add column if not exists decision text;
alter table public.decisions add column if not exists status text not null default 'active';
alter table public.decisions add column if not exists decided_at timestamptz not null default now();
alter table public.decisions add column if not exists entity_id uuid references public.entities (id) on delete set null;
alter table public.decisions add column if not exists created_at timestamptz not null default now();
alter table public.decisions add column if not exists updated_at timestamptz not null default now();

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

alter table public.raw_captures add column if not exists user_id uuid references public.profiles (id) on delete cascade;
alter table public.raw_captures add column if not exists source text not null default 'web';
alter table public.raw_captures add column if not exists raw_text text;
alter table public.raw_captures add column if not exists classification jsonb not null default '{}'::jsonb;
alter table public.raw_captures add column if not exists llm_source text not null default 'openai';
alter table public.raw_captures add column if not exists routed_to text;
alter table public.raw_captures add column if not exists routed_id uuid;
alter table public.raw_captures add column if not exists created_at timestamptz not null default now();

create table if not exists public.memory_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  text text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

alter table public.memory_chunks add column if not exists user_id uuid references public.profiles (id) on delete cascade;
alter table public.memory_chunks add column if not exists source_type text;
alter table public.memory_chunks add column if not exists source_id uuid;
alter table public.memory_chunks add column if not exists text text;
alter table public.memory_chunks add column if not exists embedding vector(1536);
alter table public.memory_chunks add column if not exists created_at timestamptz not null default now();

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log add column if not exists user_id uuid references public.profiles (id) on delete cascade;
alter table public.audit_log add column if not exists action text;
alter table public.audit_log add column if not exists resource_type text;
alter table public.audit_log add column if not exists resource_id uuid;
alter table public.audit_log add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.audit_log add column if not exists created_at timestamptz not null default now();

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'member'));
alter table public.profiles drop constraint if exists profiles_home_currency_check;
alter table public.profiles add constraint profiles_home_currency_check check (home_currency in ('GBP', 'USD', 'EUR'));
alter table public.profiles drop constraint if exists profiles_week_starts_on_check;
alter table public.profiles add constraint profiles_week_starts_on_check check (week_starts_on in ('Monday', 'Sunday'));

alter table public.tasks drop constraint if exists tasks_urgency_check;
alter table public.tasks add constraint tasks_urgency_check check (urgency in ('today', 'this_week', 'this_month', 'someday'));

alter table public.calendar_events drop constraint if exists calendar_events_source_check;
alter table public.calendar_events add constraint calendar_events_source_check check (source in ('placeholder', 'apple'));

alter table public.finance_snapshots drop constraint if exists finance_snapshots_currency_check;
alter table public.finance_snapshots add constraint finance_snapshots_currency_check check (currency in ('GBP', 'USD', 'EUR'));
alter table public.finance_snapshots drop constraint if exists finance_snapshots_source_check;
alter table public.finance_snapshots add constraint finance_snapshots_source_check check (source in ('placeholder', 'manual', 'openai_import'));

alter table public.user_integrations drop constraint if exists user_integrations_provider_check;
alter table public.user_integrations add constraint user_integrations_provider_check check (provider in ('apple_calendar', 'manual_finance', 'openai'));
alter table public.user_integrations drop constraint if exists user_integrations_status_check;
alter table public.user_integrations add constraint user_integrations_status_check check (status in ('connected', 'needs_setup', 'disabled', 'error'));
alter table public.user_integrations drop constraint if exists user_integrations_access_mode_check;
alter table public.user_integrations add constraint user_integrations_access_mode_check check (access_mode in ('public_ical', 'caldav_vault', 'server_secret', 'manual'));

alter table public.decisions drop constraint if exists decisions_status_check;
alter table public.decisions add constraint decisions_status_check check (status in ('active', 'reversed', 'archived'));

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

drop policy if exists "Profiles are owner-readable" on public.profiles;
create policy "Profiles are owner-readable" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users read own entities" on public.entities;
create policy "Users read own entities" on public.entities
  for select using (auth.uid() = user_id);

drop policy if exists "Users read own tasks" on public.tasks;
create policy "Users read own tasks" on public.tasks
  for select using (auth.uid() = user_id);

drop policy if exists "Users read own calendar events" on public.calendar_events;
create policy "Users read own calendar events" on public.calendar_events
  for select using (auth.uid() = user_id);

drop policy if exists "Users read own habit definitions" on public.habit_definitions;
create policy "Users read own habit definitions" on public.habit_definitions
  for select using (auth.uid() = user_id);

drop policy if exists "Users read own habit entries" on public.habit_entries;
create policy "Users read own habit entries" on public.habit_entries
  for select using (auth.uid() = user_id);

drop policy if exists "Users read own finance snapshots" on public.finance_snapshots;
create policy "Users read own finance snapshots" on public.finance_snapshots
  for select using (auth.uid() = user_id);

drop policy if exists "Users read own integrations" on public.user_integrations;
create policy "Users read own integrations" on public.user_integrations
  for select using (auth.uid() = user_id);

drop policy if exists "Users read own journal entries" on public.journal_entries;
create policy "Users read own journal entries" on public.journal_entries
  for select using (auth.uid() = user_id);

drop policy if exists "Users read own notes" on public.notes;
create policy "Users read own notes" on public.notes
  for select using (auth.uid() = user_id);

drop policy if exists "Users read own decisions" on public.decisions;
create policy "Users read own decisions" on public.decisions
  for select using (auth.uid() = user_id);

drop policy if exists "Users read own raw captures" on public.raw_captures;
create policy "Users read own raw captures" on public.raw_captures
  for select using (auth.uid() = user_id);

drop policy if exists "Users read own memory chunks" on public.memory_chunks;
create policy "Users read own memory chunks" on public.memory_chunks
  for select using (auth.uid() = user_id);

drop policy if exists "Users read own audit log" on public.audit_log;
create policy "Users read own audit log" on public.audit_log
  for select using (auth.uid() = user_id);
