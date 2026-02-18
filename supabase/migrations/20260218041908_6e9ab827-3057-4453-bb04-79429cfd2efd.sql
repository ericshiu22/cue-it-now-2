ALTER TABLE public.profiles
  ADD COLUMN alert_level text NOT NULL DEFAULT 'balanced',
  ADD COLUMN email_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN push_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN churn_alerts_enabled boolean NOT NULL DEFAULT true;