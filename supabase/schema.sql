create table if not exists public.dashboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists dashboard_snapshots_user_created_idx
  on public.dashboard_snapshots (user_id, created_at desc);

alter table public.dashboard_snapshots enable row level security;

create policy "Users can read their own dashboard snapshots"
  on public.dashboard_snapshots
  for select
  using (auth.uid()::text = user_id);
