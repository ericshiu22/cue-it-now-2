
CREATE TABLE public.favorite_teams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  team_abbr text NOT NULL,
  league text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, team_abbr)
);

ALTER TABLE public.favorite_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorite teams" ON public.favorite_teams FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorite teams" ON public.favorite_teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorite teams" ON public.favorite_teams FOR DELETE TO authenticated USING (auth.uid() = user_id);
