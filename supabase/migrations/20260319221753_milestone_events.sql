-- Milestone events table: tracks Beehiiv sync, Resend emails, and GA4 events
-- triggered at key user milestones (welcome, onboarding_complete)

create table if not exists public.milestone_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  milestone_type text not null,
  beehiiv_synced boolean default false,
  email_sent boolean default false,
  ga4_tracked boolean default false,
  metadata jsonb default '{}',
  created_at timestamptz default now() not null,
  -- Prevent duplicate milestone fires per user
  unique (user_id, milestone_type)
);

-- RLS
alter table public.milestone_events enable row level security;

-- Users can read their own milestones
create policy "Users can view own milestones"
  on public.milestone_events for select
  using (auth.uid() = user_id);

-- Only service role (edge functions) can insert/update
create policy "Service role can manage milestones"
  on public.milestone_events for all
  using (auth.role() = 'service_role');

-- Index for quick lookups
create index idx_milestone_events_user on public.milestone_events (user_id, milestone_type);
