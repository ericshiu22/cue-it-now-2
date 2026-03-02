
ALTER TABLE public.cues
  ADD COLUMN IF NOT EXISTS provider_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS previous_service_provider text,
  ADD COLUMN IF NOT EXISTS provider_checked_at timestamp with time zone;
