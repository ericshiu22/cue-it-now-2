
CREATE TABLE public.service_swaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  old_service TEXT NOT NULL,
  new_service TEXT NOT NULL,
  show_title TEXT NOT NULL,
  show_tmdb_id INTEGER NOT NULL,
  show_poster_path TEXT,
  monthly_savings NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_swaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own swaps"
  ON public.service_swaps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own swaps"
  ON public.service_swaps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own swaps"
  ON public.service_swaps FOR DELETE
  USING (auth.uid() = user_id);
