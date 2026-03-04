CREATE TABLE public.season_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  league text NOT NULL,
  streaming_service text NOT NULL,
  season_name text NOT NULL,
  season_start date NOT NULL,
  season_end date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  games_followed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.season_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own season passes" ON public.season_passes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own season passes" ON public.season_passes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own season passes" ON public.season_passes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own season passes" ON public.season_passes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX season_passes_user_league_active ON public.season_passes (user_id, league) WHERE is_active = true;