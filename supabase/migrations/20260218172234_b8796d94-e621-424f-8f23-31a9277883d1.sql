
-- 1. Track users' active streaming subscriptions
CREATE TABLE public.active_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  monthly_cost NUMERIC(6,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_name)
);

ALTER TABLE public.active_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.active_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.active_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.active_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON public.active_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_active_subscriptions_updated_at
  BEFORE UPDATE ON public.active_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add status to cues table to track watch progress
ALTER TABLE public.cues
  ADD COLUMN status TEXT NOT NULL DEFAULT 'queued';

-- 3. Track when churn alerts were sent to enforce once-per-month
CREATE TABLE public.churn_alerts_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_name, sent_at)
);

ALTER TABLE public.churn_alerts_log ENABLE ROW LEVEL SECURITY;

-- Service role only — no direct user access needed
CREATE POLICY "Service role can manage churn alerts log"
  ON public.churn_alerts_log FOR ALL
  USING (true)
  WITH CHECK (true);
