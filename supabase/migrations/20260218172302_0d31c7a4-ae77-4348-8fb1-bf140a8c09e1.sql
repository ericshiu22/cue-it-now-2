
-- Replace the overly permissive policy with a restrictive one
-- This table is only accessed via service_role key in edge functions
DROP POLICY "Service role can manage churn alerts log" ON public.churn_alerts_log;

-- No public access at all — service role bypasses RLS automatically
CREATE POLICY "No public access to churn alerts log"
  ON public.churn_alerts_log FOR SELECT
  USING (false);
